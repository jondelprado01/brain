<?php
/*
 * DEFAULT_ATOM_BULK_CRUD.PHP
 * ---------------------------------------------------------------------------
 * 2026-09-01 RM (AI: Claude Code): NEW file. Server endpoint backing the Bulk Edit (paste-from-Excel) workflow on the
 * alternate default-atom page (modules/default-atom/INDEX_NEW.PHP + js/default-atom-new.js). It touches NO existing file:
 * it is a brand-new endpoint that mirrors the access/auth + dry-run write idiom of index-time's INDEX_OVERRIDE_CRUD.PHP.
 *
 * Target table (LIVE): BRAIN.DEFAULT_ATOM on mxhtafot01l.maxim-ic.com -> Open_ILink("MXHTAFOT01L").
 *   Columns: DA_ID (PK, AUTO_INC), RESOURCE_TYPE, SITE_NUM, RES_AREA, ENG_NAME, ATOM_NAME, CHANGED_BY, CHANGED_DT.
 *
 * This is EDIT-ONLY (never inserts): every row must carry an existing DA_ID. UI-label -> DB-column mapping:
 *   DA_ID=DA_ID, TYPE=RESOURCE_TYPE, SITE=SITE_NUM, RES_AREA=RES_AREA, ENG_NAME=ENG_NAME, ATOM_NAME=ATOM_NAME.
 *
 * Writable set: SITE_NUM, RES_AREA, ATOM_NAME (+ CHANGED_BY/CHANGED_DT set as a consequence). DA_ID is the lookup key.
 * TYPE and ENG_NAME are match-only / non-modifiable: each is checked ONLY when a value is entered, and if entered it must
 * equal the record's value (mismatch -> refused); neither is ever written. Writable values are further constrained at
 * this time: SITE_NUM must be one of {ADGT, ADPI} and RES_AREA one of {ATE FT, ATE WS, ATE PBS}. A row whose three
 * writable values already equal the DB is reported "no_change" and skipped.
 *
 * Request:  POST action = bulk_edit_check | bulk_edit   (+ rows = JSON array, dry_run = "0"|"1")
 *   Per-row JSON keys: { da_id, type, site, res_area, eng_name, atom_name }  (CHANGED_BY/CHANGED_DT ignored on input)
 * Response: JSON
 *   bulk_edit_check -> { ok:true, all_valid:bool, update_count, no_change_count, error_count, dry_run_forced, rows:[...] }
 *   bulk_edit       -> { ok:true, dry_run:bool, dry_run_forced:bool, update_count, no_change_count, sql:[...] }
 *                        - DRY RUN: NOTHING is run against the server (no BEGIN/UPDATE/COMMIT); "sql" is just the list of
 *                          UPDATE statements that WOULD have run, for preview. LIVE: "sql" is BEGIN + UPDATEs + COMMIT.
 *                      { ok:false, revalidate:true, rows:[...] , ... }   (something changed / no longer valid)
 *   Per-row result:   { index, da_id, status, errors:[...], db_type?, db_eng? }
 *     status: ok | no_change | invalid | not_found | type_mismatch | eng_mismatch | dup_in_paste
 *
 * Security: auth is re-derived SERVER-SIDE from $_SESSION (never from the posted user_details, which is spoofable):
 *   1) logged in  -> $_SESSION['SYSTEM'] set (same gate every module page uses).
 *   2) authorized -> BRAIN.USER_ACCOUNT_ROLES for this EMP_ID contains USER_GROUP 'SCM Cap Planning' or 'all' (= Admin).
 *   CHANGED_BY is read from BRAIN.USER_ACCOUNT.EMP_NAME for the session EMP_ID (falls back to $_SESSION['EMP_NAME']).
 */

session_start();

require('../../ENV.PHP');

header('Content-Type: application/json');

// Match the write timezone used by the existing DEFAULT_ATOM.PHP endpoint so CHANGED_DT lands in local (Manila) time.
date_default_timezone_set('Asia/Manila');

