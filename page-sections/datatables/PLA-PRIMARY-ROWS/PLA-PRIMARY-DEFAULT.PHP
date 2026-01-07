<?php

$has_ded_status = 'disabled';
$has_hw_set = 'disabled';

if (in_array('SCM Cap Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
    $has_ded_status = '';
}

if (in_array('HW Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
    $has_hw_set = '';
}

echo '<tr>
        <td class="'.$cls.'">
            <button class="btn btn-success btn-sm btn-dedication-table_primary_'.$table_id.'" 
                    type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <ul class="dropdown-menu">
                <li>
                    <button type="button" class="dropdown-item text-secondary btn-sm dedication-config" dedication-type="primary" table-id="table_primary_'.$table_id.'" '.$has_ded_status.'>
                        <i class="fa-solid fa-clone"></i> Dedications
                    </button>
                </li>
                <li>
                    <button type="button" class="dropdown-item text-secondary btn-sm dt-control" '.$has_hw_set.'>
                        <i class="fa-solid fa-microchip"></i> HW Set
                    </button>
                </li>
            </ul>
        </td>
        <td class="'.$cls.'">'.$pd['ENGR_TESTER'].'</td>
        <td class="'.$cls.'">'.$pd['ENGR_HANDLER'].'</td>
        <td class="'.$cls.'">'.$pd['ATOM_TESTER'].'</td>
        <td class="'.$cls.'">'.$pd['ATOM_HANDLER'].'</td>
        <td class="'.$cls.'">'.$rnd_test_time.'</td>
        <td class="'.$cls.'">'.$utpi.'</td>
        <td class="'.$cls.'">'.$rnd_index_time.'</td>
        <td class="'.$cls.'">'.$rnd_oee.'</td>
        <td class="'.$cls.'">'.$rnd_qc_factor.'</td>
        <td class="'.$cls.'">'.$rnd_sprint_uph.'</td>
        <td class="'.$cls.'">'.$rnd_uph.'</td>
        <td class="'.$cls.'">
            <input part-flag-data="'.$part_flag.'" class="form-check-input unplannable-flag" atom-group="'.$pd['ATOM_TESTER'].'|'.$pd['ATOM_HANDLER'].'" 
            type="checkbox" value=\''.json_encode($pd).'\' flag-type="" disabled>
        </td>
        <td class="'.$cls.' '.$hide.'">'.$pd['HASH'].'</td>
        <td class="'.$cls.' '.$hide.'">'.$hardware_set.'</td>
        <td class="'.$cls.' '.$hide.'">'.$part_id.'</td>
        <td class="'.$cls.' '.$hide.'">table_primary_'.$table_id.'</td>
        <td class="'.$cls.' '.$hide.'">table_source_'.$table_id.'</td>
        <td class="'.$cls.' '.$hide.'">'.$pd['PRIO_CD'].'</td>
        <td class="'.$cls.' '.$hide.'">'.$primary_hw.'</td>
        <td class="'.$cls.' '.$hide.'">'.$primary_id.'</td>
        <td class="'.$cls.' '.$hide.'">IS_PRIMARY</td>
        <td class="'.$cls.' '.$hide.'">'.implode(",", $dup_hw_temp_arr[$idtf]).'</td>
        <td class="'.$cls.'"></td>
        <td class="'.$cls.' '.$hide.'">'.$pd['RES_SET_ID'].'</td>
        <td class="'.$cls.' '.$hide.'">'.$pd['ATOM_MASTER_ID'].'</td>
        <td class="'.$cls.' '.$hide.'">'.$part_flag.'</td>
        <td class="'.$cls.' '.$hide.'">DEFAULT</td>
        <td class="'.$cls.' '.$hide.'"></td>
        <td class="'.$cls.' '.$hide.'">'.$step_temp_arr[$step][0].'</td>
        <td class="'.$cls.' '.$hide.'">'.$pd['ORIG_PRIO'].'</td>
        <td class="'.$cls.' '.$hide.'">NOT_INSTANCE</td>
        <td class="'.$cls.' '.$hide.'">NOT_INSTANCE</td>
        <td class="'.$cls.' '.$hide.'">'.$pd['TEST_TYPE'].'</td>
    </tr>';

?>