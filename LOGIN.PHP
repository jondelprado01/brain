<?php
require('ENV.PHP');

// ini_set("error_reporting",E_ALL);
// ini_set("display_errors",1);

if (isset($_REQUEST['id']) && strpos($_REQUEST['id'], 'ERROR') !== false) {
    session_start();
    session_destroy();

    $sso = SSO;
    if (ENV_SERVER == "LOCAL") {
        $path = "";
    }
    else{
        $path = (ENV_SERVER == "STAGING") ? "/API/BRAIN_UI_JCDP" : "/TEST/BRAIN_UI_JCDP";
    }
    $http = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
    $url = $http."://".$_SERVER['HTTP_HOST'].$path."/LOGIN.PHP";
    header("Location: ".$sso.$url."");
}
else{
    session_start();

    // $_SESSION["SYSTEM"]           = "BRAIN";
    // $_SESSION["EMP_NO"]           = "301114";
    // $_SESSION["EMP_NAME"]         = "John Dalisky";
    // $_SESSION["EMP_EMAIL"]        = "John.Dalisky@analog.com";
    // $_SESSION["EMP_ROLE"]         = "User";
    // $_SESSION["EMP_USER_GROUP"]   = ['SCM Cap Planning', 'HW Planning'];

    // $_SESSION["SYSTEM"]           = "BRAIN";
    // $_SESSION["EMP_NO"]           = "145752";
    // $_SESSION["EMP_NAME"]         = "Nishanth Sripathi";
    // $_SESSION["EMP_EMAIL"]        = "Nishanth.Sripathi@analog.com";
    // $_SESSION["EMP_ROLE"]         = "User";
    // $_SESSION["EMP_USER_GROUP"]   = ['SCM Cap Planning'];

    // $_SESSION["SYSTEM"]           = "BRAIN";
    // $_SESSION["EMP_NO"]           = "30003";
    // $_SESSION["EMP_NAME"]         = "Ivy Espiritu";
    // $_SESSION["EMP_EMAIL"]        = "IVY.ESPIRITU@ANALOG.COM";
    // $_SESSION["EMP_ROLE"]         = "User";
    // $_SESSION["EMP_USER_GROUP"]   = ['HW Planning'];

    // $_SESSION["SYSTEM"]           = "BRAIN";
    // $_SESSION["EMP_NO"]           = "120188";
    // $_SESSION["EMP_NAME"]         = "Wendy Atienza";
    // $_SESSION["EMP_EMAIL"]        = "Wendy.Atienza@analog.com";
    // $_SESSION["EMP_ROLE"]         = "User";
    // $_SESSION["EMP_USER_GROUP"]   = ['Production Planning'];

    $_SESSION["SYSTEM"]           = "BRAIN";
    $_SESSION["EMP_NO"]           = "2008473";
    $_SESSION["EMP_NAME"]         = "Jonathan Del Prado";
    $_SESSION["EMP_EMAIL"]        = "Jonathan.Delprado@analog.com";
    $_SESSION["EMP_ROLE"]         = "Administrator";
    $_SESSION["EMP_USER_GROUP"]   = [];
    
    header("Location: INDEX.PHP");
    return;

    require('../../SSO/nusoap/lib/nusoap.php');
    $l_oClient = new nusoap_client('http://ds2.maxim-ic.com/singlesignon/userauth.php');
    $data_sso = $l_oClient->call('getUserDetailByID', $_REQUEST['id']);

    if (!is_null($data_sso['employeeno'])) {
        $results = [];
        try {
            $curl = curl_init();
            curl_setopt_array($curl, array(
                CURLOPT_URL => "http://MXHDAFOT01L.maxim-ic.com/API/USER_ACCOUNT.PHP?PROCESS_TYPE=CHECK_LOGIN_INFO&EMPLOYEE_ID=".urlencode($data_sso['employeeno']),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'GET',
                CURLOPT_HTTPHEADER => array('Content-Type: application/json', 'Accept: application/json')
            ));
            $results = json_decode(curl_exec($curl), true);
            curl_close($curl);
        }
        catch(Exception $e) {
            echo 'Message: ' .$e->getMessage();
        }
        
        if (count($results) > 0) {
            $user_group = [];

            if (strpos($results['USER_GROUP'], ",") !== false) {
                $user_group = explode(",", $results['USER_GROUP']);
            }
            else{
                if ($results['USER_GROUP'] != "all") {
                    array_push($user_group, $results['USER_GROUP']);
                }
            }

            $_SESSION["SYSTEM"]           = "BRAIN";
            $_SESSION["EMP_NO"]           = $results['EMP_ID'];
            $_SESSION["EMP_NAME"]         = $results['EMP_NAME'];
            $_SESSION["EMP_EMAIL"]        = $results['EMP_EMAIL'];
            $_SESSION["FIRST_NAME"]         = $results["FIRST_NAME"];
            $_SESSION["LAST_NAME"]          = $results["LAST_NAME"];
            $_SESSION["EMP_ROLE"]         = ($results['ROLE'] == "admin") ? "Administrator" : "User";
            $_SESSION["EMP_USER_GROUP"]   = $user_group;

            header("Location: INDEX.PHP");
        }
        else{
            echo "Error";
        }
    }else{
        #2025-10-15 RM  default non-admin
        $_SESSION["SYSTEM"]           = "BRAIN";
        $_SESSION["EMP_NO"]           = "";
        $_SESSION["EMP_NAME"]         = "Log In";
        $_SESSION["EMP_EMAIL"]        = "noone@nowhere.com";
        $_SESSION["FIRST_NAME"]         = "Log";
        $_SESSION["LAST_NAME"]          = "In";
        $_SESSION["EMP_ROLE"]         = "";
        $_SESSION["EMP_USER_GROUP"]   = [];
/*
        $_SESSION["SYSTEM"]           = "BRAIN";
        $_SESSION["EMP_NO"]           = "2008473";
        $_SESSION["EMP_NAME"]         = "ADMIN TEST ACCOUNT";
        $_SESSION["EMP_EMAIL"]        = "admin@admin.com";
        $_SESSION["FIRST_NAME"]         = "admin";
        $_SESSION["LAST_NAME"]          = "admin";
        $_SESSION["EMP_ROLE"]         = "Administrator";
        $_SESSION["EMP_USER_GROUP"]   = [];
*/
        header("Location: INDEX.PHP");

        // echo "<pre>", var_dump($data_sso), "</pre>";
        // echo "Employee No:".$data_sso['employeeno'];
    }

    
    
}

?>