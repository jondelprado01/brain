<div class="card border-info mt-2 mb-4">
                    <h5 class="card-header border-info">
                        Change Notifications
                    </h5>
                    <div style="min-height: 3em;" class="card-body">
                        <div class="row">
                        <?php
                            $primary_data_raw = $response['MAIN_DISPLAY']['PENDING_PRIMARY'];

                            foreach ($primary_data_raw as $pmdr) {
                                if ($pmdr[6] == "PENDING") {
                                    date_default_timezone_set('Asia/Manila');
                                    $seconds_ago = (time() - strtotime($pmdr[9]));
                                    if ($seconds_ago >= 31536000) {
                                        $timeago = intval($seconds_ago / 31536000) . " years ago";
                                    } elseif ($seconds_ago >= 2419200) {
                                        $timeago = intval($seconds_ago / 2419200) . " months ago";
                                    } elseif ($seconds_ago >= 86400) {
                                        $timeago = intval($seconds_ago / 86400) . " days ago";
                                    } elseif ($seconds_ago >= 3600) {
                                        $timeago = intval($seconds_ago / 3600) . " hours ago";
                                    } elseif ($seconds_ago >= 60) {
                                        $timeago = intval($seconds_ago / 60) . " minutes ago";
                                    } else {
                                        $timeago = "Less than a minute ago";
                                    }
                                ?>
                                    <div class="col-lg-12 mb-4">
                                        <div class="card">
                                            <div class="card-header bg-pending d-flex justify-content-between">
                                                <strong class="me-auto"><small>(Hardware Change)</small></strong>
                                                <small><i class="fa-regular fa-clock"></i>&nbsp;<?php echo $timeago?></small>
                                            </div>
                                            <div class="card-body">
                                                <a class="card-title" href="/?partnum[0]=<?php echo rawurlencode($pmdr[0]); ?>"><strong><?php echo $pmdr[0];?></strong></a>
                                                <p class="card-text">
                                                    <ul>
                                                        <li><small><?php echo $pmdr[1]." / ".$pmdr[4]; ?></small></li>
                                                        <li><small><?php echo $pmdr[2]; ?></small></li>
                                                        <li><small><?php echo $pmdr[7]." - ".$pmdr[8]; ?></small></li>
                                                    </ul>
                                                </p>
                                                <hr>
                                                <div class="d-flex justify-content-between m-0 p-0">
                                                    <small><i class="fa-solid fa-user"></i>&nbsp;&nbsp;<?php echo $pmdr[11]?></small>
                                                    <small><?php echo date_format(date_create($pmdr[9]), "M d, Y - h:i:s A"); ?></small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                <?php
                                }
                            }
                        ?>

                    </div>
                </div>