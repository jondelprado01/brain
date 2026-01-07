<div class="modal fade zoom" id="dedicationsModal" data-bs-backdrop="static" data-bs-keyboard="false" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl" style="min-width:70%;">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="oeeModalLabel">Dedications</h1>
                <button type="button" class="btn-close btn-close-dedication" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body pt-2 pb-4 pr-2 pl-2">
                <div class="row">
                    <div class="col-lg-12">
                        <div class="accordion mb-3" id="accordionPanelsStayOpenExample">
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                <button class="accordion-button fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseOne">
                                    Selected Setup
                                </button>
                                </h2>
                                <div id="panelsStayOpen-collapseOne" class="accordion-collapse collapse show">
                                    <div class="accordion-body">
                                        <div class="row">
                                            <div class="col-lg-4">
                                                <div class="list-group">
                                                    <div style="font-size: 15px;" class="list-group-item list-group-item-action" aria-current="true">
                                                        <div class="d-flex w-100 justify-content-between">
                                                            <small>MFG_PART_NUM</small>
                                                            <strong class="td-partnum"></strong>
                                                        </div>
                                                        <div class="d-flex w-100 justify-content-between">
                                                            <small>SAP_RTE_ID</small>
                                                            <strong class="td-rte"></strong>
                                                        </div>
                                                        <div class="d-flex w-100 justify-content-between">
                                                            <small>SITE_NUM</small>
                                                            <strong class="td-site"></strong>
                                                        </div>
                                                        <div class="d-flex w-100 justify-content-between">
                                                            <small>RES_AREA</small>
                                                            <strong class="td-res"></strong>
                                                        </div>
                                                        <div class="d-flex w-100 justify-content-between">
                                                            <small>STEP_NM</small>
                                                            <strong class="td-step"></strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-lg-4">
                                                <div class="list-group">
                                                    <div style="font-size: 15px;" class="list-group-item list-group-item-action" aria-current="true">
                                                        <div class="d-flex w-100 justify-content-between">
                                                            <small>ENGR_TESTER</small>
                                                            <strong class="td-etester"></strong>
                                                        </div>
                                                        <div class="d-flex w-100 justify-content-between">
                                                            <small>ENGR_HANDLER</small>
                                                            <strong class="td-ehandler"></strong>
                                                        </div>
                                                        <div class="d-flex w-100 justify-content-between">
                                                            <small>ATOM_TESTER</small>
                                                            <strong class="td-atester"></strong>
                                                        </div>
                                                        <div class="d-flex w-100 justify-content-between">
                                                            <small>ATOM_HANDLER</small>
                                                            <strong class="td-ahandler"></strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-lg-4">
                                                <div class="row">
                                                    <div class="col-lg-6">
                                                        <div class="list-group">
                                                            <div style="font-size: 15px;" class="list-group-item list-group-item-action" aria-current="true">
                                                                <div class="d-flex w-100 justify-content-between">
                                                                    <small>TEST_TIME</small>
                                                                    <strong class="td-ttime"></strong>
                                                                </div>
                                                                <div class="d-flex w-100 justify-content-between">
                                                                    <small>UTPI</small>
                                                                    <strong class="td-utpi"></strong>
                                                                </div>
                                                                <div class="d-flex w-100 justify-content-between">
                                                                    <small>INDEX_TIME</small>
                                                                    <strong class="td-itime"></strong>
                                                                </div>
                                                                <div class="d-flex w-100 justify-content-between">
                                                                    <small>OEE</small>
                                                                    <strong class="td-oee"></strong>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-lg-6">
                                                        <div class="list-group">
                                                            <div style="font-size: 15px;" class="list-group-item list-group-item-action" aria-current="true">
                                                                <div class="d-flex w-100 justify-content-between">
                                                                    <small>QC_FACTOR</small>
                                                                    <strong class="td-qc"></strong>
                                                                </div>
                                                                <div class="d-flex w-100 justify-content-between">
                                                                    <small>SPRINT_UPH</small>
                                                                    <strong class="td-suph"></strong>
                                                                </div>
                                                                <div class="d-flex w-100 justify-content-between">
                                                                    <small>UPH</small>
                                                                    <strong class="td-uph"></strong>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                <button class="accordion-button fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseTwo">
                                    Existing Dedications
                                </button>
                                </h2>
                                <div id="panelsStayOpen-collapseTwo" class="accordion-collapse collapse show">
                                    <div class="accordion-body">
                                        <div class="d-flex justify-content-end">
                                            <button type="button" class="btn btn-danger btn-sm btn-remove-all-dedication mb-2">
                                                Remove <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                        <div class="table-responsive">
                                            <table class="table table-bordered table-hover table-striped table-dedication">
                                                <thead>
                                                    <tr>
                                                        <th>SITE_NUM</th>
                                                        <th>SAP_RTE_ID</th>
                                                        <th>STEP_NM</th>
                                                        <th>ENGR_TESTER</th>
                                                        <th>ENGR_HANDLER</th>
                                                        <th>DEDICATED ATOM_TESTER</th>
                                                        <th>DEDICATED ATOM_HANDLER</th>
                                                        <th>EXCLUSIVE</th>
                                                        <th>TYPE</th>
                                                        <th class="fs-6">
                                                            <div class="form-check d-flex justify-content-center">
                                                                <input class="form-check-input dedication-check-all" type="checkbox">
                                                            </div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody style="font-size: 13px!important;"></tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-7">
                        <div class="card mb-3">
                            <div class="card-header">
                                <span class="card-title fw-bold">Selection</span>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-lg-6">
                                        <div class="form-floating mb-2">
                                            <input type="text" class="form-control" id="floating-tester" placeholder="">
                                            <label for="floating-tester">SEARCH ATOM TESTER</label>
                                        </div>
                                        <select class="form-select form-control select2-tester" size="10" name="dedications-tester">

                                        </select>
                                    </div>
                                    <div class="col-lg-6">
                                        <div class="form-floating mb-2">
                                            <input type="text" class="form-control" id="floating-handler" placeholder="">
                                            <label for="floating-handler">SEARCH ATOM HANDLER</label>
                                        </div>
                                        <select class="form-select form-control select2-handler" size="10" name="dedications-handler">
                                            
                                        </select>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div class="col-lg-5">
                        <div class="card mb-3">
                            <input type="hidden" class="selected-setup">
                            <div class="card-header">
                                <span class="card-title fw-bold">Controls</span>
                            </div>
                            <div class="card-body test-div">
                                <div class="row">
                                    <div class="col-lg-6">
                                        <div class="form-check form-switch mb-2">
                                            <label class="form-check-label h6" for="dedication-is-primary">Primary</label>&nbsp;
                                            <input class="form-check-input dedication-is-primary" type="checkbox" value="" id="dedication-is-primary">
                                        </div>
                                    </div>
                                    <div class="col-lg-6">
                                        <div class="form-check form-switch mb-2">
                                            <label class="form-check-label h6" for="dedication-apply-all">Apply to All</label>&nbsp;
                                            <input class="form-check-input dedication-apply-all" type="checkbox" value="" id="dedication-apply-all">
                                        </div>
                                    </div>
                                    <div class="col-lg-6">
                                        <div class="form-check form-switch mb-2">
                                            <label class="form-check-label h6" for="dedication-allow-setups">Allow Other Setups</label>&nbsp;
                                            <input class="form-check-input dedication-allow-setups" type="checkbox" value="" id="dedication-allow-setups">
                                        </div>
                                    </div>
                                </div>
                                <hr>
                                <div style="gap: 20px;" class="d-flex justify-content-center">
                                    <button type="button" class="btn btn-success btn-save-dedication w-50 mb-2">
                                        Save <i class="fa-regular fa-floppy-disk"></i>
                                    </button>
                                    <!-- <button type="button" class="btn btn-danger btn-remove-all-dedication w-50 mb-2">
                                        Remove All <i class="fa-solid fa-trash"></i>
                                    </button> -->
                                </div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-center">
                            <button style="display: none;" class="btn btn-outline-secondary btn-message btn-loader" type="button" disabled>
                                <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                <span role="status">Retrieving data... Please wait.</span>
                            </button>
    
                            <button style="display: none;" class="btn btn-outline-danger btn-message btn-no-result" type="button" disabled>
                                <span role="status">Data not found. Please try again.</span>
                            </button>
                        </div>
                        
                    </div>
                    <!-- <div class="col-lg-12">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">Existing Dedications</span>
                            </div>
                            <div class="card-body">
                                <table class="table table-bordered table-hover table-striped table-dedication">
                                    <thead>
                                        <tr>
                                            <th>SITE_NUM</th>
                                            <th>SAP_RTE_ID</th>
                                            <th>STEP_NM</th>
                                            <th>ENGR_TESTER</th>
                                            <th>ENGR_HANDLER</th>
                                            <th>DEDICATED ATOM_TESTER</th>
                                            <th>DEDICATED ATOM_HANDLER</th>
                                            <th>EXCLUSIVE</th>
                                            <th>ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody style="font-size: 13px!important;"></tbody>
                                </table>
                            </div>
                        </div>
                    </div> -->
                </div>
            </div>
        </div>
    </div>
</div>