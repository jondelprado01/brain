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
            foreach ($assets as $key => $asset) {
                if (!in_array($key, [4, 11, 12, 16])) {
                    echo $asset;
                }
            }
        ?>
        <link rel="stylesheet" href="../../css/plugins/dataTables.dataTables.2.3.2.min.css"/>
        <script src="../../js/plugins/dataTables.2.3.2.min.js"></script>
        <script src="../../js/absolute.js"></script>
        <script src="../../js/default-atom.js"></script>
        <style>
            .dt-input{
                margin-right: 1em!important;
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

            <div class="card h-100">
                <div class="card-header">
                    <h3 class="card-title text-center">DEFAULT ATOM</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-12">
                            <table class="table table-bordered table-hover table-striped table-default-atom">
                                <thead>
                                    <tr>
                                        <th>TYPE</th>
                                        <th>SITE</th>
                                        <th>RES_AREA</th>
                                        <th>ENG NAME</th>
                                        <th>ATOM NAME</th>
                                        <th>ACTION</th>
                                    </tr>
                                </thead>
                            </table>
                        </div>
                    </div>
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

        </div>

    </body>
    
</html>