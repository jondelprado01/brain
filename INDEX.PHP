<?php
    session_start();
    
    require('ENV.PHP');
    
    if (!isset($_SESSION['SYSTEM'])) {
        // $sso = SSO;
        // $path = (ENV_SERVER != "LOCAL") ? "/TEST/BRAIN_UI_JCDP" : "";
        // $http = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
        // $url = $http."://".$_SERVER['HTTP_HOST'].$path."/LOGIN.PHP";
        // header("Location: ".$sso.$url."");

        header("Location: LOGIN.PHP");
    }
    
	include_once("./assets/LIST.PHP");
	include_once("./requests/API.PHP");

    $assets = RENDER_ASSETS("main");
	$response = null;
	$data = [];
	$temp_arr = [];

	if (isset($_REQUEST['partnum'])) {
		$response = API_REQUEST('planning-assumptions', $_REQUEST['partnum']);
        // echo "<pre>", var_dump($response), "</pre>";
	    // return;
		foreach ($response['MAIN_DISPLAY']['DATA'] as $main) {
			$value = [];
			$details = [];
			$main_partnum = $main['PART'];
			if (!in_array($main_partnum, $temp_arr)) {
				$product_data = "";
				$group = $main['GENERIC']." (".$main['TEST_TYPE']." - L-ADI)";
				foreach ($response['PART_SELECTION']['DATA'] as $key => $selection) {
					if ($main_partnum == $key) {
						$package = (isset($selection['PACKAGETYPE'][0])) ? $selection['PACKAGETYPE'][0] : "";
						$leadcount = (isset($selection['LEADCOUNT'][0])) ? $selection['LEADCOUNT'][0] : "";
						$bodysize = (isset($selection['BODYSIZE'][0])) ? $selection['BODYSIZE'][0] : "";
						$product_data .= $package." ".$bodysize." ".$leadcount;
					}
				}
				array_push($data, [$main['PART'], $main['GENERIC'], $product_data, $group]);
				array_push($temp_arr, $main_partnum);
			}
		}
	}
    else{
        $response = API_REQUEST('planning-assumptions');
    }
?>
<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BRAIN</title>
        <script>
            var env = '<?php echo ENVIRONMENT;?>';
            var server = '<?php echo ENV_SERVER;?>';
            var user_details = {
                emp_id: '<?php echo $_SESSION["EMP_NO"];?>',
                emp_name: '<?php echo $_SESSION["EMP_NAME"];?>',
                emp_email: '<?php echo $_SESSION["EMP_EMAIL"];?>',
                emp_user_group: '<?php echo json_encode($_SESSION["EMP_USER_GROUP"]);?>'
            }
        </script>
        <?php
            foreach ($assets as $asset) {
                echo $asset;
            }
        ?>
    </head>

    <body>
        <?php
            //OFFCANVAS SIDEBAR (UTILITIES - DEV)
            require('./page-sections/offcanvas/UTILITIES.PHP');

            //NAVBAR
            require('./page-sections/navs/PAGES.PHP');

            //OEE MODAL
            require('page-sections/others/OEE.PHP');
        ?>

        <div class="d-flex">
            <aside id="sidebar" class="sidebar-toggle p-0">
                <input type="hidden" class="pre-data" value='<?php echo (!empty($response['MAIN_DISPLAY']['DATA'])) ? json_encode($data, true) : '' ?>'>

                <div class="card-deck">
                    <div class="card rounded-0">
                        <div class="card-header border-0 text-center">
                            <h5 class="card-title">RESOURCE PICKER</h5>
                        </div>
                    </div>
                    <div class="card rounded-0 border-top-0">
                        <div class="card-header d-flex justify-content-between">
                            <h6 class="card-title"><i class="fa-solid fa-magnifying-glass"></i> SEARCH RECORD</h6>
                            <button class="btn btn-sm btn-info btn-clear">Clear Resource Picker</button>
                        </div>
                        <div class="card-body pt-1">
                            <div class="input-group mt-2">
                                <div class="form-floating">
                                    <input type="text" class="form-control" id="search-record" placeholder="Input here...">
                                    <label for="search-record">Input Part / Generic / Resource</label>
                                </div>
                                <button type="button" class="btn btn-sm btn-info btn-search-input">Search</button>
                            </div>
                        </div>
                    </div>
                    <div class="card rounded-0 border-top-0 pt-2">
                        <div class="card-header d-flex justify-content-between pb-3">
                            <h6 class="card-title"><i class="fa-solid fa-list"></i> CATEGORIES & FILTERS</h6>
                            <div>
                                <?php
                                    $oee_status = "not-allowed";
                                    if (in_array('Production Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
                                        $oee_status = "";
                                    }
                                ?>
                                <button class="btn btn-sm btn-primary btn-oee-modal <?php echo $oee_status;?>">OEE <i class="fa-solid fa-pen-to-square"></i></button>
                                <button class="btn btn-sm btn-info btn-combination">Search Combination</button>
                            </div>
                        </div>
                        <div style="min-height: 4em;" class="card-body categories-filters-section">
                            <div style="display: none!important;" class="alert alert-result alert-warning mb-2 alert-no-result" role="alert">
                                <i class="fa-solid fa-info bi-exclamation-triangle-fill flex-shrink-0 me-2"></i> 
                                No Result Found!
                            </div>

                            <div class="accordion result-accordion"></div>
                        </div>
                    </div>
                    <div class="card rounded-0 border-top-0 pt-2">
                        <div class="card-header d-flex justify-content-between pb-3">
                            <h6 class="card-title"><i class="fa-solid fa-folder-tree"></i> PART SELECTION</h6>
                            <div>
                                <button class="btn btn-sm btn-info btn-modify" disabled>Planning Assumptions</button>
                            </div>
                        </div>
                        <div style="min-height: 4em;" class="card-body">
                            <div class="part-selection-container">
                                <table style="width: 100%;" class="table table-bordered table-hover display compact border display compact part-selection-table">
                                    <thead>
                                        <tr>
                                            <th>Tested Part #</th>
                                            <th>Generic</th>
                                            <th>&nbsp;</th>
                                        </tr>
                                    </thead>
                                    <tbody class="part-selection-body">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
            </aside>

            <div class="main">
                <nav class="navbar navbar-expand main-navbar">
                    <button class="toggler-btn" type="button">
                        <!-- <i class="lni lni-text-align-left"></i> -->
                        <i class="fa-solid fa-bars lni lni-text-align-left"></i>
                    </button>
                </nav>
                <main class="p-3">
                    <div class="container-fluid">
                        <div class="row">
                            <div class="col-lg-12">
                                <?php
                                    require('RENDER_DATA.PHP');
                                ?>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>

        <script>
            //TOGGLE - RESOURCE PICKER
            const toggler = document.querySelector(".toggler-btn");
            toggler.addEventListener("click", function () {
            document.querySelector("#sidebar").classList.toggle("collapsed");
            });
        </script>
        
    </body>
    <!-- <footer class="bg-body-tertiary text-center text-lg-start fixed-bottom" data-bs-theme="dark">
        <div class="text-center p-3">
            <span style="color: white;">© 2025 Copyright:</span>
            <a class="text-body" href="#">Analog Devices</a>
        </div>
    </footer> -->
</html>