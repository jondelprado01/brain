<div class="col-lg-4">
    <div class="d-flex justify-content-between">

        <div class="form-floating mb-3">
            <input type="hidden" id="hwo-type2-current-val">
            <input type="text" id="hwo-type2-hw-name" class="form-control hwo-type2-fields"  placeholder="" disabled>
            <label style="font-size: 12px;" for="">HW_NAME</label>
        </div>

        <div class="form-floating mb-3">
            <input type="text" id="hwo-type2-hw-type" class="form-control hwo-type2-fields"  placeholder="" disabled>
            <label style="font-size: 12px;" for="">HW_TYPE</label>
        </div>
    </div>

    <div class="d-flex justify-content-between">

        <div class="form-floating mb-3">
            <input type="text" id="hwo-type2-site-num" class="form-control hwo-type2-fields"  placeholder="" disabled>
            <label style="font-size: 12px;" for="">SITE_NUM</label>
        </div>

        <div class="form-floating mb-3">
            <input type="text" id="hwo-type2-res-area" class="form-control hwo-type2-fields"  placeholder="" disabled>
            <label style="font-size: 12px;" for="">RES_AREA</label>
        </div>
    </div>

    <div class="form-floating mb-3">
        <select name="" class="form-control hwo-type2-week-field hwo-type2-fields" id="hwo-type2-eff-start" required></select>
        <label for=""><i class="fa-regular fa-asterisk"></i> EFF_START</label>
    </div>

    <div class="form-floating mb-3">
        <select name="" class="form-control hwo-type2-week-field hwo-type2-fields" id="hwo-type2-eff-end"></select>
        <label for="">EFF_END</label>
    </div>

    <div class="input-group mb-3">
        <div class="form-floating">
            <input type="text" class="form-control hwo-type2-fields" id="hwo-type2-override-cap" placeholder="" required>
            <label for=""><i class="fa-regular fa-asterisk"></i> OVERRIDE_CAP</label>
        </div>
        <span class="input-group-text"><small>HMS Plannable Count: <span id="hwo-type2-hms-count" class="fw-bold">0</span></small></span>
    </div>

    <div class="d-flex justify-content-end">
        <button type="button" class="btn btn-outline-secondary btn-sm hwo-type2-add">Add <i class="fa-solid fa-arrow-right-from-bracket"></i></button>
    </div>
</div>

<div class="col-lg-8">
    <div style="min-height: 330px; max-height: 330px; overflow-y: auto;" id="ht-card-container"></div>
</div>