<?php
/*
 * INDEX_OVERRIDE_CRUD.PHP
 * ---------------------------------------------------------------------------
 * Additive CRUD endpoint for the index-time "calc" page (INDEX_calc.PHP).
 *
 * Backs the add / edit / delete editor modal for BRAIN.V_INDEX_OVERRIDE.
 * The view joins two base tables, so writes target the base tables directly:
 *   - brain.index_spec_master (ism) : ISM_ID(PK,AUTO_INC), INDX_VALUE,
 *       TTPI_THRESHOLD, COEFFICIENT, CONSTANT, THRESHOLD_FORMULA, INDX_FORMULA
 *   - brain.index_spec_data   (isd) : ISD_ID(PK,AUTO_INC), ISM_ID(FK), HANDLER,
 *       PACKAGE, SOAK_TIME, BODY_SIZE, LEAD_COUNT_MIN, LEAD_COUNT_MAX,
 *       TEMP_CLASS, UTPI, SHA1_ROW_VALUE
 * Both live on mxhtafot01l.maxim-ic.com -> Open_ILink("MXHTAFOT01L").
 *
 * Relationship is 1:1: add inserts one master + one data row; delete removes
 * both. SHA1_ROW_VALUE is left NULL on insert (populated elsewhere).
 *
 * Request:  POST  action = check | save | delete   (+ fields below)
 * Response: JSON  { ok:bool, ... }
 *
 *   action=check  -> { ok:true, exists:bool, isd_id:?int }
 *   action=save   -> { ok:true, mode:"insert"|"update", isd_id:int, ism_id:int }
 *                    { ok:false, duplicate:true }
 *                    { ok:false, errors:[...] }
 *   action=delete -> { ok:true } | { ok:false, error:"..." }
 *
 * This file does NOT modify any existing module. It mirrors the access/auth
 * pattern of STATIC_CALC_INDX.PHP and the write idiom of ADI_FUNCTIONS_022.PHP.
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/* Trim a request value; empty string -> null ("empty strings are blank"). */
function io_norm($v) {
    if ($v === null) {
        return null;
    }
    $v = trim((string)$v);
    return ($v === "") ? null : $v;
}

/* Render a value for inline SQL: NULL literal when null, else 'escaped'. */
function io_sql_str($conn, $v) {
    if ($v === null) {
        return "NULL";
    }
    return "'" . mysqli_real_escape_string($conn, $v) . "'";
}

/* Render a numeric value for inline SQL: NULL literal when null, else the
 * number as the user typed it (already validated numeric). Kept as the raw
 * trimmed string so values like -0.99 are not reformatted. */
function io_sql_num($v) {
    if ($v === null) {
        return "NULL";
    }
    return $v + 0; // numeric context; $v has passed is_numeric()
}

/* Is this a numeric string? (blank already normalised to null upstream) */
function io_is_num($v) {
    return ($v !== null && is_numeric($v));
}

/*
 * Has a field's value actually changed vs. what's already stored?
 * $kind is "num" or "str". $newVal is the normalised new value (null = blank).
 * $curVal is the current DB value from mysqli_fetch_assoc (null or string).
 * Blank (null) and empty string are treated as the same "blank" state so an
 * unchanged empty field is not flagged as a change. Numerics compare by value
 * (so 0.85 == 0.850000), text compares exactly. Used to emit SET clauses only
 * for columns whose value differs.
 */
function io_changed($kind, $newVal, $curVal) {
    $newBlank = ($newVal === null || $newVal === "");
    $curBlank = ($curVal === null || $curVal === "");
    if ($newBlank && $curBlank) { return false; }
    if ($newBlank !== $curBlank) { return true; }
    if ($kind === "num") {
        return ((float)$newVal !== (float)$curVal);
    }
    return ((string)$newVal !== (string)$curVal);
}

/*
 * Normalise a numeric token to significant digits for use inside a formula:
 * drop trailing zeros after the decimal point (and a bare trailing point), so
 * -0.990 -> -0.99, 5.00 -> 5, 1.90 -> 1.9. The value is unchanged; only the
 * textual form is trimmed. This keeps formula strings stable when the user
 * re-enters an equal-but-differently-typed number, yielding more "no change"
 * cases on edit. Non-decimal / non-numeric tokens are returned untouched.
 */
