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
        <script src="../../js/index-time-fixed.js"></script>
        <style>
            #dt-length-0{
                margin-right: 0.5em!important;
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
                                                            echo "<tr><th>Handler</th><th>Package Type</th><th>Body Size</th><th>Leads Min</th><th>Leads Max</th><th>Temp Class</th><th>UTPI</th><th>Fixed ITPU</th></tr>";
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
                                                                    echo "<td>".$aryLine["HANDLER"]."</td>";
                                                                    echo "<td>".$aryLine["PKG_TYPE"]."</td>";
                                                                    echo "<td>".$aryLine["BODY_SIZE"]."</td>";
                                                                    echo "<td>".$aryLine["LEAD_COUNT_MIN"]."</td>";
                                                                    echo "<td>".$aryLine["LEAD_COUNT_MAX"]."</td>";
                                                                    echo "<td>".$aryLine["TEMP_CLASS"]."</td>";
                                                                    echo "<td>".$aryLine["UTPI"]."</td>";
                                                                    echo "<td>".number_format($aryLine["FIXED_ITPU"],3)."</td>";
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
                                                                BODY_SIZE,
                                                                LEAD_COUNT_MIN,
                                                                LEAD_COUNT_MAX,
                                                                TEMP_CLASS,
                                                                UTPI,
                                                                INDEX_VALUE,
                                                                TTPI_THRESHOLD,
                                                                THRESHOLD_FORMULA
                                                                #FINAL_FORMULA
                                                                FROM BRAIN.V_INDEX_OVERRIDE
                                                                ORDER BY HANDLER, PKG_TYPE, IFNULL(LEAD_COUNT_MIN,0), IFNULL(LEAD_COUNT_MAX,99), TEMP_CLASS, UTPI;";
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
                                                            echo "<tr><th>Handler</th><th>Package Type</th><th>Body Size</th><th>Leads Min</th><th>Leads Max</th><th>Temp Class</th><th>UTPI</th><th>Fixed ITPU</th><th>TTPI Threshold</th><th>Threshold Formula</th></tr>";
                                                            echo "</THEAD><TBODY CLASS=B1 BGCOLOR=#FFFFFF>";

                                                            $intCtr = 0;
                                                            foreach($aryFIT as $intISDID => $aryFITTemp) {
                                                                if ($aryFITTemp['THRESHOLD_FORMULA'] != null && $aryFITTemp['THRESHOLD_FORMULA'] != "") {
                                                                        $aryLine = array(
                                                                            "HANDLER"=>$aryFITTemp["HANDLER"],
                                                                            "PKG_TYPE"=>$aryFITTemp["PKG_TYPE"],
                                                                            "BODY_SIZE"=>$aryFITTemp["BODY_SIZE"],
                                                                            "LEAD_COUNT_MIN"=>$aryFITTemp["LEAD_COUNT_MIN"],
                                                                            "LEAD_COUNT_MAX"=>$aryFITTemp["LEAD_COUNT_MAX"],
                                                                            "TEMP_CLASS"=>$aryFITTemp["TEMP_CLASS"],
                                                                            "UTPI"=>$aryFITTemp["UTPI"],
                                                                            "FIXED_ITPU"=>$aryFITTemp["INDEX_VALUE"],
                                                                            "TTPI_THRESHOLD"=>$aryFITTemp["TTPI_THRESHOLD"],
                                                                            "THRESHOLD_FORMULA"=>$aryFITTemp["THRESHOLD_FORMULA"]
                                                                        );
                                                                        
                                                                        if($intCtr == 0) {
                                                                            echo "<tr id=\"tr_111\">";
                                                                        }else{
                                                                            echo "<tr>";
                                                                        }
                                                                        echo "<td>".$aryLine["HANDLER"]."</td>";
                                                                        echo "<td>".$aryLine["PKG_TYPE"]."</td>";
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

    </body>
</html>