<div class="modal fade zoom" id="oeeModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="oeeModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl" style="min-width:90%;">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="oeeModalLabel">Modify OEE</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body pt-2 pb-4 pr-2 pl-2">

                <div class="row">

                    <div class="col-lg-12 d-flex justify-content-between mb-2">
                        <button type="button" class="btn btn-success btn-save-oee">
                            Save <i class="fa-regular fa-floppy-disk"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary btn-reset me-md-2" type="button">
                            Reset All <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                    
                    <div class="col-lg-3">
                        <div class="card border-success mb-4">
                            <div class="card-header border-success text-center">
                                Common
                            </div>

                            <div class="card-body common-list">
                                <span class="common-empty">&nbsp;</span>
                            </div>

                        </div>
                    </div>

                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-header text-center">
                                OEE Combination
                            </div>
                            <div class="card-body">
                                <table style="width:100%!important" class="table table-sm table-hover table-main table-oee">
                                    <thead>
                                        <tr>
                                            <?php
                                                $columns = ['PART_NUM', 'SITE', 'RES_AREA', 'TESTER', 'HANDLER', 'TEMP'];

                                                foreach ($columns as $key => $column) {
                                                ?>
                                                    <th>
                                                        <div class="dropdown">
                                                            <span class="dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                <?php echo $column; ?>
                                                            </span>

                                                            <ul class="dropdown-menu">
                                                                <li><a class="dropdown-item text-success" data-type="item-<?php echo strtolower($column); ?>" href="#" data-text="common" data-index="<?php echo $key?>">Common</a></li>
                                                                <li><a class="dropdown-item text-danger" data-type="item-<?php echo strtolower($column); ?>" href="#" data-text="ignore" data-index="<?php echo $key?>">Ignore</a></li>
                                                            </ul>
                                                        </div>
                                                    </th>
                                                <?php
                                                }
                                            ?>
                                            <th>OEE</th>
                                            <th>PLAN?</th>
                                        </tr>
                                    </thead>
                                    <tbody style="font-size: .81em!important;" class="table-group-divider"></tbody>
                                </table>
                                <?php
                                    $existing_main =    [];
                                    $default_data =     [];
                                    $partnum =          [];
                                    $site =             [];
                                    $res_area =         [];
                                    $tester =           [];
                                    $handler =          [];
                                    $temp =             [];
                                    
                                    if (!empty($oee_override_data)) {
                                        foreach ($oee_override_data as $key => $override) {
                                            if ($override[2] == 'main') {
                                                $existing_main = unserialize($override[3]);
                                            }
                                        }
                                    }

                                    foreach ($part_data as $pdata) {
                                        array_push($default_data, [
                                            $pdata['PART'], 
                                            $pdata['SITE'], 
                                            $pdata['TEST_TYPE'], 
                                            $pdata['ATOM_TESTER'], 
                                            $pdata['ATOM_HANDLER'], 
                                            $pdata['TEMP_CLASS'], 
                                            $pdata['OEE'], 
                                            'Y'
                                        ]);
                                        (!in_array($pdata['PART'], $partnum)) ? array_push($partnum, $pdata['PART']) : '';
                                        (!in_array($pdata['SITE'], $site)) ? array_push($site, $pdata['SITE']) : '';
                                        (!in_array($pdata['TEST_TYPE'], $res_area)) ? array_push($res_area, $pdata['TEST_TYPE']) : '';
                                        (!in_array($pdata['ATOM_TESTER'], $tester)) ? array_push($tester, $pdata['ATOM_TESTER']) : '';
                                        (!in_array($pdata['ATOM_HANDLER'], $handler)) ? array_push($handler, $pdata['ATOM_HANDLER']) : '';
                                        (!in_array($pdata['TEMP_CLASS'], $temp)) ? array_push($temp, $pdata['TEMP_CLASS']) : '';
                                    }
                                ?>
                                <input type="hidden" id="existing-data" value='<?php echo json_encode($oee_override_data, true) ?>'>
                                <input type="hidden" id="existing-main" value='<?php echo json_encode($existing_main, true) ?>'>
                                <input type="hidden" id="default-data"  value='<?php echo json_encode($default_data, true) ?>'>
                                <input type="hidden" id="no-partnum"    value='<?php echo json_encode($partnum, true) ?>'  column-name="PART_NUM">
                                <input type="hidden" id="no-site"       value='<?php echo json_encode($site, true) ?>'     column-name="SITE">
                                <input type="hidden" id="no-res"        value='<?php echo json_encode($res_area, true) ?>' column-name="RES_AREA">
                                <input type="hidden" id="no-tester"     value='<?php echo json_encode($tester, true) ?>'   column-name="TESTER">
                                <input type="hidden" id="no-handler"    value='<?php echo json_encode($handler, true) ?>'  column-name="HANDLER">
                                <input type="hidden" id="no-temp"       value='<?php echo json_encode($temp, true) ?>'     column-name="TEMP">
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-3">
                        <div class="card border-danger">
                            <div class="card-header border-danger text-center">
                                Ignore
                            </div>
                            <div class="card-body ignore-list">
                                <span class="ignore-empty">&nbsp;</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    </div>
</div>