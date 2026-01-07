<?php

function API_REQUEST($module, $request = null){

    $input = "";
    $results = [];

    switch ($module) {
        case 'planning-assumptions':
            $endpoints = [
                'PART_SELECTION'    => 'http://MXHTAFOT01L.maxim-ic.com/TEST/MAPPER_ADI.PHP?INPUT_TYPE=MFG_PART_NUM&OUTPUT_TYPE=PRODUCT_DATA_ADI',
                'MAIN_DISPLAY'      => 'http://MXHTAFOT01L.maxim-ic.com/TEST/TOP_SECTION.php?INPUT_TYPE=MFG_PART_NUM&OUTPUT_TYPE=BODS_JDA_ADI',
            ];
            break;

        case 'timephasing':
            $endpoints = [
                'TIMEPHASING'   => 'http://MXHDAFOT01L.maxim-ic.com/API/MAPPER_BRAIN_006.PHP?INPUT_TYPE=SAP_RTE_ID&OUTPUT_TYPE=TPI_DATA_GET_ALL',
                'CURRENT_WEEK'  => 'http://MXHDAFOT01L.maxim-ic.com/API/TIMEPHASING.PHP?PROCESS_TYPE=GET_CURRENT_WEEK'
            ];
            break;

        case 'summary':
            $endpoints = [
                'SUMMARY'       => 'http://MXHDAFOT01L.maxim-ic.com/API/MAPPER_BRAIN_006.PHP?INPUT_TYPE=SAP_RTE_ID&OUTPUT_TYPE=TPI_SUMMARY_COMPARE_GET_ALL'
            ];
            break;

        case 'instance-data':
            $endpoints = [
                'INSTANCE_DATA' => 'http://MXHDAFOT01L.maxim-ic.com/API/MAPPER_BRAIN_006.PHP?INPUT_TYPE=TPI_ID&OUTPUT_TYPE=TPI_DATA_GET_ONE',
            ];
            break;

        case 'hw-override-tool':
            $endpoints = [
                'WEEKS'      => 'http://MXHDAFOT01L.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=GET_WEEKS&OUTPUT_TYPE=BODS_JDA_ADI',
                'TYPE_1'     => 'http://MXHDAFOT01L.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=GET_DUMMY_HW&OUTPUT_TYPE=BODS_JDA_ADI',
                'TYPE_2'     => 'http://MXHDAFOT01L.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=GET_HW_CAPACITY&OUTPUT_TYPE=BODS_JDA_ADI',
                'TYPE_3'     => 'http://MXHDAFOT01L.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=GET_NON_BOARD&OUTPUT_TYPE=BODS_JDA_ADI',
            ];
            break;
        case 'nonate-tool':
            $endpoints = [
                'WEEKS'      => 'http://MXHDAFOT01L.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=GET_WEEKS&OUTPUT_TYPE=BODS_JDA_ADI',
                'TYPE_1'     => 'http://MXHDAFOT01L.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=GET_BOARD_BURNIN&OUTPUT_TYPE=BODS_JDA_ADI',
                'TYPE_2'     => 'http://MXHDAFOT01L.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=GET_SOCKET&OUTPUT_TYPE=BODS_JDA_ADI',
                'TYPE_3'     => 'http://MXHDAFOT01L.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=GET_HW_CAPACITY&OUTPUT_TYPE=BODS_JDA_ADI',
            ];
            break;
    }

    if ($request != null) {
        if ($module == "planning-assumptions" || $module == 'summary' || $module == 'instance-data') {
            foreach ($request as $key => $partnum) {
                $no_json = ($module == "summary" || $module == "instance-data" || $module == "planning-assumptions") ? "" : "&NO_JSON=1";
                $input .= "&INPUT[".$key."]=".urlencode($partnum).$no_json."";
            }
        }
        else{
            $input .= "&INPUT=".urlencode($request)."";
        }
    }

    foreach ($endpoints as $key => $ep) {
        if ($key == 'TIMEPHASING') {
            $input = "&INPUT[0]=".urlencode($request);
        }
        if ($key == 'MAIN_DISPLAY') {
            $input = $input."&NO_JSON=1";
        }
        try {
            $curl = curl_init();
            curl_setopt_array($curl, array(
                CURLOPT_URL => $ep.$input,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'GET',
                CURLOPT_HTTPHEADER => array('Content-Type: application/json', 'Accept: application/json')
            ));
            $results[$key] = json_decode(curl_exec($curl), true);
            curl_close($curl);
        }
        catch(Exception $e) {
            $results[$key] = 'Message: ' .$e->getMessage();
        }
    }
    return $results;
}
?>