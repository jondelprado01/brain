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
        <style>
            .thread,
            .thread ul {
                list-style: none;
                margin: 0;
                padding-left: 20px;
                position: relative;
            }

            .thread ul::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                border-left: 1px solid #ccc;
            }

            .thread li {
                position: relative;
                padding-left: 20px;
                margin: 8px 0;
            }

            .thread li::before {
                content: '';
                position: absolute;
                top: 12px;
                left: 0;
                width: 15px;
                border-top: 1px solid #ccc;
            }
        </style>
    </head>

    <body>
        <?php
            //OFFCANVAS SIDEBAR (UTILITIES - DEV)
            require('./page-sections/offcanvas/UTILITIES.PHP');

            //NAVBAR
            require('./page-sections/navs/PAGES.PHP');

            //user groups and roles
            $user_group_role_arr = [
                "Resource Picker"   => [],
                "Main Display"      => [],
                "Default Atom"      => ["Assign Default Atom"],
                "HW Override"       => [],
                "NON-ATE"           => [],
                "Index Time"        => ["Fixed", "Variable"]
            ];

            if (count($_SESSION['EMP_USER_GROUP']) == 0) {
                array_push($user_group_role_arr["Resource Picker"], "Search", "OEE Override");
                array_push($user_group_role_arr["Main Display"], "Alternate To Primary", "Change HW Set", "Set Flag Status", "Dedications", "Time-phasing");
                array_push($user_group_role_arr["HW Override"], "Type 1 - HW Mapping", "Type 2 - HW Capacity Override", "Type 3 - Plan Non-Boards");
                array_push($user_group_role_arr["NON-ATE"], "Type 1 - BurnIn Load/Unload Hours","Type 2 - Override Socket Efficiency","Type 3 - HW Capacity Override");
            }
            else{
                foreach ($_SESSION['EMP_USER_GROUP'] as $ugkey => $user_group) {
                    if ($user_group == "SCM Cap Planning") {
                        array_push($user_group_role_arr["Resource Picker"], "Search");
                        array_push($user_group_role_arr["Main Display"], "Alternate To Primary", "Change HW Set", "Set Flag Status", "Dedications", "Time-phasing");
                    }
                    if ($user_group == "HW Planning") {
                        array_push($user_group_role_arr["Resource Picker"], "Search");
                        array_push($user_group_role_arr["Main Display"], "Alternate To Primary", "Change HW Set", "Time-phasing");
                        array_push($user_group_role_arr["HW Override"], "Type 1 - HW Mapping", "Type 2 - HW Capacity Override", "Type 3 - Plan Non-Boards");
                        array_push($user_group_role_arr["NON-ATE"], "Type 1 - BurnIn Load/Unload Hours","Type 2 - Override Socket Efficiency","Type 3 - HW Capacity Override");
                    }
                    if ($user_group == "Production Planning") {
                        array_push($user_group_role_arr["Resource Picker"], "Search", "OEE Override");
                        array_push($user_group_role_arr["Main Display"], "Alternate To Primary", "Time-phasing");
                    }
                }
            }

        ?>

        <div class="container mt-5">
            <div class="row">
                <div class="col-lg-4">
                    <div class="card">
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
                                </h5>
                                <small>
                                    <?php 
                                    if(isset($_SESSION["EMP_EMAIL"])) {
                                        echo $_SESSION["EMP_EMAIL"];
                                    }else{
                                        echo "????";
                                    }
                                    ?>
                                </small>
                            </div>
                            <hr>
                            <b>User Role:</b>&emsp;<?php echo $_SESSION["EMP_ROLE"]; ?><br><br>
                            <b>Assigned User Group(s):</b>
                            <ul>
                                <?php
                                    if (count($_SESSION['EMP_USER_GROUP']) == 0) {
                                        echo "<li>Administrator</li>";
                                    }
                                    else{
                                        foreach ($_SESSION['EMP_USER_GROUP'] as $ugkey => $user_group) {
                                            echo "<li>".$user_group."</li>";
                                        }
                                    }
                                ?>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-body">

                            <ul class="thread">
                                <li>
                                    <?php 
                                        if (count($_SESSION['EMP_USER_GROUP']) == 0) {
                                            echo "Administrator";
                                        }
                                        else{
                                            echo implode(", ", $_SESSION['EMP_USER_GROUP']);
                                        }
                                    ?>
                                    <ul>
                                        <?php
                                            foreach ($user_group_role_arr as $modkey => $modules) {
                                                if (count($modules) > 0) {
                                                ?>
                                                    <li>
                                                        <b><?php echo $modkey?></b>
                                                        <ul>
                                                            <?php
                                                                foreach (array_unique($modules) as $funckey => $function) {
                                                                ?>
                                                                    <li><?php echo $function; ?></li>
                                                                <?php
                                                                }
                                                            ?>
                                                        </ul>
                                                    </li>
                                                <?php
                                                }
                                            }
                                        ?>
                                    </ul>
                                </li>
                            </ul>

                        </div>
                    </div>
                </div>
            </div>
        </div>

    </body>
    
</html>