// --- auth guard #1: logged in (same SESSION gate the module pages rely on) --------------------------------------------
if (!isset($_SESSION['SYSTEM'])) {
    http_response_code(401);
    echo json_encode(array("ok" => false, "error" => "Not authenticated. Please log in again."));
    exit;
}

include_once("/var/www/html/MYSQLI_COMMON_FUNCTIONS.PHP");
$daCon = Open_ILink("MXHTAFOT01L");

// ---------------------------------------------------------------------------
// DRY-RUN switch.
//   Bulk Edit runs in DRY RUN (nothing is persisted): the transaction still BEGINs and every UPDATE runs so the SQL is
//   validated by the server, but it ends in ROLLBACK and the full list of executed statements is returned as "sql" for
//   preview. The UI checkbox "flips it on and off" by posting dry_run=0 (LIVE) / 1 (dry); the server treats anything other
//   than an explicit "0" as dry-run, so the safe default holds even if the flag is missing.
//
//   $DA_FORCE_DRY_RUN is a SERVER-SIDE master switch. While it is true, dry-run is ENFORCED: the client flag is ignored,
//   NO changes are ever written to the DB, and every response reports the SQL that would have run. This cannot be bypassed
//   by unchecking the UI box or by a crafted POST. To re-enable real (LIVE) writes later: set this to false AND re-enable
//   the "Dry Run" checkbox in modules/default-atom/INDEX_NEW.PHP (remove its `disabled`/`checked`-locked state).
// ---------------------------------------------------------------------------
$DA_FORCE_DRY_RUN = false;
$DA_DRY_RUN = $DA_FORCE_DRY_RUN || !(isset($_REQUEST['dry_run']) && (string)$_REQUEST['dry_run'] === '0');

// ---------------------------------------------------------------------------
// Allowed-value whitelists (enforced on the WRITABLE fields at this time). An input SITE / RES_AREA that is not exactly
// one of these (trimmed, case-sensitive) is refused so only canonical values can be written. Widen these lists to relax.
// PHP 5.4 cannot `const` an array, so these are plain vars pulled into DA_BULK_VALIDATE via `global`.
// ---------------------------------------------------------------------------
$DA_ALLOWED_SITE     = array('ADGT', 'ADPI');
$DA_ALLOWED_RES_AREA = array('ATE FT', 'ATE WS', 'ATE PBS');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/* Trim; empty string -> null. */
function da_norm($v) {
    if ($v === null) { return null; }
    $v = trim((string)$v);
    return ($v === "") ? null : $v;
}

/* Escaped 'string' literal for inline SQL (NULL literal when null). */
function da_sql_str($conn, $v) {
    if ($v === null) { return "NULL"; }
    return "'" . mysqli_real_escape_string($conn, $v) . "'";
}

/*
 * A required field is "blank" when it is empty OR consists only of dash characters (e.g. "-", "--"). Our own export
 * renders NULLs as blank and the on-screen table shows them as "--", so a pasted "--" must be treated as "not populated"
 * for the required-column rule the caller specified (must not trim to empty, must not consist only of dashes).
 */
function da_blank_or_dashes($v) {
    if ($v === null) { return true; }
    $t = trim((string)$v);
    if ($t === "") { return true; }
    return (preg_match('/^-+$/', $t) === 1);
}

/* True when $v (trimmed) exactly equals one of the allowed values. Case-sensitive so only canonical values pass. */
function da_in_allowed($v, $allowed) {
    $t = trim((string)$v);
    for ($i = 0; $i < count($allowed); $i++) {
        if ($t === $allowed[$i]) { return true; }
    }
    return false;
}

/* Compare two cell values as trimmed strings (null -> ""); used for the "no change" detection on writable columns. */
function da_eq($a, $b) {
    $a = ($a === null) ? "" : trim((string)$a);
    $b = ($b === null) ? "" : trim((string)$b);
    return ($a === $b);
}

