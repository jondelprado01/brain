<?php
session_start();

require('../../ENV.PHP');

if (!isset($_SESSION['SYSTEM'])) {
    $sso = SSO;
    if (ENV_SERVER == "LOCAL") {
        $path = "";
    }
    else{
        $path = (ENV_SERVER == "STAGING") ? "/API/BRAIN_UI_JCDP" : "/TEST/BRAIN_UI_JCDP";
    }
    $http = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
    $url = $http."://".$_SERVER['HTTP_HOST'].$path."/LOGIN.PHP";
    header("Location: ".$sso.$url."");
}

include_once("../../assets/LIST.PHP");
$assets = RENDER_ASSETS("module");

//LIVE TIMEPHASING SCHEDULE DATASET (retrieved once, filtered client-side)
include_once("DATA_TIMEPHASING.PHP");
$timephasing = GET_TIMEPHASING_SCHEDULES();

//AD name of the logged-in user (same personnel.v_workday_memory the listing uses),
//used to default the username filter to the current user.
$current_username = GET_USERNAME_FOR_EMPLOYEE(isset($_SESSION["EMP_NO"]) ? $_SESSION["EMP_NO"] : "");

//current week's FYWW (FY##_W##), shown in the FYWW column header so the
//delinquent/current badges have a visible reference point.
$current_fyww = GET_CURRENT_FYWW();

//chronological ordinal per FYWW (from the fiscal calendar), so the density
//fishbone can space ribs by true week-distance even across fiscal-year boundaries.
$fyww_ordinals = GET_FYWW_ORDINALS();

