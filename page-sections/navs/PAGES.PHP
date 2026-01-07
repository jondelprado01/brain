<?php
    switch (ENV_SERVER) {
        case 'TEST':
            $subdomain = '/TEST/BRAIN_UI_JCDP';
            break;
        case 'STAGING':
            $subdomain = '/API/BRAIN_UI_JCDP';
            break;
        
        default:
            $subdomain = '';
            break;
    }
    $index = (ENV_SERVER == 'STAGING' || ENV_SERVER == 'TEST') ? 4 : 2;
    $pa = '';
    $da = '';
    $ho = '';
    $na = '';
    $it = '';
    $am = '';
    $url = explode("/", $_SERVER['REQUEST_URI']);
    if (strpos($_SERVER['REQUEST_URI'], 'modules') !== false) {
        switch ($url[$index]) {
            case 'default-atom':
                $da = 'active';
                break;

            case 'hw-override':
                $ho = 'active';
                break;
            
            case 'nonate':
                $na = 'active';
                break;

            case 'nonate':
                $it = 'active';
                break;

            case 'account-management':
                $am = 'active';
                break;
        }
    }
    else{
        $idx = ($index == 4) ? 3 : 1;
        if ($url[$idx] != 'PROFILE.PHP') {
            $pa = 'active';
        }
    }
?>
<nav class="navbar navbar-expand-lg  sticky-top bg-body-tertiary" data-bs-theme="dark">
    <div class="container-fluid">
        <a class="navbar-brand" href="#">
            <img src="<?php echo ($pa == 'active') ? "./" : "../../"?>assets/brain-logo.png" alt="Bootstrap" width="50" height="50">
            &nbsp;BRAIN
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div style="padding-right: 1em!important;" class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <!-- <li class="nav-item me-4">
                    <a class="nav-link" aria-current="page" href="#">
                        <i class="fa-solid fa-gauge"></i>
                        DASHBOARD
                    </a>
                </li> -->
                <li class="nav-item me-4">
                    <a class="nav-link <?php echo $pa; ?>" aria-current="page" href="<?php echo $subdomain; ?>/INDEX.PHP">
                        <i class="fa-solid fa-diagram-project"></i>
                        PLANNING ASSUMPTIONS
                    </a>
                </li>
                <li class="nav-item me-4">
                    <a class="nav-link <?php echo $da; ?>" aria-current="page" href="<?php echo $subdomain; ?>/modules/default-atom/INDEX.PHP">
                        <i class="fa-solid fa-link"></i>
                        DEFAULT ATOM
                    </a>
                </li>

                <?php
                    $hwm_status = "disabled";
                    $it_status = "disabled";
                    if (in_array('HW Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
                        $hwm_status = "";
                    }

                    if (in_array('Production Planning', $_SESSION['EMP_USER_GROUP']) || count($_SESSION['EMP_USER_GROUP']) == 0) {
                        $it_status = "";
                    }
                ?>
                
                <li class="nav-item me-4">
                    <a class="nav-link <?php echo $ho." ".$hwm_status; ?>" aria-current="page" href="<?php echo $subdomain; ?>/modules/hw-override/INDEX.PHP">
                        <i class="fa-solid fa-microchip"></i>
                        HARDWARE OVERRIDE
                    </a>
                </li>

                <li class="nav-item me-4">
                    <a class="nav-link <?php echo $na." ".$hwm_status; ?>" aria-current="page" href="<?php echo $subdomain; ?>/modules/nonate/INDEX.PHP">
                        <i class="fa-solid fa-memory"></i>
                        NONATE
                    </a>
                </li>

                <li class="nav-item me-4">
                    <a class="nav-link <?php echo $it." ".$it_status; ?>" aria-current="page" href="<?php echo $subdomain; ?>/modules/index-time/INDEX.PHP">
                        <i class="fa-solid fa-timeline"></i>
                        INDEX TIME
                    </a>
                </li>

                <?php
                    if ($_SESSION["EMP_ROLE"] == "Administrator" || $_SESSION['EMP_ROLE'] == "Master") {
                    ?>
                        <li class="nav-item me-4">
                            <a class="nav-link <?php echo $am; ?>" aria-current="page" href="<?php echo $subdomain; ?>/modules/account-management/INDEX.PHP">
                                <i class="fa-solid fa-users"></i>
                                ACCOUNT MANAGEMENT
                            </a>
                        </li>
                    <?php
                    }
                ?>
                <!-- <li class="nav-item">
                    <a class="nav-link" href="#" data-bs-toggle="offcanvas" data-bs-target="#offcanvasExample" aria-controls="offcanvasExample">Utilities</a>
                </li> -->
            </ul>

            <div class="btn-group dropstart" role="group">
                <button type="button" class="btn btn-info dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    <?php echo $_SESSION["EMP_NAME"]; ?>
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="<?php echo $subdomain; ?>/PROFILE.PHP"><i class="fa-solid fa-user"></i> Profile</a></li>
                    <li><a class="dropdown-item" href="<?php echo $subdomain; ?>/SESSION-CONTROLLER.PHP?process=logout"><i class="fa-solid fa-right-from-bracket"></i> Logout</a></li>
                </ul>
            </div>

        </div>
    </div>
</nav>