/*
 * Resolve the logged-in user server-side and decide authorization. Identity comes from $_SESSION['EMP_NO'] (set at
 * login), NOT from any posted field. Returns array(allowed=>bool, emp_name=>string).
 *   - allowed : BRAIN.USER_ACCOUNT_ROLES for this EMP_ID has a USER_GROUP token 'SCM Cap Planning' or 'all' (= Admin).
 *   - emp_name: BRAIN.USER_ACCOUNT.EMP_NAME for this EMP_ID (falls back to $_SESSION['EMP_NAME'] if the row is absent).
 */
function da_current_user($conn) {
    $emp_no = isset($_SESSION['EMP_NO']) ? trim((string)$_SESSION['EMP_NO']) : "";
    $out = array("allowed" => false, "emp_name" => (isset($_SESSION['EMP_NAME']) ? $_SESSION['EMP_NAME'] : ""));
    if ($emp_no === "") { return $out; }
    $empEsc = mysqli_real_escape_string($conn, $emp_no);

    // display name (authoritative CHANGED_BY source)
    $rsN = ExecuteIQuery("SELECT EMP_NAME FROM BRAIN.USER_ACCOUNT WHERE EMP_ID = '" . $empEsc . "' LIMIT 1;", $conn);
    if ($rsN && ($n = mysqli_fetch_assoc($rsN)) && isset($n['EMP_NAME']) && trim((string)$n['EMP_NAME']) !== "") {
        $out['emp_name'] = $n['EMP_NAME'];
    }

    // role check: a USER_GROUP token of 'SCM Cap Planning' or 'all' (= Admin) grants access. USER_GROUP may be a single
    // value or a comma-separated list (that is how LOGIN.PHP treats it), so split on comma and exact-match each trimmed
    // token - do NOT substring-match, so 'all' cannot match inside another name.
    $rsR = ExecuteIQuery("SELECT USER_GROUP FROM BRAIN.USER_ACCOUNT_ROLES WHERE EMP_ID = '" . $empEsc . "';", $conn);
    if ($rsR) {
        while ($r = mysqli_fetch_assoc($rsR)) {
            $tokens = explode(",", isset($r['USER_GROUP']) ? (string)$r['USER_GROUP'] : "");
            for ($t = 0; $t < count($tokens); $t++) {
                $g = trim($tokens[$t]);
                if ($g === 'SCM Cap Planning' || $g === 'all') { $out['allowed'] = true; break 2; }
            }
        }
    }
    return $out;
}

/* Decode $_REQUEST['rows'] (JSON array of row objects) into a PHP array; anything malformed becomes an empty array. */
function da_bulk_rows() {
    if (!isset($_REQUEST['rows'])) { return array(); }
    $decoded = json_decode($_REQUEST['rows'], true);
    return is_array($decoded) ? $decoded : array();
}

/*
 * Validate the whole paste against the LIVE table and return a structured result. All-or-nothing: the caller enables
 * EXECUTE only when error_count === 0. "no_change" rows are valid (they just will not be written). One IN(...) lookup
 * fetches every referenced record by PK (cheap) and builds a da_id -> row map, so validation is a single round-trip.
 *
 * Required columns that must actually be populated (non-blank, not only dashes): DA_ID, SITE, RES_AREA, ATOM_NAME.
 * DA_ID must additionally be a whole number and must exist in the table (this is an edit, never an add). SITE and
 * RES_AREA are further whitelisted ($DA_ALLOWED_SITE / $DA_ALLOWED_RES_AREA). TYPE and ENG_NAME are NOT required and
 * never editable; each is checked ONLY when a value is entered, and if entered it must equal the record's value
 * (mismatch -> type_mismatch / eng_mismatch). A DA_ID that appears >1x in the paste marks each such row.
 */
