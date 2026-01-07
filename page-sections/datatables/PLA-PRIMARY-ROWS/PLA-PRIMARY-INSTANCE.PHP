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

    $pi_route           = $instance_data['INSTANCE_DATA']['DATA'][$_GET['timephase-instance']]['SAP_RTE_ID'];
    $pi_partnum         = $instance_data['INSTANCE_DATA']['DATA'][$_GET['timephase-instance']]['DATA']['MFG_PART_NUM'];
    $pi_step_nm         = $result['STEP_NM'];
    $pi_rte_seq         = $result['RTE_SEQ_NUM'];
    $pi_eng_tester      = $result['RES_PRIO_CD'][1]['TESTER_ENG'];
    $pi_eng_handler     = $result['RES_PRIO_CD'][1]['HANDLER_ENG'];
    $pi_atom_tester     = $result['RES_PRIO_CD'][1]['TESTER'];
    $pi_atom_handler    = $result['RES_PRIO_CD'][1]['HANDLER'];
    $pi_ttime           = $result['RES_PRIO_CD'][1]['TTPI'];
    $pi_utpi            = $result['RES_PRIO_CD'][1]['UTPI'];
    $pi_index           = $result['RES_PRIO_CD'][1]['INDX'];
    $pi_oee             = $result['RES_PRIO_CD'][1]['OEE'];
    $pi_qcf             = $result['TEST_PERC']; //no equivalent value from api
    $pi_suph            = "--"; //no equivalent value from api
    $pi_uph             = $result['RES_PRIO_CD'][1]['UTPH'];
    $pi_res_set         = $result['RES_PRIO_CD'][1]['REF_STEP_ID'];
    $pi_data            = $result['RES_PRIO_CD'][1];
    $pi_hw_set          = $result['RES_PRIO_CD'][1]['HW_SET_ID'];
    $pi_tpd_id          = $result['RES_PRIO_CD'][1]['TPD_ID'];
    $pi_res_area        = $result['RES_AREA'];
    $pi_hash            = hash("sha256", $pi_partnum.'|'.$pi_atom_tester.'|'.$pi_atom_handler.'|'.$pi_res_set.'|'.$pi_hw_set);

    $editable = 'contenteditable="true"';
    $instance_attr = 'instance-data-id="'.$_GET['timephase-instance'].'"';
    $instance_idtf = 'instance-identifier="'.$pi_step_nm.'|'.$pi_rte_seq.'|1|'.$pi_atom_tester.'|'.$pi_atom_handler.'"';
    $if_ttpi = 'instance-field="TTPI"';
    $if_utpi = 'instance-field="UTPI"';
    $if_indx = 'instance-field="INDX"';
    $if_oee = 'instance-field="OEE"';

    $cls = "bg-part-primary";
    $hide = "td-hide";
    $hardware_set = json_encode($hardware_data);
    $part_id = $pi_partnum.'|'.$part_data[0]['SITE'].'|'.$pi_step_nm.'|'.$pi_hash.'|'.$pi_route.'|COMPLETED|0';
    $part_flag = preg_replace('/[^A-Za-z0-9\-]/', '_', $pi_partnum.'_'.$part_data[0]['SITE'].'_'.$pi_step_nm.'_'.$pi_route);
    $idtf = $pi_eng_tester.'|'.$pi_eng_handler.'|'.$pi_atom_tester.'|'.$pi_atom_handler.'|'.$pi_route.'|'.$pi_step_nm;
}

$pa_menu = (count($result) > 0) ? 'disabled' : '';

$pi_data['RTE_SEQ_NUM'] = $pi_rte_seq;
$pi_data['RES_PRIO_CD'] = 1;
$pi_data['STEP_NM'] = $pi_step_nm;

$has_ded_status = 'disabled';
$has_hw_set = 'disabled';

