<?php

$unplannable_check = 'disabled';
$has_ded_status = 'disabled';
$has_hw_set = 'disabled';

if (in_array('SCM Cap Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
    $unplannable_check = '';
    $has_ded_status = '';
}

if (in_array('HW Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
    $has_hw_set = '';
}

$row_disabled_pad = ($pd['ENGR_TESTER'] == null || $pd['ENGR_HANDLER'] == null || $pd['ENGR_TESTER'] == "NONE" || $pd['ENGR_HANDLER'] == "NONE") ? 'style="pointer-events: none!important; opacity: 0.6!important;"' : '';

// 2026-10-08 RM (AI: Claude Code): [AI-generated] Promoted to production -- WS-gated display strings for the two trailing columns TD EFF (2dp) / WFR IDX % (3dp).
// Values render ONLY for RES_AREA (=TEST_TYPE) 'ATE WS'/'ATE PBS' (source BRAIN_ADI_ALLDB_ALL, already in $pd); any other area or null/empty -> blank.
$io_ws_areas  = array('ATE WS', 'ATE PBS');
$io_is_ws     = in_array(strtoupper(trim($pd['TEST_TYPE'])), $io_ws_areas, true);
$td_eff_disp  = ($io_is_ws && isset($pd['TD_EFF'])      && $pd['TD_EFF'] !== null      && $pd['TD_EFF'] !== '')      ? number_format((float)$pd['TD_EFF'], 2)      : '';
$wfr_idx_disp = ($io_is_ws && isset($pd['WFR_IDX_PCT']) && $pd['WFR_IDX_PCT'] !== null && $pd['WFR_IDX_PCT'] !== '') ? number_format((float)$pd['WFR_IDX_PCT'], 3) : '';

echo '<tr '.$row_disabled_pad.'>
        <td>
            <button class="btn btn-outline-warning btn-sm btn-dedication-table_source_'.$table_id.'" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <ul class="dropdown-menu">
                <li>
                    <button type="button" class="dropdown-item text-secondary btn-sm dedication-config" dedication-type="alternate" table-id="table_source_'.$table_id.'" '.$has_ded_status.'>
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
        <td>'.$pd['ENGR_TESTER'].'</td>
        <td>'.$pd['ENGR_HANDLER'].'</td>
        <td>'.$pd['ATOM_TESTER'].'</td>
        <td>'.$pd['ATOM_HANDLER'].'</td>
        <td>'.$rnd_test_time.'</td>
        <td>'.$utpi.'</td>
        <td>'.$rnd_index_time.'</td>
        <td>'.$rnd_oee.'</td>
        <td>'.$rnd_qc_factor.'</td>
        <td>'.$rnd_sprint_uph.'</td>
        <td>'.$rnd_uph.'</td>
        <td>
            <input part-flag-data="'.$part_flag.'" class="form-check-input unplannable-flag" atom-group="'.$pd['ATOM_TESTER'].'|'.$pd['ATOM_HANDLER'].'" 
            type="checkbox" value=\''.json_encode($pd).'\' '.$flag_status.' flag-type="'.$flag_type.'" '.$unplannable_check.'>
        </td>
        <td class="'.$cls.'">'.$pd['HASH'].'</td>
        <td class="'.$cls.'">'.$hardware_set.'</td>
        <td class="'.$cls.'">'.$part_id.'</td>
        <td class="'.$cls.'">table_primary_'.$table_id.'</td>
        <td class="'.$cls.'">table_source_'.$table_id.'</td>
        <td class="'.$cls.'">'.$pd['PRIO_CD'].'</td>
        <td class="'.$cls.'">'.$pd['HW_SET_ID'].'</td>
        <td class="'.$cls.'"></td>
        <td class="'.$cls.'">IS_ALTERNATE</td>
        <td class="'.$cls.'">'.implode(",", $dup_hw_temp_arr[$idtf]).'</td>
        <td class="'.$cls.'">'.strtoupper($flag_type).'</td>
        <td class="'.$cls.'">'.$pd['RES_SET_ID'].'</td>
        <td class="'.$cls.'">'.$pd['ATOM_MASTER_ID'].'</td>
        <td class="'.$cls.'">'.$part_flag.'</td>
        <td class="'.$cls.'">DEFAULT</td>
        <td class="'.$cls.'"></td>
        <td class="'.$cls.'">'.$step_temp_arr[$step][0].'</td>
        <td class="'.$cls.'">'.$pd['ORIG_PRIO'].'</td>
        <td class="'.$cls.'">NOT_INSTANCE</td>
        <td class="'.$cls.'">NOT_INSTANCE</td>
        <td class="'.$cls.'">'.$pd['TEST_TYPE'].'</td>
        <td>'.$td_eff_disp.'</td>
        <td>'.$wfr_idx_disp.'</td>
    </tr>';

?>