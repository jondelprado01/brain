<?php

$result = [];
if (count(array_values($instance_setups)) > 0) {
    foreach ($rte_keys as $key_rte => $rtek) {
        $instance_setups[$rtek]['RTE_SEQ_NUM'] = $rtek;
    }
    $instnc_stps = array_values($instance_setups);

    $result = current(array_filter($instnc_stps, function($item) use($step) {
        return $item['STEP_NM'] == $step;
    }));
}

$editable = '';
$instance_attr = '';
$instance_idtf = '';
$instance_field = '';
$if_ttpi = '';
$if_utpi = '';
$if_indx = '';
$if_oee = '';

if (count($result) > 0) {
    $setup_keys = array_keys($result['RES_PRIO_CD']);

    foreach ($setup_keys as $key => $skey) {
        if ($skey != 1) {
            $pi_route           = $instance_data['INSTANCE_DATA']['DATA'][$_GET['timephase-instance']]['SAP_RTE_ID'];
            $pi_partnum         = $instance_data['INSTANCE_DATA']['DATA'][$_GET['timephase-instance']]['DATA']['MFG_PART_NUM'];
            $pi_step_nm         = $result['STEP_NM'];
            $pi_rte_seq         = $result['RTE_SEQ_NUM'];
            $pi_eng_tester      = $result['RES_PRIO_CD'][$skey]['TESTER_ENG'];
            $pi_eng_handler     = $result['RES_PRIO_CD'][$skey]['HANDLER_ENG'];
            $pi_atom_tester     = $result['RES_PRIO_CD'][$skey]['TESTER'];
            $pi_atom_handler    = $result['RES_PRIO_CD'][$skey]['HANDLER'];
            $pi_ttime           = $result['RES_PRIO_CD'][$skey]['TTPI'];
            $pi_utpi            = $result['RES_PRIO_CD'][$skey]['UTPI'];
            $pi_index           = $result['RES_PRIO_CD'][$skey]['INDX'];
            $pi_oee             = $result['RES_PRIO_CD'][$skey]['OEE'];
            $pi_qcf             = $result['TEST_PERC']; //no equivalent value from api
            $pi_suph            = "--"; //no equivalent value from api
            $pi_uph             = $result['RES_PRIO_CD'][$skey]['UTPH'];
            $pi_res_set         = $result['RES_PRIO_CD'][$skey]['REF_STEP_ID'];
            $pi_data            = $result['RES_PRIO_CD'][$skey];
            $pi_hw_set          = $result['RES_PRIO_CD'][$skey]['HW_SET_ID'];
            $pi_tpd_id          = $result['RES_PRIO_CD'][$skey]['TPD_ID'];
            $pi_is_ded          = $result['RES_PRIO_CD'][$skey]['IS_DED'];
            $pi_res_area        = $result['RES_AREA'];
            $pi_hash            = hash("sha256", $pi_partnum.'|'.$pi_atom_tester.'|'.$pi_atom_handler.'|'.$pi_res_set.'|'.$pi_hw_set);
    
            $editable = 'contenteditable="true"';
            $instance_attr = 'instance-data-id="'.$_GET['timephase-instance'].'"';
            $instance_idtf = 'instance-identifier="'.$pi_step_nm.'|'.$pi_rte_seq.'|'.$skey.'|'.$pi_atom_tester.'|'.$pi_atom_handler.'"';
            $if_ttpi = 'instance-field="TTPI"';
            $if_utpi = 'instance-field="UTPI"';
            $if_indx = 'instance-field="INDX"';
            $if_oee = 'instance-field="OEE"';
    
            $cls = "td-hide";
            
            if ($result['RES_PRIO_CD'][$skey]['IS_DED'] == "1") {
                $bg_cell = " bg-part-dedication-alternate";
                $bg_btn = "btn-primary";
                $ded_btn = '';
            }
            $hardware_set = json_encode($hardware_data);
            $part_id = $pi_partnum.'|'.$part_data[0]['SITE'].'|'.$pi_step_nm.'|'.$pi_hash.'|'.$pi_route.'|COMPLETED|0';
            $part_flag = preg_replace('/[^A-Za-z0-9\-]/', '_', $pi_partnum.'_'.$part_data[0]['SITE'].'_'.$pi_step_nm.'_'.$pi_route);
            $idtf = $pi_eng_tester.'|'.$pi_eng_handler.'|'.$pi_atom_tester.'|'.$pi_atom_handler.'|'.$pi_route.'|'.$pi_step_nm;
    
            $pa_menu = (count($result) > 0) ? 'disabled' : '';
            $pi_flag_status = ($skey >= 99) ? "checked" : "";

            $pi_data['RTE_SEQ_NUM'] = $pi_rte_seq;
            $pi_data['RES_PRIO_CD'] = $skey;
            $pi_data['STEP_NM'] = $pi_step_nm;
            
            $unplannable_check = 'disabled';
            $has_dedication = 'disabled';
            $has_hw_set = 'disabled';

            if (in_array('SCM Cap Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
                $unplannable_check = '';
                $has_dedication = '';
            }

            if (in_array('HW Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
                $has_hw_set = '';
            }

            $bg_cell = "";
            $bg_btn = "btn-outline-warning";
            $ded_btn = '';

            if ($pi_is_ded == null) {
                $ded_btn = '<li><button type="button" class="dropdown-item text-secondary btn-sm dedication-config" table-id="table_source_'.$table_id.'" '.$has_dedication.'>
                                <i class="fa-solid fa-clone"></i> Dedications
                            </button></li>';
            }

            echo '<tr>
                    <td class="'.$bg_cell.'">
                        <button class="btn '.$bg_btn.' btn-sm btn-dedication-table_source_'.$table_id.'" 
                                type="button" data-bs-toggle="dropdown" aria-expanded="false"
                                >
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        <ul class="dropdown-menu">
                            '.$ded_btn.'
                            <li>
                                <button type="button" class="dropdown-item text-secondary btn-sm dt-control" '.$has_hw_set.'>
                                    <i class="fa-solid fa-microchip"></i> HW Set
                                </button>
                            </li>
                        </ul>
                    </td>
                    <td class="'.$bg_cell.'">'.$pi_eng_tester.'</td>
                    <td class="'.$bg_cell.'">'.$pi_eng_handler.'</td>
                    <td class="'.$bg_cell.'">'.$pi_atom_tester.'</td>
                    <td class="'.$bg_cell.'">'.$pi_atom_handler.'</td>
                    <td class="'.$bg_cell.' instance-input" instance-default="'.round($pi_ttime, 2).'" '.$if_ttpi.' '.$instance_idtf.' '.$instance_attr.' '.$editable.'>'.round($pi_ttime, 2).'</td>
                    <td class="'.$bg_cell.' instance-input" instance-default="'.$pi_utpi.'" '.$if_utpi.' '.$instance_idtf.' '.$instance_attr.' '.$editable.'>'.$pi_utpi.'</td>
                    <td class="'.$bg_cell.' instance-input" instance-default="'.round($pi_index, 2).'" '.$if_indx.' '.$instance_idtf.' '.$instance_attr.' '.$editable.'>'.round($pi_index, 2).'</td>
                    <td class="'.$bg_cell.' instance-input" instance-default="'.number_format((float)$pi_oee, 2, '.', '').'" '.$if_oee.' '.$instance_idtf.' '.$instance_attr.' '.$editable.'>'.number_format((float)$pi_oee, 2, '.', '').'</td>
                    <td class="'.$bg_cell.'">'.$pi_qcf.'</td>
                    <td class="'.$bg_cell.'">'.$pi_suph.'</td>
                    <td class="'.$bg_cell.'">'.round($pi_uph, 2).'</td>
                    <td class="'.$bg_cell.'">
                        <input part-flag-data="'.$part_flag.'" class="form-check-input unplannable-flag" atom-group="'.$pi_atom_tester.'|'.$pi_atom_handler.'" 
                        type="checkbox" value=\''.json_encode($pi_data).'\' flag-type="" '.$pi_flag_status.' '.$unplannable_check.'>
                    </td>
                    <td class="'.$cls.' ">NO_DATA_AVAILABLE</td>
                    <td class="'.$cls.' ">'.$hardware_set.'</td>
                    <td class="'.$cls.' ">'.$part_id.'</td>
                    <td class="'.$cls.' ">table_primary_'.$table_id.'</td>
                    <td class="'.$cls.' ">table_source_'.$table_id.'</td>
                    <td class="'.$cls.' ">'.$skey.'</td>
                    <td class="'.$cls.' ">'.$pi_hw_set.'</td>
                    <td class="'.$cls.' ">NO_DATA_AVAILABLE</td>
                    <td class="'.$cls.' ">IS_ALTERNATE</td>
                    <td class="'.$cls.' ">'.$pi_hw_set.'</td>
                    <td class="'.$cls.' ">'.$pi_tpd_id.'</td>
                    <td class="'.$cls.' ">'.$pi_res_set.'</td>
                    <td class="'.$cls.' ">NO_DATA_AVAILABLE</td>
                    <td class="'.$cls.' ">'.$part_flag.'</td>
                    <td class="'.$cls.' ">INSTANCE</td>
                    <td class="'.$cls.' "></td>
                    <td class="'.$cls.' ">'.$step_temp_arr[$step][0].'</td>
                    <td class="'.$cls.' ">'.$skey.'</td>
                    <td class="'.$cls.' ">'.$pi_step_nm.'|'.$pi_rte_seq.'|'.$skey.'|'.$pi_atom_tester.'|'.$pi_atom_handler.'</td>
                    <td class="'.$cls.' ">'.json_encode($pi_data).'</td>
                    <td class="'.$cls.' ">'.$pi_res_area.'</td>
                </tr>';
        }
    }
}
?>