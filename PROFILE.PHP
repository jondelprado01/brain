<?php
session_start();
if(isset($_REQUEST["DEBUG"]) && trim($_REQUEST["DEBUG"]) != "") {
    print_r2($_SESSION);
}

include_once("./assets/LIST.PHP");
include_once("./requests/API.PHP");
require('ENV.PHP');
$assets = RENDER_ASSETS("main");

function print_r2($aryArray) {
    echo str_replace("<BR><BR>","<BR>",str_replace("\n","<BR>",str_replace(" ","&nbsp;",print_r($aryArray,true))));
}


?>
<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BRAIN</title>
        <?php
            foreach ($assets as $key => $asset) {
                if ($key != 16) {
                    echo $asset;
                }
            }
        ?>
    </head>

    <body>
        <?php
            //OFFCANVAS SIDEBAR (UTILITIES - DEV)
            require('./page-sections/offcanvas/UTILITIES.PHP');

            //NAVBAR
            require('./page-sections/navs/PAGES.PHP');
        ?>

        <div class="container">
            <div class="row">
                <div class="card mt-5">
                    <div class="card-body">
                        <div class="text-center">
                            <img style="height: 100px; width: 100px;" src="assets/profile.jpg" class="rounded mb-3">
                            <h5>
                                <?php 
                                if(isset($_SESSION["EMP_NAME"])) {
                                    echo $_SESSION["EMP_NAME"];
                                }else{
                                    echo "????";
                                }
                                ?>
                                <!-- Admin User -->
                            </h5>
                            <small>
                                <?php 
                                if(isset($_SESSION["EMP_EMAIL"])) {
                                    echo $_SESSION["EMP_EMAIL"];
                                }else{
                                    echo "????";
                                }
                                ?>
                                <!-- admin@user.com -->
                            </small>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-lg-6">
                                <div class="form-floating mb-3">
                                    <input type="text" class="form-control" placeholder="">
                                    <label>
                                    <?php 
                                    if(isset($_SESSION["FIRST_NAME"])) {
                                        echo $_SESSION["FIRST_NAME"];
                                    }else{
                                        echo "????";
                                    }
                                    ?>
                                    <!-- First Name -->
                                    </label>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="form-floating mb-3">
                                    <input type="text" class="form-control" placeholder="">
                                    <label>
                                    <?php 
                                    if(isset($_SESSION["LAST_NAME"])) {
                                        echo $_SESSION["LAST_NAME"];
                                    }else{
                                        echo "????";
                                    }
                                    ?>
                                    <!-- Last Name --> </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </body>
    
</html>