<div style="margin-left:50px!important;" class="card mb-3">
    <div style="background-color: #cff4fc;" class="card-header d-flex justify-content-between pt-1 pb-1">
        <strong>TIME-PHASING</strong>
        <input type="hidden" class="instance-loaded">
    </div>
    <?php
        $has_tp_status = 'pointer-events: none; opacity: 0.7;';

        if (in_array('SCM Cap Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
            $has_tp_status = '';
        }
    ?>
    <div style="width: 100%; overflow-x: auto; white-space: nowrap; <?php echo $has_tp_status;?>" class="card-body d-flex justify-content-start">
    
        <div class="card text-center tp-card rounded-0 col-auto m-3">
            <div class="card-header">Current - <?php echo $timephases['CURRENT_WEEK']['WEEK'];?></div>
            <div style="height: 10em!important;" class="card-body">

                <?php

                // echo "<pre>", var_dump($timephases_summary), "</pre>";
	            // return;

                    $current_summary = [];
                    $th_count = 0;
                    foreach ($timephases_summary['SUMMARY']['DATA'][0][0]['SUMMARY']['PRIMARY_SETUP'] as $key => $ci) {
                        $occurrence = count($ci['METADATA']['STEP_NM']);
                        if ($occurrence > $th_count) {
                            $current_summary = [];
                            $th_count = $occurrence;
                            array_push($current_summary, $ci['TESTER'], $ci['HANDLER'], $ci['METADATA']);
                        }
                    }

                    $tp_metadata = $current_summary[2];
                    $md_keys = array_keys($tp_metadata);
                    $tp_sitem = "";
                    $tp_sitem .= '<div class="col-lg-6 mb-2"><small>'.$current_summary[0].'</small></div><div class="col-lg-6"><small>'.$current_summary[1].'</small></div>';

                    foreach ($current_summary[2]['STEP_NM'] as $key2 => $sm) {
                        $tp_sitem .= '<div class="col-lg-3 mb-2"><small>'.$sm.'</small></div>';
                    }
                    $tp_sitem .= '<hr>';

                    foreach ($md_keys as $key => $mdk) {
                        if ($mdk != "STEP_NM" && $mdk != "TEMP_FLOW") {
                            $tp_sitem .= '<div class="col-lg-6"><small>'.$mdk.': '.$tp_metadata[$mdk].'</small></div>';
                        }
                    }
                    $tp_current_content = '<div class="row">'.$tp_sitem.'</div>';
                ?>

                <p class="card-text">
                    <small><?php echo str_replace("_ZEROCAP","", $current_summary[0])?></small><br>
                    <small><?php echo str_replace("_ZEROCAP","", $current_summary[1])?></small><br>
                    <small>Flow: <?php echo $current_summary[2]['FLOW'];?></small><br>
                    <small>Aggr.UTPH: <?php echo $current_summary[2]['UTPH'];?></small>
                </p>
            </div>
            <div class="card-footer text-body-secondary footer-current d-flex justify-content-between">
                <button type="button" class="btn btn-outline-info btn-sm"
                   data-bs-placement="right"
                   data-bs-toggle="popover"
                   data-bs-custom-class="instance-popover"
                   data-bs-title="Current Instance"
                   data-bs-content='<?php echo $tp_current_content;?>' href="#">
                    Details <i class="fa-solid fa-circle-info"></i>
                </button>
                <button type="button" class="btn btn-outline-success btn-sm btn-instance"
                    process="new"
                    instance-type="current"
                    instance-route="<?php echo $route_id?>"
                    instance-id="current"
                    instance-date="<?php echo $timephases['CURRENT_WEEK']['DATE']?>"
                    instance-week="<?php echo $timephases['CURRENT_WEEK']['WEEK']?>"
                    instance-num="0">New <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        </div>
        
        <?php
            $existing_weeks = [];
            if (count($timephases['TIMEPHASING']) > 0) {
                foreach ($timephases['TIMEPHASING'] as $key => $tp) {
                    $fyww = "FY".substr($tp['FYWW'], 2, 2)."_W".substr($tp['FYWW'], 4, 2);
                    if (!in_array($tp['FYWW'], $existing_weeks)) {
                        array_push($existing_weeks, $fyww.'|'.$tp['INSTANCE']);
                    }
                    if ($tp['SAP_RTE_ID'] == $route_id) {
                    ?>
                        <div class="card text-center tp-card-arrow border-0">
                            <div style="background: transparent;" class="card-header border-0">&nbsp;</div>
                            <div class="card-body border-0"><i class="fa-solid fa-arrow-right position-absolute top-50 start-50 translate-middle"></i></div>
                            <div style="background: transparent;" class="card-footer border-0">&nbsp;</div>
                        </div>

                        <div card-id="<?php echo $tp['TPI_ID']; ?>" class="card text-center tp-card rounded-0 col-auto m-3">
                            <div class="card-header">
                                <div class="row justify-content-end">
                                    <div class="col-4 d-flex justify-content-start">
                                        <span class="badge text-bg-info">#<?php echo $tp['INSTANCE']; ?></span>
                                    </div>
                                    <div class="col-4 d-flex justify-content-center">
                                        <?php echo $fyww; ?>
                                    </div>
                                    <div class="col-4 d-flex justify-content-end">
                                        <i type="button" class="fa-solid fa-ellipsis-vertical" data-bs-toggle="dropdown" aria-expanded="false"></i>
                                        <ul class="dropdown-menu">
                                            <li type="button" class="dropdown-item btn-edit-instance text-primary"
                                            process="edit"
                                            instance-type="clone"
                                            instance-route="<?php echo $route_id?>"
                                            instance-id="<?php echo $tp['TPI_ID']; ?>" 
                                            instance-date="<?php echo $tp['EFF_START_DT']; ?>" 
                                            instance-week="<?php echo $fyww; ?>"
                                            instance-note=<?php echo json_encode($tp['NOTES']); ?>
                                            instance-process="<?php echo $tp['PROCESS_TYPE']; ?>"
                                            instance-num="<?php echo $tp['INSTANCE']; ?>"><i class="fa-solid fa-pen-to-square"></i> Edit</li>
                                            <li type="button" class="dropdown-item btn-delete-instance text-danger"
                                                data-week="<?php echo $fyww;?>"
                                                data-id="<?php echo $tp['TPI_ID']; ?>" 
                                                data-route="<?php echo $tp['SAP_RTE_ID']; ?>"
                                                data-part="<?php echo $tp['MFG_PART_NUM']; ?>"
                                                data-num="<?php echo $tp['INSTANCE']; ?>"><i class="fa-solid fa-trash"></i> Delete</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div style="height: 10em!important;" class="card-body instance-card">
                                <h6 class="card-title"><?php echo $tp['PROCESS_TYPE']; ?></h6>
                                <p class="card-text">
                                    <?php
                                        $tp_ext_citem = "";
                                        $tp_compare = $timephases_summary['SUMMARY']['DATA'][0][$tp['TPI_ID']]['COMPARE'];
                                        if (count($tp_compare) > 0) {
                                            $tpc_keys = array_keys($tp_compare);
                                            foreach ($tpc_keys as $key => $tpk) {
                                                if ($tpk != "PRIMARY_SETUP") {
                                                    $changes_icon = (array_key_exists("MORE", $tp_compare[$tpk])) ? "fa-arrow-up text-success" : "fa-arrow-down text-danger";
                                                    $changes_text = (array_key_exists("MORE", $tp_compare[$tpk])) ? "text-success" : "text-danger";

                                                    //CONSTRUCTING POPOVER CONTENTS (DETAILS BUTTON)
                                                    foreach (array_keys($tp_compare[$tpk]) as $key2 => $tpck) {
                                                        if ($tpk != "FLOW_NUMERIC") {
                                                            foreach ($tp_compare[$tpk][$tpck] as $key3 => $tpckv) {
                                                                //DIFF VALUE - FOR FLOW ONLY
                                                                if ($tpk == "FLOW") {
                                                                    $diff_val = "";
                                                                    $tpckv['THIS'] = str_replace(",", "<br>", $tpckv['THIS']); 
                                                                    $tpckv['THAT'] = str_replace(",", "<br>", $tpckv['THAT']); 
                                                                    foreach (array_keys($tpckv['DIFF']) as $key4 => $dk) {
                                                                        $diff_val .= $tpckv['DIFF'][$dk].'<br>';
                                                                    }
                                                                    $tpckv['DIFF'] = $diff_val;
                                                                } 
                                                                $tp_ext_citem .= '<div class="col-lg-12 mb-2">
                                                                                    <small><i class="fa-solid '.$changes_icon.'"></i> '.$tpk.'</small>
                                                                                    <div class="row">
                                                                                        <div class="col-lg-4"><small>'.$tpckv['THAT'].'</small></div>
                                                                                        <div class="col-lg-4"><small class="'.$changes_text.'">'.$tpckv['THIS'].'</small></div>
                                                                                        <div class="col-lg-4"><small>'.$tpckv['DIFF'].'</small></div>
                                                                                    </div>
                                                                                </div>';
                                                            }
                                                        }
                                                        else{
                                                            $tp_ext_citem .= '<div class="col-lg-12 mb-2">
                                                                                <small><i class="fa-solid '.$changes_icon.'"></i> '.$tpk.'</small>
                                                                                <div class="row">
                                                                                    <div class="col-lg-4"><small>'.(isset($tp_compare['FLOW_NUMERIC']['LESS']) ? $tp_compare['FLOW_NUMERIC']['LESS']['THAT'] : 0) .'</small></div>
                                                                                    <div class="col-lg-4"><small class="'.$changes_text.'">'.(isset($tp_compare['FLOW_NUMERIC']['LESS']) ? $tp_compare['FLOW_NUMERIC']['LESS']['THIS'] : 0).'</small></div>
                                                                                    <div class="col-lg-4"><small>'.(isset($tp_compare['FLOW_NUMERIC']['LESS']) ? $tp_compare['FLOW_NUMERIC']['LESS']['DIFF'] : 0) .'</small></div>
                                                                                </div>
                                                                            </div>';
                                                        }
                                                    }
                                                }
                                                elseif ($tpk == "PRIMARY_SETUP") {
                                                    $changes_icon = (array_key_exists("NEUTRAL", $tp_compare[$tpk])) ? "fa-equals text-info" : "fa-arrow-up-1-9 text-primary";

                                                    foreach (array_keys($tp_compare[$tpk]) as $key2 => $tpck) {
                                                        $tp_ext_citem_inner = "";
                                                        foreach ($tp_compare[$tpk][$tpck] as $key3 => $tpckv) {
                                                            $item_step = "";
                                                            foreach ($tpckv['STEP_NM'] as $key4 => $step) {
                                                                $item_step .= '<small>'.$step.'</small>';
                                                            }
                                                            $tp_ext_citem_inner .= '<div class="col-lg-12"><small>'.$tpckv['THAT'].'</small></div>
                                                                                    <div class="col-lg-12"><small>'.$tpckv['THIS'].'</small></div>
                                                                                    <div class="col-lg-12"><small>'.$tpckv['DIFF'].'</small></div>
                                                                                    <div class="col-lg-12 d-flex justify-content-between mb-3">'.$item_step.'</div>';
                                                        }

                                                        $tp_ext_citem .= '<div class="col-lg-12 mb-4">
                                                                            <small><i class="fa-solid '.$changes_icon.'"></i> '.$tpk.'</small>
                                                                            <div class="row">'.$tp_ext_citem_inner.'</div>
                                                                        </div>';
                                                    }
                                                }

                                                echo '<small><i class="fa-solid '.$changes_icon.'"></i> '.$tpk.'</small><br>';
                                            }
                                        }
                                        else{
                                            echo 'N/A';
                                            $tp_ext_citem = "Not Available";
                                        }
                                        $tp_ext_content = '<div class="row">'.$tp_ext_citem.'</div>';
                                    ?>
                                </p>
                            </div>
                            <div class="card-footer text-body-secondary d-flex justify-content-between footer-<?php echo $tp['TPI_ID'];?>">
                                <button  type="button" class="btn btn-outline-info btn-sm"
                                    data-bs-placement="right"
                                    data-bs-toggle="popover"
                                    data-bs-custom-class="instance-popover"
                                    data-bs-title="Instance #<?php echo $tp['INSTANCE']?>"
                                    data-bs-content='<?php echo $tp_ext_content;?>' href="#">
                                        Details <i class="fa-solid fa-circle-info"></i>
                                </button>
                                <button type="button" instance-id="<?php echo $tp['TPI_ID']; ?>" class="btn btn-outline-primary btn-sm btn-load-instance">Load <i class="fa-solid fa-right-to-bracket"></i></button>
                                <button type="button" class="btn btn-outline-success btn-sm btn-instance"
                                    process="new"
                                    instance-type="clone"
                                    instance-route="<?php echo $route_id?>"
                                    instance-id="<?php echo $tp['TPI_ID']; ?>" 
                                    instance-date="<?php echo $tp['EFF_START_DT']; ?>" 
                                    instance-week="<?php echo $fyww; ?>"
                                    instance-note=<?php echo json_encode($tp['NOTES']); ?>
                                    instance-process="<?php echo $tp['PROCESS_TYPE']; ?>"
                                    instance-num="<?php echo $tp['INSTANCE']; ?>">New <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    <?php
                    }
                }
            }
        ?>

        <input type="hidden" class="tp-existing-<?php echo str_replace(['#','.','-','/', '^'], "_", $route_id);?>" value=<?php echo json_encode($existing_weeks); ?>>

    </div>

    <div class="modal fade zoom" id="timephasingModal" data-bs-backdrop="static" tabindex="-1" aria-labelledby="timephasingModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="timephasingModalLabel">New Instance</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-lg-6">
                            <input type="hidden" class="tp-default-data">
                            <input type="hidden" class="tp-crud">
                            <input type="hidden" class="tp-route" value="<?php echo $route_id; ?>">
                            <input type="hidden" class="tp-id">
                            <input type="hidden" class="tp-date">
                            <input type="hidden" class="tp-week">
                            <input type="hidden" class="tp-num">

                            <input type="hidden" class="ext-tp-id">
                            <input type="hidden" class="ext-tp-date">
                            <input type="hidden" class="ext-tp-week">
                            <input type="hidden" class="ext-tp-num">
                            <table class="table table-bordered table-calendar">
                                <caption>
                                    <nav class="d-flex justify-content-center" aria-label="navigate calendar">
                                        <ul class="pagination">
                                            <li class="page-item"><a class="page-link" page-type="paginate-previous" href="#">Previous</a></li>
                                            <li class="page-item"><a class="page-link" page-type="paginate-next" href="#">Next</a></li>
                                        </ul>
                                    </nav>
                                </caption>
                                <tbody class="tbody">
                                    
                                </tbody>
                            </table>
                        </div>
                        <div class="col-lg-6">
                            
                            <div class="card mb-3">
                                <div class="card-header"><strong>Details</strong></div>
                                <div class="card-body">
                                    <dl class="row">
                                        <dt class="col-sm-4">Instance:</dt>
                                        <dd class="col-sm-8 in-container"></dd>

                                        <dt class="col-sm-4">Cloned Week:</dt>
                                        <dd class="col-sm-8 cw-container"></dd>

                                        <dt class="col-sm-4">SAP_RTE_ID:</dt>
                                        <dd class="col-sm-8"><?php echo $route_id?></dd>
                                    </dl>
                                </div>
                            </div>

                            <div class="card mb-3">
                                <div class="card-header"><strong>Process Type</strong></div>
                                <div stlye="min-height: 8em!important;" class="card-body">
                                    <div class="row">
                                        <?php
                                            $process_arr = ['Dedication', 'Flow Removal', 'Index Time Changes', 'OEE Changes', 'Plannable Flag', 'Platform Migration', 'Platform Migration - No SUS', 'Primary Platform Update','Test Time Reduction','UTPI Changes'];

                                            foreach ($process_arr as $key => $parr) {
                                                $pid = (int)$key + 1;
                                            ?>
                                                <div class="col-lg-6">
                                                    <input type="checkbox" class="btn-check tp-process" value="<?php echo $parr;?>" name="tp-process" id="option-<?php echo $pid;?>">
                                                    <label class="btn" for="option-<?php echo $pid;?>"><?php echo $parr;?></label>
                                                </div>
                                            <?php
                                            }
                                        ?>
                                    </div>
                                </div>
                            </div>
                            <div class="form-floating">
                                <textarea class="form-control tp-notes" placeholder="" style="height: 100px"></textarea>
                                <label>Notes</label>
                            </div>
                            <hr class="mb-4 mt-4">
                            <div class="d-flex justify-content-center">
                                <button type="button" class="btn btn-success btn-save-instance">Save <i class="fa-solid fa-floppy-disk"></i></button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>

</div>