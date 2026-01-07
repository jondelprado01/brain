#!/usr/bin/php -q
<?php
try {
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL => 'http://mxhdafot01l.maxim-ic.com/API/PRIMARY_SETUP.php?INPUT_TYPE=MFG_PART_NUM&OUTPUT_TYPE=BODS_JDA_ADI&PROCESS_TYPE=PROCESS_PENDING_HW_CHANGE&NO_JSON=1',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_HTTPHEADER => array('Content-Type: application/json', 'Accept: application/json')
    ));
    $results = json_decode(curl_exec($curl), true);
    curl_close($curl);
}
catch(Exception $e) {
    echo 'Message: ' .$e->getMessage();
}

return var_dump($results);

?>