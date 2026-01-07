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
        <?php
            foreach ($assets as $key => $asset) {
                if (!in_array($key, [4, 11, 12, 16])) {
                    echo $asset;
                }
            }
        ?>
        <link rel="stylesheet" href="../../css/plugins/dataTables.dataTables.2.3.2.min.css"/>
        <script src="../../js/plugins/dataTables.2.3.2.min.js"></script>
        <script src="../../js/account.js"></script>
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
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title text-center">ACCOUNT MANAGEMENT</h3>
                </div>
                <div class="card-body">
                    <!-- <div class="d-flex justify-content-end">
                        <button type="button" class="btn btn-outline-success btn-add-user mb-3" data-bs-toggle="modal" data-bs-target="#addUserModal">
                            Add User <i class="fa-solid fa-user-plus"></i>
                        </button>
                    </div> -->
                    <table class="table table-users table-bordered table-hover table-striped">
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </div>

        <!-- <div class="modal fade zoom" id="addUserModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="addUserModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="addUserModalLabel">Add User</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-lg-12 mb-3">
                            <div class="form-floating">
                                <select class="form-select fw-bold">
                                    <option selected>----</option>
                                </select>
                                <label>Select User</label>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="form-floating">
                                <select class="form-select fw-bold">
                                    <option selected>----</option>
                                    <option value="">Hardware Planning </option>
                                    <option value="">Production Planning</option>
                                    <option value="">SCM Capacity Planning </option>
                                </select>
                                <label>Select Role</label>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="form-floating">
                                <select class="form-select fw-bold">
                                    <option selected>----</option>
                                    <option value="">Inheritable</option>
                                    <option value="">Assigned</option>
                                </select>
                                <label>Select Role Type</label>
                            </div>
                        </div>
                        <div class="col-lg-12"><hr></div>
                        <label class="mb-2">Custom Permission:</label>
                        <div class="col-lg-4 mb-3">
                            <div class="card">
                                <div class="card-header"><span class="card-title">Planning Assumptions:</span></div>
                                <div class="card-body">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault" checked>
                                        <label class="form-check-label text-warning" for="switchCheckDefault">View</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-info" for="switchCheckDefault">Edit Primary Setups</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-info" for="switchCheckDefault">Unplannable Flag</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-4 mb-3">
                            <div class="card">
                                <div class="card-header"><span class="card-title">Dedications:</span></div>
                                <div class="card-body">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault" checked>
                                        <label class="form-check-label text-warning" for="switchCheckDefault">View</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-success" for="switchCheckDefault">Create</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-danger" for="switchCheckDefault">Delete</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-4 mb-3">
                            <div class="card">
                                <div class="card-header"><span class="card-title">OEE:</span></div>
                                <div class="card-body">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault" checked>
                                        <label class="form-check-label text-warning" for="switchCheckDefault">View</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-success" for="switchCheckDefault">Create</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-danger" for="switchCheckDefault">Delete</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-4 mb-3">
                            <div class="card">
                                <div class="card-header"><span class="card-title">Time-phasing:</span></div>
                                <div class="card-body">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault" checked>
                                        <label class="form-check-label text-warning" for="switchCheckDefault">View</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-success" for="switchCheckDefault">Create</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-danger" for="switchCheckDefault">Delete</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-4 mb-3">
                            <div class="card">
                                <div class="card-header"><span class="card-title">HW Override:</span></div>
                                <div class="card-body">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault" checked>
                                        <label class="form-check-label text-warning" for="switchCheckDefault">View</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-success" for="switchCheckDefault">Create</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-primary" for="switchCheckDefault">Edit</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-danger" for="switchCheckDefault">Delete</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-4 mb-3">
                            <div class="card">
                                <div class="card-header"><span class="card-title">NONATE:</span></div>
                                <div class="card-body">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault" checked>
                                        <label class="form-check-label text-warning" for="switchCheckDefault">View</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-success" for="switchCheckDefault">Create</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-primary" for="switchCheckDefault">Edit</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault">
                                        <label class="form-check-label text-danger" for="switchCheckDefault">Delete</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-success">Save changes</button>
                </div>
                </div>
            </div>
        </div> -->

    </body>
    
</html>