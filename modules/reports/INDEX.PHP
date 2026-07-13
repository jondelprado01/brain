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
// $timephasing = GET_TIMEPHASING_SCHEDULES();
$timephasing = [];


//AD name of the logged-in user (same personnel.v_workday_memory the listing uses),
//used to default the username filter to the current user.
// $current_username = GET_USERNAME_FOR_EMPLOYEE(isset($_SESSION["EMP_NO"]) ? $_SESSION["EMP_NO"] : "");
$current_username = [];


//current week's FYWW (FY##_W##), shown in the FYWW column header so the
//delinquent/current badges have a visible reference point.
// $current_fyww = GET_CURRENT_FYWW();
$current_fyww = [];

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
            /* ... EXCEPT NOTES (column 4), which may wrap freely */
            #tpScheduleTable th:nth-child(4),
            #tpScheduleTable td:nth-child(4) {
                white-space: normal;
                min-width: 200px;
            }
            /* pre-allocate more room to MFG PART NUM (column 1) */
            #tpScheduleTable th:nth-child(1),
            #tpScheduleTable td:nth-child(1) {
                min-width: 220px;
            }
            /* CHANGE DATE (column 5) left-justified */
            #tpScheduleTable th:nth-child(5),
            #tpScheduleTable td:nth-child(5) {
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
                                    <button type="button" class="btn btn-sm btn-outline-secondary" id="tpSortReset">
                                        Reset to default
                                    </button>
                                </div>
                            </div>

                            <table id="tpScheduleTable" class="table table-bordered table-hover table-striped display compact" style="width:100%">
                                <thead>
                                    <tr class="tp-header-row">
                                        <th>MFG PART NUM</th>
                                        <th>FYWW</th>
                                        <th>PROCESS TYPE</th>
                                        <th>NOTES</th>
                                        <th>CHANGE DATE</th>
                                        <th>USERNAME</th>
                                        <th class="no-export"><i class="fa-solid fa-frog"></i> LINKS</th>
                                    </tr>
                                    <tr class="tp-filter-row">
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="0" placeholder="Filter MFG PART NUM"></th>
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="1" placeholder="Filter FYWW"></th>
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="2" placeholder="Filter PROCESS TYPE"></th>
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="3" placeholder="Filter NOTES"></th>
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="4" placeholder="Filter CHANGE DATE"></th>
                                        <th><input type="text" class="form-control form-control-sm column-filter" data-col="5" placeholder="Filter USERNAME"></th>
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

    </body>

</html>