function DA_BULK_VALIDATE($conn, $rowsIn) {
    global $DA_ALLOWED_SITE, $DA_ALLOWED_RES_AREA;
    $n = count($rowsIn);

    // pre-count DA_ID occurrences (by trimmed raw value) so duplicates in the paste can be flagged on every offending row
    $idCounts = array();
    for ($i = 0; $i < $n; $i++) {
        $rawId = da_norm(isset($rowsIn[$i]['da_id']) ? $rowsIn[$i]['da_id'] : null);
        if ($rawId !== null) {
            $idCounts[$rawId] = isset($idCounts[$rawId]) ? $idCounts[$rawId] + 1 : 1;
        }
    }

    // gather the numeric DA_IDs and fetch their records in one PK IN(...) query
    $ids = array();
    for ($i = 0; $i < $n; $i++) {
        $rawId = da_norm(isset($rowsIn[$i]['da_id']) ? $rowsIn[$i]['da_id'] : null);
        if ($rawId !== null && ctype_digit($rawId)) { $ids[(int)$rawId] = true; }
    }
    $dbMap = array();
    if (!empty($ids)) {
        $idList = implode(",", array_keys($ids));
        $rs = ExecuteIQuery(
            "SELECT DA_ID, RESOURCE_TYPE, SITE_NUM, RES_AREA, ENG_NAME, ATOM_NAME FROM BRAIN.DEFAULT_ATOM WHERE DA_ID IN (" . $idList . ");",
            $conn
        );
        if ($rs) {
            while ($row = mysqli_fetch_assoc($rs)) { $dbMap[(string)$row['DA_ID']] = $row; }
        }
    }

    // per-column required-field check driver: request key -> human label. TYPE and ENG_NAME are intentionally absent:
    // neither is required and neither is editable - each is only verified below when a value is actually entered.
    $required = array(
        'site'      => 'SITE',
        'res_area'  => 'RES_AREA',
        'atom_name' => 'ATOM_NAME'
    );

    $rows = array();
    $updateCount = 0; $noChangeCount = 0; $errorCount = 0;

    for ($i = 0; $i < $n; $i++) {
        $r        = $rowsIn[$i];
        $rawId    = da_norm(isset($r['da_id']) ? $r['da_id'] : null);
        $type     = isset($r['type'])      ? $r['type']      : null;
        $site     = isset($r['site'])      ? $r['site']      : null;
        $res_area = isset($r['res_area'])  ? $r['res_area']  : null;
        $eng_name = isset($r['eng_name'])  ? $r['eng_name']  : null;
        $atom     = isset($r['atom_name']) ? $r['atom_name'] : null;

        $errors = array();

        // DA_ID: required, must be a whole number (bulk edit cannot add rows, so an empty/NEW DA_ID is refused outright)
        if (da_blank_or_dashes($rawId)) {
            $errors[] = "DA_ID is required (this is a bulk edit, not an add).";
        } else if (!ctype_digit($rawId)) {
            $errors[] = "DA_ID must be a whole number.";
        }

        // the other required columns must actually be populated
        foreach ($required as $key => $label) {
            $val = isset($r[$key]) ? $r[$key] : null;
            if (da_blank_or_dashes($val)) {
                $errors[] = $label . " is required (cannot be blank or only dashes).";
            }
        }

        // whitelist the two writable code columns (only enforced when populated - the "required" rule above already
        // flags a blank one). An out-of-list value is refused so only canonical SITE / RES_AREA values can be written.
        $siteN = da_norm($site);
        if ($siteN !== null && !da_in_allowed($siteN, $DA_ALLOWED_SITE)) {
            $errors[] = 'SITE must be one of: ' . implode(', ', $DA_ALLOWED_SITE) . ' (got "' . $siteN . '").';
        }
        $resN = da_norm($res_area);
        if ($resN !== null && !da_in_allowed($resN, $DA_ALLOWED_RES_AREA)) {
            $errors[] = 'RES_AREA must be one of: ' . implode(', ', $DA_ALLOWED_RES_AREA) . ' (got "' . $resN . '").';
        }

        $status = null;
        $db_type = null;
        $db_eng  = null;

        if (!empty($errors)) {
            $status = "invalid";
        } else if (isset($idCounts[$rawId]) && $idCounts[$rawId] > 1) {
            $status = "dup_in_paste";
        } else if (!isset($dbMap[$rawId])) {
            $status = "not_found";
        } else {
            $db = $dbMap[$rawId];
            $db_type = $db['RESOURCE_TYPE'];
            $db_eng  = $db['ENG_NAME'];
            // TYPE and ENG_NAME are optional and non-editable: only reject when a value was entered AND it disagrees
            // with the record (blank = "leave alone / don't verify"). Neither is ever written.
            if (!da_blank_or_dashes($type) && !da_eq($type, $db['RESOURCE_TYPE'])) {
                $status = "type_mismatch";
            } else if (!da_blank_or_dashes($eng_name) && !da_eq($eng_name, $db['ENG_NAME'])) {
                $status = "eng_mismatch";
            } else {
                // no_change when all writable columns (SITE_NUM, RES_AREA, ATOM_NAME) already equal the DB; else update
                $changed = (!da_eq($site,     $db['SITE_NUM'])) ||
                           (!da_eq($res_area, $db['RES_AREA'])) ||
                           (!da_eq($atom,     $db['ATOM_NAME']));
                $status = $changed ? "ok" : "no_change";
            }
        }

        if     ($status === "ok")        { $updateCount++; }
        else if ($status === "no_change"){ $noChangeCount++; }
        else                             { $errorCount++; }

        $entry = array(
            "index"  => $i,
            "da_id"  => ($rawId === null ? "" : $rawId),
            "status" => $status,
            "errors" => $errors
        );
        if ($db_type !== null) { $entry["db_type"] = $db_type; }
        if ($db_eng  !== null) { $entry["db_eng"]  = $db_eng; }
        $rows[] = $entry;
    }

    return array(
        "rows"            => $rows,
        "all_valid"       => ($errorCount === 0 && $n > 0),
        "update_count"    => $updateCount,
        "no_change_count" => $noChangeCount,
        "error_count"     => $errorCount,
        "count"           => $n
    );
}

