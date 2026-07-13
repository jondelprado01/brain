<div class="offcanvas offcanvas-end" tabindex="-1" id="filterOffCanvasType1" aria-labelledby="filterOffCanvasType1Label">
    <div class="offcanvas-header">
        <h5 class="offcanvas-title" id="filterOffCanvasType1Label">Filters</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body pt-0">

        <div class="mb-3">
            <span>Active Filters:</span><br>
            <?php
                unset($_GET['tab']);
                $active_filters = $_GET;
                if (count($_GET) > 0) {
                    foreach ($_GET as $key => $value) {
                        echo '<span class="badge text-bg-secondary">'.$key.'</span> ';
                    }
                }
            ?>
        </div>

        <hr>

        <div class="mb-3">
            <label class="mb-2" for="">Created By:</label><br>
            <input type="radio" class="btn-check hwo-checks-type1" name="options-type1" input-name="CREATED_BY_MY" id="option-my-type1" value="MY_RECORDS" autocomplete="off" checked>
            <label class="btn btn-outline-success btn-sm" for="option-my-type1">My Records</label>

            <input type="radio" class="btn-check hwo-checks-type1" name="options-type1" input-name="CREATED_BY_OTHERS" id="option-others-type1" value="OTHERS" autocomplete="off">
            <label class="btn btn-outline-warning btn-sm" for="option-others-type1">Others</label>

            <input type="radio" class="btn-check hwo-checks-type1" name="options-type1" input-name="CREATED_BY_ALL" id="option-all-type1" value="ALL" autocomplete="off">
            <label class="btn btn-outline-info btn-sm" for="option-all-type1">All</label>
        </div>

        <div class="mb-3">
            <label class="mb-2" for="">Effective Start Date Status:</label><br>
            <input type="radio" class="btn-check hwo-checks-type1" name="options-date-type1" input-name="DATE_STATUS_VALID" id="option-valid-dates-type1" value="VALID_<?php echo (int)str_replace("_W", "", $weeks[0]);?>" autocomplete="off">
            <label class="btn btn-outline-success btn-sm" for="option-valid-dates-type1">Valid Dates</label>

            <input type="radio" class="btn-check hwo-checks-type1" name="options-date-type1" input-name="DATE_STATUS_PAST" id="option-past-dates-type1" value="PAST_<?php echo (int)str_replace("_W", "", $weeks[0]);?>" autocomplete="off">
            <label class="btn btn-outline-warning btn-sm" for="option-past-dates-type1">Past Dates</label>

            <input type="radio" class="btn-check hwo-checks-type1" name="options-date-type1" input-name="DATE_STATUS_ALL" id="option-all-dates-type1" value="ALL" autocomplete="off">
            <label class="btn btn-outline-info btn-sm" for="option-all-dates-type1">All</label>
        </div>

        <div class="mb-3">
            <select class="hwo-inputs-type1 select2-type1 form-control" input-name="MFG_PART_NUM" id="mfg-partnum-type1" multiple="multiple" name="mfg-partnum[]" data-placeholder="MFG_PART_NUM"></select>
        </div>

        <div class="mb-3">
            <select class="hwo-inputs-type1 select2-type1 form-control" input-name="GENPOOL_HW" id="genpool-hw-type1" multiple="multiple" name="genpool-hw[]" data-placeholder="GENPOOL_HW"></select>
        </div>

        <div class="mb-3">
            <select class="hwo-inputs-type1 select2-type1 form-control" input-name="HW_NAME" id="hw-name-type1" multiple="multiple" name="hw-name[]" data-placeholder="HW_NAME"></select>
        </div>

        <div class="mb-3">
            <div class="input-group">
                <div class="form-floating">
                    <input type="text" class="hwo-inputs-type1 form-control eff-date" input-name="EFF_START_FROM" id="eff-start-from-type1">
                    <label class="fw-lighter" for="eff-start-from">EFF_START - FROM</label>
                </div>

                <div class="form-floating">
                    <input type="text" class="hwo-inputs-type1 form-control" input-name="EFF_START_TO" id="eff-start-to-type1" disabled>
                    <label class="fw-lighter" for="eff-start-to">EFF_START - TO</label>
                </div>
            </div>
        </div>

        <div class="mb-3">
            <div class="input-group">
                <div class="form-floating">
                    <input type="text" class="hwo-inputs-type1 form-control eff-date" input-name="EFF_END_FROM" id="eff-end-from-type1">
                    <label class="fw-lighter" for="eff-end-from">EFF_END - FROM</label>
                </div>

                <div class="form-floating">
                    <input type="text" class="hwo-inputs-type1 form-control" input-name="EFF_END_TO" id="eff-end-to-type1" disabled>
                    <label class="fw-lighter" for="eff-end-to">EFF_END - TO</label>
                </div>
            </div>
        </div>

        <div class="mb-3">
            <div class="input-group">
                <div class="form-floating">
                    <input type="number" class="hwo-inputs-type1 form-control input-jda-feed" input-name="JDA_FEED_MIN" id="jda-feed-min" min="0" placeholder="">
                    <label class="fw-lighter" for="jda-feed-min">JDA_FEED - MIN</label>
                </div>

                <div class="form-floating">
                    <input type="number" class="hwo-inputs-type1 form-control input-jda-feed" input-name="JDA_FEED_MAX" id="jda-feed-max" min="0" placeholder="">
                    <label class="fw-lighter" for="jda-feed-max">JDA_FEED - MAX</label>
                </div>
            </div>
        </div>

        <div class="mb-3">
            <select class="hwo-inputs-type1 select2-type1 form-control" id="mapping-type-type1" input-name="MAPPING_TYPE" multiple="multiple" name="mapping-type[]" data-placeholder="MAPPING_TYPE">
                <option value=""></option>
                <option value="DEDICATION">DEDICATION</option>
                <option value="DUMMY">DUMMY</option>
            </select>
        </div>

        <hr>

        <div class="d-flex justify-content-between">
            <a href="#" class="text-danger btn-remove-type1">Remove Filters <i style="font-size: 13px!important;" class="fa-solid fa-x"></i></a>
            <div class="d-flex gap-2">
                <button type="button" class="btn btn-secondary btn-sm btn-clear-type1">Clear <i class="fa-solid fa-eraser"></i></button>
                <button type="button" class="btn btn-primary btn-sm btn-set-type1">Apply <i class="fa-solid fa-filter"></i></button>
            </div>
        </div>

    </div>
</div>