function io_sig($v) {
    if ($v === null) {
        return $v;
    }
    $s = trim((string)$v);
    if ($s === "") {
        return $s;
    }
    // only touch plain decimals with a fractional part (optional sign)
    if (preg_match('/^[+-]?\d*\.\d+$/', $s)) {
        $s = rtrim($s, "0");
        $s = rtrim($s, ".");
    }
    return $s;
}

/*
 * Build the two formula strings exactly as stored in production, e.g.
 *   threshold_formula = UTPI*((-0.99*TESTTIME)+2.65)
 *   final_formula     = IF(TTPI>=1.9,0.85,UTPI*((-0.99*TTPU)+2.65))
 * Numeric tokens are reduced to significant digits (io_sig) so trailing zeros
 * do not create spurious differences. TESTTIME and TTPU denote the same
 * quantity; each column keeps the literal token seen in prod.
 */
function IO_BUILD_FORMULAS($coeffRaw, $constRaw, $ttpiThreshRaw, $indexValRaw) {
    $coeff = io_sig($coeffRaw);
    $const = io_sig($constRaw);
    $thr   = io_sig($ttpiThreshRaw);
    $idx   = io_sig($indexValRaw);
    $threshold = "UTPI*((" . $coeff . "*TESTTIME)+" . $const . ")";
    $final     = "IF(TTPI>=" . $thr . "," . $idx
               . ",UTPI*((" . $coeff . "*TTPU)+" . $const . "))";
    return array($threshold, $final);
}

/*
 * Pull the 8 combination fields from the request, normalised (blank -> null).
 * Returns an associative array keyed by DB column name.
 */
function io_read_combo() {
    return array(
        "HANDLER"        => io_norm(isset($_REQUEST['handler'])        ? $_REQUEST['handler']        : null),
        "PACKAGE"        => io_norm(isset($_REQUEST['package'])        ? $_REQUEST['package']        : null),
        "SOAK_TIME"      => io_norm(isset($_REQUEST['soak_time'])      ? $_REQUEST['soak_time']      : null),
        "BODY_SIZE"      => io_norm(isset($_REQUEST['body_size'])      ? $_REQUEST['body_size']      : null),
        "LEAD_COUNT_MIN" => io_norm(isset($_REQUEST['lead_count_min']) ? $_REQUEST['lead_count_min'] : null),
        "LEAD_COUNT_MAX" => io_norm(isset($_REQUEST['lead_count_max']) ? $_REQUEST['lead_count_max'] : null),
        "TEMP_CLASS"     => io_norm(isset($_REQUEST['temp_class'])     ? $_REQUEST['temp_class']     : null),
        "UTPI"           => io_norm(isset($_REQUEST['utpi'])           ? $_REQUEST['utpi']           : null)
    );
}

/*
 * Validate the combination fields. Returns an array of error strings (empty
 * when valid). soak_time / lead_count_min / lead_count_max are nullable but,
 * when present, must be numeric > 0. utpi is required, integer >= 1.
 */
function io_validate_combo($combo) {
    $errors = array();

    // nullable-but-positive numerics
    $posFields = array(
        "SOAK_TIME"      => "Soak Time",
        "LEAD_COUNT_MIN" => "Leads Min",
        "LEAD_COUNT_MAX" => "Leads Max"
    );
    foreach ($posFields as $key => $label) {
        $val = $combo[$key];
        if ($val !== null) {
            if (!is_numeric($val) || ($val + 0) <= 0) {
                $errors[] = $label . " must be a number greater than 0.";
            }
        }
    }

    // when both lead counts are present, min must be <= max
    $lcMin = $combo["LEAD_COUNT_MIN"];
    $lcMax = $combo["LEAD_COUNT_MAX"];
    if ($lcMin !== null && $lcMax !== null
        && is_numeric($lcMin) && is_numeric($lcMax)
        && ($lcMin + 0) > ($lcMax + 0)) {
        $errors[] = "Leads Min must be less than or equal to Leads Max.";
    }

    // handler: required, never blank/null
    if ($combo["HANDLER"] === null) {
        $errors[] = "Handler is required.";
    }

    // utpi: required, integer >= 1 (never blank/null)
    $utpi = $combo["UTPI"];
    if ($utpi === null) {
        $errors[] = "UTPI is required.";
    } else if (!ctype_digit((string)$utpi) || (int)$utpi < 1) {
        $errors[] = "UTPI must be an integer >= 1.";
    }

    return $errors;
}

