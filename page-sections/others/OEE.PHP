<div class="modal fade zoom" id="oeeModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="oeeModalLabel">
    <div class="modal-dialog modal-dialog-centered modal-xl" style="min-width:90%;">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="oeeModalLabel">Modify OEE</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body pt-4 pb-4 pr-2 pl-2">

                <div class="row">
                    <!-- <div class="col-lg-12 d-flex justify-content-between mb-2">
                        <input type="hidden" class="last-common-column">
                        <input type="hidden" class="primary-setups">
                        <button type="button" class="btn btn-success btn-save-oee">
                            Save Override <i class="fa-regular fa-floppy-disk"></i>
                        </button>
                        <button class="btn btn-sm btn-warning btn-reset-oee" type="button">
                            Reset UI <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div> -->
                    
                    <!-- <div class="col-lg-3 col-md-12 col-sm-12">
                        <div class="card border-success mb-4 rounded-0">
                            <div class="card-header text-bg-success text-center rounded-0">COMMON</div>
                            <div style="padding: 1em 1.5em 0;!important;" class="card-body common-list text-center"></div>
                        </div>
                    </div> -->

                    <div class="col-lg-8 col-md-12 col-sm-12 mb-4">
                        <style>
                            input::-webkit-outer-spin-button,
                            input::-webkit-inner-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                            }
                            .oee-checkbox{
                                transform: scale(1.5)!important;
                            }
                        </style>
                        <div class="card rounded-0">
                            <div class="card-header d-flex justify-content-between rounded-0">
                                <span>&nbsp;</span>
                                <span>MAIN</span>
                                <button class="btn btn-info btn-sm btn-apply-oee">
                                    Apply Filters <i class="fa-solid fa-right-to-bracket"></i>
                                </button>
                            </div>
                            <div class="card-body oee-card-body">
                                <table style="width:100%!important;" class="table table-sm table-hover table-main table-oee">
                                    <thead>
                                        <tr class="h6">
                                            <?php
                                                $columns = ['MFG_PART_NUM', 'SITE_NUM', 'RES_AREA', 'TESTER', 'HANDLER', 'TEMP_CLASS'];

                                                foreach ($columns as $key => $column) {
                                                ?>
                                                    <th id="<?php echo $column?>">
                                                        <?php
                                                            if ($column != 'SITE_NUM' && $column != 'RES_AREA') {
                                                            ?>
                                                                <div class="dropdown">
                                                                    <span class="dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                        <?php echo $column; ?>
                                                                    </span>

                                                                    <ul class="dropdown-menu">
                                                                        <li><a class="dropdown-item text-success" href="#" process-type="common" col-name="<?php echo $column;?>" col-index="<?php echo $key?>">Common</a></li>
                                                                        <li><a class="dropdown-item text-danger" href="#" process-type="ignore" col-name="<?php echo $column;?>" col-index="<?php echo $key?>">Ignore</a></li>
                                                                    </ul>
                                                                </div>
                                                            <?php
                                                            }
                                                            else{
                                                                echo $column;
                                                            }
                                                        ?>
                                                    </th>
                                                <?php
                                                }
                                            ?>
                                            <th>OEE</th>
                                            <th>OVERRIDE</th>
                                            <th style="display: none!important;">&nbsp;</th>
                                            <!-- <th>PRIMARY</th> -->
                                        </tr>
                                    </thead>
                                    <tbody style="font-size: .81em!important;" class="table-group-divider"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4 col-md-12 col-sm-12">
                        <div class="col-lg-12">
                            <div class="card border-success mb-2 rounded-0">
                                <div class="card-header text-bg-success text-center rounded-0">COMMON</div>
                                <div style="padding: 1em 1.5em 0;!important;" class="card-body common-list text-center"></div>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <div class="card border-danger rounded-0">
                                <div class="card-header text-bg-danger text-center rounded-0">IGNORE</div>
                                <div style="padding: 1em 1.5em 0;!important;" class="card-body ignore-list text-center"></div>
                            </div>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <input type="hidden" class="last-common-column">
                            <input type="hidden" class="primary-setups">

                            <button type="button" class="btn btn-success btn-sm btn-save-oee">
                                Save Override <i class="fa-regular fa-floppy-disk"></i>
                            </button>
                            <button class="btn btn-warning btn-sm btn-reset-oee" type="button">
                                Reset UI <i class="fa-solid fa-rotate-right"></i>
                            </button>
                        </div>
                    </div>

                    <!-- <div class="col-lg-3 col-md-12 col-sm-12">
                        <div class="card border-danger">
                            <div class="card-header border-danger text-center">IGNORE</div>
                            <div style="padding: 1em 1.5em 0;!important;" class="card-body ignore-list text-center"></div>
                        </div>
                    </div> -->
                </div>

            </div>

            <!-- <div class="modal-footer d-flex justify-content-center">
                <button class="btn btn-info btn-apply-oee">Apply Filters <i class="fa-solid fa-right-to-bracket"></i></button>
            </div> -->

        </div>
    </div>
</div>