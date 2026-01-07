<div class="col-lg-12">
    <?php
    echo "<pre>", var_dump($multi_partnum), "</pre>";
        foreach ($route as $rt) {
            $route_group = [];
            $step_group = [];

            foreach ($part_data as $data) {
                if ($data['RTE_ID'] == $rt) {
                    array_push($route_group, $data);
                    array_push($step_group, $data['STEP']);
                }
            }
            ?>
                <div style="margin-left:25px!important;" class="alert alert-info pt-1 pb-1 mb-2" role="alert">
                    <b><?php echo $rt?> / <?php echo $part_data[0]['SITE']?> / Y</b>
                </div>
            <?php

            $clean_step = array_values(array_unique($step_group));
            foreach ($clean_step as $key => $clean) {
            ?>
                <div style="margin-left:50px!important;" class="card mb-2">
                    <div style="background-color: #cff4fc;" class="card-header pt-2 pb-2"><strong><?php echo $clean?> - <?php echo $part_data[$key]['TEMP_CLASS'] ?></strong></div>
                    <div class="card-body p-0">
                        <div class="table-responsive">

                            <table id="table_primary_<?php echo $clean."_".$part_data[$key]['HASH']?>" class="table table_primary" part-data="<?php echo $part_data[$key]['PART']?>">
                                <thead>
                                    <tr>
                                        <th>&nbsp;</th>
                                    <?php
                                        $parent_table_primary = "table_primary_".$clean."_".$part_data[$key]['HASH'];
                                        $parent_table_source = "table_source_".$clean."_".$part_data[$key]['HASH'];
                                        foreach ($thead as $th) {
                                            echo "<th>".$th."</th>";
                                        }
                                    ?>
                                        <th style="display: none!important;">&nbsp;</th>
                                        <th style="display: none!important;">&nbsp;</th>
                                        <th style="display: none!important;">&nbsp;</th>
                                        <th style="display: none!important;">&nbsp;</th>
                                        <th style="display: none!important;">&nbsp;</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php
                                        $filter_data = array_filter($part_data, function($pd) use($clean, $primary_data, $hardware_data, $parent_table_primary, $parent_table_source) {

                                            $hardware_set = "";

                                            foreach ($hardware_data as $key => $hardware) {
                                                $hardware_count = 1;
                                                if ($pd['HW_SET_ID'] == $hardware['HW_SET_ID']) {
                                                    $cntr = ($hardware['CNTCR'] != null) ? $hardware['CNTCR'] : "N/A";
                                                    $fplate = ($hardware['FPLATE'] != null) ? $hardware['FPLATE'] : "N/A";
                                                    $testcard = ($hardware['TESTCARD'] != null) ? $hardware['TESTCARD'] : "N/A";
                                                    $hardware_set = $hardware_count."|".$cntr."|".$fplate."|".$testcard;
                                                    $hardware_count++;
                                                }
                                            }

                                            if ($pd['STEP'] == $clean) {
                                                $part_data = $pd['PART'].'|'.$pd['SITE'].'|'.$clean.'|'.$pd['HASH'];
                                                if (isset($primary_data) && in_array($part_data, $primary_data)) {
                                                    echo '<tr>
                                                            <td class="dt-control"></td>
                                                            <td>'.$pd['ENGR_TESTER'].'</td>
                                                            <td>'.$pd['ENGR_HANDLER'].'</td>
                                                            <td>'.$pd['ATOM_TESTER'].'</td>
                                                            <td>'.$pd['ATOM_HANDLER'].'</td>
                                                            <td>'.round($pd['TEST_TIME'], 2).'</td>
                                                            <td>'.$pd['UTPI'].'</td>
                                                            <td>'.round($pd['INDEX_TIME'], 1).'</td>
                                                            <td>'.round($pd['OEE'], 2).'</td>
                                                            <td>'.round($pd['QC_FACTOR'], 2).'</td>
                                                            <td>'.round($pd['SPRINT_UPH'], 1).'</td>
                                                            <td>'.round($pd['UPH'], 1).'</td>
                                                            <td><div class="select"><select class="form-control input-plannable"><option value="Y">Y</option><option value="N">N</option></select></div></td>
                                                            <td style="display: none!important;">'.$pd['HASH'].'</td>
                                                            <td style="display: none!important;">'.$hardware_set.'</td>
                                                            <td style="display: none!important;">'.$part_data.'</td>
                                                            <td style="display: none!important;">'.$parent_table_primary.'</td>
                                                            <td style="display: none!important;">'.$parent_table_source.'</td>
                                                        </tr>';
                                                }
                                            }
                                        });
                                    ?>
                                </tbody>
                            </table>

                            <table id="table_source_<?php echo $clean."_".$part_data[$key]['HASH']?>" class="table table-hover table_source" part-data="<?php echo $part_data[$key]['PART']?>">
                                <thead>
                                    <tr>
                                        <th>&nbsp;</th>
                                    <?php
                                        $parent_table_primary = "table_primary_".$clean."_".$part_data[$key]['HASH'];
                                        $parent_table_source = "table_source_".$clean."_".$part_data[$key]['HASH'];
                                        foreach ($thead as $th) {
                                            echo "<th>".$th."</th>";
                                        }
                                    ?>
                                        <th style="display: none!important;">&nbsp;</th>
                                        <th style="display: none!important;">&nbsp;</th>
                                        <th style="display: none!important;">&nbsp;</th>
                                        <th style="display: none!important;">&nbsp;</th>
                                        <th style="display: none!important;">&nbsp;</th>
                                    </tr>
                                </thead>
                                <tbody>
                                <?php
                                    $filter_data = array_filter($part_data, function($pd) use($clean, $primary_data, $hardware_data, $parent_table_primary, $parent_table_source) {

                                        $hardware_set = "";
                                        
                                        $hardware_count = 1;
                                        foreach ($hardware_data as $key => $hardware) {
                                            if ($pd['HW_SET_ID'] == $hardware['HW_SET_ID']) {
                                                $cntr = ($hardware['CNTCR'] != null) ? $hardware['CNTCR'] : "N/A";
                                                $fplate = ($hardware['FPLATE'] != null) ? $hardware['FPLATE'] : "N/A";
                                                $testcard = ($hardware['TESTCARD'] != null) ? $hardware['TESTCARD'] : "N/A";
                                                $hardware_set = $hardware_count."|".$cntr."|".$fplate."|".$testcard;
                                                $hardware_count++;
                                            }
                                        }
                                        
                                        if ($pd['STEP'] == $clean) {
                                            $part_data = $pd['PART'].'|'.$pd['SITE'].'|'.$clean.'|'.$pd['HASH'];
                                            if (isset($primary_data) && !in_array($part_data, $primary_data)) {
                                                echo '<tr>
                                                        <td class="dt-down-arrow"></td>
                                                        <td>'.$pd['ENGR_TESTER'].'</td>
                                                        <td>'.$pd['ENGR_HANDLER'].'</td>
                                                        <td>'.$pd['ATOM_TESTER'].'</td>
                                                        <td>'.$pd['ATOM_HANDLER'].'</td>
                                                        <td>'.round($pd['TEST_TIME'], 2).'</td>
                                                        <td>'.$pd['UTPI'].'</td>
                                                        <td>'.round($pd['INDEX_TIME'], 1).'</td>
                                                        <td>'.round($pd['OEE'], 2).'</td>
                                                        <td>'.round($pd['QC_FACTOR'], 2).'</td>
                                                        <td>'.round($pd['SPRINT_UPH'], 1).'</td>
                                                        <td>'.round($pd['UPH'], 1).'</td>
                                                        <td><select class="form-control input-plannable"><option value="Y">Y</option><option value="N">N</option></select></td>
                                                        <td style="display: none!important;">'.$pd['HASH'].'</td>
                                                        <td style="display: none!important;">'.$hardware_set.'</td>
                                                        <td style="display: none!important;">'.$part_data.'</td>
                                                        <td style="display: none!important;">'.$parent_table_primary.'</td>
                                                        <td style="display: none!important;">'.$parent_table_source.'</td>
                                                    </tr>';
                                            }
                                        }
                                    });
                                ?>
                                </tbody>
                            </table>

                        </div>
                    </div>
                </div>
            <?php
            }
        }


        // date_default_timezone_set('Asia/Manila');
    // $curr_date = date('Y-m-d H:i:s');
    // $curr_day = date('l', strtotime($curr_date));
    // $exec_date = '';

    // if ($curr_day == 'Thursday' || $curr_day == 'Friday') {
    //     $get_curr_thurs = date('Y-m-d', strtotime('thursday this week'));
    //     $get_next_tues = date('Y-m-d', strtotime('next tuesday'));

    //     $deadline = strtotime(date(''.$get_curr_thurs.' 23:59:00'));
    //     $totime = strtotime($curr_date);

    //     if ($deadline > $totime) {
    //         $exec_date = date('Y-m-d H:i:s', strtotime('+24 hours', strtotime($curr_date)));
    //     }
    //     else{
    //         $curr_time = date('H:i:s', strtotime($curr_date));
    //         $exec_date = date('Y-m-d '.$curr_time.'', strtotime($get_next_tues));
    //     }
    // }
    // else{
    //     $exec_date = date('Y-m-d H:i:s', strtotime('+24 hours', strtotime($curr_date)));
    // }

    // echo $exec_date;
    ?>
</div>
