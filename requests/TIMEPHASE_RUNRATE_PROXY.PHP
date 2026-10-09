<?php
/*
 * ============================================================================================================================
 * AI-GENERATED CODE NOTICE
 * This file was authored with substantial assistance from an AI coding tool (Claude Code / Anthropic Claude). Review before
 * relying on it in production.
 * ----------------------------------------------------------------------------------------------------------------------------
 * TIMEPHASE_RUNRATE_PROXY.PHP  --  same-origin calc proxy for the timephasing instance-edit view (INDEX_ALT.PHP?...&timephase-
 * instance=<TPI_ID>). The browser cannot call the afotcosj004 RUNRATE endpoint directly (cross-origin preflight + GROSS_DPW is
 * a server-side lookup), so this add-only endpoint: (1) is session-gated like the other request endpoints, (2) sources GROSS_DPW
 * server-side from bods_jda_stage.brain_adi_alldb_all_noexport on afotcosj004, (3) server-to-server POSTs one batched RUNRATE
 * call to MAPPER_ADI_STANDARD.PHP, and (4) returns the enriched results keyed by the caller's per-setup KEY. Precedents mirrored:
 * modules/index-time/STATIC_CALC_INDX.PHP (session gate + Open_ILink("afotcosj004") + ExecuteIQuery) and requests/API.PHP (the
 * house-style curl_setopt_array server-to-server pattern; here CURLOPT_POST with a JSON body instead of GET).
 *
 * Field-agnostic envelope (2026-09-28 RM): for THIS build the caller only sends ATE WS / ATE PBS setups and only TD_EFF /
 * WFR_IDX_PCT are consumed, but the request/response shape is intentionally generic (an INPUT array in, a { KEY: {..enriched..} }
 * map out) so the later INDX / OEE auto-calc hookup -- which also applies to ATE FT -- can reuse this same proxy rather than a
 * new one. The RUNRATE call itself is not modified here; it is consumed as-is (a read for GROSS_DPW + the calc fan-out).
 *
 * Request  (POST, JSON body): { "INPUT": [ { KEY, UTPI, TTPI, INDX, OEE, RES_AREA, HANDLER, MFG_PART_NUM, SITE_NUM, STEP_NM,
 *                                            SAP_RTE_ID(optional) }, ... ] }   -- KEY is the caller's per-setup handle, echoed back.
 * Response (JSON):            { "ok": true,  "DATA": { "<KEY>": { "TD_EFF": <n>, "WFR_IDX_PCT": <n> }, ... } }
 *                             { "ok": false, "error": "<message>", "errors": { "<KEY>": "<why>", ... } }
 * On ANY per-item error (e.g. missing GROSS_DPW for a WS/PBS setup) the whole call fails so the client can hard-block Save.
 * ============================================================================================================================
 */

session_start();

require('../ENV.PHP');

header('Content-Type: application/json');

// --- auth guard: same SESSION gate the module pages / other request endpoints rely on. Credentials stay server-side. ---------
if (!isset($_SESSION['SYSTEM'])) {
    http_response_code(401);
    echo json_encode(array("ok" => false, "error" => "Not authenticated."));
    exit;
}

// --- read + validate the JSON body ------------------------------------------------------------------------------------------
$rawBody = file_get_contents('php://input');
$reqBody = json_decode($rawBody, true);

if (!is_array($reqBody) || !isset($reqBody['INPUT']) || !is_array($reqBody['INPUT']) || count($reqBody['INPUT']) == 0) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Missing or invalid INPUT array."));
    exit;
}

$aryInput   = $reqBody['INPUT'];
$io_ws_areas = array('ATE WS', 'ATE PBS'); // RES_AREA values for which TD_EFF/WFR_IDX_PCT are meaningful (need GROSS_DPW).

// --- DB handle for the GROSS_DPW lookup (afotcosj004, NOT the local BRAIN DB) -----------------------------------------------
include_once("/var/www/html/MYSQLI_COMMON_FUNCTIONS.PHP");
$iConRLM = Open_ILink("afotcosj004");