//exception report data: MFG_PART_NUMs with >1 distinct sap_rte_id for the same
//site_num (a data anomaly), shown at the top of the Timephasing pane.
$multi_rte_exceptions = GET_MULTI_RTE_EXCEPTIONS();
?>
<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BRAIN</title>
        <script>
            var user_details = {
                emp_id: '<?php echo $_SESSION["EMP_NO"];?>',
                emp_name: '<?php echo $_SESSION["EMP_NAME"];?>',
                emp_email: '<?php echo $_SESSION["EMP_EMAIL"];?>',
            }
        </script>
        <?php
            //skip old datatables css/js (4,11), keytable cdn (12) and custom.js (16);
            //this module loads its own datatables+buttons build below.
            foreach ($assets as $key => $asset) {
                if (!in_array($key, [4, 11, 12, 16])) {
                    echo $asset;
                }
            }
        ?>
        <!-- DataTables + Buttons (copy/csv/excel) bundle, shared with index-time. Load order matters. -->
        <script src="../../js/jquery-3.7.1/jquery-3.7.1.js"></script>
        <link  href="../../js/datatables-index-time/datatables.css" rel="stylesheet">
        <script src="../../js/datatables-index-time/datatables.js"></script>
        <script src="../../js/datatables-index-time/buttons.print.min.js"></script>
        <script src="../../js/datatables-index-time/buttons.html5.min.js"></script>
        <script src="../../js/datatables-index-time/jszip.min.js"></script>
        <script src="../../js/datatables-index-time/buttons.dataTables.js"></script>
        <script src="../../js/datatables-index-time/dataTables.buttons.js"></script>
        <script>
            //full dataset for the Timephasing tab, filtered entirely client-side.
            var timephasing_data = <?php echo json_encode($timephasing); ?>;
            //AD name of the logged-in user; used to default the username filter.
            var current_username = <?php echo json_encode($current_username); ?>;
            //current week's FYWW (FY##_W##), shown in the FYWW column header.
            var current_fyww = <?php echo json_encode($current_fyww); ?>;
            //chronological ordinal per FYWW, for proportional rib spacing in the
            //density fishbone (correct across fiscal-year boundaries).
            var fyww_ordinals = <?php echo json_encode($fyww_ordinals); ?>;
        </script>
        <script src="../../js/report-timephasing.js"></script>
        <style>
            /* per-column filter inputs sit directly under each header label */
            #tpScheduleTable thead .column-filter {
                width: 100%;
                box-sizing: border-box;
                font-weight: normal;
                font-size: 12px;
                margin-top: 4px;
                padding-right: 18px; /* room for the clear "x" */
            }
            /* wrapper lets us overlay the clear "x" on the filter input */
            #tpScheduleTable thead .column-filter-wrap {
                position: relative;
                display: block;
            }
            #tpScheduleTable thead .column-filter-clear {
                position: absolute;
                right: 4px;
                top: 50%;
                transform: translateY(-50%);
                margin-top: 2px; /* offset the input's margin-top */
                cursor: pointer;
                color: #888;
                font-size: 15px;
                line-height: 1;
                font-weight: bold;
                padding: 0 2px;
            }
            #tpScheduleTable thead .column-filter-clear:hover {
                color: #dc3545;
            }
            /* keep the header label + its filter box stacked */
            #tpScheduleTable thead th {
                vertical-align: top;
            }
            #tpScheduleTable td {
                vertical-align: top;
            }
            /* no column may word-wrap ... */
            #tpScheduleTable th,
            #tpScheduleTable td {
                white-space: nowrap;
            }
            /* ... EXCEPT NOTES (column 5), which may wrap freely */
            #tpScheduleTable th:nth-child(5),
            #tpScheduleTable td:nth-child(5) {
                white-space: normal;
                min-width: 200px;
            }
            /* pre-allocate more room to MFG PART NUM (column 1) */
            #tpScheduleTable th:nth-child(1),
            #tpScheduleTable td:nth-child(1) {
                min-width: 220px;
            }
            /* CHANGE DATE (column 6) left-justified */
            #tpScheduleTable th:nth-child(6),
            #tpScheduleTable td:nth-child(6) {
                text-align: left;
            }
            /* LINKS column (PA + ALL DB buttons): keep both on one line, cell snug */
            #tpScheduleTable td:last-child,
            #tpScheduleTable th:last-child {
                width: 1%;
                text-align: center;
                white-space: nowrap;
            }
            #tpScheduleTable .all-db-btn,
            #tpScheduleTable .pa-btn {
                white-space: nowrap;
            }
            /* grouped MFG_PART_NUM (a part with >1 schedule): shade the block and
               box it with top/bottom borders so the group reads as one unit.
               Overrides table-striped's alternating background via specificity. */
            #tpScheduleTable tbody tr.tp-group > td,
            #tpScheduleTable tbody tr.tp-group.odd > td,
            #tpScheduleTable tbody tr.tp-group.even > td {
                background-color: #eef4fb; /* soft blue block */
            }
            #tpScheduleTable tbody tr.tp-group.tp-group-alt > td,
            #tpScheduleTable tbody tr.tp-group.tp-group-alt.odd > td,
            #tpScheduleTable tbody tr.tp-group.tp-group-alt.even > td {
                background-color: #e2ecf7; /* slightly deeper for adjacent groups */
            }
            #tpScheduleTable tbody tr.tp-group-start > td {
                border-top: 2px solid #6c9bd2;
            }
            #tpScheduleTable tbody tr.tp-group-end > td {
                border-bottom: 2px solid #6c9bd2;
            }
            /* left/right rails on the group block */
            #tpScheduleTable tbody tr.tp-group > td:first-child {
                border-left: 2px solid #6c9bd2;
            }
            #tpScheduleTable tbody tr.tp-group > td:last-child {
                border-right: 2px solid #6c9bd2;
            }
            /* mild gap between the "entries per page" length <select> and its
               surrounding label text, which otherwise render flush against each
               other. Scoped to this table's DataTables length control (wrapper id
               is <tableId>_wrapper) so it can't affect other tables. */
            #tpScheduleTable_wrapper .dt-length select {
                margin-left: 6px;
                margin-right: 6px;
            }
            /* ---- What's New changelog panel ------------------------------ */
            .tp-wn-body {
                max-height: 340px;
                overflow-y: auto;
                font-size: 13px;
                background-color: #f8fbff;
                border-color: #b6d4fe;
            }
            .tp-wn-release + .tp-wn-release {
                margin-top: 12px;
                padding-top: 10px;
                border-top: 1px solid #d5e3f5;
            }
            .tp-wn-date {
                font-weight: 600;
                color: #0c63e4;
                margin-bottom: 4px;
            }
            .tp-wn-list {
                margin: 0;
                padding-left: 20px;
            }
            .tp-wn-list li { margin-bottom: 3px; }
            /* rotate the chevron when the panel is open (Bootstrap sets
               aria-expanded="true" on the toggle button) */
            .tp-wn-chevron { transition: transform 0.15s ease; }
            .tp-whatsnew [aria-expanded="true"] .tp-wn-chevron {
                transform: rotate(180deg);
            }
            /* ---- FYWW herringbone (schedule density) --------------------- */
            /* Horizontal spine: a flex row of per-week columns. Each week has a
               center spine node (FYWW + badge) with one "bone" card either above
               or below (alternating). Rendered into the modal by
               report-timephasing.js from the current filter set. */
            /* the dialog sizes to its content and may exceed the viewport width;
               the modal frame (not the content) scrolls to reach the overflow, so
               nothing is clipped and no inner scrollbar hides part of the diagram. */
            #tpHerringboneModal { overflow: auto; }
            .tp-hb-dialog {
                max-width: none;
                width: fit-content;
                width: -moz-fit-content;
                margin: 1rem auto;
            }
            .tp-hb-dialog .modal-body { overflow: visible; }
            /* Ishikawa (cause-and-effect) layout: one unbroken horizontal spine;
               each FYWW is an angled RIB off the spine (alternating up/down); the
               week's schedules are HORIZONTAL text lines stepping along the rib
               (following its angle without being rotated); the FYWW label sits at
               the rib tip. Ribs/text are absolutely placed off a per-week hub, so
               the spine line itself is never broken. Diagram may exceed the screen
               width; the modal frame scrolls, content never clips. */
            /* fishbone PNG used in place of the FA fish icon (button + modal title);
               height-constrained, auto width preserves the 285x139 aspect ratio. */
            .tp-hb-btn-icon { height: 16px; width: auto; vertical-align: -3px; }
            .tp-hb-title-icon { height: 22px; width: auto; vertical-align: -4px; }
            /* vertical-orientation variant: same PNG rotated 90deg clockwise */
            .tp-hb-icon-rot { transform: rotate(90deg); }
            #tpHerringbone { overflow: visible; padding: 16px 24px; }
            /* summary counts (delinquent / risk / OK) above the diagram */
            .tp-hb-summarybar {
                position: sticky;
                left: 0;
                display: flex;
                gap: 18px;
                align-items: center;
                margin-bottom: 14px;
                font-size: 13px;
                font-weight: 600;
            }
            .tp-hb-summarybar .tp-hb-sum {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 2px 10px;
                border: 1px solid #d0d7de;
                border-radius: 14px;
                background: #f6f8fa;
                white-space: nowrap;
            }
            /* the track is a positioned canvas; each week is absolutely placed on it
               at an X driven purely by the calendar ordinal, so hub-to-hub distance
               reads as elapsed time (NOT content width). Width/height set inline. */
            .tp-hb-track {
                position: relative;
            }
            /* the single continuous spine, drawn across the whole track */
            .tp-hb-spine-line {
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 3px;
                background: #6c9bd2;
                transform: translateY(-50%);
                z-index: 0;
            }
            /* arrowhead / effect box at the head (right) of the spine */
            .tp-hb-head {
                position: absolute;
                top: 50%;
                right: -2px;
                transform: translateY(-50%);
                border-top: 9px solid transparent;
                border-bottom: 9px solid transparent;
                border-left: 14px solid #6c9bd2;
                z-index: 1;
            }
            /* each week is absolutely placed at its ordinal-driven X (left set inline);
               everything inside is positioned off the hub at the track's vertical
               center so the spine stays straight regardless of content width.
               NOTE: no z-index here on purpose — if a week established its own
               stacking context, a clickable part could only win the stacking
               contest within its own week, and cross-week overlaps (the common
               case) would fall back to DOM order. Leaving weeks context-free lets
               every cause line compare z-index in one shared (track) context, so
               the raised .tp-hb-part always lands on top. */
            .tp-hb-week {
                position: absolute;
                top: 0;
            }
            /* the point where this rib meets the spine (top set inline = hub Y) */
            .tp-hb-hub {
                position: absolute;
                left: 0;
                width: 9px;
                height: 9px;
                border-radius: 50%;
                background: #6c9bd2;
                transform: translate(-50%, -50%);
                z-index: 3;
            }
            .tp-hb-week.tp-hb-current .tp-hb-hub { background: #b8860b; }
            /* --- vertical form: spine runs top->bottom ------------------------
               Each week spans the whole track so its absolutely-placed children
               use track coordinates (spineX / hubY) directly. Because the weeks
               overlap (all full-track), the container must be click-through or the
               topmost week would swallow every click; the cause lines below opt
               back in so their PA links stay clickable. */
            .tp-hb-vertical .tp-hb-week {
                left: 0; top: 0; width: 100%; height: 100%;
                pointer-events: none;
            }
            .tp-hb-vertical .tp-hb-cause { pointer-events: auto; }
            /* continuous vertical spine (left set inline = spine X) */
            .tp-hb-spine-v {
                top: 0; bottom: 0; left: 0;
                right: auto;
                width: 3px; height: auto;
                transform: translateX(-50%);
            }
            /* small tickmark on the spine for a calendar week with NO schedule
               (no label). Crosses the spine: a horizontal bar for the vertical
               spine, a vertical bar for the horizontal spine. Centered inline. */
            .tp-hb-tick {
                position: absolute;
                width: 11px;
                height: 2px;
                background: #9db8d6;
                transform: translate(-50%, -50%);
                z-index: 2;
            }
            .tp-hb-tick.tp-hb-tick-h {
                width: 2px;
                height: 11px;
            }
            /* arrowhead at the spine foot (bottom), pointing down */
            .tp-hb-head-v {
                top: auto; bottom: -2px; right: auto;
                transform: translateX(-50%);
                border-left: 9px solid transparent;
                border-right: 9px solid transparent;
                border-top: 14px solid #6c9bd2;
                border-bottom: 0;
            }
            /* cause lines in vertical mode are single-line; the JS sizes each lane
               to the measured text width, so no clamp/ellipsis is needed. */
            .tp-hb-vertical .tp-hb-cause {
                white-space: nowrap;
            }
            /* the visible angled bone; length/rotation set inline per week */
            .tp-hb-rib {
                position: absolute;
                left: 0;
                top: 50%;
                height: 3px;
                background: #6c9bd2;
                transform-origin: left center;
                z-index: 1;
            }
            /* one horizontal cause line, stepped along the rib via inline top/left.
               Text is NEVER rotated; it just tracks the bone's angle. Reading order
               from the spine outward: FYWW, then username, then that user's parts. */
            .tp-hb-cause {
                position: absolute;
                white-space: nowrap;
                font-size: 12px;
                line-height: 1.3;
                z-index: 2;
            }
            /* FYWW header line (nearest the spine): a small pill so the week reads
               as the "cause category" at the base of the bone. */
            .tp-hb-cause.tp-hb-fyww {
                font-weight: 600;
                background: #fff;
                border: 1px solid #6c9bd2;
                border-radius: 10px;
                padding: 1px 8px;
            }
            .tp-hb-week.tp-hb-current .tp-hb-cause.tp-hb-fyww {
                border-color: #b8860b;
                background: #fff8e1;
            }
            .tp-hb-cause.tp-hb-empty {
                color: #888;
                font-style: italic;
            }
            .tp-hb-cause.tp-hb-user {
                font-weight: 600;
                color: #2f5b8a;
            }
            /* a cause line carrying a clickable MFG_PART_NUM is raised above plain
               lines so, where lines overlap, the part stays on top and clickable. */
            .tp-hb-cause.tp-hb-has-part { z-index: 5; }
            .tp-hb-cause.tp-hb-has-part:hover { z-index: 6; }
            .tp-hb-part {
                cursor: pointer;
                text-decoration: underline;
                color: #0d6efd;
                /* opaque background so the part hides whatever text sits behind it
                   in its own footprint (the overlapped bit of the lower line is
                   covered rather than showing through). */
                background: #fff;
                border-radius: 3px;
                padding: 0 2px;
                box-decoration-break: clone;
                -webkit-box-decoration-break: clone;
            }
            .tp-hb-week.tp-hb-current .tp-hb-part { background: #fff8e1; }
            .tp-hb-part:hover { color: #0a58ca; }
            .tp-hb-proc { color: #444; }
            /* reserved slot for the future per-TPI_ID API change summary */
            .tp-hb-summary { color: #6c757d; }
            .tp-hb-count {
                display: inline-block;
                min-width: 18px;
                text-align: center;
                background: #6c9bd2;
                color: #fff;
                border-radius: 9px;
                padding: 0 6px;
                margin-left: 4px;
                font-size: 11px;
            }
            /* the FYWW header's total-schedule count: darker than the per-user
               pills so the week total reads as the headline figure for the bone. */
            .tp-hb-count.tp-hb-fyww-count {
                background: #2f5b8a;
                font-weight: 600;
            }
            /* sort controls bar above the table */
            .tp-sort-controls {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-end;
                gap: 10px;
                margin-bottom: 12px;
            }
            .tp-sort-controls .form-label {
                font-size: 12px;
                margin-bottom: 2px;
            }
            .tp-sort-controls select {
                font-size: 13px;
            }
            /* exception report (multi-rte anomalies) above the sort controls */
            .tp-exceptions .table-responsive {
                max-height: 220px;
                overflow-y: auto;
            }
            .tp-exceptions-table {
                font-size: 12px;
                background: #fff;
            }
            .tp-exceptions-table th {
                position: sticky;
                top: 0;
                background: #f8f9fa;
                z-index: 1;
            }
        </style>
    </head>

    <body>
        <?php
            //NAVBAR
            require('../../page-sections/navs/PAGES.PHP');
        ?>

        <div class="container-sm p-4">

            <div class="card h-100">
                <div class="card-header">
                    <h3 class="card-title text-center">REPORTS</h3>
                </div>
                <div class="card-body">

                    <!-- REPORT TABS: Timephasing (live) + placeholders for OEE / New Parts -->
                    <ul class="nav nav-tabs" id="reportTab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="timephasing-tab" data-bs-toggle="tab"
                                    data-bs-target="#timephasing-pane" type="button" role="tab"
                                    aria-controls="timephasing-pane" aria-selected="true">
                                <i class="fa-solid fa-timeline"></i> Timephasing
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="oee-tab" data-bs-toggle="tab"
                                    data-bs-target="#oee-pane" type="button" role="tab"
                                    aria-controls="oee-pane" aria-selected="false">
                                <i class="fa-solid fa-gauge"></i> OEE
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="new-parts-tab" data-bs-toggle="tab"
                                    data-bs-target="#new-parts-pane" type="button" role="tab"
                                    aria-controls="new-parts-pane" aria-selected="false">
                                <i class="fa-solid fa-cube"></i> New Parts
                            </button>
                        </li>
                    </ul>

                    <div class="tab-content pt-3" id="reportTabContent">

                        <!-- TIMEPHASING -->
                        <div class="tab-pane fade show active" id="timephasing-pane" role="tabpanel"
                             aria-labelledby="timephasing-tab" tabindex="0">

                            <!-- WHAT'S NEW: running, user-facing changelog of the Timephasing report,
                                 newest first, since (and including) initial deployment. Collapsed by
                                 default (Bootstrap collapse). When a user-facing change ships, add a
                                 dated <li> at the TOP of the newest date's list (or a new date block).
                                 Dates are real ship dates supplied by the product owner; the initial
                                 release date was not recorded, so it is labeled without a date. -->
                            <div class="tp-whatsnew mb-3">
                                <button class="btn btn-sm btn-outline-info" type="button"
                                        data-bs-toggle="collapse" data-bs-target="#tpWhatsNew"
                                        aria-expanded="false" aria-controls="tpWhatsNew">
                                    <i class="fa-solid fa-bullhorn"></i> What&rsquo;s New
                                    <i class="fa-solid fa-chevron-down tp-wn-chevron"></i>
                                </button>
                                <div class="collapse mt-2" id="tpWhatsNew">
                                    <div class="card card-body tp-wn-body">
                                        <div class="tp-wn-release">
                                            <div class="tp-wn-date">2026-07-20</div>
                                            <ul class="tp-wn-list">
                                                <li>New <strong>GENERIC</strong> column, shown right after MFG PART NUM (filterable and sortable like any other column).</li>
                                                <li><strong>Three-level sorting</strong> &mdash; a third &ldquo;Then by&rdquo; level was added to the sort controls.</li>
                                                <li><strong>&ldquo;(no null)&rdquo; sort options</strong> for NOTES and USERNAME &mdash; keep blank/empty rows at the bottom instead of floating them to the top when sorting ascending.</li>
                                                <li><strong>Column-filter dropdowns</strong> &mdash; each filter box now offers that column&rsquo;s existing values as a dropdown; the choices narrow as you filter other columns.</li>
                                                <li><strong>Schedule Density fishbone</strong> &mdash; a diagram (horizontal or vertical) showing how the currently filtered schedules spread across fiscal weeks, opened from the icons above the LINKS column.</li>
                                                <li>Minor spacing fix on the &ldquo;entries per page&rdquo; control.</li>
                                            </ul>
                                        </div>
                                        <div class="tp-wn-release">
                                            <div class="tp-wn-date">2026-07-10 &mdash; Initial release</div>
                                            <ul class="tp-wn-list">
                                                <li>Live Timephasing schedule table with per-column filters and copy / CSV / Excel export.</li>
                                                <li><strong>USERNAME filter</strong> is part-level (shows every schedule for the parts a user touched) and defaults to the logged-in user.</li>
                                                <li>Customizable, <strong>group-aware ordering</strong> (all rows for a part stay together) with clickable headers; your sort is remembered between visits.</li>
                                                <li><strong>Grouped-part shading</strong> &mdash; when one MFG PART NUM has more than one schedule, its rows are shaded and boxed together so the group reads as one block.</li>
                                                <li><strong>FYWW timeliness badges</strong> &mdash; delinquent (red) and current-week (yellow) markers; the FYWW header shows the current week.</li>
                                                <li><strong>PA</strong> and <strong>ALL DB</strong> quick-link buttons per row (jump straight to Planning Assumptions / All Databases for that part).</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- EXCEPTION REPORT: MFG_PART_NUMs with >1 sap_rte_id for the same SITE_NUM.
                                 Rendered server-side; only shown when anomalies exist. -->
                            <?php if (!empty($multi_rte_exceptions)) { ?>
                                <div class="alert alert-warning tp-exceptions" role="alert">
                                    <div class="d-flex align-items-center mb-2">
                                        <i class="fa-solid fa-triangle-exclamation me-2"></i>
                                        <strong>
                                            Exceptions: <?php echo count($multi_rte_exceptions); ?>
                                            MFG PART NUM / SITE with more than one SAP_RTE_ID
                                        </strong>
                                    </div>
                                    <div class="mb-2 fst-italic">
                                        Please report this to your local BRAIN admin.
                                    </div>
                                    <div class="table-responsive">
                                        <table class="table table-sm table-bordered mb-0 tp-exceptions-table">
                                            <thead>
                                                <tr>
                                                    <th>MFG PART NUM</th>
                                                    <th>SITE NUM</th>
                                                    <th># RTE</th>
                                                    <th>SAP_RTE_IDs</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <?php foreach ($multi_rte_exceptions as $ex) {
                                                    //click-to-jump to Planning Assumptions for this part,
                                                    //same navigation as the report's per-row PA button
                                                    //(root INDEX.PHP?partnum[0]=<part> into the reused
                                                    //"brain_pa" tab).
                                                    $ex_href = "../../INDEX.PHP?partnum[0]=" . rawurlencode($ex["mfg_part_num"]);
                                                ?>
                                                    <tr>
                                                        <td>
                                                            <a href="<?php echo htmlspecialchars($ex_href); ?>"
                                                               target="brain_pa"
                                                               title="Load Planning Assumptions for this part"><?php echo htmlspecialchars($ex["mfg_part_num"]); ?></a>
                                                        </td>
                                                        <td><?php echo htmlspecialchars($ex["site_num"]); ?></td>
                                                        <td><?php echo htmlspecialchars($ex["rte_count"]); ?></td>
                                                        <td><?php echo htmlspecialchars($ex["sap_rte_ids"]); ?></td>
                                                    </tr>
                                                <?php } ?>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            <?php } ?>

                            <!-- customizable ordering controls (built/populated by report-timephasing.js) -->
                            <div class="tp-sort-controls" id="tpSortControls">
                                <div>
                                    <label class="form-label" for="tpSortField">Sort by</label>
                                    <select class="form-select form-select-sm" id="tpSortField"></select>
                                </div>
                                <div>
                                    <label class="form-label" for="tpSortDir">Direction</label>
                                    <select class="form-select form-select-sm" id="tpSortDir">
                                        <option value="asc">Ascending</option>
                                        <option value="desc">Descending</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="form-label" for="tpSortField2">Then by</label>
                                    <select class="form-select form-select-sm" id="tpSortField2"></select>
                                </div>
                                <div>
                                    <label class="form-label" for="tpSortDir2">Direction</label>
                                    <select class="form-select form-select-sm" id="tpSortDir2">
                                        <option value="asc">Ascending</option>
                                        <option value="desc">Descending</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="form-label" for="tpSortField3">Then by</label>
                                    <select class="form-select form-select-sm" id="tpSortField3"></select>
                                </div>
                                <div>
                                    <label class="form-label" for="tpSortDir3">Direction</label>
                                    <select class="form-select form-select-sm" id="tpSortDir3">
                                        <option value="asc">Ascending</option>
                                        <option value="desc">Descending</option>
                                    </select>
                                </div>
                                <div>
                                    <button type="button" class="btn btn-sm btn-outline-secondary" id="tpSortReset">
                                        Reset to default
                                    </button>
                                </div>
                            </div>

                            <table id="tpScheduleTable" class="table table-bordered table-hover table-striped display compact" style="width:100%">
                                <thead>
                                    <tr class="tp-header-row">
                                        <th>MFG PART NUM</th>
                                        <th>GENERIC</th>
                                        <th>FYWW</th>
                                        <th>PROCESS TYPE</th>
                                        <th>NOTES</th>
                                        <th>CHANGE DATE</th>
                                        <th>USERNAME</th>
                                        <th class="no-export"><i class="fa-solid fa-frog"></i> LINKS</th>
                                    </tr>
                                    <tr class="tp-filter-row">
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="0" placeholder="Filter MFG PART NUM"></th>
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="1" placeholder="Filter GENERIC"></th>
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="2" placeholder="Filter FYWW"></th>
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="3" placeholder="Filter PROCESS TYPE"></th>
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="4" placeholder="Filter NOTES"></th>
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="5" placeholder="Filter CHANGE DATE"></th>
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="6" placeholder="Filter USERNAME"></th>
                                        <th class="no-export"></th>
                                    </tr>
                                </thead>
                            </table>
                        </div>

                        <!-- OEE (placeholder) -->
                        <div class="tab-pane fade" id="oee-pane" role="tabpanel"
                             aria-labelledby="oee-tab" tabindex="0">
                            <div class="alert alert-secondary text-center my-3" role="alert">
                                <i class="fa-solid fa-screwdriver-wrench"></i> OEE report coming soon.
                            </div>
                        </div>

                        <!-- NEW PARTS (placeholder) -->
                        <div class="tab-pane fade" id="new-parts-pane" role="tabpanel"
                             aria-labelledby="new-parts-tab" tabindex="0">
                            <div class="alert alert-secondary text-center my-3" role="alert">
                                <i class="fa-solid fa-screwdriver-wrench"></i> New Parts report coming soon.
                            </div>
                        </div>

                    </div>

                </div>
            </div>

        </div>

        <!-- FYWW herringbone (schedule density) modal. Populated by
             report-timephasing.js from the current filter set when the timeline
             button in the LINKS header is clicked. -->
        <div class="modal fade" id="tpHerringboneModal" tabindex="-1"
             aria-labelledby="tpHerringboneLabel" aria-hidden="true">
            <div class="modal-dialog tp-hb-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="tpHerringboneLabel">
                            <img src="../../img/fishbone_285_139.png" alt="Fishbone" class="tp-hb-title-icon"> Timephasing Density by FYWW
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="tpHerringbone" class="tp-herringbone">
                            <!-- .tp-hb-track injected by JS -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </body>

</html>
