<?php
/*
 * STATIC_CALC_INDX.PHP
 * ---------------------------------------------------------------------------
 * Additive endpoint for the index-time "calc" page (INDEX_calc.PHP).
 * Returns the rows from bods_jda_stage.static_calc_indx that match a given
 * ISD_ID, as JSON, for display in a popup table.
 *
 * Request:  POST or GET   ISD_ID = <integer>
 * Response: { "ok": true, "isd_id": <int>, "columns": [...], "rows": [ {..}, .. ] }
 *           { "ok": false, "error": "<message>" }
 *
 * This file does NOT modify any existing module. It mirrors the local-MySQL
 * access pattern already used by INDEX.PHP (Open_ILink / ExecuteIQuery).
 */

session_start();

require('../../ENV.PHP');

header('Content-Type: application/json');

// --- auth guard: same SESSION gate the module pages rely on ----------------
if (!isset($_SESSION['SYSTEM'])) {
    http_response_code(401);
    echo json_encode(array("ok" => false, "error" => "Not authenticated."));
    exit;
}

// --- validate input --------------------------------------------------------
$rawISDID = isset($_REQUEST['ISD_ID']) ? $_REQUEST['ISD_ID'] : null;

if ($rawISDID === null || $rawISDID === "" || !ctype_digit((string)$rawISDID)) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Missing or invalid ISD_ID."));
    exit;
}

$intISDID = (int)$rawISDID;

// --- query ------------------------------------------------------------------
include_once("/var/www/html/MYSQLI_COMMON_FUNCTIONS.PHP");

// static_calc_indx lives on afotcosj004, not the local BRAIN DB.
$iConRLM = Open_ILink("afotcosj004");

// ISD_ID is validated as an integer above, so it is safe to inline.
$strSQL = "
    SELECT *
    FROM bods_jda_stage.static_calc_indx
    WHERE ISD_ID = ".$intISDID."
    ORDER BY ISD_ID;";

$RSMain  = ExecuteIQuery($strSQL, $iConRLM);

$aryRows = array();
$aryCols = array();

if ($RSMain) {
    while ($LineMain = mysqli_fetch_assoc($RSMain)) {
        if (empty($aryCols)) {
            $aryCols = array_keys($LineMain);
        }
        $aryRows[] = $LineMain;
    }
}

mysqli_close($iConRLM);

echo json_encode(array(
    "ok"      => true,
    "isd_id"  => $intISDID,
    "columns" => $aryCols,
    "rows"    => $aryRows
));
?>