// Accumulators: $aryOut = final KEY -> {TD_EFF,WFR_IDX_PCT}; $aryRunrateInput = the batched RUNRATE payload; $aryKeyByIdx maps
// each RUNRATE INPUT position back to its KEY (RUNRATE returns DATA in INPUT order); $aryErrors collects any per-item failure.
$aryOut          = array();
$aryRunrateInput = array();
$aryKeyByIdx     = array();
$aryErrors       = array();

foreach ($aryInput as $item) {

    $key = isset($item['KEY']) ? (string)$item['KEY'] : '';
    if ($key === '') { continue; } // a KEY-less item cannot be matched back to a cell; skip it defensively.

    $res_area = isset($item['RES_AREA']) ? strtoupper(trim($item['RES_AREA'])) : '';
    $is_ws    = in_array($res_area, $io_ws_areas, true);

    // Non-WS/PBS setups have no wafer index-time component: the calc is trivially TD_EFF=1, WFR_IDX_PCT=1 -- resolve locally and
    // never hit RUNRATE for them (this build's client only sends WS/PBS, but stay defensive for the later INDX/OEE reuse).
    if (!$is_ws) {
        $aryOut[$key] = array("TD_EFF" => 1, "WFR_IDX_PCT" => 1);
        continue;
    }

    // WS/PBS -> GROSS_DPW is required. Look it up by MFG_PART_NUM / SITE_NUM / RES_AREA / STEP_NM (+ SAP_RTE_ID when supplied,
    // for route precision). String keys are escaped against the live connection; the noexport table is the RUNRATE_HELPER source.
    $mpn  = isset($item['MFG_PART_NUM']) ? mysqli_real_escape_string($iConRLM, $item['MFG_PART_NUM']) : '';
    $site = isset($item['SITE_NUM'])     ? mysqli_real_escape_string($iConRLM, $item['SITE_NUM'])     : '';
    $step = isset($item['STEP_NM'])      ? mysqli_real_escape_string($iConRLM, $item['STEP_NM'])      : '';
    $rarea_esc = mysqli_real_escape_string($iConRLM, $res_area);

    $rteFilter = '';
    if (isset($item['SAP_RTE_ID']) && $item['SAP_RTE_ID'] !== '' && $item['SAP_RTE_ID'] !== null) {
        $rte_esc   = mysqli_real_escape_string($iConRLM, $item['SAP_RTE_ID']);
        $rteFilter = " AND SAP_RTE_ID = '".$rte_esc."' ";
    }

    $strSQL = "
        SELECT GROSS_DPW
        FROM bods_jda_stage.brain_adi_alldb_all_noexport
        WHERE MFG_PART_NUM = '".$mpn."'
          AND SITE_NUM     = '".$site."'
          AND RES_AREA     = '".$rarea_esc."'
          AND STEP_NM      = '".$step."'
          ".$rteFilter."
        LIMIT 1;";

    $RSMain    = ExecuteIQuery($strSQL, $iConRLM);
    $gross_dpw = null;
    if ($RSMain && ($LineMain = mysqli_fetch_assoc($RSMain)) !== null) {
        $gross_dpw = $LineMain['GROSS_DPW'];
    }

    if ($gross_dpw === null || $gross_dpw === '' || (float)$gross_dpw <= 0) {
        // Without a positive GROSS_DPW the WS/PBS calc cannot run -- record the failure so the whole call hard-fails downstream.
        $aryErrors[$key] = "No GROSS_DPW for ".$item['MFG_PART_NUM']." / ".$item['SITE_NUM']." / ".$res_area." / ".$item['STEP_NM'].".";
        continue;
    }

    // Build the RUNRATE INPUT item: ATTR carries the numeric calc inputs, XA carries the classification the formula branches on.
    $aryKeyByIdx[] = $key;
    $aryRunrateInput[] = array(
        "ATTR" => array(
            "UTPI"      => isset($item['UTPI']) ? (float)$item['UTPI'] : 0,
            "TTPI"      => isset($item['TTPI']) ? (float)$item['TTPI'] : 0,
            "INDX"      => isset($item['INDX']) ? (float)$item['INDX'] : 0,
            "OEE"       => isset($item['OEE'])  ? (float)$item['OEE']  : 0,
            "GROSS_DPW" => (float)$gross_dpw
        ),
        "XA" => array(
            "RES_AREA" => $res_area,
            "HANDLER"  => isset($item['HANDLER']) ? $item['HANDLER'] : ''
        )
    );
}

