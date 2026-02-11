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

$response = API_REQUEST('hw-override-tool');

$existing_mapping = $response['TYPE_1'];
$existing_capacity = $response['TYPE_2'];
$existing_nonboard = $response['TYPE_3'];
$weeks = $response['WEEKS'];
// echo "<pre>", var_dump($weeks_open), "</pre>";
// return;
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
            var existing_mapping = '<?php echo json_encode($existing_mapping);?>';
            var existing_capacity = '<?php echo json_encode($existing_capacity);?>';
            var existing_nonboard = '<?php echo json_encode($existing_nonboard);?>';
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
        <script src="../../js/hardware-type-1.js"></script>
        <script src="../../js/hardware-type-2.js"></script>
        <script src="../../js/hardware-type-3.js"></script>

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
            .row-disabled{
                pointer-events: none!important;
                opacity: 0.6!important;
            }
            .selectable-row{
                cursor: pointer!important;
            }
            #dt-length-0, #dt-length-1, #dt-length-2{
                margin-right: 1em!important;
            }
            input:read-only, input:read-only .label-type, select:disabled{
                background-color: white!important;
            }
            .dataTables_filter{
                margin-bottom: 1em!important;
            }
            .input-part-select{
                font-size: 13px!important;
            }
            .details-tooltip{
                background-color: white!important;
                padding-top: 5px!important;
            }
            .form-control{
                text-transform: uppercase;
            }
            .custom-tooltip {
            --bs-tooltip-bg: var(--bd-violet-bg);
            --bs-tooltip-color: var(--bs-white);
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
                    <h3 class="card-title text-center">HARDWARE OVERRIDE</h3>
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
                                    <button tab-name="type-1" class="nav-link hw-link <?php echo $active_type1; ?>" id="nav-type1-tab" data-bs-toggle="tab" data-bs-target="#nav-type1" type="button" role="tab" aria-controls="nav-type1" aria-selected="false">Type 1</button>
                                    <button tab-name="type-2" class="nav-link hw-link <?php echo $active_type2; ?>" id="nav-type2-tab" data-bs-toggle="tab" data-bs-target="#nav-type2" type="button" role="tab" aria-controls="nav-type2" aria-selected="false">Type 2</button>
                                    <button tab-name="type-3" class="nav-link hw-link <?php echo $active_type3; ?>" id="nav-type3-tab" data-bs-toggle="tab" data-bs-target="#nav-type3" type="button" role="tab" aria-controls="nav-type3" aria-selected="false">Type 3</button>
                                </div>
                            </nav>
                            <div class="tab-content d-flex justify-content-center" id="nav-tabContent">
                                <div class="tab-pane w-100 fade <?php echo ($active_type1 != '') ? 'show ' : ''; echo $active_type1;?>" id="nav-type1" role="tabpanel" aria-labelledby="nav-type1-tab" tabindex="0">
                                    <div class="card border border-start-0 border-end-0">
                                        <div class="card-header d-flex justify-content-between">
                                            <div>
                                                <h5 class="card-title"><i class="fa-solid fa-microchip"></i> Type 1</h5>
                                                <small>Plan Dummy HW for Specific Part</small>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-lg-6 mb-3 text-center">
                                                    <button type="button" class="btn btn-link btn-modal-dummy" data-bs-toggle="modal" data-bs-target="#modal-add-dummy-type1">HW Mapping <i class="fa-solid fa-circle-plus text-success"></i></button>
                                                </div>
                                                <div class="col-lg-6 mb-3 text-center">
                                                    <button type="button" class="btn btn-link btn-upload-csv" data-bs-toggle="modal" data-bs-target="#modal-upload-csv-type1">Upload CSV for Mass Update <i class="fa-solid fa-cloud-arrow-up text-primary"></i></button>
                                                </div>
                                                <hr class="mb-2">
                                                <div class="col-lg-12 mt-3 mb-3">
                                                    <div class="modal fade zoom" id="modal-add-dummy-type1" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
                                                        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"  style="min-width:90%;">
                                                            <div class="modal-content">
                                                                <div class="modal-header d-flex justify-content-between bg-success-subtle">
                                                                    <div>
                                                                        <h1 class="modal-title fs-5">Create HW Mapping</h1>
                                                                        <small>All fields with <i class="fa-solid fa-asterisk"></i> are required.</small>
                                                                    </div>
                                                                    <!-- <i class="details-tooltip fa-solid fa-circle-info text-info" data-bs-toggle="tooltip" data-bs-placement="top"
                                                                        data-bs-custom-class="custom-tooltip" data-bs-html="true"
                                                                        data-bs-title='<div class="alert alert-success pt-0 pb-0" role="alert">
                                                                                            New Override.
                                                                                        </div>
                                                                                        <div class="alert alert-warning pt-0 pb-0" role="alert">
                                                                                            Existing Override.
                                                                                        </div>
                                                                                        <div class="alert alert-primary pt-0 pb-0" role="alert">
                                                                                            Rendered From CSV.
                                                                                        </div>'></i> -->
                                                                </div>
                                                                <div class="modal-body">
                                                                    <div class="row">
                                                                        <div class="col-lg-8 mb-3">
                                                                            <div class="row">
                                                                                <div class="col-lg-6">
                                                                                    <div class="input-group">
                                                                                        <input identifier="type1" class="form-control input-search-type1" type="text" placeholder="Search Part">
                                                                                        <input type="radio" class="btn-check" name="input-mapping-type1" id="dummy" value="DUMMY" checked>
                                                                                        <label class="btn btn-outline-success" for="dummy">DUMMY</label>
                                                                                        
                                                                                        <input type="radio" class="btn-check" name="input-mapping-type1" id="dedication" value="DEDICATION">
                                                                                        <label class="btn btn-outline-success" for="dedication">DEDICATION</label>
                                                                                    </div>
                                                                                    <div class="form-text" id="basic-addon4">Hit "Enter" to proceed</div>
                                                                                </div>
                                                                                <div class="col-lg-6">
                                                                                    <div class="input-group">
                                                                                        <select class="form-select input-select-type1" disabled>
                                                                                        </select>
                                                                                        <button class="btn btn-outline-success btn-add-dummy" type="button" disabled>
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
                                                                            <button class="btn btn-outline-secondary d-none loader-hms-type1" type="button" disabled>
                                                                                    <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                                                                    <span role="status">Calculating HMS Count, Please Wait...</span>
                                                                            </button>
                                                                        </div>
                                                                        <hr>
                                                                    </div>
                                                                    <div class="row g-2 input-container-type1">
                                                                        <p class="lead empty-filler-type1 d-flex justify-content-center align-items-center">
                                                                            Create HW Mappings (Dummy or Dedication) Using Search or CSV Upload
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div class="modal-footer bg-success-subtle">
                                                                    <button type="button" class="btn btn-danger btn-close-modal-type1" process-type="type1" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                                                                    <button type="button" class="btn btn-success btn-save-type1" process-type="type1">Save <i class="fa-regular fa-floppy-disk"></i></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="d-flex justify-content-end btn-delete-hw-container d-none">
                                                        <button type="button" class="btn btn-danger btn-delete-hw-all">Delete All HW Mappings</button>
                                                    </div>
                                                    <table class="table table-dummy-type1 table-bordered table-hover h-100">
                                                        <thead>
                                                            <tr>
                                                                <th class="fs-6">
                                                                    <div class="d-flex justify-content-center">
                                                                        <input class="dummy-hw-check-all" type="checkbox">
                                                                    </div>
                                                                </th>
                                                                <th>ID</th>
                                                                <th>MFG_PART_NUM</th>
                                                                <th>GENPOOL HW</th>
                                                                <th>HW_NAME</th>
                                                                <th>EFF_START</th>
                                                                <th>EFF_END</th>
                                                                <th>JDA FEED</th>
                                                                <th>MAPPING_TYPE</th>
                                                                <th>REMARKS</th>
                                                                <th>ACTIONS</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <?php
                                                                foreach ($existing_mapping as $key => $mapping) {
                                                                ?>
                                                                    <tr>
                                                                        <td>
                                                                            <div class="d-flex justify-content-center">
                                                                                <input class="dummy-hw-check" type="checkbox" value='<?php echo json_encode($mapping);?>'>
                                                                            </div>
                                                                        </td>
                                                                        <td><?php echo $mapping['ID']?></td>
                                                                        <td class="text-sm"><?php echo $mapping['MFG_PART_NUM']?></td>
                                                                        <td><?php echo $mapping['GENPOOL']?></td>
                                                                        <td><?php echo $mapping['HW_NM']?></td>
                                                                        <td><?php echo $mapping['EFF_START']?></td>
                                                                        <td><?php echo $mapping['EFF_END']?></td>
                                                                        <td><?php echo $mapping['CAPACITY']?></td>
                                                                        <td><?php echo $mapping['HW_TYPE']?></td>
                                                                        <td>
                                                                            <?php
                                                                                if ($mapping['HW_TYPE'] == 'DEDICATION') {
                                                                                ?>
                                                                                    <small class="fw-semibold"><span class="badge text-bg-info"><?php echo $mapping['CAPACITY']?> HW</span> have been dropped from <br>
                                                                                    <span class="badge text-bg-info"><?php echo $mapping['GENPOOL']?> HW</span> for weeks: </br>
                                                                                    <span class="badge text-bg-info"><?php echo $mapping['EFF_START']?></span> to <span class="badge text-bg-info"><?php echo $mapping['EFF_END']?></span></small>
                                                                                <?php
                                                                                }
                                                                                else{
                                                                                    echo 'N/A';
                                                                                }
                                                                            ?>
                                                                        </td>
                                                                        <td class="">
                                                                            <div class="btn-group">
                                                                                <button class="btn btn-outline-info btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                                    <i class="fa-solid fa-ellipsis"></i>
                                                                                </button>
                                                                                <ul class="dropdown-menu">
                                                                                    <li>
                                                                                        <button type="button" data='<?php echo json_encode($mapping);?>' class="dropdown-item text-warning btn-view-dummy">
                                                                                            <i class="fa-solid fa-eye"></i> View
                                                                                        </button>
                                                                                    </li>
                                                                                    <li>
                                                                                        <button type="button" data='<?php echo json_encode($mapping);?>' class="dropdown-item text-primary btn-edit-dummy">
                                                                                            <i class="fa-solid fa-pen-to-square"></i> Edit
                                                                                        </button>
                                                                                    </li>
                                                                                    <li>
                                                                                        <!-- <button type="button" data='<?php echo json_encode($mapping);?>' class="dropdown-item text-danger btn-delete-dummy">
                                                                                            <i class="fa-solid fa-trash"></i> Delete
                                                                                        </button> -->
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
                                <div class="tab-pane w-100 fade <?php echo ($active_type2 != '') ? 'show ' : ''; echo $active_type2;?>" id="nav-type2" role="tabpanel" aria-labelledby="nav-type2-tab" tabindex="0">
                                    <div class="card border border-start-0 border-end-0">
                                        <div class="card-header d-flex justify-content-between">
                                            <div>
                                                <h5 class="card-title"><i class="fa-solid fa-calendar-week"></i> Type 2</h5>
                                                <small>Hardware Capacity Override</small>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-lg-6 mb-3 text-center">
                                                    <button type="button" class="btn btn-link btn-modal-hw" data-bs-toggle="modal" data-bs-target="#modal-add-hw-type2">HW Capacity Override <i class="fa-solid fa-circle-plus text-success"></i></button>
                                                </div>
                                                <div class="col-lg-6 mb-3 text-center">
                                                    <button type="button" class="btn btn-link btn-upload-csv" data-bs-toggle="modal" data-bs-target="#modal-upload-csv-type2">Upload CSV for Mass Update <i class="fa-solid fa-cloud-arrow-up text-primary"></i></button>
                                                </div>
                                                <hr class="mb-2">
                                                <div class="col-lg-12 mt-3 mb-3">
                                                    <div class="modal fade zoom" id="modal-add-hw-type2" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
                                                        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"  style="min-width:90%;">
                                                            <div class="modal-content">
                                                                <div class="modal-header d-flex justify-content-between bg-success-subtle">
                                                                    <div>
                                                                        <h1 class="modal-title fs-5">Create HW Capacity Override</h1>
                                                                        <small>All fields with <i class="fa-solid fa-asterisk"></i> are required.</small>
                                                                    </div>
                                                                    <i class="details-tooltip fa-solid fa-circle-info text-info" data-bs-toggle="tooltip" data-bs-placement="top"
                                                                        data-bs-custom-class="custom-tooltip" data-bs-html="true"
                                                                        data-bs-title='<div class="alert alert-success pt-0 pb-0" role="alert">
                                                                                            New Override.
                                                                                        </div>
                                                                                        <div class="alert alert-warning pt-0 pb-0" role="alert">
                                                                                            Existing Override.
                                                                                        </div>
                                                                                        <div class="alert alert-primary pt-0 pb-0" role="alert">
                                                                                            Rendered From CSV.
                                                                                        </div>'></i>
                                                                </div>
                                                                <div class="modal-body">
                                                                    <div class="row">
                                                                        <div class="col-lg-8 mb-3">
                                                                            <div class="row g-2">
                                                                                <div class="col-lg-5">
                                                                                    <input identifier="type2" class="form-control input-search-type2" type="text" placeholder="Search HW">
                                                                                    <div class="form-text" id="basic-addon4">Hit "Enter" to proceed</div>
                                                                                </div>
                                                                                <div class="col-lg-7">
                                                                                    <div class="input-group">
                                                                                        <select class="form-select input-select-type2" disabled>
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
                                                                            <button class="btn btn-outline-secondary d-none loader-override-type2" type="button" disabled>
                                                                                    <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                                                                    <span role="status">Validating Override Capacity, Please Wait...</span>
                                                                            </button>
                                                                        </div>
                                                                        <hr>
                                                                    </div>
                                                                    <div class="row g-2 input-container-type2">
                                                                        <p class="lead empty-filler-type2 d-flex justify-content-center align-items-center">
                                                                            Create HW Capacity Overrides Using Search or CSV Upload
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div class="modal-footer bg-success-subtle">
                                                                    <button type="button" class="btn btn-danger btn-close-modal-type2" process-type="type2" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                                                                    <button type="button" class="btn btn-success btn-save-type2" process-type="type2">Save <i class="fa-regular fa-floppy-disk"></i></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="d-flex justify-content-end btn-delete-type2-container d-none">
                                                        <button type="button" class="btn btn-danger btn-delete-type2-all">Delete All Overrides</button>
                                                    </div>
                                                    <table class="table table-hw-type2 table-bordered table-hover h-100">
                                                        <thead>
                                                            <tr>
                                                                <th class="fs-6">
                                                                    <div class="d-flex justify-content-center">
                                                                        <input class="type2-check-all" type="checkbox">
                                                                    </div>
                                                                </th>
                                                                <th>ID</th>
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

                                                                    $deletable = true;
                                                                    $hw_dedicated_cap = 0;
                                                                    $hw_rem_cap = 0;
                                                                    $hw_nm = $capacity['HW_NM'];
                                                                    $hw_type = $capacity['HW_TYPE'];
                                                                    $hw_start = (int)str_replace("_W", "", $capacity['EFF_START']);
                                                                    $hw_end   = (int)str_replace("_W", "", $capacity['EFF_END']);

                                                                    $res_map = array_map(function($item) use ($hw_nm, $hw_type, $hw_start, $hw_end) {

                                                                        $mp_start = (int)str_replace("_W", "", $item['EFF_START']);
                                                                        $mp_end   = (int)str_replace("_W", "", $item['EFF_END']);
                                                                        
                                                                        return (
                                                                                $item['HW_TYPE'] === "DEDICATION" &&
                                                                                $item['GENPOOL'] === $hw_nm &&
                                                                                $item['GP_HW_TYPE'] === $hw_type &&
                                                                                ($hw_start <= $mp_end && $mp_start <= $hw_end)

                                                                            ) ? $item : null;

                                                                    }, $existing_mapping);
                                                                        
                                                                    $res_map = array_filter($res_map, function($value) {
                                                                        return $value !== null;
                                                                    });

                                                                    if (count($res_map) > 0) {

                                                                        $keys = array('HW_NM', 'EFF_START', 'EFF_END', 'GENPOOL', 'CAPACITY');
                                                                        // Create unique hash from multiple keys
                                                                        $compositeKeys = array_map(function($item) use ($keys) {
                                                                            $parts = array();
                                                                            foreach ($keys as $key) {
                                                                                $parts[] = isset($item[$key]) ? $item[$key] : '';
                                                                            }
                                                                            return implode('|', $parts); // separator should be unique enough
                                                                        }, $res_map);

                                                                        // Get unique hashes and their original positions
                                                                        $uniqueComposite = array_unique($compositeKeys);

                                                                        // Use positions to filter the original array
                                                                        $uniqueData = array_intersect_key($res_map, $uniqueComposite);

                                                                        // Reindex if desired
                                                                        $uniqueData = array_values($uniqueData);

                                                                        foreach ($uniqueData as $key => $rm) {
                                                                            $hw_dedicated_cap += (double)$rm['CAPACITY'];
                                                                        }
                                                                    }

                                                                    $hw_rem_cap = (double)$capacity['CURRENT_CAP'] - $hw_dedicated_cap;

                                                                    //CHECK IF HW OVERRIDE HAS DEDICATION WITHIN EFF DATES
                                                                    $emp_dedicated_cap = 0;
                                                                    $res_cap = 0;
                                                                    $hw_current_cap = $capacity['CURRENT_CAP'];
                                                                    foreach ($existing_mapping as $key => $emp) {
                                                                        $emp_start = (int)str_replace("_W", "", $emp['EFF_START']);
                                                                        $emp_end   = (int)str_replace("_W", "", $emp['EFF_END']);

                                                                        if ($emp['GENPOOL'] == $capacity['HW_NM'] && $emp['HW_TYPE'] == "DEDICATION") {
                                                                            if ($hw_start <= $emp_start && $emp_end <= $hw_end) {
                                                                                $emp_dedicated_cap += (double)$emp['CAPACITY'];
                                                                            }
                                                                        }
                                                                    }

                                                                    $res_cap = $hw_current_cap - $emp_dedicated_cap;

                                                                    $deletable = ($res_cap < 0) ? false : true;
                                                                ?>
                                                                    <tr>
                                                                        <td>
                                                                        <?php
                                                                            if ($deletable) {
                                                                            ?>
                                                                                <div class="d-flex justify-content-center">
                                                                                    <input class="type2-check" type="checkbox" value='<?php echo json_encode($capacity);?>'>
                                                                                </div>
                                                                            <?php
                                                                            }
                                                                        ?>
                                                                        </td>
                                                                        <td><?php echo $capacity['ID']?></td>
                                                                        <td><?php echo $capacity['HW_NM']?></td>
                                                                        <td><?php echo $capacity['SITE_NUM']?></td>
                                                                        <td><?php echo $capacity['RES_AREA']?></td>
                                                                        <td><?php echo $capacity['EFF_START']?></td>
                                                                        <td><?php echo $capacity['EFF_END']?></td>
                                                                        <td><?php echo $capacity['OVERRIDE_CAP']?></td>
                                                                        <td>
                                                                        <?php
                                                                            if ($hw_dedicated_cap != 0 && $hw_rem_cap != 0) {
                                                                            ?>
                                                                                <div class="d-flex justify-content-between">
                                                                                    <span class="badge text-bg-info"><?php echo $capacity['CURRENT_CAP']?></span>
                                                                                    <i class="fa-solid fa-minus"></i>
                                                                                    <span class="badge text-bg-warning"><?php echo $hw_dedicated_cap?></span>
                                                                                </div>
                                                                                <hr>
                                                                                <div class="d-flex justify-content-end">
                                                                                    <span class="badge text-bg-success"><?php echo $hw_rem_cap?></span>
                                                                                </div>
                                                                            <?php
                                                                            }
                                                                            else{
                                                                                echo $capacity['CURRENT_CAP'];
                                                                            }
                                                                        ?>

                                                                            
                                                                        </td>
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
                                                    <hr>
                                                    <div class="d-flex justify-content-end">
                                                        <span class="badge rounded-pill text-bg-info">HMS COUNT</span>&emsp;
                                                        <span class="badge rounded-pill text-bg-warning">JDA FEED</span>&emsp;
                                                        <span class="badge rounded-pill text-bg-success">REMAINING CAPACITY</span>&emsp;
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="tab-pane w-100 fade <?php echo ($active_type3 != '') ? 'show ' : ''; echo $active_type3;?>" id="nav-type3" role="tabpanel" aria-labelledby="nav-type3-tab" tabindex="0">
                                    <div class="card border border-start-0 border-end-0">
                                        <div class="card-header d-flex justify-content-between">
                                            <div>
                                                <h5 class="card-title"><i class="fa-solid fa-list-check"></i> Type 3</h5>
                                                <small>Plan Non-Boards for all Parts</small>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-lg-6 mb-3 text-center">
                                                    <button type="button" class="btn btn-link btn-modal-dummy" data-bs-toggle="modal" data-bs-target="#modal-add-nonboard-type3">Plan Non-Boards <i class="fa-solid fa-circle-plus text-success"></i></button>
                                                </div>
                                                <div class="modal fade zoom" id="modal-add-nonboard-type3" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
                                                    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                                                        <div class="modal-content">
                                                            <div class="modal-header d-flex justify-content-between bg-success-subtle">
                                                                <div>
                                                                    <h1 class="modal-title fs-5">Plan Non-Boards for All Parts</h1>
                                                                </div>
                                                                <i class="details-tooltip fa-solid fa-circle-info text-info" data-bs-toggle="tooltip" data-bs-placement="top"
                                                                    data-bs-custom-class="custom-tooltip" data-bs-html="true"
                                                                    data-bs-title='<div class="alert alert-success pt-0 pb-0" role="alert">
                                                                                        New Override.
                                                                                    </div>
                                                                                    <div class="alert alert-warning pt-0 pb-0" role="alert">
                                                                                        Existing Override.
                                                                                    </div>
                                                                                    <div class="alert alert-primary pt-0 pb-0" role="alert">
                                                                                        Rendered From CSV.
                                                                                    </div>'></i>
                                                            </div>
                                                            <div class="modal-body">
                                                                <div class="row">
                                                                    <div class="col-lg-12 col-sm-12 mb-3">
                                                                        <div class="input-group">
                                                                            <div class="form-floating">
                                                                                <input type="text" class="form-control input-hw-name-type3" placeholder="">
                                                                                <label>Search for HW_NAME</label>
                                                                            </div>
                                                                            <div class="form-floating">
                                                                                <select class="form-select input-limit-type3">
                                                                                    <option value="10" selected>10</option>
                                                                                    <option value="15">15</option>
                                                                                    <option value="20">20</option>
                                                                                    <option value="25">25</option>
                                                                                    <option value="30">30</option>
                                                                                </select>
                                                                                <label>Show First:</label>
                                                                            </div>
                                                                            <button type="button" class="input-group-text btn btn-outline-info btn-search-type3" disabled>
                                                                                <div style="display: none!important;" class="spinner-border spinner-border-sm" role="status">
                                                                                    <span class="sr-only">Loading...</span>
                                                                                </div>
                                                                                <i class="fa-solid fa-magnifying-glass"></i>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <hr>
                                                                    <div class="col-lg-12">
                                                                        <table class="table table-nonboard-type3 table-bordered table-hover  w-100 h-100">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>SITE_NUM</th>
                                                                                    <th>RES_AREA</th>
                                                                                    <th>HW TYPE HMS</th>
                                                                                    <th>HW TYPE SUS</th>
                                                                                    <th>HW NAME</th>
                                                                                    <th>HMS COUNT</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="modal-footer bg-success-subtle">
                                                                <button type="button" class="btn btn-danger btn-close-modal-type3" process-type="type3" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                                                                <button type="button" class="btn btn-success btn-save-type3" process-type="type3">Save <i class="fa-regular fa-floppy-disk"></i></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <hr class="mb-2">
                                            </div>
                                            <div class="col-lg-12 mt-3 mb-3">
                                                <div class="d-flex justify-content-end btn-delete-type3-container d-none">
                                                    <button type="button" class="btn btn-danger btn-delete-type3-all">Delete All Non-Boards</button>
                                                </div>
                                                <table class="table table-test-type3 table-bordered table-hover  h-100">
                                                    <thead>
                                                        <tr>
                                                            <th class="fs-6">
                                                                <div class="d-flex justify-content-center">
                                                                    <input class="type3-check-all" type="checkbox">
                                                                </div>
                                                            </th>
                                                            <th>SITE_NUM</th>
                                                            <th>RES_AREA</th>
                                                            <th>HW TYPE</th>
                                                            <th>HW NAME</th>
                                                            <th>HMS COUNT</th>
                                                            <th>ACTION</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <?php
                                                            foreach ($existing_nonboard as $key => $nonboard) {
                                                            ?>
                                                                <tr>
                                                                    <td>
                                                                        <div class="d-flex justify-content-center">
                                                                            <input class="type3-check" type="checkbox" value='<?php echo json_encode($nonboard);?>'>
                                                                        </div>
                                                                    </td>
                                                                    <td><?php echo $nonboard['SITE_NUM']; ?></td>
                                                                    <td><?php echo $nonboard['RES_AREA']; ?></td>
                                                                    <td><?php echo $nonboard['HW_TYPE_HMS']; ?></td>
                                                                    <td><?php echo $nonboard['HW_NAME']; ?></td>
                                                                    <td><?php echo $nonboard['CAPACITY']; ?></td>
                                                                    <td>
                                                                        <button type="button" data='<?php echo json_encode($nonboard);?>' class="btn btn-warning btn-sm btn-view-nb">
                                                                            <i class="fa-solid fa-eye"></i> View
                                                                        </button>
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

        </div>

        <!-- --------------------------------------------------------------------------------MODALS------------------------------------------------------------------------------------- -->
        
        <!-- --------------------------------------------------------------------------------VIEW MODAL------------------------------------------------------------------------------------- -->
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
                            <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-part-container"><p class="lead m-0"><strong class="view-part"></strong></p><small>PART</small></div>
                            <div class="col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-hw-nm"></strong></p><small>HW_NAME</small></div>
                            <div class="col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-start"></strong></p><small>EFF_START</small></div>
                            <div class="col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-end"></strong></p><small>EFF_END</small></div>
                            <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-capacity-container"><p class="lead m-0"><strong class="view-capacity"></strong></p><small>JDA FEED</small></div>
                            <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-override-container"><p class="lead m-0"><strong class="view-override"></strong></p><small>OVERRIDE CAPACITY</small></div>
                            <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-current-container"><p class="lead m-0"><strong class="view-current"></strong></p><small>HMS COUNT</small></div>
                            <div class="col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-hw-type"></strong></p><small>HW_TYPE</small></div>
                            <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-site-num-container"><p class="lead m-0"><strong class="view-site-num"></strong></p><small>SITE_NUM</small></div>
                            <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-res-area-container"><p class="lead m-0"><strong class="view-res-area"></strong></p><small>RES_AREA</small></div>
                            <hr>
                            <div class="col-lg-4 col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-created-at"></strong></p><small>CREATED_AT</small></div>
                            <div class="col-lg-4 col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-created-by"></strong></p><small>CREATED_BY</small></div>
                            <div class="col-lg-4 col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-updated-at"></strong></p><small>UPDATED_AT</small></div>
                        </div>
                    </div>
                    <div class="modal-footer bg-warning-subtle">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade zoom" id="modal-view-data-type2" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header d-flex justify-content-between bg-warning-subtle">
                        <div>
                            <h1 class="modal-title fs-5">View <span class="view-type-h1"></span> - <span class="view-record-h1"></span></h1>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-hw-nm-type2"></strong></p><small>HW_NAME</small></div>
                            <div class="col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-hw-type-type2"></strong></p><small>HW_TYPE</small></div>
                            <div class="col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-start-type2"></strong></p><small>EFF_START</small></div>
                            <div class="col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-end-type2"></strong></p><small>EFF_END</small></div>
                            <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-override-container-type2"><p class="lead m-0"><strong class="view-override-type2"></strong></p><small>OVERRIDE CAPACITY</small></div>
                            <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-current-container-type2"><p class="lead m-0"><strong class="view-current-type2"></strong></p><small>HMS COUNT</small></div>
                            <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-site-num-container-type2"><p class="lead m-0"><strong class="view-site-num-type2"></strong></p><small>SITE_NUM</small></div>
                            <div style="display: none!important;" class="col-sm-6 text-center mb-2 view-res-area-container-type2"><p class="lead m-0"><strong class="view-res-area-type2"></strong></p><small>RES_AREA</small></div>
                            <hr>
                            <div class="col-lg-4 col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-created-at-type2"></strong></p><small>CREATED_AT</small></div>
                            <div class="col-lg-4 col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-created-by-type2"></strong></p><small>CREATED_BY</small></div>
                            <div class="col-lg-4 col-sm-6 text-center mb-2"><p class="lead m-0"><strong class="view-updated-at-type2"></strong></p><small>UPDATED_AT</small></div>
                        </div>
                    </div>
                    <div class="modal-footer bg-warning-subtle">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade zoom" id="modal-view-data-type3" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header d-flex justify-content-between bg-warning-subtle">
                        <div>
                            <h1 class="modal-title fs-5">View <span class="view-name-type3"></span> - <span class="view-hms-type3"></span></h1>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-sm-4 text-center mb-4"><p class="lead m-0"><strong class="view-site-type3"></strong></p><small>SITE_NUM</small></div>
                            <div class="col-sm-4 text-center mb-4"><p class="lead m-0"><strong class="view-area-type3"></strong></p><small>RES_AREA</small></div>
                            <div class="col-sm-4 text-center mb-4"><p class="lead m-0"><strong class="view-cap-type3"></strong></p><small>HMS COUNT</small></div>
                            <div class="col-sm-4 text-center mb-4"><p class="lead m-0"><strong class="view-name-type3"></strong></p><small>HW_NAME</small></div>
                            <div class="col-sm-4 text-center mb-4"><p class="lead m-0"><strong class="view-hms-type3"></strong></p><small>HW_TYPE_HMS</small></div>
                            <div class="col-sm-4 text-center mb-4"><p class="lead m-0"><strong class="view-sus-type3"></strong></p><small>HW_TYPE_SUS</small></div>
                            <hr>
                            <div class="col-sm-6 text-center mb-4"><p class="lead m-0"><strong class="view-at-type3"></strong></p><small>CREATED_AT</small></div>
                            <div class="col-sm-6 text-center mb-4"><p class="lead m-0"><strong class="view-by-type3"></strong></p><small>CREATED_BY</small></div>
                        </div>
                    </div>
                    <div class="modal-footer bg-warning-subtle">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
            </div>
        </div>
        

        <!-- --------------------------------------------------------------------------------EDIT MODAL------------------------------------------------------------------------------------- -->
        <div class="modal fade zoom" id="modal-edit-data-type2" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header d-flex justify-content-between bg-primary-subtle">
                        <div>
                            <h1 class="modal-title fs-5">Edit <span class="edit-type-h1-type2"></span> - <span class="edit-record-h1-type2"></span></h1>
                            <small>All fields with <i class="fa-solid fa-asterisk"></i> are required.</small>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="row g-2">
                            <input type="hidden" class="edit-data-type2 edit-id-type2">

                            <div style="display: none;" class="alert alert-danger alert-exceeded-type2" role="alert">
                                Changing Override Capacity Will Affect These Records:

                                <table class="table table-bordered mt-2">
                                    <thead>
                                        <tr>
                                            <th>MFG_PART_NUM</th>
                                            <th>HW NAME</th>
                                            <th>GENPOOL / HW SPEC</th>
                                            <th>JDA FEED</th>
                                        </tr>
                                    </thead>
                                    <tbody class="affected-container-type2">
                                        
                                    </tbody>
                                </table>
                            </div>

                            <div class="col-lg-6">
                                <div class="form-floating mb-3">
                                    <input  class="form-control edit-data-type2 edit-hw-nm-type2" type="text" placeholder="" readonly>
                                    <label class="label-type">HW_NAME</label>
                                </div>
                            </div>
                            <div style="display: none!important;" class="col-lg-6 edit-override-container-type2">
                                <div class="form-floating mb-3">
                                    <input  class="form-control edit-data-type2 edit-override-type2" type="number" step="0.1" placeholder="" required>
                                    <label class="label-type"><i class="fa-solid fa-asterisk"></i> OVERRIDE CAP</label>
                                </div>
                            </div>
                            <div class="col-lg-6 edit-start-container-type2">
                                <div class="form-floating mb-3">
                                    <select class="form-select  edit-data-type2 edit-start-type2 edit-week-type2" placeholder="" required></select>
                                    <label class="label-type label-start"><i class="fa-solid fa-asterisk"></i> EFF START</label>
                                </div>
                            </div>
                            <div class="col-lg-6 edit-end-container-type2">
                                <div class="form-floating mb-3">
                                    <select class="form-select  edit-data-type2 edit-end-type2 edit-week-type2" placeholder="" required></select>
                                    <label class="label-type label-end"><i class="fa-solid fa-asterisk"></i> EFF END</label>
                                </div>
                            </div>
                            <div style="display: none!important;" class="col-lg-6 edit-current-container-type2">
                                <div class="form-floating mb-3">
                                    <input  class="form-control edit-data-type2 edit-current-type2" type="number" step="0.1" placeholder="" readonly>
                                    <label class="label-type">HMS COUNT</label>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="form-floating mb-3">
                                    <input  class="form-control edit-data-type2 edit-hw-type-type2" type="text"  placeholder="" readonly>
                                    <label class="label-type">HW_TYPE</label>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="form-floating mb-3">
                                    <input  class="form-control edit-data-type2 edit-site-num-type2" type="text"  placeholder="" readonly>
                                    <label class="label-type">SITE_NUM</label>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="form-floating mb-3">
                                    <input  class="form-control edit-data-type2 edit-res-area-type2" type="text"  placeholder="" readonly>
                                    <label class="label-type">RES_AREA</label>
                                </div>
                            </div>
                            <hr>
                            <div class="col-lg-4 text-center">
                                <small>Date Created:</small>
                                <p class="lead edit-created-at-type2"></p>
                            </div>
                            <div class="col-lg-4 text-center">
                                <small>Created By:</small>
                                <p class="lead edit-created-by-type2"></p>
                            </div>
                            <div class="col-lg-4 text-center">
                                <small>Date Updated:</small>
                                <p class="lead edit-updated-at-type2"></p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer bg-primary-subtle">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                        <button type="button" class="btn btn-success btn-edit-data-type2">Save <i class="fa-regular fa-floppy-disk"></i></button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- FOR TYPE 2 EDIT MODAL ONLY -->
        <div class="modal fade zoom" id="modal-edit-data" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header d-flex justify-content-between bg-primary-subtle">
                        <div>
                            <h1 class="modal-title fs-5">Edit <span class="edit-type-h1"></span> - <span class="edit-record-h1"></span></h1>
                            <small>All fields with <i class="fa-solid fa-asterisk"></i> are required.</small>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="row g-2">
                            <input type="hidden" class="edit-data edit-id">
                            <input type="hidden" class="edit-data edit-genpool">
                            <div style="display: none!important;" class="col-lg-6 edit-part-container"><div class="form-floating mb-3"><input  class="form-control edit-data edit-part" type="text" placeholder="" readonly><label class="label-type">PART</label></div></div>
                            <div class="col-lg-6"><div class="form-floating mb-3"><input  class="form-control edit-data edit-hw-nm" type="text" placeholder=""><label class="label-type"><i class="fa-solid fa-asterisk"></i>HW_NAME</label></div></div>
                            <div class="col-lg-6 edit-start-container"><div class="form-floating mb-3"><select class="form-select  edit-data edit-start edit-week" placeholder=""></select><label class="label-type label-start"><i class="fa-solid fa-asterisk"></i> EFF START</label></div></div>
                            <div class="col-lg-6 edit-end-container"><div class="form-floating mb-3"><select class="form-select  edit-data edit-end edit-week" placeholder=""></select><label class="label-type label-end"><i class="fa-solid fa-asterisk"></i> EFF END</label></div></div>
                            <div style="display: none!important;" class="col-lg-6 edit-capacity-container"><div class="form-floating mb-3"><input  class="form-control edit-data edit-capacity" type="number" step="0.1" placeholder=""><label class="label-type"><i class="fa-solid fa-asterisk"></i> JDA FEED</label></div></div>
                            <div style="display: none!important;" class="col-lg-6 edit-override-container"><div class="form-floating mb-3"><input  class="form-control edit-data edit-override" type="number" step="0.1" placeholder=""><label class="label-type"><i class="fa-solid fa-asterisk"></i> OVERRIDE CAP</label></div></div>
                            <div style="display: none!important;" class="col-lg-6 edit-current-container"><div class="form-floating mb-3"><input  class="form-control edit-data edit-current" type="number" step="0.1" placeholder="" readonly><label class="label-type">HMS COUNT</label></div></div>
                            <div class="col-lg-6"><div class="form-floating mb-3"><input  class="form-control edit-data edit-hw-type" type="text"  placeholder="" readonly><label class="label-type">HW_TYPE</label></div></div>
                            <hr>
                            <div class="col-lg-4 text-center">
                                <small>Date Created:</small>
                                <p class="lead edit-created-at"></p>
                            </div>
                            <div class="col-lg-4 text-center">
                                <small>Created By:</small>
                                <p class="lead edit-created-by"></p>
                            </div>
                            <div class="col-lg-4 text-center">
                                <small>Date Updated:</small>
                                <p class="lead edit-updated-at"></p>
                            </div>
                            <input type="hidden" class="edit-data edit-genpool-cap">
                        </div>
                    </div>
                    <div class="modal-footer bg-primary-subtle">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                        <button type="button" class="btn btn-success btn-edit-data">Save <i class="fa-regular fa-floppy-disk"></i></button>
                    </div>
                </div>
            </div>
        </div>
        

        <!-- --------------------------------------------------------------------------------UPLOAD MODAL------------------------------------------------------------------------------------- -->
        <div class="modal fade zoom" id="modal-upload-csv-type1" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header d-flex justify-content-between">
                        <div>
                            <h1 class="modal-title fs-5" id="staticBackdropLabel">Upload CSV for Mass Update</h1>
                            <small><em>Note: All rows with empty cell will not be processed.</em></small>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-lg-12">
                                <div style="display: none!important;" class="alert alert-result alert-danger mb-3 alert-invalid pt-0 pb-0" role="alert">
                                    <i class="fa-solid fa-info bi-exclamation-triangle-fill flex-shrink-0 me-2"></i> 
                                    <small>File type does not match extension (.csv)</small>
                                </div>

                                <div class="input-group mb-3">
                                    <input type="file" class="form-control input-csv-type1">
                                    <button type="button" class="btn btn-outline-success btn-upload-type1">Upload <i class="fa-solid fa-cloud-arrow-up"></i></button>
                                </div>
                            </div>

                            <div class="col-lg-12 error-container d-none">
                                <div class="alert alert-danger" role="alert">
                                    Validation failed. Some fields contain errors. Click <a href="#" class="alert-link btn-csv-error">'Download CSV File'</a> to review and correct them.
                                </div>
                                <table class="table table-bordered table-hover table-sm">
                                    <thead>
                                        <tr>
                                            <th>MFG_PART_NUM</th>
                                            <th>GENPOOL HW</th>
                                            <th>HW_NAME</th>
                                            <th>EFF_START</th>
                                            <th>EFF_END</th>
                                            <th>GENPOOL CAPACITY</th>
                                            <th>JDA FEED</th>
                                            <th>MAPPING_TYPE</th>
                                            <th>ACTION</th>
                                            <th>TARGET_ID</th>
                                            <th>ERROR</th>
                                        </tr>
                                    </thead>
                                    <tbody class="csv-error-tbody"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer d-flex justify-content-between">
                        
                        <div>
                            <button style="display: none!important;" class="btn btn-outline-secondary btn-validate-csv btn-loader" type="button" disabled>
                                <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                <span role="status">Validating CSV File... Please wait.</span>
                            </button>
                        </div>

                        <div>
                            <button type="button" class="btn btn-outline-danger btn-close-upload-type1" process-type="type1" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade zoom" id="modal-upload-csv-type2" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header d-flex justify-content-between">
                        <div>
                            <h1 class="modal-title fs-5" id="staticBackdropLabel">Upload CSV for Mass Update</h1>
                            <small><em>Note: All rows with empty cell will not be processed.</em></small>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="row">

                            <div class="col-lg-12">
                                <div style="display: none!important;" class="alert alert-result alert-danger mb-3 alert-invalid pt-0 pb-0" role="alert">
                                    <i class="fa-solid fa-info bi-exclamation-triangle-fill flex-shrink-0 me-2"></i> 
                                    <small>File type does not match extension (.csv)</small>
                                </div>
                                <div class="input-group mb-3">
                                    <input type="file" class="form-control input-csv-type2">
                                    <button type="button" class="btn btn-outline-success btn-upload-type2">Upload <i class="fa-solid fa-cloud-arrow-up"></i></button>
                                </div>
                            </div>

                            <div class="col-lg-12 error-container-type2 d-none">
                                <div class="alert alert-danger" role="alert">
                                    Validation failed. Some fields contain errors. Click <a href="#" class="alert-link btn-csv-error-type2">'Download CSV File'</a> to review and correct them.
                                </div>
                                <table class="table table-bordered table-hover table-sm">
                                    <thead>
                                        <tr>
                                            <th>HW_NAME</th>
                                            <th>SITE_NUM</th>
                                            <th>RES_AREA</th>
                                            <th>EFF_START</th>
                                            <th>EFF_END</th>
                                            <th>OVERRIDE CAP</th>
                                            <th>HMS COUNT</th>
                                            <th>HW_TYPE</th>
                                            <th>ACTION</th>
                                            <th>TARGET_ID</th>
                                            <th>ERROR</th>
                                        </tr>
                                    </thead>
                                    <tbody class="csv-error-tbody-type2"></tbody>
                                </table>
                            </div>

                        </div>
                    </div>
                    <div class="modal-footer d-flex justify-content-between">
                        <div>
                            <button style="display: none!important;" class="btn btn-outline-secondary btn-validate-csv-type2 btn-loader" type="button" disabled>
                                <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                <span role="status">Validating CSV File... Please wait.</span>
                            </button>
                        </div>
                        <div>
                            <button type="button" class="btn btn-outline-danger btn-close-upload-type2" process-type="type2" data-bs-dismiss="modal">Close <i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </body>
    
</html>