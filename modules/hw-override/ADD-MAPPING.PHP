<div class="col-lg-4">
    <div class="form-floating mb-3">
        <input type="hidden" id="hwo-type1-current-val">
        <input type="hidden" id="hwo-type1-mfg-partnum">
        <input type="hidden" id="hwo-type1-genpool">
        <input type="hidden" id="hwo-type1-gpcap">
        <input type="hidden" id="hwo-type1-hw-type">
        <input type="hidden" id="hwo-type1-mapping-type">
        <input type="text" id="hwo-type1-partnum-container" class="form-control"  placeholder="" disabled>
        <label style="font-size: 12px;" for="">MFG_PART_NUM / GENPOOL HW / HW_TYPE</label>
    </div>

    <div class="form-floating mb-3">
        <select name="" class="form-control" id="hwo-type1-site-num" disabled required>
            <option value="">--</option>
            <option value="ADGT">ADGT</option>
            <option value="ADPI">ADPI</option>
        </select>
        <label for=""><i class="fa-regular fa-asterisk"></i> SITE_NUM</label>
    </div>

    <div class="form-floating mb-3">
        <input type="text" class="form-control" id="hwo-type1-hw-name" placeholder="" required>
        <label for=""><i class="fa-regular fa-asterisk"></i> HW_NAME</label>
    </div>

    <div class="form-floating mb-3">
        <select name="" class="form-control hwo-type1-week-field" id="hwo-type1-eff-start" required></select>
        <label for=""><i class="fa-regular fa-asterisk"></i> EFF_START</label>
    </div>

    <div class="form-floating mb-3">
        <select name="" class="form-control hwo-type1-week-field" id="hwo-type1-eff-end"></select>
        <label for="">EFF_END</label>
    </div>

    <div class="input-group mb-3">
        <div class="form-floating">
            <input type="text" class="form-control" id="hwo-type1-jda-feed" placeholder="" required>
            <label for=""><i class="fa-regular fa-asterisk"></i> JDA_FEED</label>
        </div>
        <span class="input-group-text"><small>HMS Plannable Count: <span id="hwo-type1-hms-count" class="fw-bold">0</span></small></span>
    </div>

    <div class="d-flex justify-content-end">
        <button type="button" class="btn btn-outline-secondary btn-sm hwo-type1-add">Add <i class="fa-solid fa-arrow-right-from-bracket"></i></button>
    </div>
</div>

<div class="col-lg-8">
    <div style="min-height: 400px; max-height: 400px; overflow-y: auto;" id="gp-card-container"></div>
    <hr>
    <div class="mt-4 bottom-0 end-0 d-flex justify-content-end gap-2">
        <span class="badge text-bg-info">Min = Safest remaining Count</span>
        <span class="badge text-bg-danger">Max = Highest available Count</span>
    </div>
</div>