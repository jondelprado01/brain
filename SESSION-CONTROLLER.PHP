<?php
    require('ENV.PHP');
    if (isset($_REQUEST['process'])) {
       $process = $_REQUEST['process'];

       if ($process == "login") {
        // //FOR USER LOGIN PROCESS
        // session_start();
        // $_SESSION["SYSTEM"]     = "BRAIN";
        // $_SESSION["EMP_NO"]     = "123456";
        // $_SESSION["EMP_NAME"]   = "Admin Admin";
        // $_SESSION["EMP_EMAIL"]  = "admin@example.com";
        // $_SESSION["EMP_ROLE"]   = "Administrator";

        // header("Location: INDEX.PHP");
       }
       else{
        session_start();
        session_destroy();

        // $sso = SSO;
        // if (ENV_SERVER == "LOCAL") {
        //     $path = "";
        // }
        // else{
        //     $path = (ENV_SERVER == "STAGING") ? "/API/BRAIN_UI_JCDP" : "/TEST/BRAIN_UI_JCDP";
        // }
        // $http = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
        // $url = $http."://".$_SERVER['HTTP_HOST'].$path."/LOGIN.PHP";
        // header("Location: ".$sso.$url."");

        header("Location: LOGIN.PHP");
       }
    }

?>