$action = isset($_REQUEST['action']) ? strtolower(trim($_REQUEST['action'])) : "";

// --- auth guard #2: role gate (SCM Cap Planning or all), derived from the session identity -----------------------------
$me = da_current_user($daCon);
if (!$me['allowed']) {
    http_response_code(403);
    echo json_encode(array("ok" => false, "error" => "You are not authorized to bulk edit Default Atoms (requires the 'SCM Cap Planning' or Admin role)."));
    mysqli_close($daCon);
    exit;
}

// ----- action: bulk_edit_check (validate only, no writes) -------------------------------------------------------------
if ($action === "bulk_edit_check") {
    $rowsIn = da_bulk_rows();
    if (empty($rowsIn)) {
        echo json_encode(array("ok" => false, "error" => "No rows to validate."));
        mysqli_close($daCon);
        exit;
    }
    $res = DA_BULK_VALIDATE($daCon, $rowsIn);
    echo json_encode(array(
        "ok"              => true,
        "all_valid"       => $res['all_valid'],
        "update_count"    => $res['update_count'],
        "no_change_count" => $res['no_change_count'],
        "error_count"     => $res['error_count'],
        "dry_run_forced"  => $DA_FORCE_DRY_RUN,
        "rows"            => $res['rows']
    ));
    mysqli_close($daCon);
    exit;
}

