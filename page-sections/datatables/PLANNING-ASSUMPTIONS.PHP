<div class="col-lg-12">

    <!-- EXISTING DEDICATIONS DATA -->
    <input type="hidden" class="existing-dedications" value='<?php echo json_encode($dedication_data); ?>'>

    <?php
        $step_temp_arr = [];

        foreach ($part_data as $key => $data) {
            $step_temp_arr[$data['STEP']] = [];
            if (!in_array($data['TEMP_CLASS'], $step_temp_arr[$data['STEP']])) {
                array_push($step_temp_arr[$data['STEP']], $data['TEMP_CLASS']);
            }
        }

        if (count($multi_partnum) <= 1) {
        ?>
            <p class="lead d-flex justify-content-end h5 mb-2">
                Apply to All Steps:
            </p>
            <div style="display: none;" class="apply-check-primary-container">
                <div class="form-check form-switch form-check-reverse d-flex justify-content-end mb-2">
                    <label class="form-check-label h6" for="apply_check_primary">Alternate to Primary</label>&nbsp;
                    <input class="form-check-input apply-check-primary" type="checkbox" value="" id="apply_check_primary">
                </div>
            </div>
            <div style="display: none;" class="apply-check-flag-container">
                <div class="form-check form-switch form-check-reverse d-flex justify-content-end mb-2">
                    <label class="form-check-label h6" for="apply_check_flag">Unplannable Flag</label>&nbsp;
                    <input class="form-check-input apply-check-flag" type="checkbox" value="" id="apply_check_flag">
                </div>
            </div>
             
        <?php
        }
    ?>
    <div class="tp-alert-container">

    </div>
    <?php
        $loaded_instance_route = "";
        foreach ($multi_partnum as $key => $multi) {
            
            $route_id = $key;
            
            if ($loaded_instance_route == "NOT_EQUAL") {
                continue;
            }

            ///GET TIMEPHASES
            $instance_setups = [];
            $timephases = [
                'TIMEPHASING' => [],
                'CURRENT_WEEK' => []
            ];
            $timephases_all = API_REQUEST('timephasing', $route_id);

            foreach ($timephases_all['TIMEPHASING']['DATA'] as $tpkey => $tpall) {
                foreach ($tpall as $tpi_id => $tpdata) {
                    if ($tpi_id != 0) {
                        array_push($timephases['TIMEPHASING'], [
                            'TPI_ID'        => $tpi_id,
                            'SAP_RTE_ID'    => ($tpdata['SAP_RTE_ID'] != null) ? $tpdata['SAP_RTE_ID'] : $route_id,
                            'EFF_START_DT'  => $tpdata['EFF_START_DT'],
                            'FYWW'          => $tpdata['FYWW'],
                            'INSTANCE'      => $tpdata['INSTANCE'],
                            'PROCESS_TYPE'  => implode("<br>", $tpdata['PROCESS_TYPE']), //CHANGE TO DYNAMIC IF MULTIPLE OPTION IS DONE;
                            'NOTES'         => $tpdata['NOTES'],
                            'MFG_PART_NUM'  => $tpdata['DATA']['MFG_PART_NUM']
                        ]);
                    }
                }
            }

            $timephases['CURRENT_WEEK'] = $timephases_all['CURRENT_WEEK'];

            $timephases_summary = API_REQUEST('summary', [$route_id]);

            $instance_session_data = "";
            if (isset($_GET['timephase-instance'])) {
                $instance_data = API_REQUEST('instance-data', [$_GET['timephase-instance']]);
                if ($instance_data['INSTANCE_DATA'] != NULL && count($instance_data['INSTANCE_DATA']) > 0) {
                    if ($instance_data['INSTANCE_DATA']['DATA'][$_GET['timephase-instance']]['SAP_RTE_ID'] == $route_id) {
                        $loaded_instance_route = $route_id;
                        $rte_keys = array_keys($instance_data['INSTANCE_DATA']['DATA'][$_GET['timephase-instance']]['DATA']['RTE_SEQ_NUM']);
                        $instance_setups = $instance_data['INSTANCE_DATA']['DATA'][$_GET['timephase-instance']]['DATA']['RTE_SEQ_NUM'];
                        $instance_data['INSTANCE_DATA']['DATA'][$_GET['timephase-instance']]['TPI_ID'] = $_GET['timephase-instance'];
                        $instance_session_data = json_encode($instance_data['INSTANCE_DATA']['DATA']);
                    }
                    else{
                        $loaded_instance_route = "NOT_EQUAL";
                    }
                }
            }

            ?>
                <input type="hidden" class="instance-session-data" value='<?php echo $instance_session_data;?>'>
                <div style="margin-left:25px!important;" class="alert alert-info pt-1 pb-1 mb-2" role="alert">
                    <b><?php echo $route_id?> / <?php echo $part_data[0]['SITE']?></b>
                </div>
            <?php

            require ("TIMEPHASING.PHP");
            foreach($multi as $key => $mp){
                if (count($instance_setups) > 0) {
                    $instance_steps = [];
                    foreach ($rte_keys as $key => $rtk) {
                        array_push($instance_steps, $instance_setups[$rtk]['STEP_NM']);
                    }
                    if (!in_array($mp, $instance_steps)) {
                        continue;
                    }
                }

                $step = $mp;
                $random_str = substr(str_shuffle("abcdefghijklmnopqrstuvwxyz"), 0, 10);
                $trim_step = str_replace(['#','.','0','-','/', '^'], "_", $mp);
                $trim_rte = str_replace(['#','.','0','-','/', '^'], "_", $route_id);
                $table_id = $trim_step."_".$random_str."_".$trim_rte;
                ?>
                    <div style="margin-left:50px!important;" class="card mb-4">
                        <div style="background-color: #cff4fc;" class="card-header pt-2 pb-2 d-flex justify-content-between">
                            <div>
                                <strong class="mr-2"><?php echo $step?> - <?php echo $step_temp_arr[$step][0] ?></strong>
                                <?php
                                    if (count($instance_setups) > 0) {
                                        $rte_seq_val = "";
                                        foreach ($rte_keys as $key => $rtk) {
                                            if ($instance_setups[$rtk]['STEP_NM'] == $step) {
                                                $rte_seq_val = $rtk;
                                            }
                                        }
                                    ?>
                                        <b>[</b> <a href="#" class="text-danger btn-flow-removal" 
                                                    data-id="<?php echo $rte_seq_val; ?>" 
                                                    instance-id="<?php echo $_GET['timephase-instance']; ?>" 
                                                    step-id="<?php echo $step; ?>">Delete Step</a> <b>]</b>
                                    <?php
                                    }
                                ?>
                            </div>
                            <?php
                                foreach ($primary_data_raw as $pmdr) {
                                    if ($route_id == $pmdr[4] && $step == $pmdr[2] && $pmdr[6] == 'PENDING') {
                                        $btn_id = "HWCH_".$table_id;
                                        // var_dump($pmdr);
                                        // CHANGING HW SET OF PRIMARY DOES NOT CARRY OVER IF YOU CHANGE IT WITH ANOTHER ALTERNATE SETUP /UI & BACKEND PRIMARY_SETUP.PHP (CURRENT PRIMARY GETS DELETED IF YOU CHANGE IT INCLUDING THE NEW HW SET)
                                    ?>
                                        <button id="<?php echo $btn_id ?>" type="button" class="btn btn-sm btn-primary position-relative mt-1 mb-1" data-bs-toggle="modal" data-bs-target="#pending-modal-<?php echo $trim_rte."_".$step?>">
                                            Hardware Change
                                            <i class="fa-solid fa-arrow-right-arrow-left"></i>
                                            <span class="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle">
                                                <span class="visually-hidden">New alerts</span>
                                            </span>
                                        </button>
                                    <?php
                                    }   
                                }

                                include(__DIR__ .'/../others/PENDING-UPDATES.PHP');

                                $dup_temp_arr = [];
                                $dup_hw_temp_arr = [];
                                $test = [];
                                
                                foreach ($part_data as $pd) {
                                    $identifier = $pd['ENGR_TESTER'].'|'.$pd['ENGR_HANDLER'].'|'.$pd['ATOM_TESTER'].'|'.$pd['ATOM_HANDLER'].'|'.$route_id.'|'.$pd['STEP'];
                                    if (!in_array($identifier, $dup_temp_arr)) {
                                        array_push($test, $pd);
                                    }
                                    array_push($dup_temp_arr, $identifier);
                                    $dup_hw_temp_arr[$identifier][] = $pd['HW_SET_ID'];
                                }
                            ?>
                        </div>
                        <div class="card-body p-0">     

                            <div class="card rounded-0 mb-2 border-success">
                                <div style="background-color: #dbffe3;" class="card-header">
                                    <h6>PRIMARY SETUP</h6>
                                </div>
                                <div class="card-body p-0">
                                    <div style="overflow-x: auto; white-space: nowrap;">
                                        <table id="table_primary_<?php echo $table_id?>" class="table table_primary display compact">
                                            <thead>
                                                <tr>
                                                    <?php
                                                        foreach ($thead as $th) {
                                                            echo "<th>".$th."</th>";
                                                        }
                                                        for ($i=1; $i <= 21; $i++) { 
                                                            echo '<th style="display: none!important;">&nbsp;</th>';
                                                        }
                                                    ?>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <?php
                                                    //CHECK IF IN AN INSTANCE IS LOADED
                                                    if (count(array_values($instance_setups)) > 0) {
                                                        require('PLA-PRIMARY-ROWS/PLA-PRIMARY-INSTANCE.PHP');
                                                    }
                                                    else{
                                                        $has_dedication = [];
                                                        foreach ($dedication_data as $ded_data) {
                                                            if ($ded_data['TYPE'] == "PRIMARY") {
                                                                array_push($has_dedication, $ded_data['SAP_RTE_ID'].'|'.$ded_data['STEP_NM']);
                                                                if ($ded_data['SAP_RTE_ID'] == $route_id && $ded_data['STEP_NM'] == $step) {
                                                                    $cls = "bg-part-dedication-primary";
                                                                    $hide = "td-hide";
                                                                    $hardware_set = json_encode($hardware_data);
                                                                    $part_id = $ded_data['MFG_PART_NUM'].'|'.$ded_data['SITE_NUM'].'|'.$ded_data['STEP_NM'].'|'.$ded_data['HASH'].'|'.$ded_data['SAP_RTE_ID'].'|COMPLETED';
                                                                    $part_flag = preg_replace('/[^A-Za-z0-9\-]/', '_', $ded_data['SITE_NUM'].'_'.$ded_data['STEP_NM'].'_'.$ded_data['SAP_RTE_ID']);
    
                                                                    if(count($unplannable_data) > 0){
                                                                        foreach ($unplannable_data as $key => $ud) {
                                                                            if ($ud['ATOM_MASTER_ID'] == $ded_data['ATOM_MASTER_ID']) {
                                                                                $ded_data['DB_ID'] = $ud['ID'];
                                                                            }
                                                                        }
                                                                    }
                                                                    require('PLA-PRIMARY-ROWS/PLA-PRIMARY-DEDICATION.PHP');
                                                                }
                                                            }
                                                        }
                                                        foreach ($test as $pd) {
                                                            if ($pd['RTE_ID'] == $route_id && $pd['STEP'] == $step) {
                                                                if (!in_array($pd['RTE_ID'].'|'.$pd['STEP'], $has_dedication)) {

                                                                    $cls = "bg-part-primary";
                                                                    $hide = "td-hide";
                                                                    $hardware_set = json_encode($hardware_data);
                                                                    $part_id = $pd['PART'].'|'.$pd['SITE'].'|'.$pd['STEP'].'|'.$pd['HASH'].'|'.$pd['RTE_ID'].'|COMPLETED|0';
                                                                    $part_flag = preg_replace('/[^A-Za-z0-9\-]/', '_', $pd['PART'].'_'.$pd['SITE'].'_'.$pd['STEP'].'_'.$pd['RTE_ID']);
                                                                    $idtf = $pd['ENGR_TESTER'].'|'.$pd['ENGR_HANDLER'].'|'.$pd['ATOM_TESTER'].'|'.$pd['ATOM_HANDLER'].'|'.$route_id.'|'.$pd['STEP'];
                                                                    
                                                                    $utpi           = ($pd['UTPI'] != null          && $pd['UTPI'] != '')       ? $pd['UTPI'] : 'N/A';
                                                                    $rnd_test_time  = ($pd['TEST_TIME'] != null     && $pd['TEST_TIME'] != '')  ? round($pd['TEST_TIME'], 2)  : 'N/A';
                                                                    $rnd_index_time = ($pd['INDEX_TIME'] != null    && $pd['INDEX_TIME'] != '') ? round($pd['INDEX_TIME'], 2) : 'N/A';
                                                                    $rnd_oee        = ($pd['OEE'] != null           && $pd['OEE'] != '')        ? number_format((float)$pd['OEE'], 2, '.', '') : 'N/A';
                                                                    $rnd_qc_factor  = ($pd['QC_FACTOR'] != null     && $pd['QC_FACTOR'] != '')  ? round($pd['QC_FACTOR'], 3)  : 'N/A';
                                                                    $rnd_sprint_uph = ($pd['SPRINT_UPH'] != null    && $pd['SPRINT_UPH'] != '') ? round($pd['SPRINT_UPH'], 2) : 'N/A';
                                                                    $rnd_uph        = ($pd['UPH'] != null           && $pd['UPH'] != '')        ? round($pd['UPH'], 2)        : 'N/A';

                                                                    if(count($unplannable_data) > 0){
                                                                        foreach ($unplannable_data as $key => $ud) {
                                                                            if ($ud['ATOM_MASTER_ID'] == $pd['HASH']) {
                                                                                $pd['DB_ID'] = $ud['ID'];
                                                                            }
                                                                        }
                                                                    }


                                                                    if (isset($primary_data) && in_array($part_id, $primary_data)) {
                                                                        $primary_id = "";
                                                                        foreach ($primary_data_raw as $pmdr) {
                                                                            if ($pmdr[0].'|'.$pmdr[1].'|'.$pmdr[2].'|'.$pmdr[3].'|'.$pmdr[4].'|'.$pmdr[6].'|'.$pmdr[15] == $part_id) {
                                                                                $primary_id = $pmdr[10];
                                                                                $primary_hw = $pmdr[5];
                                                                                break;
                                                                            }
                                                                        }

                                                                        require('PLA-PRIMARY-ROWS/PLA-PRIMARY-DEFAULT.PHP');
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                    
                                                ?>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <i style="font-size: 1.8em;" class="fa-solid fa-arrows-up-to-line d-flex justify-content-center"></i>

                            <div class="card rounded-0 mt-2 border-warning">
                                <div style="background-color: #fffedb;" class="card-header">
                                    <h6>ALTERNATE SETUP</h6>
                                </div>
                                <div class="card-body p-0">
                                    <div style="overflow-x: auto; white-space: nowrap;">
                                        <table id="table_source_<?php echo $table_id?>" class="table table-hover table_source display compact">
                                            <thead>
                                                <tr>
                                                    <?php
                                                        foreach ($thead as $th) {
                                                            echo "<th>".$th."</th>";
                                                        }
                                                        for ($i=1; $i <= 21; $i++) { 
                                                            echo '<th style="display: none!important;">&nbsp;</th>';
                                                        }
                                                    ?>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <?php

                                                    if (count(array_values($instance_setups)) > 0) {
                                                        require('PLA-ALTERNATE-ROWS/PLA-ALTERNATE-INSTANCE.PHP');
                                                    }
                                                    else{
                                                        if (count($dedication_data) > 0) {
                                                            foreach ($dedication_data as $ded_data) {
                                                                if ($ded_data['TYPE'] == "ALTERNATE") {
                                                                    array_push($has_dedication, $ded_data['SAP_RTE_ID'].'|'.$ded_data['STEP_NM']);
                                                                    if ($ded_data['SAP_RTE_ID'] == $route_id && $ded_data['STEP_NM'] == $step) {
                                                                        $cls = "bg-part-dedication-alternate";
                                                                        $hide = "td-hide";
                                                                        $hardware_set = json_encode($hardware_data);
                                                                        $part_id = $ded_data['MFG_PART_NUM'].'|'.$ded_data['SITE_NUM'].'|'.$ded_data['STEP_NM'].'|'.$ded_data['HASH'].'|'.$ded_data['SAP_RTE_ID'].'|COMPLETED';
                                                                        $part_flag = preg_replace('/[^A-Za-z0-9\-]/', '_', $ded_data['SITE_NUM'].'_'.$ded_data['STEP_NM'].'_'.$ded_data['SAP_RTE_ID']);
        
                                                                        if(count($unplannable_data) > 0){
                                                                            foreach ($unplannable_data as $key => $ud) {
                                                                                if ($ud['ATOM_MASTER_ID'] == $ded_data['ATOM_MASTER_ID']) {
                                                                                    $ded_data['DB_ID'] = $ud['ID'];
                                                                                }
                                                                            }
                                                                        }

                                                                        require('PLA-ALTERNATE-ROWS/PLA-ALTERNATE-DEDICATION.PHP');
                                                                    }
                                                                }
                                                            }
                                                        }

                                                        foreach ($test as $pd) {
                                                            if ($pd['RTE_ID'] == $route_id && $pd['STEP'] == $step) {
                                                                $hardware_set = json_encode($hardware_data);
                                                                $part_id = $pd['PART'].'|'.$pd['SITE'].'|'.$pd['STEP'].'|'.$pd['HASH'].'|'.$pd['RTE_ID'].'|COMPLETED|0';
                                                                $part_flag = preg_replace('/[^A-Za-z0-9\-]/', '_', $pd['PART'].'_'.$pd['SITE'].'_'.$pd['STEP'].'_'.$pd['RTE_ID']);
                                                                $idtf = $pd['ENGR_TESTER'].'|'.$pd['ENGR_HANDLER'].'|'.$pd['ATOM_TESTER'].'|'.$pd['ATOM_HANDLER'].'|'.$route_id.'|'.$pd['STEP'];
                                                                $uf_value = $pd['ATOM_TESTER'].'|'.$pd['ATOM_HANDLER'];

                                                                $flag_status = "";
                                                                $flag_type = "";
                                                                if(count($unplannable_data) > 0){
                                                                    foreach ($unplannable_data as $key => $ud) {
                                                                        if ($ud['ATOM_MASTER_ID'] == $pd['HASH']) {
                                                                            $flag_status = "checked";
                                                                            $flag_type = "unplannable";
                                                                            $pd['DB_ID'] = $ud['ID'];
                                                                        }
                                                                    }
                                                                }

                                                                if (isset($primary_data) && !in_array($part_id, $primary_data)) {
                                                                    $cls = "td-hide";
                                                                    $utpi           = ($pd['UTPI'] != null          && $pd['UTPI'] != '')       ? $pd['UTPI'] : 'N/A';
                                                                    $rnd_test_time  = ($pd['TTPI'] != null          && $pd['TTPI'] != '')       ? round($pd['TTPI'], 2)  : 'N/A';
                                                                    $rnd_index_time = ($pd['INDX'] != null          && $pd['INDX'] != '')       ? round($pd['INDX'], 2) : 'N/A';
                                                                    $rnd_oee        = ($pd['OEE'] != null           && $pd['OEE'] != '')        ? number_format((float)$pd['OEE'], 2, '.', '') : 'N/A';
                                                                    $rnd_qc_factor  = ($pd['QC_FACTOR'] != null     && $pd['QC_FACTOR'] != '')  ? round($pd['QC_FACTOR'], 3)  : 'N/A';
                                                                    $rnd_sprint_uph = ($pd['SPRINT_UPH'] != null    && $pd['SPRINT_UPH'] != '') ? round($pd['SPRINT_UPH'], 2) : 'N/A';
                                                                    $rnd_uph        = ($pd['UPH'] != null           && $pd['UPH'] != '')        ? round($pd['UPH'], 2)        : 'N/A';

                                                                    require('PLA-ALTERNATE-ROWS/PLA-ALTERNATE-DEFAULT.PHP');
                                                                }
                                                                
                                                            }
                                                        }
                                                    }
                                                ?>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                <?php
                // DEDICATIONS
                include(__DIR__ .'/../others/DEDICATIONS.PHP');
            }
        }
    ?>
</div>