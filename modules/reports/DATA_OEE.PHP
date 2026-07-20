<?php

function GET_OEE_DATA(){
    $results = [
        "DATA" => [],
        "ERROR" => ""
    ];
    
    try {
        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'http://MXHTAFOT01L.maxim-ic.com/TEST/OEE_OVERRIDE_TEST.PHP?PROCESS_TYPE=GET_OEE_FOR_REPORT',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_HTTPHEADER => array('Content-Type: application/json', 'Accept: application/json')
        ));
        $results["DATA"] = json_decode(curl_exec($curl), true);
        curl_close($curl);
    }
    catch(Exception $e) {
        $results["ERROR"] = 'Message: ' .$e->getMessage();
    }

    return $results;
}//cant upload this file
?>