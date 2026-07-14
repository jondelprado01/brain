<div style="--bs-offcanvas-width: 520px;" class="offcanvas offcanvas-end" tabindex="-1" id="filterOffCanvasNonateType2" aria-labelledby="filterOffCanvasNonateType2Label">
    <div class="offcanvas-header">
        <h5 class="offcanvas-title" id="filterOffCanvasNonateType2Label">Filters</h5>
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
            <input type="radio" class="btn-check hwo-checks-nonate-type2" name="options-nonate-type2" input-name="CREATED_BY_MY" id="option-my-nonate-type2" value="MY_RECORDS" autocomplete="off" checked>
            <label class="btn btn-outline-success btn-sm" for="option-my-nonate-type2">My Records</label>

            <input type="radio" class="btn-check hwo-checks-nonate-type2" name="options-nonate-type2" input-name="CREATED_BY_OTHERS" id="option-others-nonate-type2" value="OTHERS" autocomplete="off">
            <label class="btn btn-outline-warning btn-sm" for="option-others-nonate-type2">Others</label>

            <input type="radio" class="btn-check hwo-checks-nonate-type2" name="options-nonate-type2" input-name="CREATED_BY_ALL" id="option-all-nonate-type2" value="ALL" autocomplete="off">
            <label class="btn btn-outline-info btn-sm" for="option-all-nonate-type2">All</label>
        </div>

        <div class="mb-3">
            <select class="hwo-inputs-nonate-type2 select2-nonate-type2 form-control" input-name="BOARD" id="board-name-nonate-type2" multiple="multiple" name="board-name[]" data-placeholder="BOARD"></select>
        </div>

        <div class="mb-3">
            <select class="hwo-inputs-nonate-type2 select2-nonate-type2 form-control" id="hw-type-nonate-type2" input-name="HW_TYPE" multiple="multiple" name="hw-type[]" data-placeholder="HW_TYPE">
                <option value=""></option>
                <option value="BURNIN_BOARD">BURNIN_BOARD</option>
            </select>
        </div>

        <div class="mb-3">
            <div class="input-group">
                <div class="form-floating">
                    <input type="number" class="hwo-inputs-nonate-type2 form-control input-socket-efficiency" input-name="SOCKET_EFFICIENCY_MIN" id="socket-efficiency-min" min="0" placeholder="">
                    <label class="fw-lighter" for="socket-efficiency-min">SOCKET_EFFICIENCY - MIN</label>
                </div>

                <div class="form-floating">
                    <input type="number" class="hwo-inputs-nonate-type2 form-control input-socket-efficiency" input-name="SOCKET_EFFICIENCY_MAX" id="socket-efficiency-max" min="0" placeholder="">
                    <label class="fw-lighter" for="socket-efficiency-max">SOCKET_EFFICIENCY - MAX</label>
                </div>
            </div>
        </div>

        <hr>

        <div class="d-flex justify-content-between">
            <a href="#" class="btn-remove-nonate-type2">Reset to Default <i style="font-size: 13px!important;" class="fa-solid fa-arrow-rotate-left"></i></a>
            <div class="d-flex gap-2">
                <button type="button" class="btn btn-secondary btn-sm btn-clear-nonate-type2">Clear <i class="fa-solid fa-eraser"></i></button>
                <button type="button" class="btn btn-primary btn-sm btn-set-nonate-type2">Apply <i class="fa-solid fa-filter"></i></button>
            </div>
        </div>

    </div>
</div>