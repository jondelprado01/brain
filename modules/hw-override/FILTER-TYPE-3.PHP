<div class="offcanvas offcanvas-end" tabindex="-1" id="filterOffCanvasType3" aria-labelledby="filterOffCanvasType3Label">
    <div class="offcanvas-header">
        <h5 class="offcanvas-title" id="filterOffCanvasType3Label">Filters</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body pt-0">

        <div class="mb-3">
            <span>Active Filters:</span><br>
            <?php
                unset($_GET['tab']);
                $active_filters = [];
                if (count($_GET) > 0) {
                    foreach ($_GET as $key => $value) {
                        if ($key != "EMP_NAME") {
                            if ($key == "CREATED_BY" || $key == "DATE_STATUS") {
                                if ($_GET[$key] == "ALL") {
                                    continue;
                                }
                            }
                            array_push($active_filters, $key);
                        }
                        else{
                            if (!isset($_GET['CREATED_BY']) || ($_GET['CREATED_BY'] != "ALL" && $_GET['CREATED_BY'] != "OTHERS")) {
                                array_push($active_filters, "CREATED_BY");
                            }
                        }
                    }
                }
                if (count($active_filters) > 0) {
                    foreach (array_unique($active_filters) as $key => $value) {
                       echo '<span class="badge text-bg-secondary">'.$value.'</span> ';
                    }
                }
            ?>
        </div>

        <hr>

        <div class="mb-3">
            <label class="mb-2" for="">Created By:</label><br>
            <input type="radio" class="btn-check hwo-checks-type3" name="options-type3" input-name="CREATED_BY_MY" id="option-my-type3" value="MY_RECORDS" autocomplete="off" checked>
            <label class="btn btn-outline-success btn-sm" for="option-my-type3">My Records</label>

            <input type="radio" class="btn-check hwo-checks-type3" name="options-type3" input-name="CREATED_BY_OTHERS" id="option-others-type3" value="OTHERS" autocomplete="off">
            <label class="btn btn-outline-warning btn-sm" for="option-others-type3">Others</label>

            <input type="radio" class="btn-check hwo-checks-type3" name="options-type3" input-name="CREATED_BY_ALL" id="option-all-type3" value="ALL" autocomplete="off">
            <label class="btn btn-outline-info btn-sm" for="option-all-type3">All</label>
        </div>

        <div class="mb-3">
            <select class="hwo-inputs-type3 select2-type3 form-control" input-name="SITE_NUM" id="site-num-type3" multiple="multiple" name="site-num[]" data-placeholder="SITE_NUM">
                <?php
                    $site_num_arr = ["ADCV", "ADGT", "ADP2", "ADP3", "ADPI", "ADTH", "GTBURNIN", "PITEST", "SUB-TH1"];
                    foreach ($site_num_arr as $snkey => $sn_val) {
                        echo '<option value="'.$sn_val.'">'.$sn_val.'</option>';
                    }
                ?>
            </select>
        </div>
        <div class="mb-3">
            <select class="hwo-inputs-type3 select2-type3 form-control" input-name="RES_AREA" id="res-area-type3" multiple="multiple" name="res-area[]" data-placeholder="RES_AREA">
                <?php
                    $res_area_arr = ["ATE FT", "ATE WS", "NON-ATE"];
                    foreach ($res_area_arr as $rakey => $ra_val) {
                        echo '<option value="'.$ra_val.'">'.$ra_val.'</option>';
                    }
                ?>
            </select>
            <!-- <label class="form-label fw-lighter">RES_AREA</label> -->
        </div>

        <div class="mb-3">
            <select class="hwo-inputs-type3 select2-type3 form-control" input-name="HW_NAME" id="hw-name-type3" multiple="multiple" name="hw-name[]" data-placeholder="HW_NAME"></select>
        </div>

        <div class="mb-3">
            <div class="input-group">
                <div class="form-floating">
                    <input type="number" class="hwo-inputs-type3 form-control input-hms-count" input-name="HMS_COUNT_MIN" id="hms-count-min" min="0" placeholder="">
                    <label class="fw-lighter" for="hms-count-min">HMS COUNT - MIN</label>
                </div>

                <div class="form-floating">
                    <input type="number" class="hwo-inputs-type3 form-control input-hms-count" input-name="HMS_COUNT_MAX" id="hms-count-max" min="0" placeholder="">
                    <label class="fw-lighter" for="hms-count-max">HMS COUNT - MAX</label>
                </div>
            </div>
        </div>

        <div class="mb-3">
            <select class="hwo-inputs-type3 select2-type3 form-control" input-name="HW_TYPE" id="hw-type-type3" multiple="multiple" name="hw-type[]" data-placeholder="HW_TYPE">
                <?php
                    $hw_type_arr = ["CNTCR", "CONVKIT", "DGHTRBD", "DUTBD", "FMYBD", "FPLATE", "LOADBD", "PERFBD", "PERFBRD", "PGMCARD", "PRBCARD", "TCVOSBD", "TCVSBRD", "TESTCARD"];
                    foreach ($hw_type_arr as $hwtkey => $hwt_val) {
                        echo '<option value="'.$hwt_val.'">'.$hwt_val.'</option>';
                    }
                ?>
            </select>
        </div>

        <hr>

        <div class="d-flex justify-content-between">
            <a href="#" class="btn-remove-type3">Reset to Default <i style="font-size: 13px!important;" class="fa-solid fa-arrow-rotate-left"></i></a>
            <div class="d-flex gap-2">
                <button type="button" class="btn btn-secondary btn-sm btn-clear-type3">Clear <i class="fa-solid fa-eraser"></i></button>
                <button type="button" class="btn btn-primary btn-sm btn-set-type3">Apply <i class="fa-solid fa-filter"></i></button>
            </div>
        </div>
        

    </div>
</div>