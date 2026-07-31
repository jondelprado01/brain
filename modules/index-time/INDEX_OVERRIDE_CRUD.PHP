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
        "UTPI"           => io_norm(isset($_REQUEST['utpi'])           ? $_REQUEST['utpi']           : null),
        "TRAY_TUBE_QTY"  => io_norm(isset($_REQUEST['tray_tube_qty'])  ? $_REQUEST['tray_tube_qty']  : null)
    );
}

/*
 * Validate the combination fields. Returns an array of error strings (empty
 * when valid). soak_time / lead_count_min / lead_count_max are nullable but,
 * when present, must be numeric > 0. utpi is required, integer >= 1.
 */
function io_validate_combo($combo) {
    $errors = array();

    // nullable-but-positive-integer numerics: when present must be a positive
    // integer (>= 1). Tray/Tube Qty is a combo field with the same rule.
    $posFields = array(
        "SOAK_TIME"      => "Soak Time",
        "LEAD_COUNT_MIN" => "Leads Min",
        "LEAD_COUNT_MAX" => "Leads Max",
        "TRAY_TUBE_QTY"  => "Tray/Tube Qty"
    );
    foreach ($posFields as $key => $label) {
        $val = $combo[$key];
        if ($val !== null) {
            if (!ctype_digit((string)$val) || (int)$val < 1) {
                $errors[] = $label . " must be a positive integer.";
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
         . "TRAY_TUBE_QTY <=> " . io_sql_str($conn, $combo["TRAY_TUBE_QTY"]) . " AND "
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

/*
 * Compute the master-table values for one save/upsert row. Returns:
 *   norm => array(col => normalised new value)   -- for io_changed() diffs
 *   sql  => array(col => inline-SQL fragment)     -- for SET clauses
 * Fixed rows have NULL formula components + formula strings; variable rows
 * build them from the coefficient/constant/threshold via IO_BUILD_FORMULAS.
 * Shared by the single-row `save` action and the batch `bulk_upsert` action.
 */
function io_build_master($conn, $isVariable, $indexValRaw, $ttpiThreshRaw, $coeffRaw, $constRaw) {
    if ($isVariable) {
        $formulas = IO_BUILD_FORMULAS($coeffRaw, $constRaw, $ttpiThreshRaw, $indexValRaw);
        $thrNew   = $formulas[0];
        $finNew   = $formulas[1];
        $ttpiNew  = $ttpiThreshRaw;
        $coeffNew = $coeffRaw;
        $constNew = $constRaw;
    } else {
        $ttpiNew = null; $coeffNew = null; $constNew = null; $thrNew = null; $finNew = null;
    }
    return array(
        "norm" => array(
            "INDX_VALUE"        => $indexValRaw,
            "TTPI_THRESHOLD"    => $ttpiNew,
            "COEFFICIENT"       => $coeffNew,
            "CONSTANT"          => $constNew,
            "THRESHOLD_FORMULA" => $thrNew,
            "INDX_FORMULA"      => $finNew
        ),
        "sql" => array(
            "INDX_VALUE"        => io_sql_num($indexValRaw),
            "TTPI_THRESHOLD"    => io_sql_num($ttpiNew),
            "COEFFICIENT"       => io_sql_num($coeffNew),
            "CONSTANT"          => io_sql_num($constNew),
            "THRESHOLD_FORMULA" => io_sql_str($conn, $thrNew),
            "INDX_FORMULA"      => io_sql_str($conn, $finNew)
        )
    );
}

/* data-table SET assignments (INSERT/UPDATE); order matches the base table. */
function io_data_assign($conn, $combo) {
    return
          "HANDLER = "        . io_sql_str($conn, $combo["HANDLER"])   . ", "
        . "PACKAGE = "        . io_sql_str($conn, $combo["PACKAGE"])   . ", "
        . "SOAK_TIME = "      . io_sql_num($combo["SOAK_TIME"])        . ", "
        . "BODY_SIZE = "      . io_sql_str($conn, $combo["BODY_SIZE"]) . ", "
        . "LEAD_COUNT_MIN = " . io_sql_num($combo["LEAD_COUNT_MIN"])   . ", "
        . "LEAD_COUNT_MAX = " . io_sql_num($combo["LEAD_COUNT_MAX"])   . ", "
        . "TEMP_CLASS = "     . io_sql_str($conn, $combo["TEMP_CLASS"]). ", "
        . "UTPI = "           . io_sql_num($combo["UTPI"])             . ", "
        . "TRAY_TUBE_QTY = "  . io_sql_num($combo["TRAY_TUBE_QTY"]);
}

/* master-table SET assignments from an io_build_master() result. */
function io_master_assign($mv) {
    return
          "INDX_VALUE = "        . $mv["sql"]["INDX_VALUE"]        . ", "
        . "TTPI_THRESHOLD = "    . $mv["sql"]["TTPI_THRESHOLD"]    . ", "
        . "COEFFICIENT = "       . $mv["sql"]["COEFFICIENT"]       . ", "
        . "CONSTANT = "          . $mv["sql"]["CONSTANT"]          . ", "
        . "THRESHOLD_FORMULA = " . $mv["sql"]["THRESHOLD_FORMULA"] . ", "
        . "INDX_FORMULA = "      . $mv["sql"]["INDX_FORMULA"];
}

/* (col, kind, new-normalised-value, sql-fragment) tuples for the data table. */
function io_data_cols($conn, $combo) {
    return array(
        array("HANDLER",        "str", $combo["HANDLER"],        io_sql_str($conn, $combo["HANDLER"])),
        array("PACKAGE",        "str", $combo["PACKAGE"],        io_sql_str($conn, $combo["PACKAGE"])),
        array("SOAK_TIME",      "num", $combo["SOAK_TIME"],      io_sql_num($combo["SOAK_TIME"])),
        array("BODY_SIZE",      "str", $combo["BODY_SIZE"],      io_sql_str($conn, $combo["BODY_SIZE"])),
        array("LEAD_COUNT_MIN", "num", $combo["LEAD_COUNT_MIN"], io_sql_num($combo["LEAD_COUNT_MIN"])),
        array("LEAD_COUNT_MAX", "num", $combo["LEAD_COUNT_MAX"], io_sql_num($combo["LEAD_COUNT_MAX"])),
        array("TEMP_CLASS",     "str", $combo["TEMP_CLASS"],     io_sql_str($conn, $combo["TEMP_CLASS"])),
        array("UTPI",           "num", $combo["UTPI"],           io_sql_num($combo["UTPI"])),
        array("TRAY_TUBE_QTY",  "num", $combo["TRAY_TUBE_QTY"],  io_sql_num($combo["TRAY_TUBE_QTY"]))
    );
}

/* (col, kind, new-normalised-value, sql-fragment) tuples for the master table. */
function io_master_cols($mv) {
    return array(
        array("INDX_VALUE",        "num", $mv["norm"]["INDX_VALUE"],        $mv["sql"]["INDX_VALUE"]),
        array("TTPI_THRESHOLD",    "num", $mv["norm"]["TTPI_THRESHOLD"],    $mv["sql"]["TTPI_THRESHOLD"]),
        array("COEFFICIENT",       "num", $mv["norm"]["COEFFICIENT"],       $mv["sql"]["COEFFICIENT"]),
        array("CONSTANT",          "num", $mv["norm"]["CONSTANT"],          $mv["sql"]["CONSTANT"]),
        array("THRESHOLD_FORMULA", "str", $mv["norm"]["THRESHOLD_FORMULA"], $mv["sql"]["THRESHOLD_FORMULA"]),
        array("INDX_FORMULA",      "str", $mv["norm"]["INDX_FORMULA"],      $mv["sql"]["INDX_FORMULA"])
    );
}

/* Emit SET clauses only for columns whose value differs from the current row. */
function io_diff_set($cols, $cur) {
    $set = array();
    foreach ($cols as $c) {
        $curVal = isset($cur[$c[0]]) ? $cur[$c[0]] : null;
        if (io_changed($c[1], $c[2], $curVal)) {
            $set[] = $c[0] . " = " . $c[3];
        }
    }
    return $set;
}

// ---------------------------------------------------------------------------
// Batch (paste-from-Excel) helpers -- shared by the bulk_* actions below.
// ---------------------------------------------------------------------------

/* NULL-safe numeric equality: both blank match; else compare as floats. */
function io_num_eq($a, $b) {
    $aBlank = ($a === null || $a === "");
    $bBlank = ($b === null || $b === "");
    if ($aBlank && $bBlank) { return true; }
    if ($aBlank !== $bBlank) { return false; }
    return ((float)$a === (float)$b);
}

/* Numeric equality rounded to 5 decimals (the display/export precision).
 * Strips thousands ',' from the pasted side first. Both blank match. */
function io_num5_eq($pasted, $dbVal) {
    $pBlank = ($pasted === null || $pasted === "");
    $dBlank = ($dbVal === null || $dbVal === "");
    if ($pBlank && $dBlank) { return true; }
    if ($pBlank !== $dBlank) { return false; }
    $p = str_replace(",", "", (string)$pasted);
    if (!is_numeric($p) || !is_numeric($dbVal)) { return false; }
    return (round((float)$p, 5) === round((float)$dbVal, 5));
}

/* String equality after trim; blank (null/"") sides are equal. */
function io_str_eq($a, $b) {
    $a = ($a === null) ? "" : trim((string)$a);
    $b = ($b === null) ? "" : trim((string)$b);
    return ($a === $b);
}

/* Fetch one joined data+master record by ISD_ID, or null if not found. */
function IO_BULK_FETCH_ROW($conn, $isdId) {
    $sql = "SELECT d.ISD_ID, d.ISM_ID, d.HANDLER, d.PACKAGE, d.SOAK_TIME, "
         . "d.BODY_SIZE, d.LEAD_COUNT_MIN, d.LEAD_COUNT_MAX, d.TEMP_CLASS, d.UTPI, "
         . "d.TRAY_TUBE_QTY, m.INDX_VALUE, m.TTPI_THRESHOLD, m.THRESHOLD_FORMULA "
         . "FROM brain.index_spec_data d "
         . "JOIN brain.index_spec_master m ON m.ISM_ID = d.ISM_ID "
         . "WHERE d.ISD_ID = " . (int)$isdId . " LIMIT 1;";
    $rs = ExecuteIQuery($sql, $conn);
    if ($rs && ($row = mysqli_fetch_assoc($rs))) {
        return $row;
    }
    return null;
}

/* "fixed" or "variable" from a fetched row's THRESHOLD_FORMULA state. */
function IO_BULK_ROW_TYPE($row) {
    $tf = isset($row["THRESHOLD_FORMULA"]) ? $row["THRESHOLD_FORMULA"] : null;
    return ($tf === null || $tf === "") ? "fixed" : "variable";
}

/* Like io_read_combo() but reads the 9 combo fields from a decoded paste-row
 * object (keys match the JS payload) instead of $_REQUEST. */
function io_read_combo_from($r) {
    $g = function($k) use ($r) { return isset($r[$k]) ? $r[$k] : null; };
    return array(
        "HANDLER"        => io_norm($g("handler")),
        "PACKAGE"        => io_norm($g("package_type")),
        "SOAK_TIME"      => io_norm($g("soak_time")),
        "BODY_SIZE"      => io_norm($g("body_size")),
        "LEAD_COUNT_MIN" => io_norm($g("lead_count_min")),
        "LEAD_COUNT_MAX" => io_norm($g("lead_count_max")),
        "TEMP_CLASS"     => io_norm($g("temp_class")),
        "UTPI"           => io_norm($g("utpi")),
        "TRAY_TUBE_QTY"  => io_norm($g("tray_tube_qty"))
    );
}

/* Decode the posted rows JSON into an array (or empty array on failure). */
function io_bulk_rows() {
    $raw = isset($_REQUEST['rows']) ? $_REQUEST['rows'] : "";
    $rows = json_decode($raw, true);
    return is_array($rows) ? $rows : array();
}

/*
 * Do two combo rows collide? Same exact-match on the six scalar fields (NULL
 * counts as a value) AND overlapping inclusive lead-count ranges (NULL bound =
 * open-ended). Mirrors IO_DUP_EXISTS but compares two in-memory combos, used
 * for intra-paste collision detection (which the DB check can't see).
 */
function io_combo_collide($a, $b) {
    $scalars = array("HANDLER","PACKAGE","SOAK_TIME","BODY_SIZE","TEMP_CLASS","UTPI","TRAY_TUBE_QTY");
    foreach ($scalars as $k) {
        $av = ($a[$k] === null) ? null : (string)$a[$k];
        $bv = ($b[$k] === null) ? null : (string)$b[$k];
        if ($av !== $bv) { return false; }
    }
    // inclusive range overlap with NULL as open-ended
    $aMin = $a["LEAD_COUNT_MIN"]; $aMax = $a["LEAD_COUNT_MAX"];
    $bMin = $b["LEAD_COUNT_MIN"]; $bMax = $b["LEAD_COUNT_MAX"];
    $leftOk  = ($aMin === null || $bMax === null || ($aMin + 0) <= ($bMax + 0));
    $rightOk = ($bMin === null || $aMax === null || ($bMin + 0) <= ($aMax + 0));
    return ($leftOk && $rightOk);
}

/*
 * Validate a batch DELETE paste. $type is "fixed"|"variable". Each $rows entry
 * is a decoded paste-row object. Returns the response structure (all_valid,
 * counts, per-row status). Writes nothing.
 */
function IO_BULK_DELETE_VALIDATE($conn, $type, $rows) {
    $out = array();
    $seenIsd = array();
    $validCount = 0;
    $errorCount = 0;

    foreach ($rows as $i => $r) {
        $isdRaw = isset($r["isd_id"]) ? trim((string)$r["isd_id"]) : "";
        $status = "ok";
        $mismatches = array();

        if ($isdRaw === "" || !ctype_digit($isdRaw)) {
            $status = "bad_isd";
        } else if (isset($seenIsd[$isdRaw])) {
            $status = "dup";
        } else {
            $seenIsd[$isdRaw] = true;
            $db = IO_BULK_FETCH_ROW($conn, (int)$isdRaw);
            if ($db === null) {
                $status = "not_found";
            } else {
                $rowType = IO_BULK_ROW_TYPE($db);
                if ($rowType !== $type) {
                    $status = ($type === "fixed") ? "not_fixed" : "not_variable";
                } else {
                    // common fields
                    if (!io_str_eq($r["handler"],      $db["HANDLER"]))    { $mismatches[] = "Handler"; }
                    if (!io_str_eq($r["package_type"], $db["PACKAGE"]))    { $mismatches[] = "Package Type"; }
                    if (!io_str_eq($r["body_size"],    $db["BODY_SIZE"]))  { $mismatches[] = "Body Size"; }
                    if (!io_str_eq($r["temp_class"],   $db["TEMP_CLASS"])) { $mismatches[] = "Temp Class"; }
                    if (!io_num_eq(io_norm($r["lead_count_min"]), $db["LEAD_COUNT_MIN"])) { $mismatches[] = "Leads Min"; }
                    if (!io_num_eq(io_norm($r["lead_count_max"]), $db["LEAD_COUNT_MAX"])) { $mismatches[] = "Leads Max"; }
                    if (!io_num_eq(io_norm($r["utpi"]),           $db["UTPI"]))           { $mismatches[] = "UTPI"; }
                    if (!io_num5_eq($r["fixed_itpu"], $db["INDX_VALUE"]))  { $mismatches[] = "Fixed ITPI"; }
                    if ($type === "fixed") {
                        if (!io_num_eq(io_norm($r["tray_tube_qty"]), $db["TRAY_TUBE_QTY"])) { $mismatches[] = "Tray/Tube Qty"; }
                    } else {
                        if (!io_num_eq(io_norm($r["soak_time"]), $db["SOAK_TIME"]))        { $mismatches[] = "Soak Time"; }
                        if (!io_num5_eq($r["ttpi_threshold"], $db["TTPI_THRESHOLD"]))       { $mismatches[] = "TTPI Threshold"; }
                        if (!io_str_eq($r["threshold_formula"], $db["THRESHOLD_FORMULA"]))  { $mismatches[] = "Threshold Formula"; }
                    }
                    if (!empty($mismatches)) { $status = "mismatch"; }
                }
            }
        }

        if ($status === "ok") { $validCount++; } else { $errorCount++; }
        $out[] = array(
            "index"      => $i,
            "isd_id"     => $isdRaw,
            "status"     => $status,
            "mismatches" => $mismatches
        );
    }

    return array(
        "rows"        => $out,
        "all_valid"   => ($errorCount === 0 && $validCount > 0),
        "valid_count" => $validCount,
        "error_count" => $errorCount
    );
}

/*
 * Validate a batch ADD/EDIT (upsert) paste. $type is "fixed"|"variable". Rows
 * with a present ISD_ID are updates; blank ISD_ID are inserts. Runs the same
 * field validation as the single-row save plus DB and intra-paste collision.
 * Writes nothing. Returns the response structure.
 */
function IO_BULK_UPSERT_VALIDATE($conn, $type, $rows) {
    $isVariable = ($type === "variable");
    $out = array();
    $combos = array();      // index => combo (for intra-paste collision)
    $insertCount = 0;
    $updateCount = 0;
    $errorCount = 0;

    foreach ($rows as $i => $r) {
        $isdRaw = isset($r["isd_id"]) ? trim((string)$r["isd_id"]) : "";
        // blank -- or the literal "NEW" (any case) -- marks an insert
        if (strtoupper($isdRaw) === "NEW") { $isdRaw = ""; }
        $op = ($isdRaw === "") ? "insert" : "update";
        $status = "ok";
        $errors = array();
        $dupIsd = null;

        $combo = io_read_combo_from($r);
        $errors = io_validate_combo($combo);

        // index_value required non-zero numeric (same as single-row save)
        $indexValRaw = io_norm(isset($r["fixed_itpu"]) ? str_replace(",", "", (string)$r["fixed_itpu"]) : null);
        if ($indexValRaw === null) {
            $errors[] = "Fixed ITPI is required.";
        } else if (!is_numeric($indexValRaw)) {
            $errors[] = "Fixed ITPI must be numeric.";
        } else if (($indexValRaw + 0) == 0) {
            $errors[] = "Fixed ITPI must be non-zero.";
        }

        // variable-only formula components
        if ($isVariable) {
            $ttpiThreshRaw = io_norm(isset($r["ttpi_threshold"]) ? str_replace(",", "", (string)$r["ttpi_threshold"]) : null);
            $coeffRaw      = io_norm(isset($r["coefficient"]) ? $r["coefficient"] : null);
            $constRaw      = io_norm(isset($r["constant"])    ? $r["constant"]    : null);
            if (!io_is_num($ttpiThreshRaw)) { $errors[] = "TTPI Threshold is required and must be numeric."; }
            if (!io_is_num($coeffRaw))      { $errors[] = "Coefficient is required and must be numeric."; }
            if (!io_is_num($constRaw))      { $errors[] = "Constant is required and must be numeric."; }
        }

        if ($op === "update") {
            if (!ctype_digit($isdRaw)) {
                $status = "invalid";
                $errors[] = "ISD ID must be a positive integer.";
            } else {
                $db = IO_BULK_FETCH_ROW($conn, (int)$isdRaw);
                if ($db === null) {
                    $status = "not_found";
                } else if (IO_BULK_ROW_TYPE($db) !== $type) {
                    $status = "type_switch";
                }
            }
        }

        // field-validity errors take precedence over collision reporting
        if ($status === "ok" && !empty($errors)) {
            $status = "invalid";
        }

        // DB collision (exclude own row on update)
        if ($status === "ok") {
            $exclude = ($op === "update" && ctype_digit($isdRaw)) ? (int)$isdRaw : null;
            $dup = IO_DUP_EXISTS($conn, $combo, $exclude);
            if ($dup !== null) {
                $status = "duplicate";
                $dupIsd = $dup;
            }
        }

        $combos[$i] = ($status === "ok" || $status === "duplicate") ? $combo : null;

        $out[] = array(
            "index"      => $i,
            "isd_id"     => $isdRaw,
            "op"         => $op,
            "status"     => $status,
            "errors"     => $errors,
            "dup_isd_id" => $dupIsd
        );
    }

    // intra-paste collision: any two rows whose combos collide with each other
    $n = count($out);
    for ($a = 0; $a < $n; $a++) {
        if ($combos[$a] === null) { continue; }
        for ($b = $a + 1; $b < $n; $b++) {
            if ($combos[$b] === null) { continue; }
            if (io_combo_collide($combos[$a], $combos[$b])) {
                foreach (array($a, $b) as $k) {
                    if ($out[$k]["status"] === "ok") {
                        $out[$k]["status"] = "dup_in_paste";
                    }
                }
            }
        }
    }

    // recount after all status assignments
    $insertCount = 0; $updateCount = 0; $errorCount = 0;
    foreach ($out as $o) {
        if ($o["status"] !== "ok") { $errorCount++; continue; }
        if ($o["op"] === "insert") { $insertCount++; } else { $updateCount++; }
    }

    return array(
        "rows"         => $out,
        "all_valid"    => ($errorCount === 0 && $n > 0),
        "insert_count" => $insertCount,
        "update_count" => $updateCount,
        "error_count"  => $errorCount
    );
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
$IO_DRY_RUN = false;

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
    $mv = io_build_master($iConRLM, $isVariable, $indexValRaw, $ttpiThreshRaw, $coeffRaw, $constRaw);

    // shared column assignments (used by both insert and update)
    $dataAssign   = io_data_assign($iConRLM, $combo);
    $masterAssign = io_master_assign($mv);

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
            . "LEAD_COUNT_MAX, TEMP_CLASS, UTPI, TRAY_TUBE_QTY FROM brain.index_spec_data "
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
        $masterSet = io_diff_set(io_master_cols($mv), $curMaster);
        $dataSet   = io_diff_set(io_data_cols($iConRLM, $combo), $curData);

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

// ----- batch actions (paste-from-Excel) ------------------------------------
// $bulk_type is the type declared by the client (from the pasted column count).
$bulk_type = isset($_REQUEST['bulk_type']) ? strtolower(trim($_REQUEST['bulk_type'])) : "";
$bulk_type = ($bulk_type === "variable") ? "variable" : "fixed";

// ----- action: bulk_delete_check -------------------------------------------
if ($action === "bulk_delete_check") {
    $rows = io_bulk_rows();
    $res  = IO_BULK_DELETE_VALIDATE($iConRLM, $bulk_type, $rows);
    echo json_encode(array_merge(array("ok" => true, "bulk_type" => $bulk_type), $res));
    mysqli_close($iConRLM);
    exit;
}

// ----- action: bulk_delete -------------------------------------------------
if ($action === "bulk_delete") {
    $rows = io_bulk_rows();
    $res  = IO_BULK_DELETE_VALIDATE($iConRLM, $bulk_type, $rows);
    if (!$res["all_valid"]) {
        echo json_encode(array_merge(array("ok" => false, "bulk_type" => $bulk_type), $res));
        mysqli_close($iConRLM);
        exit;
    }

    $aryRan = array();
    $aryRan[] = "BEGIN;";
    ExecuteIQuery("BEGIN;", $iConRLM);

    $deleted = 0;
    foreach ($res["rows"] as $ro) {
        $isdId = (int)$ro["isd_id"];
        // linked master id
        $rsM = ExecuteIQuery("SELECT ISM_ID FROM brain.index_spec_data WHERE ISD_ID = " . $isdId . " LIMIT 1;", $iConRLM);
        $ismId = ($rsM && ($m = mysqli_fetch_assoc($rsM))) ? (int)$m["ISM_ID"] : null;
        if ($ismId === null) {
            ExecuteIQuery("ROLLBACK;", $iConRLM);
            $aryRan[] = "ROLLBACK;";
            echo json_encode(array("ok" => false, "error" => "Record " . $isdId . " vanished; rolled back.", "sql" => $aryRan));
            mysqli_close($iConRLM);
            exit;
        }
        $stmts = array(
            "DELETE FROM brain.index_spec_data   WHERE ISD_ID = " . $isdId . ";",
            "DELETE FROM brain.index_spec_master WHERE ISM_ID = " . $ismId . ";"
        );
        foreach ($stmts as $strSQL) {
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
        $deleted++;
    }

    $endStmt = $IO_DRY_RUN ? "ROLLBACK;" : "COMMIT;";
    ExecuteIQuery($endStmt, $iConRLM);
    $aryRan[] = $endStmt;

    echo json_encode(array(
        "ok"            => true,
        "dry_run"       => $IO_DRY_RUN,
        "bulk_type"     => $bulk_type,
        "deleted_count" => $deleted,
        "sql"           => $aryRan
    ));
    mysqli_close($iConRLM);
    exit;
}

// ----- action: bulk_upsert_check -------------------------------------------
if ($action === "bulk_upsert_check") {
    $rows = io_bulk_rows();
    $res  = IO_BULK_UPSERT_VALIDATE($iConRLM, $bulk_type, $rows);
    echo json_encode(array_merge(array("ok" => true, "bulk_type" => $bulk_type), $res));
    mysqli_close($iConRLM);
    exit;
}

// ----- action: bulk_upsert -------------------------------------------------
if ($action === "bulk_upsert") {
    $rows = io_bulk_rows();
    $res  = IO_BULK_UPSERT_VALIDATE($iConRLM, $bulk_type, $rows);
    if (!$res["all_valid"]) {
        echo json_encode(array_merge(array("ok" => false, "bulk_type" => $bulk_type), $res));
        mysqli_close($iConRLM);
        exit;
    }

    $isVariable = ($bulk_type === "variable");
    $aryRan = array();
    $ids    = array();
    $insertCount = 0;
    $updateCount = 0;
    $noChangeCount = 0;

    $aryRan[] = "BEGIN;";
    ExecuteIQuery("BEGIN;", $iConRLM);

    foreach ($res["rows"] as $ro) {
        $i = $ro["index"];
        $r = $rows[$i];
        $combo = io_read_combo_from($r);

        $indexValRaw   = io_norm(isset($r["fixed_itpu"]) ? str_replace(",", "", (string)$r["fixed_itpu"]) : null);
        $ttpiThreshRaw = io_norm(isset($r["ttpi_threshold"]) ? str_replace(",", "", (string)$r["ttpi_threshold"]) : null);
        $coeffRaw      = io_norm(isset($r["coefficient"]) ? $r["coefficient"] : null);
        $constRaw      = io_norm(isset($r["constant"])    ? $r["constant"]    : null);
        $mv = io_build_master($iConRLM, $isVariable, $indexValRaw, $ttpiThreshRaw, $coeffRaw, $constRaw);

        if ($ro["op"] === "insert") {
            // master then data (1:1); SHA1_ROW_VALUE omitted -> NULL
            $sqlMaster = "INSERT INTO brain.index_spec_master SET " . io_master_assign($mv) . ";";
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
            $sqlData = "INSERT INTO brain.index_spec_data SET ISM_ID = " . (int)$newIsmId . ", " . io_data_assign($iConRLM, $combo) . ";";
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
            $ids[] = array("index" => $i, "isd_id" => (int)$newIsdId, "ism_id" => (int)$newIsmId);
            $insertCount++;
        } else {
            // update: fetch current rows, emit minimal diffs
            $isdId = (int)$ro["isd_id"];
            $rsJoin = ExecuteIQuery(
                "SELECT d.ISM_ID, d.HANDLER, d.PACKAGE, d.SOAK_TIME, d.BODY_SIZE, "
                . "d.LEAD_COUNT_MIN, d.LEAD_COUNT_MAX, d.TEMP_CLASS, d.UTPI, d.TRAY_TUBE_QTY, "
                . "m.INDX_VALUE, m.TTPI_THRESHOLD, m.COEFFICIENT, m.CONSTANT, "
                . "m.THRESHOLD_FORMULA, m.INDX_FORMULA "
                . "FROM brain.index_spec_data d JOIN brain.index_spec_master m ON m.ISM_ID = d.ISM_ID "
                . "WHERE d.ISD_ID = " . $isdId . " LIMIT 1;",
                $iConRLM
            );
            $cur = ($rsJoin) ? mysqli_fetch_assoc($rsJoin) : null;
            if (!$cur) {
                ExecuteIQuery("ROLLBACK;", $iConRLM);
                $aryRan[] = "ROLLBACK;";
                echo json_encode(array("ok" => false, "error" => "Record " . $isdId . " vanished; rolled back.", "sql" => $aryRan));
                mysqli_close($iConRLM);
                exit;
            }
            $ismId = (int)$cur["ISM_ID"];
            $masterSet = io_diff_set(io_master_cols($mv), $cur);
            $dataSet   = io_diff_set(io_data_cols($iConRLM, $combo), $cur);

            if (empty($masterSet) && empty($dataSet)) {
                $noChangeCount++;
                $ids[] = array("index" => $i, "isd_id" => $isdId, "ism_id" => $ismId, "no_change" => true);
            } else {
                $stmts = array();
                if (!empty($masterSet)) {
                    $stmts[] = "UPDATE brain.index_spec_master SET " . implode(", ", $masterSet) . " WHERE ISM_ID = " . $ismId . ";";
                }
                if (!empty($dataSet)) {
                    $stmts[] = "UPDATE brain.index_spec_data SET " . implode(", ", $dataSet) . " WHERE ISD_ID = " . $isdId . ";";
                }
                foreach ($stmts as $strSQL) {
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
                $ids[] = array("index" => $i, "isd_id" => $isdId, "ism_id" => $ismId);
                $updateCount++;
            }
        }
    }

    $endStmt = $IO_DRY_RUN ? "ROLLBACK;" : "COMMIT;";
    ExecuteIQuery($endStmt, $iConRLM);
    $aryRan[] = $endStmt;

    echo json_encode(array(
        "ok"              => true,
        "dry_run"         => $IO_DRY_RUN,
        "bulk_type"       => $bulk_type,
        "insert_count"    => $insertCount,
        "update_count"    => $updateCount,
        "no_change_count" => $noChangeCount,
        "ids"             => $ids,
        "sql"             => $aryRan
    ));
    mysqli_close($iConRLM);
    exit;
}

// ----- unknown action ------------------------------------------------------
http_response_code(400);
echo json_encode(array("ok" => false, "error" => "Unknown action."));
mysqli_close($iConRLM);
?>
