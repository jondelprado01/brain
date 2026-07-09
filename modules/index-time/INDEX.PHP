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
            foreach ($assets as $key => $asset) {
                if (!in_array($key, [4, 9, 10, 11, 12, 14, 15, 16])) {
                    echo $asset;
                }
            }
        ?>
        <script src="../../js/jquery-3.7.1/jquery-3.7.1.js"></script>
        <link  href="../../js/datatables-index-time/datatables.css" rel="stylesheet">
        <script src="../../js/datatables-index-time/datatables.js"></script>
        <script src="../../js/datatables-index-time/buttons.print.min.js"></script>
        <script src="../../js/datatables-index-time/buttons.html5.min.js"></script>
        <script src="../../js/datatables-index-time/jszip.min.js"></script>
        <script src="../../js/datatables-index-time/buttons.dataTables.js"></script>
        <script src="../../js/datatables-index-time/dataTables.buttons.js"></script>
        <!-- 2026-01-12 RM must be before index-time-fixed.js -->
        <script src="../../js/chart.umd.min.js"></script>
        <script src="../../js/index-time-fixed-calc.js"></script>
        <style>
            #dt-length-0{
                margin-right: 0.5em!important;
            }
            .table-graph th:first-child,
            .table-graph td:first-child {
                position: sticky;
                left: 0;
                background: white;
                z-index: 1;
            }
            /* clickable "View" cell (Matches column) -> opens static_calc_indx popup */
            td.scx-matches-cell {
                cursor: pointer;
                color: #0d6efd;
                text-decoration: underline;
                text-align: center;
            }
            td.scx-matches-cell:hover {
                background: #eef4ff;
            }
            /* main Fixed/Variable tables: never word-wrap cell contents */
            #mainTable th,
            #mainTable td,
            #variableTable th,
            #variableTable td {
                white-space: nowrap !important;
                word-break: normal !important;
                overflow-wrap: normal !important;
                width: auto !important;     /* size each column to its content */
            }
            /* size the table itself to its content rather than a stretched 100%,
               so there is no wasted horizontal space inside the cells */
            #mainTable,
            #variableTable {
                width: auto !important;
                table-layout: auto !important;
            }
            /* DataTables 3 wraps the table in div.dt-container whose layout rows
               are width:100%; collapse the wrapper to the table's natural width
               so the whole component (and its columns) sizes to its content.    */
            #nav-fixed div.dt-container,
            #nav-variable div.dt-container {
                display: inline-block !important;
                width: auto !important;
                max-width: 100%;
            }
            /* the toolbar/info rows still span the (now content-width) wrapper */
            #nav-fixed div.dt-container div.dt-layout-row,
            #nav-variable div.dt-container div.dt-layout-row {
                width: 100%;
            }
            /* keep the tab panel from stretching the wrapper back to full width */
            #nav-fixed,
            #nav-variable {
                text-align: left;
            }
            /* static_calc_indx popup: size columns to fit the modal width
               (~1920px window) while keeping the font readable */
            #staticCalcTable {
                font-size: 13px;
                table-layout: auto;
                width: 100% !important;
            }
            #staticCalcTable th,
            #staticCalcTable td {
                white-space: nowrap;
                padding: 3px 6px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .no-event{
                opacity: 0.5;
                cursor: not-allowed;
                pointer-events: none; 
            }
        </style>
    </head>

    <body>

        <?php 
            //NAVBAR 
            require('../../page-sections/navs/PAGES.PHP');
        ?>

        <div class="container-sm p-4">

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title text-center">INDEX TIME</h3>
                </div>
                <div class="card-body p-0">
                    <div class="row">
                        <div class="col-lg-12">
                            <?php
                                $fixed = '';
                                $variable = '';

                                if (isset($_REQUEST['tab'])) {
                                    switch ($_REQUEST['tab']) {
                                        case 'fixed':
                                            $fixed = 'active';
                                            break;    
                                        case 'variable':
                                            $variable = 'active';
                                    }
                                }
                                else {$fixed = 'active';}

                                //Enable Edit/Delete only for Admin or OR user groups.
                                $disable_btn = (count($_SESSION['EMP_USER_GROUP']) == 0 || in_array("Operation Research", $_SESSION['EMP_USER_GROUP'])) ? "" : "no-event";
                            ?>

                            
                            <nav class="pt-3">
                                <div class="nav nav-tabs d-flex justify-content-evenly" id="nav-tab" role="tablist">
                                    <button tab-name="fixed" class="nav-link index-link <?php echo $fixed; ?>" 
                                        id="nav-fixed-tab" data-bs-toggle="tab" data-bs-target="#nav-fixed" type="button" role="tab" aria-controls="nav-fixed" aria-selected="false">
                                        Fixed
                                    </button>
                                    <button tab-name="variable" class="nav-link index-link <?php echo $variable; ?>" 
                                        id="nav-variable-tab" data-bs-toggle="tab" data-bs-target="#nav-variable" type="button" role="tab" aria-controls="nav-variable" aria-selected="false">
                                        Variable
                                    </button>
                                </div>
                            </nav>
                           

                            <div class="tab-content d-flex justify-content-center" id="nav-tabContent">

                                <div class="tab-pane w-100 fade <?php echo ($fixed != '') ? 'show ' : ''; echo $fixed;?>" id="nav-fixed" role="tabpanel" aria-labelledby="nav-fixed-tab" tabindex="0">
                                    <div class="card border border-start-0 border-end-0">
                                        
                                        <div class="card-header d-flex justify-content-between">
                                            <div>
                                                <h5 class="card-title"><i class="fa-solid fa-lock"></i> Fixed</h5>
                                                <small>Fixed Index Time</small>
                                            </div>
                                            <div class="d-flex align-items-center">
                                                <button type="button" class="btn btn-sm btn-primary" id="io-add-fixed">
                                                    <i class="fa-solid fa-plus"></i> Add Index Time
                                                </button>
                                            </div>
                                        </div>
                                       
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-lg-12">
                                                    <?php
                                                        include_once("/var/www/html/MYSQLI_COMMON_FUNCTIONS.PHP");
                                                        $iConRLM = Open_ILink("localhost");
                                                        $aryFIT = FIXED_INDEX_GET_V2($iConRLM,$bolDebug);
                                                        FIXED_INDEX_RENDER($aryFIT,$bolDebug);
                                                        mysqli_close($iConRLM);

                                                        function FIXED_INDEX_RENDER($aryFIT,$bolDebug=false) {
                                                            echo "<table id=\"mainTable\" class=\"display compact h-100 cell-border\">";
                                                            #echo "<TABLE ID=\"tblFixed\" class=\"table table-striped\" BORDER=1 CELLSPACING=0 CELLPADDING=1>";
                                                            echo "<THEAD BGCOLOR=SILVER>";
                                                            echo "<tr><th>ISD ID</th><th>Handler</th><th>Package Type</th><th>Body Size</th><th>Leads Min</th><th>Leads Max</th><th>Temp Class</th><th>UTPI</th><th>Fixed ITPU</th><th>Matches</th><th>Edit</th></tr>";
                                                            echo "</THEAD><TBODY CLASS=B1 BGCOLOR=#FFFFFF>";

                                                            $intCtr = 0;
                                                            foreach($aryFIT as $intISDID => $aryFITTemp) {
                                                                #2025-12-08 RM this is split out instead of reading from the temp so i can do additional formatting (i planned to, but didnt actually)
                                                                if ($aryFITTemp['THRESHOLD_FORMULA'] == null || $aryFITTemp['THRESHOLD_FORMULA'] == "") {
                                                                    $aryLine = array(
                                                                        "HANDLER"=>$aryFITTemp["HANDLER"],
                                                                        "PKG_TYPE"=>$aryFITTemp["PKG_TYPE"],
                                                                        "BODY_SIZE"=>$aryFITTemp["BODY_SIZE"],
                                                                        "LEAD_COUNT_MIN"=>$aryFITTemp["LEAD_COUNT_MIN"],
                                                                        "LEAD_COUNT_MAX"=>$aryFITTemp["LEAD_COUNT_MAX"],
                                                                        "TEMP_CLASS"=>$aryFITTemp["TEMP_CLASS"],
                                                                        "UTPI"=>$aryFITTemp["UTPI"],
                                                                        "FIXED_ITPU"=>$aryFITTemp["INDEX_VALUE"]
                                                                    );
    
                                                                    #Print_R2($aryLine);
                                                                    #die();
    
                                                                    #echo "<tr><td>".implode("</td><td>",$aryLine)."</td></tr>";
                                                                    if($intCtr == 0) {
                                                                        echo "<tr id=\"tr_111\">";
                                                                    }else{
                                                                        echo "<tr>";
                                                                    }
                                                                    echo "<td>".$intISDID."</td>";
                                                                    echo "<td>".$aryLine["HANDLER"]."</td>";
                                                                    echo "<td>".$aryLine["PKG_TYPE"]."</td>";
                                                                    echo "<td>".$aryLine["BODY_SIZE"]."</td>";
                                                                    echo "<td>".$aryLine["LEAD_COUNT_MIN"]."</td>";
                                                                    echo "<td>".$aryLine["LEAD_COUNT_MAX"]."</td>";
                                                                    echo "<td>".$aryLine["TEMP_CLASS"]."</td>";
                                                                    echo "<td>".$aryLine["UTPI"]."</td>";
                                                                    echo "<td>".number_format($aryLine["FIXED_ITPU"],3)."</td>";
                                                                    echo "<td class=\"scx-matches-cell\" data-isd-id=\"".$intISDID."\" data-handler=\"".htmlspecialchars($aryLine["HANDLER"], ENT_QUOTES)."\">View</td>";
                                                                    echo "<td class=\"io-edit-cell\" data-row=\"".htmlspecialchars(json_encode(IO_EDIT_ROW($intISDID, $aryFITTemp, 'fixed')), ENT_QUOTES)."\"><a href=\"#\" class=\"io-edit-link\">Edit</a></td>";
                                                                    echo "</tr>";

                                                                    ++$intCtr;
                                                                }
                                                            }

                                                            echo "</TBODY></TABLE>";


                                                        }


                                                        function FIXED_INDEX_GET_V2($iConRLM,$bolDebug=false) {
                                                            $strSQL = "
                                                                SELECT
                                                                ISD_ID,
                                                                ISM_ID,
                                                                HANDLER,
                                                                PACKAGE PKG_TYPE,
                                                                SOAK_TIME,#2026-04-09 RM
                                                                BODY_SIZE,
                                                                LEAD_COUNT_MIN,
                                                                LEAD_COUNT_MAX,
                                                                TEMP_CLASS,
                                                                UTPI,
                                                                INDEX_VALUE,
                                                                TTPI_THRESHOLD,
                                                                COEFFICIENT,
                                                                CONSTANT,
                                                                THRESHOLD_FORMULA
                                                                #FINAL_FORMULA
                                                                FROM BRAIN.V_INDEX_OVERRIDE
                                                                ORDER BY HANDLER, PKG_TYPE, IFNULL(SOAK_TIME,0), IFNULL(LEAD_COUNT_MIN,0), IFNULL(LEAD_COUNT_MAX,99), TEMP_CLASS, UTPI;";
                                                            $RSMain = ExecuteIQuery($strSQL,$iConRLM);
                                                            $aryReturn = array();
                                                            while ($LineMain = mysqli_fetch_assoc($RSMain)) {
                                                                $intISDID = $LineMain["ISD_ID"];
                                                                $aryTemp = $LineMain;
                                                                unset($aryTemp["ISD_ID"]);



                                                                $aryReturn[$intISDID] = $aryTemp;
                                                            }

                                                            return $aryReturn;
                                                        }


                                                        function Print_R2($aryArray) {
                                                            echo str_replace("<BR><BR>","<BR>",str_replace("\n","<BR>",str_replace(" ","&nbsp;",print_r($aryArray,true))));
                                                        }

                                                    ?>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="tab-pane w-100 fade <?php echo ($variable != '') ? 'show ' : ''; echo $variable;?>" id="nav-variable" role="tabpanel" aria-labelledby="nav-variable-tab" tabindex="0">
                                    <div class="card border border-start-0 border-end-0">
                                        <div class="card-header d-flex justify-content-between">
                                            <div>
                                                <h5 class="card-title"><i class="fa-solid fa-arrows-turn-to-dots"></i> Variable</h5>
                                                <small>Variable Index Time</small>
                                            </div>
                                            <div class="d-flex align-items-center">
                                                <button type="button" class="btn btn-sm btn-primary" id="io-add-variable">
                                                    <i class="fa-solid fa-plus"></i> Add Index Time
                                                </button>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-lg-12">
                                                    <?php
                                                        VARIABLE_INDEX_RENDER($aryFIT,$bolDebug);

                                                        function VARIABLE_INDEX_RENDER($aryFIT,$bolDebug=false){
                                                            echo "<table id=\"variableTable\" class=\"display compact h-100 cell-border\">";
                                                            #echo "<TABLE ID=\"tblFixed\" class=\"table table-striped\" BORDER=1 CELLSPACING=0 CELLPADDING=1>";
                                                            echo "<THEAD BGCOLOR=SILVER>";
                                                            echo "<tr><th>ISD ID</th><th>Handler</th><th>Package Type</th><th>Soak Time</th><th>Body Size</th><th>Leads Min</th><th>Leads Max</th><th>Temp Class</th><th>UTPI</th><th>Fixed ITPU</th><th>TTPI Threshold</th><th>Threshold Formula</th><th>Action</th><th>Matches</th><th>Edit</th></tr>";
                                                            echo "</THEAD><TBODY CLASS=B1 BGCOLOR=#FFFFFF>";

                                                            $intCtr = 0;
                                                            foreach($aryFIT as $intISDID => $aryFITTemp) {
                                                                if ($aryFITTemp['THRESHOLD_FORMULA'] != null && $aryFITTemp['THRESHOLD_FORMULA'] != "") {
                                                                        $aryLine = array(
                                                                            "ISM_ID"=>$aryFITTemp["ISM_ID"],
                                                                            "HANDLER"=>$aryFITTemp["HANDLER"],
                                                                            "PKG_TYPE"=>$aryFITTemp["PKG_TYPE"],
                                                                            "SOAK_TIME"=>$aryFITTemp["SOAK_TIME"], //jon - new column 4/9/2026
                                                                            "BODY_SIZE"=>$aryFITTemp["BODY_SIZE"],
                                                                            "LEAD_COUNT_MIN"=>$aryFITTemp["LEAD_COUNT_MIN"],
                                                                            "LEAD_COUNT_MAX"=>$aryFITTemp["LEAD_COUNT_MAX"],
                                                                            "TEMP_CLASS"=>$aryFITTemp["TEMP_CLASS"],
                                                                            "UTPI"=>$aryFITTemp["UTPI"],
                                                                            "FIXED_ITPU"=>$aryFITTemp["INDEX_VALUE"],
                                                                            "COEFFICIENT"=>$aryFITTemp["COEFFICIENT"],
                                                                            "CONSTANT"=>$aryFITTemp["CONSTANT"],
                                                                            "TTPI_THRESHOLD"=>$aryFITTemp["TTPI_THRESHOLD"],
                                                                            "THRESHOLD_FORMULA"=>$aryFITTemp["THRESHOLD_FORMULA"]
                                                                        );
                                                                        
                                                                        if($intCtr == 0) {
                                                                            echo "<tr id=\"tr_111\">";
                                                                        }else{
                                                                            echo "<tr>";
                                                                        }
                                                                        echo "<td>".$intISDID."</td>";
                                                                        echo "<td>".$aryLine["HANDLER"]."</td>";
                                                                        echo "<td>".$aryLine["PKG_TYPE"]."</td>";
                                                                        echo "<td>".$aryLine["SOAK_TIME"]."</td>"; //jon - new column 4/9/2026
                                                                        echo "<td>".$aryLine["BODY_SIZE"]."</td>";
                                                                        echo "<td>".$aryLine["LEAD_COUNT_MIN"]."</td>";
                                                                        echo "<td>".$aryLine["LEAD_COUNT_MAX"]."</td>";
                                                                        echo "<td>".$aryLine["TEMP_CLASS"]."</td>";
                                                                        echo "<td>".$aryLine["UTPI"]."</td>";
                                                                        echo "<td>".number_format($aryLine["FIXED_ITPU"],3)."</td>";
                                                                        if(!is_null($aryLine["TTPI_THRESHOLD"])) {
                                                                            echo "<td>".number_format($aryLine["TTPI_THRESHOLD"],3)."</td>";
                                                                        }else{
                                                                            echo "<td></td>";                                                                
                                                                        }                                                                
                                                                        echo "<td>".$aryLine["THRESHOLD_FORMULA"]."</td>";
                                                                        echo '<td><button type="button" class="btn btn-calculation btn-link" btn-data='.json_encode($aryLine).'>Calculation</button></td>';
                                                                        echo "<td class=\"scx-matches-cell\" data-isd-id=\"".$intISDID."\" data-handler=\"".htmlspecialchars($aryLine["HANDLER"], ENT_QUOTES)."\">View</td>";
                                                                        echo "<td class=\"io-edit-cell\" data-row=\"".htmlspecialchars(json_encode(IO_EDIT_ROW($intISDID, $aryFITTemp, 'variable')), ENT_QUOTES)."\"><a href=\"#\" class=\"io-edit-link\">Edit</a></td>";
                                                                        echo "</tr>";

                                                                        ++$intCtr;
                                                                    }
                                                                }

                                                            echo "</TBODY></TABLE>";
                                                        }
                                                    ?>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </div>
            
        </div>
        
        <!-- VARIABLE INDEX TIME CALCULATION MODAL -->
         <div class="modal fade zoom" id="variableIndexModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="variableIndexModalLabel">
            <div class="modal-dialog modal-dialog-centered modal-xl" style="min-width:90%;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="variableIndexModalLabel">Variable Index Time Calculation - <span class="vit-handler"></span></h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body pt-4 pb-4 pr-2 pl-2">

                        <div class="table-responsive-sm">
                            <table class="table table-bordered mb-4">
                                <thead>
                                    <tr>
                                        <th>Handler</th>
                                        <th>Package Type</th>
                                        <th>Soak Time</th>
                                        <th>Body Size</th>
                                        <th>Leads Min</th>
                                        <th>Leads Max</th>
                                        <th>Temp Class</th>
                                        <th>UTPI</th>
                                        <th>Fixed ITPU</th>
                                        <th>TTPI Threshold</th>
                                        <th>Threshold Formula</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="vit-handler"></td>
                                        <td class="vit-ptype"></td>
                                        <td class="vit-stime"></td>
                                        <td class="vit-bsize"></td>
                                        <td class="vit-lmin"></td>
                                        <td class="vit-lmax"></td>
                                        <td class="vit-temp"></td>
                                        <td class="vit-utpi"></td>
                                        <td class="vit-fitpu"></td>
                                        <td class="vit-ttpith"></td>
                                        <td class="vit-thform"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style="overflow-x: auto;" class="table-responsive-sm">
                            <table class="table table-bordered table-graph">
                                <thead>
                                    <tr>
                                        <th>&nbsp;</th>
                                        <?php
                                            for ($i=1; $i <= 10; $i++) { 
                                                $sign = ($i <= 9) ? "<=" : ">";

                                                $bg_parent = parentHeaderBG($i);

                                                if ($i <= 9) {
                                                    echo '<th style="background: '.$bg_parent.';" colspan="5">'.$sign.' '.$i.'</th>';
                                                }
                                                else{
                                                    echo '<th style="background: '.$bg_parent.';" colspan="5">'.$sign.' 9</th>';
                                                }
                                            }
                                        ?>
                                    </tr>
                                    <tr>
                                        <td><b>UTPI:</b></td>
                                        <?php
                                            for ($i=0.2; $i <= 10; $i+= 0.2) {
                                                $i = round($i, 1);

                                                $bg_child = childHeaderBG($i);

                                                echo '<th style="background: '.$bg_child.';">'.$i.'</th>';
                                            }
                                        ?>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><b>Index Time:</b></td>
                                        <?php
                                            for ($i=0.2; $i <= 10; $i+= 0.2) {
                                                $i = round($i, 1);

                                                $bg_child = childHeaderBG($i);
                                                echo '<td style="background: '.$bg_child.';" class="fw-bold td-calc" data-color="'.$bg_child.'" data-id="'.$i.'">1</td>';
                                            }
                                        ?>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>
                    
                    <div class="modal-body pt-4 pb-4 pr-2 pl-2">
                        <div class="d-flex align-items-center">
                            <!-- Y-axis title -->
                            <div class="me-3 mt-0" style="writing-mode: vertical-rl; transform: rotate(180deg);">
                                <b>Index Time</b>
                            </div>

                            <div style="width: 100%!important; height: 350px;">
                                 <canvas id="VarIndex" style="max-width:100%;"></canvas>

                                <!-- X-axis title -->
                                <div class="text-center mt-2">
                                    <b>UTPI</b>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>

        <!-- STATIC CALC INDX POPUP (added for index-calc page) -->
        <div class="modal fade" id="staticCalcModal" tabindex="-1" aria-labelledby="staticCalcModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-xl" style="min-width:90%;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="staticCalcModalLabel">
                            Static Calc Index &mdash; <span class="scx-handler"></span>
                            <small class="text-muted">(ISD ID: <span class="scx-isdid"></span>)</small>
                        </h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body pt-4 pb-4">
                        <div class="scx-loader text-center py-4 d-none">
                            <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
                        </div>
                        <div class="scx-message"></div>
                        <div class="table-responsive-sm">
                            <table id="staticCalcTable" class="table table-bordered table-striped table-sm w-100">
                                <thead></thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- INDEX OVERRIDE ADD/EDIT MODAL (added for index-calc page) -->
        <div class="modal fade" id="indexOverrideModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="indexOverrideModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <form id="io-form" autocomplete="off" onsubmit="return false;">
                        <div class="modal-header">
                            <h1 class="modal-title fs-5" id="indexOverrideModalLabel">Index Time</h1>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">

                            <!-- hidden identity fields (edit mode) -->
                            <input type="hidden" id="io-isd-id" value="">
                            <input type="hidden" id="io-ism-id" value="">

                            <!-- index type -->
                            <div class="mb-3">
                                <label class="form-label d-block mb-1">Index Type</label>
                                <div class="form-check form-check-inline">
                                    <input class="form-check-input" type="radio" name="io-index-type" id="io-type-fixed" value="fixed" checked>
                                    <label class="form-check-label" for="io-type-fixed">Fixed</label>
                                </div>
                                <div class="form-check form-check-inline">
                                    <input class="form-check-input" type="radio" name="io-index-type" id="io-type-variable" value="variable">
                                    <label class="form-check-label" for="io-type-variable">Variable</label>
                                </div>
                            </div>

                            <!-- combination fields -->
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label" for="io-handler">Handler</label>
                                    <input type="text" class="form-control io-combo" id="io-handler">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label" for="io-package">Package Type</label>
                                    <input type="text" class="form-control io-combo" id="io-package">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label" for="io-soak-time">Soak Time</label>
                                    <input type="text" class="form-control io-combo" id="io-soak-time">
                                    <div class="invalid-feedback">Must be a number &gt; 0 (or blank).</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label" for="io-body-size">Body Size</label>
                                    <input type="text" class="form-control io-combo" id="io-body-size">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label" for="io-temp-class">Temp Class</label>
                                    <input type="text" class="form-control io-combo" id="io-temp-class">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label" for="io-lead-min">Leads Min</label>
                                    <input type="text" class="form-control io-combo" id="io-lead-min">
                                    <div class="invalid-feedback">Must be a number &gt; 0 (or blank).</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label" for="io-lead-max">Leads Max</label>
                                    <input type="text" class="form-control io-combo" id="io-lead-max">
                                    <div class="invalid-feedback">Must be a number &gt; 0 (or blank).</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label" for="io-utpi">UTPI</label>
                                    <input type="text" class="form-control io-combo" id="io-utpi">
                                    <div class="invalid-feedback">Required; integer &gt;= 1.</div>
                                </div>
                            </div>

                            <hr>

                            <!-- value + formula fields -->
                            <div class="row g-3">
                                <div class="col-md-3">
                                    <label class="form-label" for="io-index-value">Index Value</label>
                                    <input type="text" class="form-control" id="io-index-value">
                                    <div class="invalid-feedback">Required; numeric.</div>
                                </div>
                                <div class="col-md-3 io-variable-only">
                                    <label class="form-label" for="io-ttpi-threshold">TTPI Threshold</label>
                                    <input type="text" class="form-control" id="io-ttpi-threshold">
                                    <div class="invalid-feedback">Required; numeric.</div>
                                </div>
                                <div class="col-md-3 io-variable-only">
                                    <label class="form-label" for="io-coefficient">Coefficient</label>
                                    <input type="text" class="form-control" id="io-coefficient">
                                    <div class="invalid-feedback">Required; numeric.</div>
                                </div>
                                <div class="col-md-3 io-variable-only">
                                    <label class="form-label" for="io-constant">Constant</label>
                                    <input type="text" class="form-control" id="io-constant">
                                    <div class="invalid-feedback">Required; numeric.</div>
                                </div>
                            </div>

                            <div class="row g-3 mt-1 io-variable-only">
                                <div class="col-md-12">
                                    <label class="form-label text-muted">Threshold Formula <small>(auto-generated)</small></label>
                                    <input type="text" class="form-control bg-light text-muted" id="io-threshold-formula-preview" readonly tabindex="-1">
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label text-muted">Final Formula <small>(auto-generated)</small></label>
                                    <input type="text" class="form-control bg-light text-muted" id="io-final-formula-preview" readonly tabindex="-1">
                                </div>
                            </div>

                            <div class="io-message mt-3"></div>

                        </div>
                        <div class="modal-footer justify-content-between">
                            <button type="button" class="btn btn-danger d-none <?php echo $disable_btn; ?>" id="io-delete-btn">
                                <i class="fa-solid fa-trash"></i> Delete
                            </button>
                            <div>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary <?php echo $disable_btn; ?>" id="io-save-btn">Save</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    </body>
