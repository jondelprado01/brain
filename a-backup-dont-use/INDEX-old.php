<?php 
	
	include_once("./requests/API.PHP");

	$response = null;
	$data = [];
	$temp_arr = [];
	
	if (isset($_REQUEST['partnum'])) {
		$response = API_REQUEST($_REQUEST['partnum']);
		foreach ($response['MAIN_DISPLAY']['DATA'] as $main) {
			$value = [];
			$details = [];
			$main_partnum = $main['PART'];
			if (!in_array($main_partnum, $temp_arr)) {
				$product_data = "";
				$group = $main['GENERIC']." (".$main['TEST_TYPE']." - L-ADI)";
				foreach ($response['PART_SELECTION']['DATA'] as $key => $selection) {
					if ($main_partnum == $key) {
						$package = $selection['PACKAGETYPE'][0];
						$leadcount = $selection['LEADCOUNT'][0];
						$bodysize = (isset($selection['BODYSIZE'][0])) ? $selection['BODYSIZE'][0] : "";
						$product_data .= $package." ".$bodysize." ".$leadcount;
					}
				}
				array_push($data, [$main['PART'], $main['GENERIC'], $product_data, $group]);
				array_push($temp_arr, $main_partnum);
			}
		}
	}

	// echo '<pre>' , var_dump($response['MAIN_DISPLAY']['DATA']) , '</pre>';
	// die();
?>

<!DOCTYPE html>
<html class="html-container" data-bs-theme="light">
	<head>
		<meta charset="utf-8">
		<!-- <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/v/dt/dt-1.10.18/datatables.min.css"/> -->
		<!-- <script src="https://cdn.datatables.net/2.1.3/js/dataTables.js"></script> -->
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"/>
		<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.2/font/bootstrap-icons.css" rel="stylesheet"/>
		<link rel="stylesheet" href="css/plugins/bootstrap.min.css">
		<link rel="stylesheet" href="css/plugins/dataTables.dataTables.css">
		<link rel="stylesheet" href="css/plugins/select2.min.css">
		<link rel="stylesheet" href="css/custom.css">
		<script type="text/javascript" src="js/plugins/bootstrap.bundle.min.js"></script>
		<script type="text/javascript" src="js/plugins/jquery.min.js"></script>
		<script type="text/javascript" src="js/plugins/jquery-ui.min.js"></script>
		<script type="text/javascript" src="js/plugins/datatables.min.js"></script> 
		<script type="text/javascript" src="js/plugins/sweetalert2@11.js"></script> 
		<script type="text/javascript" src="js/plugins/select2.min.js"></script>
		<script type="text/javascript" src="js/plugins/jquery.redirect.js"></script>
		<script type="text/javascript" src="js/custom.js"></script>
	</head>
	<body>
		<div class="offcanvas offcanvas-start text-bg-dark" tabindex="-1" id="offcanvasExample" aria-labelledby="offcanvasExampleLabel">
			<div class="offcanvas-header">
				<h5 class="offcanvas-title" id="offcanvasExampleLabel">Utilities</h5>
				<button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
			</div>
			<div class="offcanvas-body">
				<div class="card">
					<label for="">for testing purposes only</label>
					2049Z-1BSTT-T0KOIZ <br>
					TS88_S <br>
					LT3999
					LT3999EDD#PBF-T0
				</div>
			</div>
		</div>
		<nav class="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
			<div class="container-fluid">
				<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarTogglerDemo01" aria-controls="navbarTogglerDemo01" aria-expanded="false" aria-label="Toggle navigation">
					<span class="navbar-toggler-icon"></span>
				</button>
				<div class="collapse navbar-collapse" id="navbarTogglerDemo01">
					<a class="navbar-brand" href="#">BRAIN</a>
					<ul class="navbar-nav me-auto mb-2 mb-lg-0">
						<li class="nav-item">
                     <a href="#" class="nav-link" data-bs-toggle="offcanvas" data-bs-target="#offcanvasExample" aria-controls="offcanvasExample">
                        Utilities
                     </a>
						</li>
						<li class="nav-item">
						<span>&nbsp;</span>
						</li>
						<li class="nav-item">
						<span>&nbsp;</span>
						</li>
					</ul>
					<div class="d-flex" role="search">
						<input type="checkbox" class="checkbox toggle-theme" id="checkbox">
						<label for="checkbox" class="checkbox-label">
							<i class="fas fa-moon"></i>
							<i class="fas fa-sun"></i>
							<span class="ball"></span>
						</label>
					</div>

				</div>
			</div>
		</nav>

  <button class="btn btn-primary btn-toggle-resource" type="button" data-bs-toggle="collapse" data-bs-target="#collapseWidthExample" aria-expanded="false" aria-controls="collapseWidthExample">
    Toggle width collapse
  </button>
		
		<div class="container-fluid p-4">
			<div class="row">

				<div class="col-lg-4 col-md-12 col-sm-12 collapse collapse-horizontal" id="collapseWidthExample">
				
					<input type="hidden" class="pre-data" value='<?php echo (!empty($response['MAIN_DISPLAY']['DATA'])) ? json_encode($data, true) : '' ?>'>
					<div class="card border-info mb-2">
						<h5 class="card-header border-info">Search Record</h5>
						<div class="card-body">
							<div class="input-group	">
								<div class="form-floating">
									<input type="text" class="form-control" id="search-record" placeholder="Input here...">
									<label for="search-record">Input here...</label>
								</div>
							</div>
						</div>
					</div>

					<div class="card border-info mt-4 mb-4">
						<h5 class="card-header border-info d-flex justify-content-between align-items-center">
							Categories & Filters
							<button style="display: none;" class="btn btn-info btn-combination">Search Combination</button>
						</h5>
						<div style="min-height: 4em;" class="card-body categories-filters-section">
							<div style="display: none!important;" class="alert alert-result alert-warning mb-2 alert-no-result" role="alert">
								<i class="fa-solid fa-info bi-exclamation-triangle-fill flex-shrink-0 me-2"></i> 
								No Result Found!
							</div>

							<div class="accordion result-accordion"></div>
						</div>
					</div>

					<div class="card border-info mt-4 mb-4">
						<h5 class="card-header border-info d-flex justify-content-between align-items-center">
							Part Selection
							<button class="btn btn-secondary btn-modify" disabled>Modify Planning Assumptions</button>
						</h5>
						<div style="min-height: 4em;" class="card-body">
							<div style="display: none!important;" class="card part-selection-container">
								<div class="card-body">
									<table style="width: 100%;" class="table table-bordered table-hover display compact border display compact part-selection-table">
										<thead>
											<tr>
												<th>Tested Part #</th>
												<th>Generic</th>
												<th>Details</th>
											</tr>
										</thead>
										<tbody class="part-selection-body">
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>

				</div>

				<div class="col-lg-8 col-md-12 col-sm-12 main-display">
					<?php
						require('RENDER_DATA.PHP');
					?>
				</div>

			</div>
		</div>

	</body>
</html>

<!-- REWORK AND USE LATER -->
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