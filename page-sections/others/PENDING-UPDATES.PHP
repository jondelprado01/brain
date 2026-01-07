<div class="modal fade zoom" id="pending-modal-<?php echo $trim_rte."_".$step?>" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
        <div class="modal-header">
            <h1 class="modal-title fs-5" id="exampleModalLabel"><?php echo $route_id." - ".$step?></h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <div class="row">
                <small class="mb-4"><i>Note: This update will be automatically processed after 24 hours unless it's cancelled manually.</i></small>
                <?php
                    $user = "";
                    $id = "";
                    $unplannable_id = "";
                    $created_at = "";
                    $to_remove_ = "";
                    
                    foreach ($primary_data_raw as $pmdr) {
                        if ($route_id == $pmdr[4] && $step == $pmdr[2]) {
                            if ($pmdr[6] == "PENDING" && $pmdr[16] != "") {
                                $to_remove = $pmdr[16];
                            }
                        }
                    }
                    
                    foreach ($primary_data_raw as $pmdr) {

                        if ($route_id == $pmdr[4] && $step == $pmdr[2]) {

                            if ($pmdr[6] != "PENDING" && $pmdr[16] == "") {
                                if ($pmdr[3]."|".$pmdr[5] != $to_remove) {
                                    continue;
                                }
                            }

                            $border = ($pmdr[6] == "PENDING") ? "border-warning" : "border-success";
                            if ($pmdr[6] == "PENDING") {
                                $id = $pmdr[10];
                                $created_at = date_format(date_create($pmdr[9]), "M d, Y - h:i:s A");
                                $scheduled_at = date_format(date_create($pmdr[12]), "M d, Y - h:i:s A");
                                $user = "Admin Admin";
                            }
                            $hw_id = ($pmdr[6] == "PENDING") ? $pmdr[5] : $pmdr[5];
                            $primary_name = ($pmdr[6] == "PENDING") ? "NEW PRIMARY" : "CURRENT PRIMARY";
                            $tester = ($pmdr[6] == "PENDING") ? $pmdr[7] : $pmdr[7];
                            $handler = ($pmdr[6] == "PENDING") ? $pmdr[8] : $pmdr[8];

                            if(count($unplannable_data) > 0){
                                foreach ($unplannable_data as $key => $ud) {
                                    if ($ud['ATOM_MASTER_ID'] == $pmdr[14]) {
                                        $unplannable_id = $ud['ID'];
                                    }
                                }
                            }

                        ?>
                            <div class="col-lg-6">
                                <div class="card text-center <?php echo $border; ?>">
                                    <div class="card-header">
                                        <?php echo $primary_name ?>
                                    </div>
                                    <div class="card-body">
                                        <table class="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>ENGR. TESTER</th>
                                                    <th>ENGR. HANDLER</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td><?php echo $tester?></td>
                                                    <td><?php echo $handler?></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <table class="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>HW_TYPE</th>
                                                    <th>HW_NAME</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <?php
                                                    foreach ($hardware_data[$hw_id] as $key => $hd) {
                                                    ?>
                                                        <tr>
                                                            <td><?php echo $key; ?></td>
                                                            <td><?php echo $hd[0]['HW_NM']?></td>
                                                        </tr>
                                                    <?php
                                                    }
                                                ?>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        <?php
                        }
                    }

                ?>
                <div class="col-lg-12"><hr></div>
                <div class="col-lg-4 pt-2 text-center">
                    <span><b>Initiated By:</b><br><?php echo $user?></span>
                </div>
                <div class="col-lg-4 pt-2 text-center">
                    <span><b>Created At:</b><br><?php echo $created_at?></span>
                </div>
                <div class="col-lg-4 pt-2 text-center">
                    <span><b>Scheduled At:</b><br><?php echo $scheduled_at?></span>
                </div>
            </div>
        </div>
        <div class="modal-footer d-flex justify-content-center">
            <button type="button" class="btn btn-outline-danger btn-hw-process" process-type="cancel" change-data-id="<?php echo $id?>" flag-id="<?php echo $unplannable_id; ?>">
                Cancel
                <i class="fa-solid fa-ban"></i>
            </button>
            <button type="button" class="btn btn-initiate btn-outline-success btn-hw-process" process-type="expedite" change-data-id="<?php echo $id?>" flag-id="<?php echo $unplannable_id; ?>">
                Expedite
                <i class="fa-solid fa-forward"></i>
            </button>
        </div>
        </div>
    </div>
</div>

<?php
    $modal_url = $trim_rte."_".$step;
    if (isset($_REQUEST['modal'])) {
    ?>
        <script type="text/javascript">
            $(window).on('load', function() {
                $('#pending-modal-<?php echo $_REQUEST['modal']?>').modal('show');
            });
        </script>
    <?php
    }
?>