</html>

<?php

    /*
     * Build the data-row payload attached to each "Edit" cell. Carries the
     * keys the editor modal needs. PACKAGE is aliased PKG_TYPE in the query;
     * INDEX_VALUE is the master INDX_VALUE. TYPE is decided by whether a
     * THRESHOLD_FORMULA exists (variable) or not (fixed).
     */
    function IO_EDIT_ROW($intISDID, $aryTemp, $type) {
        return array(
            "ISD_ID"         => $intISDID,
            "ISM_ID"         => isset($aryTemp["ISM_ID"]) ? $aryTemp["ISM_ID"] : null,
            "HANDLER"        => isset($aryTemp["HANDLER"]) ? $aryTemp["HANDLER"] : null,
            "PACKAGE"        => isset($aryTemp["PKG_TYPE"]) ? $aryTemp["PKG_TYPE"] : null,
            "SOAK_TIME"      => isset($aryTemp["SOAK_TIME"]) ? $aryTemp["SOAK_TIME"] : null,
            "BODY_SIZE"      => isset($aryTemp["BODY_SIZE"]) ? $aryTemp["BODY_SIZE"] : null,
            "LEAD_COUNT_MIN" => isset($aryTemp["LEAD_COUNT_MIN"]) ? $aryTemp["LEAD_COUNT_MIN"] : null,
            "LEAD_COUNT_MAX" => isset($aryTemp["LEAD_COUNT_MAX"]) ? $aryTemp["LEAD_COUNT_MAX"] : null,
            "TEMP_CLASS"     => isset($aryTemp["TEMP_CLASS"]) ? $aryTemp["TEMP_CLASS"] : null,
            "UTPI"           => isset($aryTemp["UTPI"]) ? $aryTemp["UTPI"] : null,
            "INDEX_VALUE"    => isset($aryTemp["INDEX_VALUE"]) ? $aryTemp["INDEX_VALUE"] : null,
            "TTPI_THRESHOLD" => isset($aryTemp["TTPI_THRESHOLD"]) ? $aryTemp["TTPI_THRESHOLD"] : null,
            "COEFFICIENT"    => isset($aryTemp["COEFFICIENT"]) ? $aryTemp["COEFFICIENT"] : null,
            "CONSTANT"       => isset($aryTemp["CONSTANT"]) ? $aryTemp["CONSTANT"] : null,
            "TYPE"           => $type
        );
    }

    function parentHeaderBG($i){
        switch ($i) {
            case $i == 1:
                $color = "#5A7FB0";
                break;

            case $i == 2:
                $color = "#6BA6F0";
                break;

            case $i == 3:
                $color = "#6AB6AE";
                break;

            case $i == 4:
                $color = "#6FC39A";
                break;

            case $i == 5:
                $color = "#E6C157";
                break;

            case $i == 6:
                $color = "#F1A15F";
                break;

            case $i == 7:
                $color = "#E57373";
                break;

            case $i == 8:
                $color = "#A48BEA";
                break;

            case $i == 9:
                $color = "#B9A6F3";
                break;
            
            default:
                $color = "#9AA6B2";
                break;
        }
        return $color;
    }

    function childHeaderBG($i){
        switch ($i) {
            case $i <= 1:
                $color = "#9BB4D6";
                break;

            case ($i > 1 && $i <= 2):
                $color = "#A9C8F6";
                break;

            case ($i > 2 && $i <= 3):
                $color = "#A3D6D0";
                break;

            case ($i > 3 && $i <= 4):
                $color = "#A8DBC1";
                break;

            case ($i > 4 && $i <= 5):
                $color = "#F1DEA0";
                break;

            case ($i > 5 && $i <= 6):
                $color = "#F6C199";
                break;

            case ($i > 6 && $i <= 7):
                $color = "#F0ADAD";
                break;

            case ($i > 7 && $i <= 8):
                $color = "#CFC1F4";
                break;

            case ($i > 8 && $i <= 9):
                $color = "#D6CBF8";
                break;
            
            default:
                $color = "#C6CED6";
                break;
        }
        return $color;
    }

?>