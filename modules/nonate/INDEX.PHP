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
include_once("../../requests/API.PHP");
$assets = RENDER_ASSETS("module");
$response = API_REQUEST('nonate-tool');
$existing_burnin = $response['TYPE_1'];
$existing_socket = $response['TYPE_2'];
$existing_capacity = $response['TYPE_3'];
$weeks = $response['WEEKS'];
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
            var existing_burnin = '<?php echo json_encode($existing_burnin);?>';
            var existing_socket = '<?php echo json_encode($existing_socket);?>';
            var existing_capacity = '<?php echo json_encode($existing_capacity);?>';
            var weeks = '<?php echo json_encode($weeks);?>';
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
        <script src="../../js/nonate-type-1.js"></script>
        <script src="../../js/nonate-type-2.js"></script>
        <script src="../../js/nonate-type-3.js"></script>

        <!-- FOR CHANGE LOG FEATURE ONLY (ALL HW OVERRIDE TYPES) -->
        <script>
            function addChangeLog(payload, user_details, module, old_data = []){
                $.ajax({
                    type: 'post',
                    url: 'http://mxhtafot01l.maxim-ic.com/TEST/BRAIN_CHANGE_LOG.PHP',
                    data: {payload: payload, user_details: user_details, module: module, old_data: old_data},
                    success: function(data){
                        console.log(data);
                    },
                    error: function(xhr, status, error) {
                        console.log(xhr);
                    }
                });
            }
        </script>

        <style>
            #dt-length-0, #dt-length-1, #dt-length-2{
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
                    <h3 class="card-title text-center">NONATE</h3>
                </div>
                <div class="card-body p-0">
                    <div class="row">
                        <div class="col-lg-12">
                            <?php
                                $active_type1 = '';
                                $active_type2 = '';
                                $active_type3 = '';

                                if (isset($_REQUEST['tab'])) {
                                    switch ($_REQUEST['tab']) {
                                        case 'type-1':
                                            $active_type1 = 'active';
                                            break;
    
                                        case 'type-2':
                                            $active_type2 = 'active';
                                            break;
    
                                        case 'type-3':
                                            $active_type3 = 'active';
                                            break;
                                    }
                                }
                                else {$active_type1 = 'active';}
                            ?>

                            <nav class="pt-3">
                                <div class="nav nav-tabs d-flex justify-content-evenly" id="nav-tab" role="tablist">
                                    <button tab-name="type-1" class="nav-link nonate-link <?php echo $active_type1; ?>" id="nav-type1-tab" data-bs-toggle="tab" data-bs-target="#nav-type1" type="button" role="tab" aria-controls="nav-type1" aria-selected="false">Type 1</button>
                                    <button tab-name="type-2" class="nav-link nonate-link <?php echo $active_type2; ?>" id="nav-type2-tab" data-bs-toggle="tab" data-bs-target="#nav-type2" type="button" role="tab" aria-controls="nav-type2" aria-selected="false">Type 2</button>
                                    <button tab-name="type-3" class="nav-link nonate-link <?php echo $active_type3; ?>" id="nav-type3-tab" data-bs-toggle="tab" data-bs-target="#nav-type3" type="button" role="tab" aria-controls="nav-type3" aria-selected="false">Type 3</button>
                                </div>
                            </nav>
                            
                            <div class="tab-content d-flex justify-content-center" id="nav-tabContent">

                                <div class="tab-pane w-100 fade <?php echo ($active_type1 != '') ? 'show ' : ''; echo $active_type1;?>" id="nav-type1" role="tabpanel" aria-labelledby="nav-type1-tab" tabindex="0">
                                    <div class="card border border-start-0 border-end-0">
                                        <div class="card-header d-flex justify-content-between">
                                            <div>
                                                <h5 class="card-title"><i class="fa-solid fa-download"></i> Type 1</h5>
                                                <small>BI - Load / Unload Hours</small>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <div class="row">
                                                <!-- <div class="d-flex justify-content-between"> -->
                                                    <div class="row g-3 mb-3 mt-0 align-items-center">
                                                        <div class="col-auto">
                                                            <label for="search-board-field-type1" class="col-form-label fw-bold">SEARCH BOARD / PART:</label>
                                                        </div>
                                                        <div class="col-auto">
                                                            <input type="text" id="search-board-field-type1" class="form-control">
                                                        </div>
                                                        <div class="col-auto">
                                                            <span id="search-board-inline-type1" class="form-text">
                                                            Must be 5-10 characters long.
                                                            </span>
                                                        </div>
                                                        <div class="col-auto">
                                                            <button style="display: none;" class="btn btn-outline-secondary btn-message btn-loader" type="button" disabled>
                                                                <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                                                <span role="status">Retrieving data... Please wait.</span>
                                                            </button>

                                                            <button style="display: none;" class="btn btn-outline-danger btn-message btn-no-result" type="button" disabled>
                                                                <span role="status">No results found for your search. Please try a different keyword.</span>
                                                            </button>
                                                        </div>
                                                        <!-- <input type="file" name="mass-insert-type1" id="mass-insert-type1">
                                                        <button id="btn-mass-insert-type1">upload</button> -->
                                                    </div>
                                                    <!-- <button type="button" class="btn btn-success btn-save-type1">Save <i class="fa-regular fa-floppy-disk"></i></button> -->
                                                <!-- </div> -->
                                                <hr>
                                                <div class="d-flex justify-content-end">
                                                    <button type="button" class="btn btn-success btn-save-burnin" disabled>Save <i class="fa-regular fa-floppy-disk"></i></button>
                                                </div>
                                                <table class="table table-non-type1 table-bordered table-hover h-100">
                                                    <thead>
                                                        <tr>
                                                            <th>MFG_PART_NUM</th>
                                                            <th>BOARD</th>
                                                            <th>BI_HOURS</th>
                                                            <th>LOAD_UNLOAD-HOURS</th>
                                                            <th>TOTAL_BI_HRS</th>
                                                            <th>TURNS_PER_WEEK</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="tab-pane w-100 fade <?php echo ($active_type2 != '') ? 'show ' : ''; echo $active_type2;?>" id="nav-type2" role="tabpanel" aria-labelledby="nav-type2-tab" tabindex="0">
                                    <div class="card border border-start-0 border-end-0">
                                        <div class="card-header d-flex justify-content-between">
                                            <div>
                                                <h5 class="card-title"><i class="fa-solid fa-percent"></i> Type 2</h5>
                                                <small>Override Socket Efficiency</small>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="row g-3 mb-3 mt-0 align-items-center">
                                                    <div class="col-auto">
                                                        <label for="search-board-field-type2" class="col-form-label fw-bold">SEARCH BOARD:</label>
                                                    </div>
                                                    <div class="col-auto">
                                                        <input type="text" id="search-board-field-type2" class="form-control">
                                                    </div>
                                                    <div class="col-auto">
                                                        <span id="search-board-inline-type2" class="form-text">
                                                        Must be 5-10 characters long.
                                                        </span>
                                                    </div>
                                                    <div class="col-auto">
                                                        <button style="display: none;" class="btn btn-outline-secondary btn-message-type2 btn-loader-type2" type="button" disabled>
                                                            <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                                            <span role="status">Retrieving data... Please wait.</span>
                                                        </button>

                                                        <button style="display: none;" class="btn btn-outline-danger btn-message-type2 btn-no-result-type2" type="button" disabled>
                                                            <span role="status">No results found for your search. Please try a different keyword.</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <hr>
                                                <div class="d-flex justify-content-end">
                                                    <button type="button" class="btn btn-success btn-save-socket" disabled>Save <i class="fa-regular fa-floppy-disk"></i></button>
                                                </div>
                                                <table class="table table-non-type2 table-bordered table-hover h-100">
                                                    <thead>
                                                        <tr>
                                                            <th>BOARD</th>
                                                            <th>SOCKET EFFICIENCY</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="tab-pane w-100 fade <?php echo ($active_type3 != '') ? 'show ' : ''; echo $active_type3;?>" id="nav-type3" role="tabpanel" aria-labelledby="nav-type3-tab" tabindex="0">
                                    <div class="card border border-start-0 border-end-0">
                                        <div class="card-header d-flex justify-content-between">
                                            <div>
                                                <h5 class="card-title"><i class="fa-solid fa-microchip"></i> Type 3</h5>
                                                <small>Hardware Capacity Override</small>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-lg-6 mb-3 text-center">
                                                    <button type="button" class="btn btn-link btn-modal-non" data-bs-toggle="modal" data-bs-target="#modal-add-non-type3">HW Capacity Override <i class="fa-solid fa-circle-plus text-success"></i></button>
                                                </div>
                                                <hr class="mb-2">
                                                <div class="d-flex justify-content-end btn-delete-type3-container d-none">
                                                    <button type="button" class="btn btn-danger btn-delete-type3-all">Delete All Overrides</button>
                                                </div>
                                                <table class="table table-non-type3 table-bordered table-hover h-100">
                                                    <thead>
                                                        <tr>
                                                            <th class="fs-6">
                                                                <div class="d-flex justify-content-center">
                                                                    <input class="type3-check-all" type="checkbox">
                                                                </div>
                                                            </th>
                                                            <th>HW_NAME</th>
                                                            <th>SITE_NUM</th>
                                                            <th>RES_AREA</th>
                                                            <th>EFF_START</th>
                                                            <th>EFF_END</th>
                                                            <th>OVERRIDE CAP</th>
                                                            <th>HMS COUNT</th>
                                                            <th>HW_TYPE</th>
                                                            <th>ACTIONS</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <?php
                                                            foreach ($existing_capacity as $key => $capacity) {
                                                            ?>
                                                                <tr>
                                                                    <td>
                                                                        <div class="d-flex justify-content-center">
                                                                            <input class="type3-check" type="checkbox" value='<?php echo json_encode($capacity);?>'>
                                                                        </div>
                                                                    </td>
                                                                    <td><?php echo $capacity['HW_NM']?></td>
                                                                    <td><?php echo $capacity['SITE_NUM']?></td>
                                                                    <td><?php echo $capacity['RES_AREA']?></td>
                                                                    <td><?php echo $capacity['EFF_START']?></td>
                                                                    <td><?php echo $capacity['EFF_END']?></td>
                                                                    <td><?php echo $capacity['OVERRIDE_CAP']?></td>
                                                                    <td><?php echo $capacity['CURRENT_CAP']?></td>
                                                                    <td><?php echo $capacity['HW_TYPE']?></td>
                                                                    <td>
                                                                        <div class="btn-group">
                                                                            <button class="btn btn-outline-info btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                                <i class="fa-solid fa-ellipsis"></i>
                                                                            </button>
                                                                            <ul class="dropdown-menu">
                                                                                <li>
                                                                                    <button type="button" data='<?php echo json_encode($capacity);?>' class="dropdown-item text-warning btn-sm btn-view-hw">
                                                                                        <i class="fa-solid fa-eye"></i> View
                                                                                    </button>
                                                                                </li>
                                                                                <li>
                                                                                    <button type="button" data='<?php echo json_encode($capacity);?>' class="dropdown-item text-primary btn-sm btn-edit-hw">
                                                                                        <i class="fa-solid fa-pen-to-square"></i> Edit
                                                                                    </button>
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            <?php
                                                            }
                                                        ?>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <!-- -----------------------------------------------------------------------------------MODALS------------------------------------------------------------------------------------------------- -->
             <div class="modal fade zoom" id="modal-view-data" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header d-flex justify-content-between bg-warning-subtle">
                            <div>
                                <h1 class="modal-title fs-5">View <span class="view-type-h1"></span> - <span class="view-record-h1"></span></h1>
                            </div>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-hw-nm"></strong></p><small>HW_NAME</small></div>
                                <div class="col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-hw-type"></strong></p><small>HW_TYPE</small></div>
                                <div class="col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-start"></strong></p><small>EFF_START</small></div>
                                <div class="col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-end"></strong></p><small>EFF_END</small></div>
                                <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-override-container"><p class="lead m-0"><strong class="view-override"></strong></p><small>OVERRIDE CAPACITY</small></div>
                                <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-current-container"><p class="lead m-0"><strong class="view-current"></strong></p><small>HMS COUNT</small></div>
                                <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-site-num-container"><p class="lead m-0"><strong class="view-site-num"></strong></p><small>SITE_NUM</small></div>
                                <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-res-area-container"><p class="lead m-0"><strong class="view-res-area"></strong></p><small>RES_AREA</small></div>
                                <hr>
                                <div class="col-lg-6 text-center mb-2"><p class="lead m-0"><strong class="view-created-at"></strong></p><small>CREATED_AT</small></div>
                                <div class="col-lg-6 text-center mb-2"><p class="lead m-0"><strong class="view-created-by"></strong></p><small>CREATED_BY</small></div>
                                <div class="col-lg-6 text-center mb-2"><p class="lead m-0"><strong class="view-updated-at"></strong></p><small>UPDATED_AT</small></div>
                                <div class="col-lg-6 text-center mb-2"><p class="lead m-0"><strong class="view-updated-at"></strong></p><small>UPDATED_AT</small></div>
                            </div>
                        </div>
                        <div class="modal-footer bg-warning-subtle">
                            <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                </div>
             </div>

             <div class="modal fade zoom" id="modal-edit-data-type3" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header d-flex justify-content-between bg-primary-subtle">
                            <div>
                                <h1 class="modal-title fs-5">Edit <span class="edit-type-h1-type3"></span> - <span class="edit-record-h1-type3"></span></h1>
                                <small>All fields with <i class="fa-solid fa-asterisk"></i> are required.</small>
                            </div>
                        </div>
                        <div class="modal-body">
                            <div class="row g-2">
                                <input type="hidden" class="edit-data-type3 default-state-type3">
                                <input type="hidden" class="edit-data-type3 edit-id-type3">
                                <div class="col-lg-6">
                                    <div class="form-floating mb-3">
                                        <input  class="form-control edit-data-type3 edit-hw-nm-type3" type="text" placeholder="" readonly>
                                        <label class="label-type">HW_NAME</label>
                                    </div>
                                </div>
                                <div style="display: none!important;" class="col-lg-6 edit-override-container-type3">
                                    <div class="form-floating mb-3">
                                        <input  class="form-control edit-data-type3 edit-override-type3" type="number" step="0.1" placeholder="">
                                        <label class="label-type"><i class="fa-solid fa-asterisk"></i> OVERRIDE CAP</label>
                                    </div>
                                </div>
                                <div class="col-lg-6 edit-start-container-type3">
                                    <div class="form-floating mb-3">
                                        <select class="form-select  edit-data-type3 edit-start-type3 edit-week-type3" placeholder=""></select>
                                        <label class="label-type label-start"><i class="fa-solid fa-asterisk"></i> EFF START</label>
                                    </div>
                                </div>
                                <div class="col-lg-6 edit-end-container-type3">
                                    <div class="form-floating mb-3">
                                        <select class="form-select  edit-data-type3 edit-end-type3 edit-week-type3" placeholder=""></select>
                                        <label class="label-type label-end"><i class="fa-solid fa-asterisk"></i> EFF END</label>
                                    </div>
                                </div>
                                <div style="display: none!important;" class="col-lg-6 edit-current-container-type3">
                                    <div class="form-floating mb-3">
                                        <input  class="form-control edit-data-type3 edit-current-type3" type="number" step="0.1" placeholder="" readonly>
                                        <label class="label-type">HMS COUNT</label>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-floating mb-3">
                                        <input  class="form-control edit-data-type3 edit-hw-type-type3" type="text"  placeholder="" readonly>
                                        <label class="label-type">HW_TYPE</label>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-floating mb-3">
                                        <input  class="form-control edit-data-type3 edit-site-num-type3" type="text"  placeholder="" readonly>
                                        <label class="label-type">SITE_NUM</label>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-floating mb-3">
                                        <input  class="form-control edit-data-type3 edit-res-area-type3" type="text"  placeholder="" readonly>
                                        <label class="label-type">RES_AREA</label>
                                    </div>
                                </div>
                                <hr>
                                <div class="col-lg-4 text-center">
                                    <small>Date Created:</small>
                                    <p class="lead edit-created-at-type3"></p>
                                </div>
                                <div class="col-lg-4 text-center">
                                    <small>Created By:</small>
                                    <p class="lead edit-created-by-type3"></p>
                                </div>
                                <div class="col-lg-4 text-center">
                                    <small>Date Updated:</small>
                                    <p class="lead edit-updated-at-type3"></p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer bg-primary-subtle">
                            <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                            <button type="button" class="btn btn-success btn-edit-data-type3">Save <i class="fa-regular fa-floppy-disk"></i></button>
                        </div>
                    </div>
                </div>
            </div>

             <div class="modal fade zoom" id="modal-add-non-type3" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
                <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"  style="min-width:90%;">
                    <div class="modal-content">
                        <div class="modal-header d-flex justify-content-between bg-success-subtle">
                            <div>
                                <h1 class="modal-title fs-5">Create HW Capacity Override</h1>
                                <small>All fields with <i class="fa-solid fa-asterisk"></i> are required.</small>
                            </div>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-lg-8 mb-3">
                                    <div class="row g-2">
                                        <div class="col-lg-5">
                                            <input identifier="type3" class="form-control input-search-type3" type="text" placeholder="Search HW">
                                            <div class="form-text" id="basic-addon4">Hit "Enter" to proceed</div>
                                        </div>
                                        <div class="col-lg-7">
                                            <div class="input-group">
                                                <select class="form-select input-select-type3" disabled>
                                                </select>
                                                <button class="btn btn-outline-success btn-add-hw" type="button" disabled>
                                                    <div style="display: none!important;" class="spinner-border spinner-border-sm" role="status">
                                                        <span class="sr-only">Loading...</span>
                                                    </div>
                                                    <i class="fa-solid fa-circle-plus"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-4">
                                    <button class="btn btn-outline-secondary d-none loader-override-type3" type="button" disabled>
                                            <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                            <span role="status">Validating Override Capacity, Please Wait...</span>
                                    </button>
                                </div>
                                <hr>
                            </div>
                            <div class="row g-2 input-container-type3">
                                <p class="lead empty-filler-type3 d-flex justify-content-center align-items-center">
                                    Create HW Capacity Overrides Using Search
                                </p>
                            </div>
                        </div>
                        <div class="modal-footer bg-success-subtle">
                            <button type="button" class="btn btn-danger btn-close-modal-type3" process-type="type3" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                            <button type="button" class="btn btn-success btn-save-type3" process-type="type3">Save <i class="fa-regular fa-floppy-disk"></i></button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </body>
    
</html>