// ----- action: bulk_edit (apply; honors the dry-run flag) -------------------------------------------------------------
if ($action === "bulk_edit") {
    $rowsIn = da_bulk_rows();
    if (empty($rowsIn)) {
        echo json_encode(array("ok" => false, "error" => "No rows to apply."));
        mysqli_close($daCon);
        exit;
    }

    // re-validate on the server before writing; refuse the whole batch if anything is off (all-or-nothing)
    $res = DA_BULK_VALIDATE($daCon, $rowsIn);
    if (!$res['all_valid']) {
        echo json_encode(array(
            "ok"              => false,
            "revalidate"      => true,
            "error"           => "The paste is no longer valid; re-check before applying.",
            "all_valid"       => false,
            "update_count"    => $res['update_count'],
            "no_change_count" => $res['no_change_count'],
            "error_count"     => $res['error_count'],
            "rows"            => $res['rows']
        ));
        mysqli_close($daCon);
        exit;
    }

    // build one UPDATE per "ok" row (skip "no_change" rows entirely - nothing to write, so CHANGED_BY/DT stay untouched)
    $changedBy = da_sql_str($daCon, $me['emp_name']);
    $now       = date('Y-m-d H:i:s');
    $nowSql    = da_sql_str($daCon, $now);

    $aryStmts = array();
    for ($i = 0; $i < count($res['rows']); $i++) {
        if ($res['rows'][$i]['status'] !== "ok") { continue; }
        $r = $rowsIn[$i];
        $daId = (int)$res['rows'][$i]['da_id'];
        $aryStmts[] =
            "UPDATE BRAIN.DEFAULT_ATOM SET " .
            "SITE_NUM = "   . da_sql_str($daCon, da_norm($r['site']))      . ", " .
            "RES_AREA = "   . da_sql_str($daCon, da_norm($r['res_area']))  . ", " .
            "ATOM_NAME = "  . da_sql_str($daCon, da_norm($r['atom_name'])) . ", " .
            "CHANGED_BY = " . $changedBy . ", " .
            "CHANGED_DT = " . $nowSql .
            " WHERE DA_ID = " . $daId . ";";
    }

    // DRY RUN: run NOTHING against the server - no BEGIN, no UPDATE, no COMMIT/ROLLBACK. Only return the SQL that WOULD
    // have executed so the user can review it. (Validation above is read-only SELECTs; the write path stays untouched.)
    if ($DA_DRY_RUN) {
        echo json_encode(array(
            "ok"              => true,
            "dry_run"         => true,
            "dry_run_forced"  => $DA_FORCE_DRY_RUN,
            "update_count"    => $res['update_count'],
            "no_change_count" => $res['no_change_count'],
            "sql"             => $aryStmts
        ));
        mysqli_close($daCon);
        exit;
    }

    // LIVE: wrap the UPDATEs in a transaction so a mid-batch failure rolls the whole set back (all-or-nothing).
    $aryRan = array();
    $aryRan[] = "BEGIN;";
    ExecuteIQuery("BEGIN;", $daCon);

    foreach ($aryStmts as $strSQL) {
        $aryRan[] = $strSQL;
        ExecuteIQuery($strSQL, $daCon);
        // mysqli_error() reflects the last statement on this connection; non-empty means this UPDATE failed -> roll back
        if (mysqli_error($daCon) !== "") {
            ExecuteIQuery("ROLLBACK;", $daCon);
            $aryRan[] = "ROLLBACK;";
            echo json_encode(array("ok" => false, "error" => "Update failed; the whole batch was rolled back.", "sql" => $aryRan));
            mysqli_close($daCon);
            exit;
        }
    }

    ExecuteIQuery("COMMIT;", $daCon);
    $aryRan[] = "COMMIT;";

    echo json_encode(array(
        "ok"              => true,
        "dry_run"         => false,
        "dry_run_forced"  => $DA_FORCE_DRY_RUN,
        "update_count"    => $res['update_count'],
        "no_change_count" => $res['no_change_count'],
        "sql"             => $aryRan
    ));
    mysqli_close($daCon);
    exit;
}

// ----- unknown action -------------------------------------------------------------------------------------------------
http_response_code(400);
echo json_encode(array("ok" => false, "error" => "Unknown action."));
mysqli_close($daCon);
exit;
?>
