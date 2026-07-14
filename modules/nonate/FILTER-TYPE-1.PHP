<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/select2-bootstrap-5-theme@1.3.0/dist/select2-bootstrap-5-theme.min.css" />
<div style="--bs-offcanvas-width: 520px;" class="offcanvas offcanvas-end" tabindex="-1" id="filterOffCanvasNonateType1" aria-labelledby="filterOffCanvasNonateType1Label">
    <div class="offcanvas-header">
        <h5 class="offcanvas-title" id="filterOffCanvasNonateType1Label">Filters</h5>
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
            <input type="radio" class="btn-check hwo-checks-nonate-type1" name="options-nonate-type1" input-name="CREATED_BY_MY" id="option-my-nonate-type1" value="MY_RECORDS" autocomplete="off" checked>
            <label class="btn btn-outline-success btn-sm" for="option-my-nonate-type1">My Records</label>

            <input type="radio" class="btn-check hwo-checks-nonate-type1" name="options-nonate-type1" input-name="CREATED_BY_OTHERS" id="option-others-nonate-type1" value="OTHERS" autocomplete="off">
            <label class="btn btn-outline-warning btn-sm" for="option-others-nonate-type1">Others</label>

            <input type="radio" class="btn-check hwo-checks-nonate-type1" name="options-nonate-type1" input-name="CREATED_BY_ALL" id="option-all-nonate-type1" value="ALL" autocomplete="off">
            <label class="btn btn-outline-info btn-sm" for="option-all-nonate-type1">All</label>
        </div>

        <div class="mb-3">
            <select class="hwo-inputs-nonate-type1 select2-nonate-type1 form-control" input-name="MFG_PART_NUM" id="mfg-partnum-nonate-type1" multiple="multiple" name="mfg-partnum[]" data-placeholder="MFG_PART_NUM"></select>
        </div>

        <div class="mb-3">
            <select class="hwo-inputs-nonate-type1 select2-nonate-type1 form-control" input-name="BOARD" id="board-name-nonate-type1" multiple="multiple" name="board-name[]" data-placeholder="BOARD"></select>
        </div>

        <div class="mb-3">
            <div class="input-group">
                <div class="form-floating">
                    <input type="number" class="hwo-inputs-nonate-type1 form-control input-bi-hours" input-name="BI_HOURS_MIN" id="bi-hours-min" min="0" placeholder="">
                    <label class="fw-lighter" for="bi-hours-min">BI_HOURS - MIN</label>
                </div>

                <div class="form-floating">
                    <input type="number" class="hwo-inputs-nonate-type1 form-control input-bi-hours" input-name="BI_HOURS_MAX" id="bi-hours-max" min="0" placeholder="">
                    <label class="fw-lighter" for="bi-hours-max">BI_HOURS - MAX</label>
                </div>
            </div>
        </div>

        <div class="mb-3">
            <div class="input-group">
                <div class="form-floating">
                    <input type="number" class="hwo-inputs-nonate-type1 form-control input-load-unload" input-name="LOAD_UNLOAD_MIN" id="load-unload-min" min="0" placeholder="">
                    <label class="fw-lighter" for="load-unload-min">LOAD_UNLOAD_HOURS - MIN</label>
                </div>

                <div class="form-floating">
                    <input type="number" class="hwo-inputs-nonate-type1 form-control input-load-unload" input-name="LOAD_UNLOAD_MAX" id="load-unload-max" min="0" placeholder="">
                    <label class="fw-lighter" for="load-unload-max">LOAD_UNLOAD_HOURS - MAX</label>
                </div>
            </div>
        </div>

        <div class="mb-3">
            <div class="input-group">
                <div class="form-floating">
                    <input type="number" class="hwo-inputs-nonate-type1 form-control input-total-bi" input-name="TOTAL_BI_MIN" id="total-bi-min" min="0" placeholder="">
                    <label class="fw-lighter" for="total-bi-min">TOTAL_BI_HOURS - MIN</label>
                </div>

                <div class="form-floating">
                    <input type="number" class="hwo-inputs-nonate-type1 form-control input-total-bi" input-name="TOTAL_BI_MAX" id="total-bi-max" min="0" placeholder="">
                    <label class="fw-lighter" for="total-bi-max">TOTAL_BI_HOURS - MAX</label>
                </div>
            </div>
        </div>

        <div class="mb-3">
            <select class="hwo-inputs-nonate-type1 select2-nonate-type1 form-control" id="hw-type-nonate-type1" input-name="HW_TYPE" multiple="multiple" name="hw-type[]" data-placeholder="HW_TYPE">
                <option value=""></option>
                <option value="BURNIN_BOARD">BURNIN_BOARD</option>
            </select>
        </div>

        <hr>

        <div class="d-flex justify-content-between">
            <a href="#" class="btn-remove-nonate-type1">Reset to Default <i style="font-size: 13px!important;" class="fa-solid fa-arrow-rotate-left"></i></a>
            <div class="d-flex gap-2">
                <button type="button" class="btn btn-secondary btn-sm btn-clear-nonate-type1">Clear <i class="fa-solid fa-eraser"></i></button>
                <button type="button" class="btn btn-primary btn-sm btn-set-nonate-type1">Apply <i class="fa-solid fa-filter"></i></button>
            </div>
        </div>

    </div>
</div>