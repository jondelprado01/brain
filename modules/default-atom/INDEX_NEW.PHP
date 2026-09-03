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
include_once("../../requests/API.PHP");
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
            // 2026-09-01 RM (AI: Claude Code): exclude the shared DataTables core/css + keyTable (4,11,12), the shared
            // jQuery/jquery-ui/select2/jquery.redirect (9,10,14,15) and custom.js (16) so we can load the SAME proven
            // datatables+Buttons stack the index-time module uses (that is the only export-capable bundle in this app).
            foreach ($assets as $key => $asset) {
                if (!in_array($key, [4, 9, 10, 11, 12, 14, 15, 16])) {
                    echo $asset;
                }
            }
        ?>
        <!-- 2026-09-01 RM (AI: Claude Code): DataTables 2 + Buttons (copy/csv/excel) bundle borrowed from index-time; excel = .xlsx via JSZip -->
        <script src="../../js/jquery-3.7.1/jquery-3.7.1.js"></script>
        <link  href="../../js/datatables-index-time/datatables.css" rel="stylesheet">
        <script src="../../js/datatables-index-time/datatables.js"></script>
        <script src="../../js/datatables-index-time/buttons.print.min.js"></script>
        <script src="../../js/datatables-index-time/buttons.html5.min.js"></script>
        <script src="../../js/datatables-index-time/jszip.min.js"></script>
        <script src="../../js/datatables-index-time/buttons.dataTables.js"></script>
        <script src="../../js/datatables-index-time/dataTables.buttons.js"></script>
        <script src="../../js/absolute.js"></script>
        <script src="../../js/default-atom-new.js"></script>
        <style>
            .dt-input{
                margin-right: 1em!important;
            }
            /* 2026-09-01 RM (AI: Claude Code): the ColumnControl search box is a dtcc <input> that defaults to ~235px (size=20),
               which used to stretch each column. Instead of a fixed width, let it EXPAND to fill its column: span.dtcc fills the
               header cell (width:100%), dtcc-search flex-grows into it, and the input stretches to 100%. min-width:0 lets the input
               shrink below its intrinsic size so it never forces a column wider than the data needs. */
            table.table-default-atom span.dtcc{
                display: flex !important;
                width: 100% !important;
            }
            table.table-default-atom span.dtcc div.dtcc-search{
                flex-grow: 1 !important;
            }
            table.table-default-atom span.dtcc div.dtcc-search > div{
                width: 100% !important;
            }
            /* less tall: trim the search input's padding and top-margin so the search row is short */
            table.table-default-atom span.dtcc div.dtcc-search input{
                width: 100% !important;
                min-width: 0 !important;
                margin-top: 2px !important;
                padding-top: 1px !important;
                padding-bottom: 1px !important;
            }
            /* 2026-09-01 RM (AI: Claude Code): index-time renders its header as <THEAD BGCOLOR=SILVER> (grey). Match that here -
               apply silver to every header cell, including the ColumnControl order/search rows, so the whole thead reads grey. */
            .table-default-atom thead th{
                background: silver !important;
            }
            /* 2026-09-01 RM (AI: Claude Code): consistent header layout - name on the LEFT, sort icon on the RIGHT, for EVERY
               column. DataTables 2 lays each header out in div.dt-column-header (a flexbox: title + order control). Its default
               is flex-direction:row (name left, icon right = correct). BUT once data loads, DataTables auto-detects DA_ID as a
               numeric column and stamps dt-type-numeric on it, which the bundle CSS turns into flex-direction:row-reverse -
               flipping the icon to the left. That is exactly why DA_ID looked right until the data arrived and then flipped.
               Force row on both header and footer so numeric columns line up with the rest and never reverse. */
            .table-default-atom thead div.dt-column-header,
            .table-default-atom thead div.dt-column-footer,
            .table-default-atom tfoot div.dt-column-header,
            .table-default-atom tfoot div.dt-column-footer{
                flex-direction: row !important;
            }
            /* 2026-09-01 RM (AI: Claude Code): the "compact" class alone reads too tight here; index-time's rows sit a little
               roomier (its table stretches to fill the card). Give cells a mild vertical padding so the table breathes without
               going back to DataTables' full default spacing. */
            .table-default-atom th,
            .table-default-atom td{
                padding-top: 2px !important;
                padding-bottom: 2px !important;
            }
            /* 2026-09-01 RM (AI: Claude Code): trim the per-row action buttons (the Edit button in the ACTION column) so they
               are not so tall - reduce their vertical padding to match the more compact rows. */
            .table-default-atom td .btn{
                padding-top: 1px !important;
                padding-bottom: 1px !important;
            }
            /* 2026-09-01 RM (AI: Claude Code): no wrapping, and size each column to its content (like index-time) so
               there is no wasted horizontal space; "compact" DataTables class handles the tight cell padding. */
            .table-default-atom th,
            .table-default-atom td{
                white-space: nowrap;
                width: auto !important;
                /* 2026-09-01 RM (AI: Claude Code): left-justify every column (DataTables right-aligns numeric columns like DA_ID
                   by default via .dt-type-numeric - override that so all headers and cells read left-aligned). */
                text-align: left !important;
            }
            .table-default-atom{
                width: auto !important;
                table-layout: auto !important;
            }
            /* 2026-09-01 RM (AI: Claude Code): size the card to its content (grow only as needed), NOT full-width; cap at viewport.
               margin:0 auto centers the fit-content card on the page, like index-time's centered container. */
            .da-fit{
                width: fit-content;
                max-width: 100%;
                margin-left: auto;
                margin-right: auto;
            }
            /* 2026-09-01 RM (AI: Claude Code): DataTables wraps the table in div.dt-container whose layout rows are
               width:100% - that is what keeps the component stretched wide with the columns spread out. Collapse the
               wrapper to the table's natural width (the same fix index-time uses), then let the toolbar rows span it. */
            .da-fit div.dt-container{
                display: inline-block !important;
                width: auto !important;
                max-width: 100%;
            }
            .da-fit div.dt-container div.dt-layout-row{
                width: 100%;
            }
            /* 2026-09-01 RM (AI: Claude Code): WHAT'S NEW panel styling, ported from the Timephasing report (.tp-wn-* -> .da-wn-*).
               da-wn-body has an explicit max-width so its long changelog lines stay contained and readable. */
            .da-wn-body{
                max-width: 720px;
                max-height: 340px;
                overflow-y: auto;
                font-size: 13px;
                background: #f8fbff;
                border: 1px solid #b6d4fe;
            }
            .da-wn-release + .da-wn-release{
                margin-top: 12px;
                padding-top: 10px;
                border-top: 1px solid #d5e3f5;
            }
            .da-wn-date{
                font-weight: 600;
                color: #0c63e4;
            }
            .da-wn-list{ padding-left: 20px; }
            .da-wn-list li{ margin-bottom: 3px; }
            .da-wn-chevron{ transition: transform 0.15s ease; }
            .da-whatsnew [aria-expanded="true"] .da-wn-chevron{
                transform: rotate(180deg);
            }
        </style>
    </head>

    <body>
        <?php
            //OFFCANVAS SIDEBAR (UTILITIES - DEV)
            require('../../page-sections/offcanvas/UTILITIES.PHP');

            //NAVBAR
            require('../../page-sections/navs/PAGES.PHP');
        ?>

        <div class="p-4">

            <div class="card h-100 da-fit">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3 class="card-title m-0">DEFAULT ATOM</h3>
                    <!-- 2026-09-01 RM (AI: Claude Code): right side of the header - What's New (left) then Bulk Edit (right). -->
                    <div class="d-flex align-items-center gap-2">
                        <!-- WHAT'S NEW: running, user-facing changelog, collapsed by default (Bootstrap collapse). Modeled on the
                             Timephasing report's panel (.tp-wn-* -> .da-wn-*). When a change ships, add a dated <li> at the TOP of
                             the newest date's list (or a new date block). The panel itself renders just below this header (#daWhatsNew). -->
                        <span class="da-whatsnew">
                            <button class="btn btn-sm btn-outline-info" type="button"
                                    data-bs-toggle="collapse" data-bs-target="#daWhatsNew"
                                    aria-expanded="false" aria-controls="daWhatsNew">
                                <i class="fa-solid fa-bullhorn"></i> What&rsquo;s New
                                <i class="fa-solid fa-chevron-down da-wn-chevron"></i>
                            </button>
                        </span>
                        <!-- 2026-09-01 RM (AI: Claude Code): Bulk Edit (paste-from-Excel), modeled on index-time's Bulk Add/Edit.
                             Opens #defaultAtomBulkUpsertModal; wired to DEFAULT_ATOM_BULK_CRUD.PHP via default-atom-new.js. -->
                        <button type="button" class="btn btn-outline-primary btn-sm btn-bulk-upsert" data-bs-toggle="modal" data-bs-target="#defaultAtomBulkUpsertModal">
                            <i class="fa-solid fa-table-list"></i> Bulk Edit
                        </button>
                    </div>
                </div>
                <!-- 2026-09-01 RM (AI: Claude Code): WHAT'S NEW panel - collapsed by default, drops down under the header when the
                     button above is clicked. da-wn-body is max-width capped so its long lines never widen the fit-content card. -->
                <div class="collapse" id="daWhatsNew">
                    <div class="p-2 pb-0">
                        <div class="card card-body da-wn-body">
                            <div class="da-wn-release">
                                <div class="da-wn-date">2026-09-01 &mdash; Initial release</div>
                                <ul class="da-wn-list">
                                    <li><strong>Download the table</strong> as <strong>Copy</strong>, <strong>CSV</strong>, or <strong>Excel (.xlsx)</strong> from the buttons above the table (the ACTION column is left out of exports).</li>
                                    <li><strong>New columns:</strong> <strong>DA_ID</strong> (shown first), plus <strong>CHANGED BY</strong> and <strong>CHANGED DT</strong> after ATOM NAME. CHANGED DT shows the <strong>date only</strong>.</li>
                                    <li><strong>Per-column search &amp; ordering</strong> like the Index Time page &mdash; click a header&rsquo;s controls to sort or filter that column.</li>
                                    <li><strong>Compact display</strong> that sizes to its contents instead of stretching across the screen; column layout is remembered between visits.</li>
                                    <li><strong>Bulk Edit</strong> (paste-from-Excel): paste rows (with existing DA_IDs), <strong>Check</strong> to validate &mdash; invalid rows turn red with a reason, unchanged rows turn yellow &mdash; then <strong>Execute</strong>. <strong>Dry Run is on by default</strong> (Execute previews the SQL without writing); <strong>uncheck Dry Run</strong> to write to the LIVE database. Requires the <strong>SCM Cap Planning</strong> or <strong>Admin</strong> role.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-2">
                    <div class="alert alert-light loading-alert" role="alert">
                        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Loading data, please wait...
                    </div>
                    <!-- 2026-09-01 RM (AI: Claude Code): NO Bootstrap .row/.col-lg-12 wrapper here - a .row is display:flex and
                         .col-lg-12 is width:100%, which forces the card back to full width and defeats .da-fit's fit-content.
                         index-time puts its table straight in the tab pane with no row/col; we do the same so the card hugs the table. -->
                    <!-- 2026-09-01 RM (AI: Claude Code): DA_ID now first; CHANGED BY / CHANGED DT after ATOM NAME.
                         ACTION is tagged no-export so it is dropped from copy/csv/excel. Column count (9) must match
                         the row.add() array in default-atom-new.js. -->
                    <!-- 2026-09-01 RM (AI: Claude Code): use DataTables' own "display compact cell-border" classes
                         (like index-time's #mainTable) instead of Bootstrap .table - "compact" tightens cell padding. -->
                    <table class="display compact cell-border table-default-atom">
                        <thead>
                            <tr>
                                <th>DA_ID</th>
                                <th>TYPE</th>
                                <th>SITE</th>
                                <th>RES_AREA</th>
                                <th>ENG NAME</th>
                                <th>ATOM NAME</th>
                                <th>CHANGED BY</th>
                                <th>CHANGED DT</th>
                                <th class="no-export">ACTION</th>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>

            <div class="modal fade zoom" id="defaultAtomModal" data-bs-backdrop="static" data-bs-keyboard="false" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h1 class="modal-title fs-5" id="defaultAtomModalLabel">Assign Default Atom</h1>
                            <button type="button" class="btn-close btn-close-dedication" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">

                                <style>
                                    .loader {
                                    width: 20px;
                                    aspect-ratio: 4;
                                    background: radial-gradient(circle closest-side,#000 90%,#0000) 0/calc(100%/3) 100% space;
                                    clip-path: inset(0 100% 0 0);
                                    animation: l1 1s steps(4) infinite;
                                    }
                                    @keyframes l1 {to{clip-path: inset(0 -34% 0 0)}}
                                </style>

                                <div class="col-lg-6">
                                    <div class="card">
                                        <div class="card-header d-flex justify-content-between">
                                            <strong>
                                                ATOM NAME: <br><p style="display: none!important;" class="atom-loader"><small class="d-flex justify-content-between"><span>selections are loading</span><span class="loader mt-1"></span></small></p>
                                            </strong>
                                            <input type="text" class="form-control w-50 atom-search" placeholder="Search...">
                                        </div>
                                        <div class="card-body p-0 m-0">
                                            <input type="hidden" class="input-atom">
                                            <input type="hidden" class="input-atom-name">
                                            <select id="atom-name" class="form-select dropdown-atom-name" size="10" aria-label=""></select>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-lg-6">

                                    <div class="form-floating mb-2">
                                        <select class="form-select input-res-area" id="floatingSelect" aria-label="Floating label select example">
                                            <option value="" selected>----</option>
                                            <option value="ATE FT">ATE FT</option>
                                            <option value="ATE WS">ATE WS</option>
                                            <option value="ATE PBS">ATE PBS</option>
                                        </select>
                                        <label for="floatingSelect">Change RES_AREA</label>
                                    </div>

                                    <div class="list-group mb-2">
                                        <div style="font-size: 15px;" class="list-group-item list-group-item-action" aria-current="true">
                                            <div class="d-flex w-100 justify-content-between">
                                                <small>TYPE</small>
                                                <strong class="li-type"></strong>
                                            </div>
                                            <div class="d-flex w-100 justify-content-between">
                                                <small>SITE</small>
                                                <strong class="li-site"></strong>
                                            </div>
                                            <div class="d-flex w-100 justify-content-between">
                                                <small>RES_AREA</small>
                                                <strong class="li-res"></strong>
                                            </div>
                                            <div class="d-flex w-100 justify-content-between">
                                                <small>ENG NAME</small>
                                                <strong class="li-eth"></strong>
                                            </div>
                                            <div class="d-flex w-100 justify-content-between">
                                                <small>ATOM NAME</small>
                                                <strong class="li-ath"></strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="list-group">
                                        <div style="font-size: 15px;" class="list-group-item list-group-item-action" aria-current="true">
                                            <div class="d-flex w-100 justify-content-between">
                                                <small>UPDATED AT</small>
                                                <strong class="li-date"></strong>
                                            </div>
                                            <div class="d-flex w-100 justify-content-between">
                                                <small>UPDATED BY</small>
                                                <strong class="li-by"></strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div class="modal-footer d-flex justify-content-center">
                            <button type="button" class="btn btn-success btn-save-atom">Save <i class="fa-solid fa-floppy-disk"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2026-09-01 RM (AI: Claude Code): Bulk Edit (paste-from-Excel) modal, modeled on index-time's #ioBulkUpsertModal.
                 Wired in default-atom-new.js to DEFAULT_ATOM_BULK_CRUD.PHP. Two actions: "Check" validates the paste (marks
                 invalid rows red, no-change rows yellow) and only then enables "Execute"; "Execute" applies the edits. A Dry
                 Run checkbox (checked by default = preview only) must be UNCHECKED to write LIVE; the banner swaps to a
                 red caution when unchecked. Editable fields: SITE_NUM, RES_AREA, ATOM_NAME (SITE/RES_AREA whitelisted).
                 DA_ID is the key; TYPE and ENG_NAME are locked (verify-only when a value is entered). -->
            <div class="modal fade zoom" id="defaultAtomBulkUpsertModal" data-bs-backdrop="static" data-bs-keyboard="false" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h1 class="modal-title fs-5"><i class="fa-solid fa-table-list"></i> Bulk Edit Default Atoms</h1>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Mode banner; daBulkUpdateBanner() (default-atom-new.js) swaps its text/color with the Dry
                                 Run checkbox. Default state here matches the checkbox default (Dry Run ON = preview). -->
                            <div id="da-bulk-mode-banner" class="alert alert-secondary py-2 mb-2">
                                <i class="fa-solid fa-flask"></i>
                                Dry Run is ON &mdash; Execute previews the SQL only; no changes are written to the DB.
                            </div>
                            <p class="small text-muted mb-2">
                                Paste a block of rows copied from the table or Excel. This is an <strong>edit only</strong> &mdash; every row must carry an
                                existing <strong>DA_ID</strong>. The first row <strong>must be a header naming the columns</strong>; columns may be in
                                <strong>any order</strong> and unrecognized columns (CHANGED BY / CHANGED DT, etc.) are ignored:
                            </p>
                            <ul class="small text-muted mb-2">
                                <li><strong>Editable:</strong> SITE, RES_AREA, ATOM_NAME.</li>
                                <li><strong>Required (must be populated, not blank / not just dashes):</strong> DA_ID, SITE, RES_AREA, ATOM_NAME.</li>
                                <li><strong>Allowed values (at this time):</strong> SITE must be one of <code>ADGT</code>, <code>ADPI</code>; RES_AREA must be one of <code>ATE FT</code>, <code>ATE WS</code>, <code>ATE PBS</code>.</li>
                                <li><strong>DA_ID</strong> must match an existing record. <strong>TYPE</strong> and <strong>ENG_NAME</strong> are <em>not</em> editable &mdash; keep the columns in place, but each is only checked when you enter a value, in which case it must match that record&rsquo;s value.</li>
                                <li><strong>CHANGED BY / CHANGED DT</strong> may be included but are ignored on input &mdash; they are set automatically to you and now.</li>
                            </ul>
                            <textarea class="form-control da-bulk-ups-paste" id="da-bulk-ups-paste" rows="8" style="font-family:monospace;font-size:12px;" placeholder="Paste rows here (tab-separated; first row must be a header naming the columns; any order)"></textarea>
                            <div class="da-bulk-ups-message mt-3"></div>
                        </div>
                        <div class="modal-footer d-flex justify-content-between align-items-center">
                            <!-- Dry Run toggle. Checked (default) = preview the SQL only (no DB changes); unchecked = LIVE
                                 write. The server honors this via dry_run=0/1, and the banner above updates on toggle. A
                                 server-side kill switch remains: set $DA_FORCE_DRY_RUN=true in DEFAULT_ATOM_BULK_CRUD.PHP. -->
                            <div class="form-check m-0">
                                <input class="form-check-input" type="checkbox" id="da-bulk-ups-dry" checked>
                                <label class="form-check-label small" for="da-bulk-ups-dry">
                                    <strong>Dry Run</strong> (preview SQL only, no DB changes)
                                </label>
                            </div>
                            <div>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-outline-primary" id="da-bulk-ups-check">Check</button>
                                <button type="button" class="btn btn-primary" id="da-bulk-ups-run" disabled>Execute</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

    </body>

</html>
