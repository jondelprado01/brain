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
                if (!in_array($key, [4, 11, 12, 16])) {
                    echo $asset;
                }
            }
        ?>

        <script type="text/javascript" src="../../js/moment.min.js"></script>
        <script type="text/javascript" src="../../js/daterangepicker.min.js"></script>
        <link rel="stylesheet" type="text/css" href="../../css/daterangepicker.css" />
        <script src="../../js/change-log.js"></script>

        <style>
            ul.timeline-3 {
                list-style-type: none;
                position: relative;
            }
            ul.timeline-3:before {
                content: " ";
                background: #d4d9df;
                display: inline-block;
                position: absolute;
                left: 29px;
                width: 2px;
                height: 100%;
                z-index: 400;
            }
            ul.timeline-3 > li {
                margin: 20px 0;
                padding-left: 20px;
            }
            ul.timeline-3 > li:before {
                content: " ";
                background: white;
                display: inline-block;
                position: absolute;
                border-radius: 50%;
                border: 3px solid #22c0e8;
                left: 20px;
                width: 20px;
                height: 20px;
                z-index: 400;
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

        <div class="container-sm p-4">

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title text-center">CHANGE LOG</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        
                        <div class="col-lg-12 mt-3">

                            <div style="display: none;" class="alert alert-danger alert-dismissible" role="alert">
                                <strong>Missing Search Details!</strong> Please complete all required search fields.
                                <button type="button" class="btn-close"></button>
                            </div>

                            <div style="display: none;" class="alert alert-warning alert-dismissible" role="alert">
                                <strong>No Results Found!</strong> No records match your search details.
                                <button type="button" class="btn-close"></button>
                            </div>

                            <div class="row">
                                <div class="col-lg-4">
                                    <div class="form-floating">
                                        <select class="form-select" id="select-module" aria-label="select module">
                                            <option value="" selected>--</option>
                                            <optgroup label="PLANNING ASSUMPTIONS">
                                                <option value="PLANNING ASSUMPTIONS TIME-PHASING">Time-Phasing</option>
                                                <option value="PLANNING ASSUMPTIONS OEE">OEE Override</option>
                                                <option value="PLANNING ASSUMPTIONS MODIFY">Modify Planning Assumptions</option>
                                            </optgroup>
                                            <option class="fw-bold" value="DEFAULT ATOM">DEFAULT ATOM</option>
                                            <optgroup label="HW OVERRIDE">
                                                <option value="HW OVERRIDE TYPE-1">TYPE 1 - HW Mapping</option>
                                                <option value="HW OVERRIDE TYPE-2">TYPE 2 - HW Capacity Override</option>
                                                <option value="HW OVERRIDE TYPE-3">TYPE 3 - Plan Non-Boards</option>
                                            </optgroup>
                                            <optgroup label="NON-ATE">
                                                <option value="NON-ATE TYPE-1">TYPE 1 - Burn-In Load/Unload Hours</option>
                                                <option value="NON-ATE TYPE-2">TYPE 2 - Override Socket Efficiency</option>
                                                <option value="NON-ATE TYPE-3">TYPE 3 - HW Capacity Override</option>
                                            </optgroup>
                                        </select>
                                        <label for="select-module">Select Module</label>
                                    </div>
                                </div>
                                <div class="col-lg-4">
                                    <div class="form-floating">
                                        <input type="text" class="form-control" id="search-value" placeholder="">
                                        <label for="search-value">Search Value</label>
                                    </div>
                                </div>
                                <div class="col-lg-4">
                                    <div class="input-group mb-3">
                                        <div class="form-floating">
                                            <input type="hidden" id="start-date">
                                            <input type="hidden" id="end-date">
                                            <input type="text" class="form-control" id="select-daterange" name="daterange" placeholder=""/>
                                            <label for="select-daterange">Select Date Range</label>
                                        </div>
                                        <button class="btn btn-outline-info" type="button" id="btn-search">Search</button>
                                    </div>
                                </div>
                            </div>
                            
                        </div>

                        <div class="col-lg-12 mt-3">
                            <hr>
                            <div class="col-md-6 offset-md-3">
                                <h4 style="margin-left: 1.2rem;">History - <span class="selected-module"></span></h4>
                                <ul class="timeline-3 change-log-container">
                                    
                                    

                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </body>
    
</html>