if (in_array('SCM Cap Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
    $has_ded_status = '';
}

if (in_array('HW Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
    $has_hw_set = '';
}

$bg_btn = "btn-outline-warning";
$ded_btn = '<li><button type="button" class="dropdown-item text-secondary btn-sm dedication-config" table-id="table_primary_'.$table_id.'" '.$has_ded_status.'>
                <i class="fa-solid fa-clone"></i> Dedications
            </button></li>';

if ($result['RES_PRIO_CD'][1]['IS_DED'] == "1") {
    $cls = " bg-part-dedication-primary";
    $bg_btn = "btn-primary";
    $ded_btn = '';
}

echo '<tr>
        <td class="'.$cls.'">
            <button class="btn btn-success btn-sm btn-dedication-table_primary_'.$table_id.'" 
                    type="button" data-bs-toggle="dropdown" aria-expanded="false"
                    >
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <ul class="dropdown-menu">
                '.$ded_btn.'
                <li class="'.$has_hw_set.'">
                    <button type="button" class="dropdown-item text-secondary btn-sm dt-control" '.$has_hw_set.'>
                        <i class="fa-solid fa-microchip"></i> HW Set
                    </button>
                </li>
            </ul>
        </td>
        <td class="'.$cls.'">'.$pi_eng_tester.'</td>
        <td class="'.$cls.'">'.$pi_eng_handler.'</td>
        <td class="'.$cls.'">'.$pi_atom_tester.'</td>
        <td class="'.$cls.'">'.$pi_atom_handler.'</td>
        <td class="'.$cls.' instance-input" instance-default="'.round($pi_ttime, 2).'" '.$if_ttpi.' '.$instance_idtf.' '.$instance_attr.' '.$editable.'>'.round($pi_ttime, 2).'</td>
        <td class="'.$cls.' instance-input" instance-default="'.$pi_utpi.'" '.$if_utpi.' '.$instance_idtf.' '.$instance_attr.' '.$editable.'>'.$pi_utpi.'</td>
        <td class="'.$cls.' instance-input" instance-default="'.round($pi_index, 2).'" '.$if_indx.' '.$instance_idtf.' '.$instance_attr.' '.$editable.'>'.round($pi_index, 2).'</td>
        <td class="'.$cls.' instance-input" instance-default="'.number_format((float)$pi_oee, 2, '.', '').'" '.$if_oee.' '.$instance_idtf.' '.$instance_attr.' '.$editable.'>'.number_format((float)$pi_oee, 2, '.', '').'</td>
        <td class="'.$cls.'">'.$pi_qcf.'</td>
        <td class="'.$cls.'">'.$pi_suph.'</td>
        <td class="'.$cls.'">'.round($pi_uph, 2).'</td>
        <td class="'.$cls.'">
            <input part-flag-data="'.$part_flag.'" class="form-check-input unplannable-flag" atom-group="'.$pi_atom_tester.'|'.$pi_atom_handler.'" 
            type="checkbox" value=\''.json_encode($pi_data).'\' flag-type="" disabled>
        </td>
        <td class="'.$cls.' '.$hide.'">NO_DATA_AVAILABLE</td>
        <td class="'.$cls.' '.$hide.'">'.$hardware_set.'</td>
        <td class="'.$cls.' '.$hide.'">'.$part_id.'</td>
        <td class="'.$cls.' '.$hide.'">table_primary_'.$table_id.'</td>
        <td class="'.$cls.' '.$hide.'">table_source_'.$table_id.'</td>
        <td class="'.$cls.' '.$hide.'">1</td>
        <td class="'.$cls.' '.$hide.'">'.$pi_hw_set.'</td>
        <td class="'.$cls.' '.$hide.'">NO_DATA_AVAILABLE</td>
        <td class="'.$cls.' '.$hide.'">IS_PRIMARY</td>
        <td class="'.$cls.' '.$hide.'">'.$pi_hw_set.'</td>
        <td class="'.$cls.' '.$hide.'">'.$pi_tpd_id.'</td>
        <td class="'.$cls.' '.$hide.'">'.$pi_res_set.'</td>
        <td class="'.$cls.' '.$hide.'">NO_DATA_AVAILABLE</td>
        <td class="'.$cls.' '.$hide.'">'.$part_flag.'</td>
        <td class="'.$cls.' '.$hide.'">INSTANCE</td>
        <td class="'.$cls.' '.$hide.'"></td>
        <td class="'.$cls.' '.$hide.'">'.$step_temp_arr[$step][0].'</td>
        <td class="'.$cls.' '.$hide.'">1</td>
        <td class="'.$cls.' '.$hide.'">'.$pi_step_nm.'|'.$pi_rte_seq.'|1|'.$pi_atom_tester.'|'.$pi_atom_handler.'</td>
        <td class="'.$cls.' '.$hide.'">'.json_encode($pi_data).'</td>
        <td class="'.$cls.' '.$hide.'">'.$pi_res_area.'</td>
    </tr>';
// <td class="'.$cls.'">'.round($pi_qcf, 2).'</td>
// <td class="'.$cls.'">'.round($pi_suph, 2).'</td>
?>