<?php

$thead = ['', 'ENGR. TESTER', 'ENGR. HANDLER',  
		'ATOM TESTER', 'ATOM HANDLER', 'TTPI', 'UTPI', 'IndxPI', 'OEE',
		'QC Factor', 'Sprint UPH', 'UPH', 'Unplannable Flag'];
		
if (isset($_REQUEST['partnum'])) {
	if (!empty($response['MAIN_DISPLAY']['DATA'])) {
		$primary_data 		= [];
		$ded_data			= [];
		$is_unique 			= ['PART', 'RTE_ID', 'STEP'];
		$part_data 			= $response['MAIN_DISPLAY']['DATA'];
		$primary_data_raw 	= $response['MAIN_DISPLAY']['PRIMARY'];
		$hardware_data 		= $response['MAIN_DISPLAY']['HARDWARE'];
		// $oee_data 			= $response['MAIN_DISPLAY']['OEE'];
		// $oee_override_data 	= $response['MAIN_DISPLAY']['OEE_OVERRIDE'];
		$unplannable_data 	= $response['MAIN_DISPLAY']['UNPLANNABLE'];
		$dedication_data 	= $response['MAIN_DISPLAY']['DEDICATION'];

		$part_num_temp = []; 
		$route_temp = []; 
		$step_temp = []; 
		$multi_partnum = [];

		// echo "<pre>", var_dump($hardware_data), "</pre>";

		foreach ($part_data as $part) {
			$multi_partnum[$part['RTE_ID']] = [];
			foreach ($part_data as $part2) {
				if ($part['RTE_ID'] == $part2['RTE_ID']) {
					if (!in_array($part2['STEP'], $multi_partnum[$part['RTE_ID']])) {
						$multi_partnum[$part['RTE_ID']][] = $part2['STEP'];
					}
				}
			}
			array_push($part_num_temp, $part['PART']);
			array_push($route_temp, $part['RTE_ID']);
			array_push($step_temp, $part['STEP']);
		}
		
		//CONSTRUCT GROUP FOR PRIMARY DATA
		foreach ($primary_data_raw as $pmdr_key => $pmdr) {
			$ded_id = (isset($pmdr[15]) && $pmdr[15] != null) ? $pmdr[15] : '0';
			$primary_data_raw[$pmdr_key][15] = $ded_id;
			$implode = $pmdr[0].'|'.$pmdr[1].'|'.$pmdr[2].'|'.$pmdr[3].'|'.$pmdr[4].'|'.$pmdr[6].'|'.$ded_id;
			array_push($primary_data, $implode);
		}

		//CONSTRUCT GROUP FOR PRIMARY DATA - AS DEDICATION
		foreach ($dedication_data as $ded) {
			$implode_ded = $ded['MFG_PART_NUM'].'|'.$ded['SITE_NUM'].'|'.$ded['STEP_NM'].'|'.$ded['SAP_RTE_ID'];
			array_push($ded_data, $implode_ded);
		}
	
		$part_num = array_values(array_unique($part_num_temp));
		$route = array_values(array_unique($route_temp));
		$step = array_values(array_unique($step_temp));
		?>

		<!-- PLANNING ASSUMPTIONS SECTION -->
		<div class="card">
			<div class="card-header d-flex justify-content-between">
				<h5>PLANNING ASSUMPTIONS</h5>
				<div>
					<button type="button" class="btn btn-outline-success btn-save-config">
						Save <i class="fa-solid fa-gear"></i>
					</button>
					<button type="button" class="btn btn-outline-warning btn-reset-config">
						Reset <i class="fa-solid fa-rotate-left"></i>
					</button>
				</div>
			</div>
			<!-- <nav class="navbar navbar-expand-lg bg-body-tertiary">
				<div class="container-fluid">
					<a class="navbar-brand">Planning Assumptions</a>
					<div class="d-flex">
						<div class="collapse navbar-collapse" id="navbarNavAltMarkup">
							<div class="navbar-nav">
								<button type="button" class="btn btn-outline-success btn-save-config mx-2 mb-2">
									Save <i class="fa-solid fa-gear"></i>
								</button>
								<button type="button" class="btn btn-outline-warning btn-reset-config mx-2 mb-2">
									Reset <i class="fa-solid fa-rotate-left"></i>
								</button>
							</div>
						</div>
					</div>
				</div>
			</nav> -->
			<div class="card-body">
				<!-- MAIN DISPLAY - DATATABLES -->
				<div class="row">
					<?php require('page-sections/datatables/PLANNING-ASSUMPTIONS.PHP'); ?>
				</div>
			</div>
		</div>

		<?php
	}
	elseif (empty($response['MAIN_DISPLAY']['DATA'])) {
		$inputs = "";
		foreach ($_REQUEST['partnum'] as $request) {
			$inputs .= "<li>".$request."</li>";
		}
	?>
		<div class="alert alert-warning" role="alert">
			<h4 class="alert-heading">No Records Found!</h4>
			<p>We couldn't find any records or data for:</p>
			<ul>
				<?php echo $inputs ?>
			</ul>
			<hr>
			<p class="mb-0"><strong>Search Help:</strong></p>
			<ul>
				<li>Check your search for any typos</li>
				<li>Try searching for an specific Part Number.</li>
				<li>The Part Number you're searching for may be deleted/updated from the Database.</li>
			</ul>
		</div>
	<?php
	}
}
?>