/*
 * Duplicate/collision test against the combination columns.
 *
 * The six scalar fields (HANDLER, PACKAGE, SOAK_TIME, BODY_SIZE, TEMP_CLASS,
 * UTPI) must match exactly -- the <=> operator is used so NULL <=> NULL is true
 * (blank fields participate in the match).
 *
 * LEAD_COUNT_MIN / LEAD_COUNT_MAX are treated as an INCLUSIVE range and a
 * collision occurs when the new [min,max] range OVERLAPS an existing row's
 * range (not only when the endpoints match exactly). Two inclusive ranges
 * [aMin,aMax] and [bMin,bMax] overlap iff aMin <= bMax AND bMin <= aMax.
 * A NULL bound is treated as open-ended (NULL min = -infinity, NULL max =
 * +infinity), so a NULL side never rules an overlap out.
 *
 * Example: an existing row min=14,max=16 and a row min=8,max=8 do not overlap;
 * but editing the 8..8 row to 14..16 would then overlap the first row and is
 * reported as a collision.
 *
 * Optionally excludes a given ISD_ID (so editing a row does not collide with
 * itself). Returns the matching ISD_ID (int) or null.
 */
function IO_DUP_EXISTS($conn, $combo, $excludeIsdId) {
    $newMin = io_sql_num($combo["LEAD_COUNT_MIN"]); // number or "NULL"
    $newMax = io_sql_num($combo["LEAD_COUNT_MAX"]); // number or "NULL"

    // overlap: newMin <= existing.max  AND  existing.min <= newMax,
    // with NULL treated as open-ended on either side.
    $overlap =
          "(" . $newMin . " IS NULL OR LEAD_COUNT_MAX IS NULL OR " . $newMin . " <= LEAD_COUNT_MAX)"
        . " AND "
        . "(LEAD_COUNT_MIN IS NULL OR " . $newMax . " IS NULL OR LEAD_COUNT_MIN <= " . $newMax . ")";

    $sql = "SELECT ISD_ID FROM brain.index_spec_data WHERE "
         . "HANDLER <=> "   . io_sql_str($conn, $combo["HANDLER"])   . " AND "
         . "PACKAGE <=> "   . io_sql_str($conn, $combo["PACKAGE"])   . " AND "
         . "SOAK_TIME <=> " . io_sql_str($conn, $combo["SOAK_TIME"]) . " AND "
         . "BODY_SIZE <=> " . io_sql_str($conn, $combo["BODY_SIZE"]) . " AND "
         . "TEMP_CLASS <=> ". io_sql_str($conn, $combo["TEMP_CLASS"]). " AND "
         . "UTPI <=> "      . io_sql_str($conn, $combo["UTPI"])      . " AND "
         . "(" . $overlap . ")";
    if ($excludeIsdId !== null) {
        $sql .= " AND ISD_ID <> " . (int)$excludeIsdId;
    }
    $sql .= " LIMIT 1;";

    $rs = ExecuteIQuery($sql, $conn);
    if ($rs && ($row = mysqli_fetch_assoc($rs))) {
        return (int)$row["ISD_ID"];
    }
    return null;
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

/*
 * DRY-RUN switch.
 * When true, save/delete still BEGIN a transaction and execute every write
 * statement (so SQL is validated by the server and mysqli_insert_id resolves),
 * but the transaction is terminated with ROLLBACK instead of COMMIT -- nothing
 * is persisted. The exact list of executed statements is returned as "sql" in
 * the JSON response so the caller can report what WOULD have run.
 * Flip to false to make writes real again.
 */
$IO_DRY_RUN = true;

$action = isset($_REQUEST['action']) ? strtolower(trim($_REQUEST['action'])) : "";

include_once("/var/www/html/MYSQLI_COMMON_FUNCTIONS.PHP");
$iConRLM = Open_ILink("MXHTAFOT01L");

// optional exclusion id (edit mode) used by check + save
$excludeIsdId = null;
if (isset($_REQUEST['isd_id']) && ctype_digit((string)$_REQUEST['isd_id'])) {
    $excludeIsdId = (int)$_REQUEST['isd_id'];
}

// ----- action: check -------------------------------------------------------
if ($action === "check") {
    $combo  = io_read_combo();
    $errors = io_validate_combo($combo);
    if (!empty($errors)) {
        // not enough valid data to test a combination yet
        echo json_encode(array("ok" => true, "exists" => false, "incomplete" => true, "errors" => $errors));
        mysqli_close($iConRLM);
        exit;
    }
    $dup = IO_DUP_EXISTS($iConRLM, $combo, $excludeIsdId);
    echo json_encode(array(
        "ok"     => true,
        "exists" => ($dup !== null),
        "isd_id" => $dup
    ));
    mysqli_close($iConRLM);
    exit;
}

// ----- action: delete ------------------------------------------------------
if ($action === "delete") {
    if ($excludeIsdId === null) {
        http_response_code(400);
        echo json_encode(array("ok" => false, "error" => "Missing or invalid isd_id."));
        mysqli_close($iConRLM);
        exit;
    }

    // find the linked master id
    $rs = ExecuteIQuery(
        "SELECT ISM_ID FROM brain.index_spec_data WHERE ISD_ID = " . $excludeIsdId . " LIMIT 1;",
        $iConRLM
    );
    $ismId = null;
    if ($rs && ($row = mysqli_fetch_assoc($rs))) {
        $ismId = (int)$row["ISM_ID"];
    }
    if ($ismId === null) {
        echo json_encode(array("ok" => false, "error" => "Record not found."));
        mysqli_close($iConRLM);
        exit;
    }

    // statements run inside the transaction (BEGIN/COMMIT|ROLLBACK added below)
    $aryStmts = array(
        "DELETE FROM brain.index_spec_data   WHERE ISD_ID = " . $excludeIsdId . ";",
        "DELETE FROM brain.index_spec_master WHERE ISM_ID = " . $ismId . ";"
    );

    $aryRan = array();
    $aryRan[] = "BEGIN;";
    ExecuteIQuery("BEGIN;", $iConRLM);

    foreach ($aryStmts as $strSQL) {
        $aryRan[] = $strSQL;
        ExecuteIQuery($strSQL, $iConRLM);
        if (!is_null(error_get_last())) {
            ExecuteIQuery("ROLLBACK;", $iConRLM);
            $aryRan[] = "ROLLBACK;";
            echo json_encode(array("ok" => false, "error" => "Delete failed; rolled back.", "sql" => $aryRan));
            mysqli_close($iConRLM);
            exit;
        }
    }

    // dry-run: roll back instead of committing so nothing is persisted
    $endStmt = $IO_DRY_RUN ? "ROLLBACK;" : "COMMIT;";
    ExecuteIQuery($endStmt, $iConRLM);
    $aryRan[] = $endStmt;

    echo json_encode(array(
        "ok"      => true,
        "dry_run" => $IO_DRY_RUN,
        "isd_id"  => $excludeIsdId,
        "ism_id"  => $ismId,
        "sql"     => $aryRan
    ));
    mysqli_close($iConRLM);
    exit;
}

// ----- action: save (insert or update) -------------------------------------
if ($action === "save") {
    $combo  = io_read_combo();
    $errors = io_validate_combo($combo);

    // index type: 'variable' requires the formula components; 'fixed' does not
    $type = isset($_REQUEST['index_type']) ? strtolower(trim($_REQUEST['index_type'])) : "fixed";
    $isVariable = ($type === "variable");

    // index_value: required, numeric, and non-zero (never blank/null/0)
    $indexValRaw = io_norm(isset($_REQUEST['index_value']) ? $_REQUEST['index_value'] : null);
    if ($indexValRaw === null) {
        $errors[] = "Index Value is required.";
    } else if (!is_numeric($indexValRaw)) {
        $errors[] = "Index Value must be numeric.";
    } else if (($indexValRaw + 0) == 0) {
        $errors[] = "Index Value must be non-zero.";
    }

    // variable-only formula components
    $ttpiThreshRaw = io_norm(isset($_REQUEST['ttpi_threshold']) ? $_REQUEST['ttpi_threshold'] : null);
    $coeffRaw      = io_norm(isset($_REQUEST['coefficient'])    ? $_REQUEST['coefficient']    : null);
    $constRaw      = io_norm(isset($_REQUEST['constant'])       ? $_REQUEST['constant']       : null);

    if ($isVariable) {
        if (!io_is_num($ttpiThreshRaw)) { $errors[] = "TTPI Threshold is required and must be numeric."; }
        if (!io_is_num($coeffRaw))      { $errors[] = "Coefficient is required and must be numeric."; }
        if (!io_is_num($constRaw))      { $errors[] = "Constant is required and must be numeric."; }
    }

    if (!empty($errors)) {
        echo json_encode(array("ok" => false, "errors" => $errors));
        mysqli_close($iConRLM);
        exit;
    }

    // authoritative duplicate check (excludes own row on edit)
    $dup = IO_DUP_EXISTS($iConRLM, $combo, $excludeIsdId);
    if ($dup !== null) {
        echo json_encode(array("ok" => false, "duplicate" => true, "isd_id" => $dup));
        mysqli_close($iConRLM);
        exit;
    }

    // build the master-table values (both the SQL fragment and the normalised
    // new value, so the update path can diff against the current row)
    if ($isVariable) {
        $formulas         = IO_BUILD_FORMULAS($coeffRaw, $constRaw, $ttpiThreshRaw, $indexValRaw);
        $thresholdFormula = $formulas[0];
        $finalFormula     = $formulas[1];
        $ttpiNew  = $ttpiThreshRaw;
        $coeffNew = $coeffRaw;
        $constNew = $constRaw;
        $thrNew   = $thresholdFormula;
        $finNew   = $finalFormula;
    } else {
        // fixed: formula components + formula strings are NULL
        $ttpiNew  = null;
        $coeffNew = null;
        $constNew = null;
        $thrNew   = null;
        $finNew   = null;
    }
    $ttpiSql  = io_sql_num($ttpiNew);
    $coeffSql = io_sql_num($coeffNew);
    $constSql = io_sql_num($constNew);
    $thrSql   = io_sql_str($iConRLM, $thrNew);
    $finSql   = io_sql_str($iConRLM, $finNew);
    $indexValSql = io_sql_num($indexValRaw);

    // shared data-table column assignments (used by both insert and update)
    $dataAssign =
          "HANDLER = "        . io_sql_str($iConRLM, $combo["HANDLER"])        . ", "
        . "PACKAGE = "        . io_sql_str($iConRLM, $combo["PACKAGE"])        . ", "
        . "SOAK_TIME = "      . io_sql_num($combo["SOAK_TIME"])                . ", "
        . "BODY_SIZE = "      . io_sql_str($iConRLM, $combo["BODY_SIZE"])      . ", "
        . "LEAD_COUNT_MIN = " . io_sql_num($combo["LEAD_COUNT_MIN"])          . ", "
        . "LEAD_COUNT_MAX = " . io_sql_num($combo["LEAD_COUNT_MAX"])          . ", "
        . "TEMP_CLASS = "     . io_sql_str($iConRLM, $combo["TEMP_CLASS"])    . ", "
        . "UTPI = "           . io_sql_num($combo["UTPI"]);

    $masterAssign =
          "INDX_VALUE = "        . $indexValSql . ", "
        . "TTPI_THRESHOLD = "    . $ttpiSql     . ", "
        . "COEFFICIENT = "       . $coeffSql    . ", "
        . "CONSTANT = "          . $constSql    . ", "
        . "THRESHOLD_FORMULA = " . $thrSql      . ", "
        . "INDX_FORMULA = "      . $finSql;

    // ----- UPDATE: requires both isd_id and ism_id -------------------------
    $ismIdReq = (isset($_REQUEST['ism_id']) && ctype_digit((string)$_REQUEST['ism_id']))
        ? (int)$_REQUEST['ism_id'] : null;

    if ($excludeIsdId !== null && $ismIdReq !== null) {
        // fetch current rows so we only SET columns whose value actually changed
        $curMaster = array();
        $rsM = ExecuteIQuery(
            "SELECT INDX_VALUE, TTPI_THRESHOLD, COEFFICIENT, CONSTANT, "
            . "THRESHOLD_FORMULA, INDX_FORMULA FROM brain.index_spec_master "
            . "WHERE ISM_ID = " . $ismIdReq . " LIMIT 1;",
            $iConRLM
        );
        if ($rsM) { $curMaster = mysqli_fetch_assoc($rsM); }

        $curData = array();
        $rsD = ExecuteIQuery(
            "SELECT HANDLER, PACKAGE, SOAK_TIME, BODY_SIZE, LEAD_COUNT_MIN, "
            . "LEAD_COUNT_MAX, TEMP_CLASS, UTPI FROM brain.index_spec_data "
            . "WHERE ISD_ID = " . $excludeIsdId . " LIMIT 1;",
            $iConRLM
        );
        if ($rsD) { $curData = mysqli_fetch_assoc($rsD); }

        if (!$curMaster || !$curData) {
            echo json_encode(array("ok" => false, "error" => "Record not found."));
            mysqli_close($iConRLM);
            exit;
        }

        // (column, kind, new-normalised-value, sql-fragment) tuples; a SET clause
        // is emitted only when io_changed() reports the value differs from the DB.
        $masterCols = array(
            array("INDX_VALUE",        "num", $indexValRaw, $indexValSql),
            array("TTPI_THRESHOLD",    "num", $ttpiNew,     $ttpiSql),
            array("COEFFICIENT",       "num", $coeffNew,    $coeffSql),
            array("CONSTANT",          "num", $constNew,    $constSql),
            array("THRESHOLD_FORMULA", "str", $thrNew,      $thrSql),
            array("INDX_FORMULA",      "str", $finNew,      $finSql)
        );
        $dataCols = array(
            array("HANDLER",        "str", $combo["HANDLER"],        io_sql_str($iConRLM, $combo["HANDLER"])),
            array("PACKAGE",        "str", $combo["PACKAGE"],        io_sql_str($iConRLM, $combo["PACKAGE"])),
            array("SOAK_TIME",      "num", $combo["SOAK_TIME"],      io_sql_num($combo["SOAK_TIME"])),
            array("BODY_SIZE",      "str", $combo["BODY_SIZE"],      io_sql_str($iConRLM, $combo["BODY_SIZE"])),
            array("LEAD_COUNT_MIN", "num", $combo["LEAD_COUNT_MIN"], io_sql_num($combo["LEAD_COUNT_MIN"])),
            array("LEAD_COUNT_MAX", "num", $combo["LEAD_COUNT_MAX"], io_sql_num($combo["LEAD_COUNT_MAX"])),
            array("TEMP_CLASS",     "str", $combo["TEMP_CLASS"],     io_sql_str($iConRLM, $combo["TEMP_CLASS"])),
            array("UTPI",           "num", $combo["UTPI"],           io_sql_num($combo["UTPI"]))
        );

        $masterSet = array();
        foreach ($masterCols as $c) {
            $cur = isset($curMaster[$c[0]]) ? $curMaster[$c[0]] : null;
            if (io_changed($c[1], $c[2], $cur)) {
                $masterSet[] = $c[0] . " = " . $c[3];
            }
        }
        $dataSet = array();
        foreach ($dataCols as $c) {
            $cur = isset($curData[$c[0]]) ? $curData[$c[0]] : null;
            if (io_changed($c[1], $c[2], $cur)) {
                $dataSet[] = $c[0] . " = " . $c[3];
            }
        }

        // nothing changed -> no-op, report it rather than running empty UPDATEs
        if (empty($masterSet) && empty($dataSet)) {
            echo json_encode(array(
                "ok"        => true,
                "dry_run"   => $IO_DRY_RUN,
                "mode"      => "update",
                "no_change" => true,
                "isd_id"    => $excludeIsdId,
                "ism_id"    => $ismIdReq,
                "sql"       => array()
            ));
            mysqli_close($iConRLM);
            exit;
        }

        // build only the UPDATEs that have changed columns
        $aryStmts = array();
        if (!empty($masterSet)) {
            $aryStmts[] = "UPDATE brain.index_spec_master SET " . implode(", ", $masterSet)
                        . " WHERE ISM_ID = " . $ismIdReq . ";";
        }
        if (!empty($dataSet)) {
            $aryStmts[] = "UPDATE brain.index_spec_data SET " . implode(", ", $dataSet)
                        . " WHERE ISD_ID = " . $excludeIsdId . ";";
        }

        $aryRan = array();
        $aryRan[] = "BEGIN;";
        ExecuteIQuery("BEGIN;", $iConRLM);

        foreach ($aryStmts as $strSQL) {
            $aryRan[] = $strSQL;
            ExecuteIQuery($strSQL, $iConRLM);
            if (!is_null(error_get_last())) {
                ExecuteIQuery("ROLLBACK;", $iConRLM);
                $aryRan[] = "ROLLBACK;";
                echo json_encode(array("ok" => false, "error" => "Update failed; rolled back.", "sql" => $aryRan));
                mysqli_close($iConRLM);
                exit;
            }
        }

        // dry-run: roll back instead of committing so nothing is persisted
        $endStmt = $IO_DRY_RUN ? "ROLLBACK;" : "COMMIT;";
        ExecuteIQuery($endStmt, $iConRLM);
        $aryRan[] = $endStmt;

        echo json_encode(array(
            "ok"      => true,
            "dry_run" => $IO_DRY_RUN,
            "mode"    => "update",
            "isd_id"  => $excludeIsdId,
            "ism_id"  => $ismIdReq,
            "sql"     => $aryRan
        ));
        mysqli_close($iConRLM);
        exit;
    }

    // ----- INSERT: new master + new data (1:1) -----------------------------
    // master first; SET-syntax keeps column/value pairing readable
    $aryRan = array();
    $aryRan[] = "BEGIN;";
    ExecuteIQuery("BEGIN;", $iConRLM);

    $sqlMaster = "INSERT INTO brain.index_spec_master SET " . $masterAssign . ";";
    $aryRan[] = $sqlMaster;
    ExecuteIQuery($sqlMaster, $iConRLM);
    if (!is_null(error_get_last())) {
        ExecuteIQuery("ROLLBACK;", $iConRLM);
        $aryRan[] = "ROLLBACK;";
        echo json_encode(array("ok" => false, "error" => "Insert (master) failed; rolled back.", "sql" => $aryRan));
        mysqli_close($iConRLM);
        exit;
    }
    $newIsmId = mysqli_insert_id($iConRLM);

    // data row links to the new master; SHA1_ROW_VALUE omitted -> NULL
    $sqlData = "INSERT INTO brain.index_spec_data SET ISM_ID = " . (int)$newIsmId . ", " . $dataAssign . ";";
    $aryRan[] = $sqlData;
    ExecuteIQuery($sqlData, $iConRLM);
    if (!is_null(error_get_last())) {
        ExecuteIQuery("ROLLBACK;", $iConRLM);
        $aryRan[] = "ROLLBACK;";
        echo json_encode(array("ok" => false, "error" => "Insert (data) failed; rolled back.", "sql" => $aryRan));
        mysqli_close($iConRLM);
        exit;
    }
    $newIsdId = mysqli_insert_id($iConRLM);

    // dry-run: roll back instead of committing so nothing is persisted.
    // Both inserts still executed inside the txn, so the auto-increment ids
    // above are the values the real insert WOULD have produced.
    $endStmt = $IO_DRY_RUN ? "ROLLBACK;" : "COMMIT;";
    ExecuteIQuery($endStmt, $iConRLM);
    $aryRan[] = $endStmt;
    if (!is_null(error_get_last())) {
        ExecuteIQuery("ROLLBACK;", $iConRLM);
        echo json_encode(array("ok" => false, "error" => "Commit failed; rolled back.", "sql" => $aryRan));
        mysqli_close($iConRLM);
        exit;
    }

    echo json_encode(array(
        "ok"      => true,
        "dry_run" => $IO_DRY_RUN,
        "mode"    => "insert",
        "isd_id"  => (int)$newIsdId,
        "ism_id"  => (int)$newIsmId,
        "sql"     => $aryRan
    ));
    mysqli_close($iConRLM);
    exit;
}

// ----- unknown action ------------------------------------------------------
http_response_code(400);
echo json_encode(array("ok" => false, "error" => "Unknown action."));
mysqli_close($iConRLM);
?>