mysqli_close($iConRLM);

// If any WS/PBS setup could not resolve GROSS_DPW, fail the whole batch (all-or-nothing, so the client keeps Save disabled).
if (count($aryErrors) > 0) {
    http_response_code(422);
    echo json_encode(array("ok" => false, "error" => "One or more setups could not be computed.", "errors" => $aryErrors));
    exit;
}

// --- server-to-server RUNRATE call (only when there is at least one WS/PBS setup to compute) --------------------------------
if (count($aryRunrateInput) > 0) {

    $payload = json_encode(array(
        "INPUT_TYPE"  => "JSON",
        "OUTPUT_TYPE" => "RUNRATE",
        "INPUT"       => $aryRunrateInput
    ));

    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL            => 'http://afotcosj004.maxim-ic.com/API/MAPPER_ADI_STANDARD.PHP',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING       => '',
        CURLOPT_MAXREDIRS      => 10,
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => array('Content-Type: application/json', 'Accept: application/json')
    ));
    $rawResp  = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($curl);
    curl_close($curl);

    if ($rawResp === false || $curlErr !== '') {
        http_response_code(502);
        echo json_encode(array("ok" => false, "error" => "RUNRATE call failed: ".$curlErr));
        exit;
    }

    $resp = json_decode($rawResp, true);

    // RUNRATE returns { STATUS, MESSAGE, DATA:[...] } with honest HTTP codes. Treat a >=400 code, a missing/short DATA array, or
    // an explicit FAILURE status as a hard failure so the client will not save partial / stale computed values.
    if ($httpCode >= 400 || !is_array($resp) || !isset($resp['DATA']) || !is_array($resp['DATA'])) {
        http_response_code(502);
        $msg = (is_array($resp) && isset($resp['MESSAGE'])) ? $resp['MESSAGE'] : ("Unexpected RUNRATE response (HTTP ".$httpCode).")";
        echo json_encode(array("ok" => false, "error" => $msg));
        exit;
    }
    if (isset($resp['STATUS']) && strtoupper((string)$resp['STATUS']) === 'FAILURE') {
        http_response_code(502);
        echo json_encode(array("ok" => false, "error" => isset($resp['MESSAGE']) ? $resp['MESSAGE'] : "RUNRATE reported FAILURE."));
        exit;
    }
    if (count($resp['DATA']) < count($aryRunrateInput)) {
        http_response_code(502);
        echo json_encode(array("ok" => false, "error" => "RUNRATE returned fewer results than requested."));
        exit;
    }

    // Map each returned DATA row back to its KEY by position (RUNRATE preserves INPUT order) and keep only the two fields the
    // caller consumes in this build. TD_EFF/WFR_IDX_PCT are the derived outputs the client stamps into the col-34/35 cells.
    foreach ($aryKeyByIdx as $idx => $key) {
        $row = $resp['DATA'][$idx];
        $aryOut[$key] = array(
            "TD_EFF"      => isset($row['TD_EFF'])      ? $row['TD_EFF']      : null,
            "WFR_IDX_PCT" => isset($row['WFR_IDX_PCT']) ? $row['WFR_IDX_PCT'] : null
        );
    }
}

echo json_encode(array("ok" => true, "DATA" => $aryOut));
?>
