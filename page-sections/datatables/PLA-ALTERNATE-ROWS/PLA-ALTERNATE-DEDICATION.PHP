<?php

$unplannable_check = 'disabled';
$has_hw_set = 'disabled';

if (in_array('SCM Cap Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
    $unplannable_check = '';
}

if (in_array('HW Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
    $has_hw_set = '';
}

$orig_prio_arr = [];

foreach ($test as $key => $t) {
    if ($t['RTE_ID'] == $ded_data['SAP_RTE_ID'] && $t['STEP'] == $ded_data['STEP_NM']) {
        array_push($orig_prio_arr, (int)$t['ORIG_PRIO']);
    }
}

$new_orig_prio = (isset($ded_data['ORIG_PRIO']) && $ded_data['ORIG_PRIO'] != "" && $ded_data['ORIG_PRIO'] != "") ? $ded_data['ORIG_PRIO'] : max($orig_prio_arr) + 10;

echo '<tr>
        <td class="'.$cls.'">
            <button class="btn btn-primary btn-sm btn-dedication-table_source_'.$table_id.'" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <ul class="dropdown-menu">
                <li>
                    <button type="button" class="dropdown-item text-secondary btn-sm dt-control" '.$has_hw_set.'>
                        <i class="fa-solid fa-microchip"></i> HW Set
                    </button>
                </li>
            </ul>
        </td>
        <td class="'.$cls.'">'.$ded_data['ENGR_TESTER'].'</td>
        <td class="'.$cls.'">'.$ded_data['ENGR_HANDLER'].'</td>
        <td class="'.$cls.'">'.$ded_data['TESTER'].'</td>
        <td class="'.$cls.'">'.$ded_data['HANDLER'].'</td>
        <td class="'.$cls.'">'.round($ded_data['TEST_TIME'], 2).'</td>
        <td class="'.$cls.'">'.$ded_data['UTPI'].'</td>
        <td class="'.$cls.'">'.round($ded_data['INDEX_TIME'], 2).'</td>
        <td class="'.$cls.'">'.number_format((float)$ded_data['OEE'], 2, '.', '').'</td>
        <td class="'.$cls.'">'.round($ded_data['QC_FACTOR'], 2).'</td>
        <td class="'.$cls.'">'.round($ded_data['SPRINT_UPH'], 2).'</td>
        <td class="'.$cls.'">'.round($ded_data['UPH'], 2).'</td>
        <td class="'.$cls.'">
            <input part-flag-data="'.$part_flag.'" class="form-check-input unplannable-flag" atom-group="'.$ded_data['TESTER'].'|'.$ded_data['HANDLER'].'" 
            type="checkbox" value=\''.json_encode($ded_data).'\' flag-type="" '.$unplannable_check.'>
        </td>
        <td class="'.$cls.' '.$hide.'">'.$ded_data['HASH'].'</td>
        <td class="'.$cls.' '.$hide.'">'.$hardware_set.'</td>
        <td class="'.$cls.' '.$hide.'">'.$part_id.'</td>
        <td class="'.$cls.' '.$hide.'">table_primary_'.$table_id.'</td>
        <td class="'.$cls.' '.$hide.'">table_source_'.$table_id.'</td>
        <td class="'.$cls.' '.$hide.'">'.$ded_data['PRIO_CD'].'</td>
        <td class="'.$cls.' '.$hide.'">'.$ded_data['HW_SET_ID'].'</td>
        <td class="'.$cls.' '.$hide.'">'.$ded_data['ID'].'</td>
        <td class="'.$cls.' '.$hide.'">IS_PRIMARY</td>
        <td class="'.$cls.' '.$hide.'">'.$ded_data['HW_SET_ID'].'</td>
        <td class="'.$cls.'"></td>
        <td class="'.$cls.' '.$hide.'">'.$ded_data['RES_SET_ID'].'</td>
        <td class="'.$cls.' '.$hide.'">'.$ded_data['ATOM_MASTER_ID'].'</td>
        <td class="'.$cls.' '.$hide.'">'.$part_flag.'</td>
        <td class="'.$cls.' '.$hide.'">DEDICATION</td>
        <td class="'.$cls.' '.$hide.'">'.$ded_data['DED_ID'].'</td>
        <td class="'.$cls.' '.$hide.'">'.$step_temp_arr[$step][0].'</td>
        <td class="'.$cls.' '.$hide.'">'.$new_orig_prio.'</td>
        <td class="'.$cls.' '.$hide.'">NOT_INSTANCE</td>
        <td class="'.$cls.' '.$hide.'">NOT_INSTANCE</td>
        <td class="'.$cls.' '.$hide.'">NO_RES_AREA</td>
    </tr>';

?>