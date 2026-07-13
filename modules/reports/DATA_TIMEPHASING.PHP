<?php
/*
 * DATA_TIMEPHASING.PHP
 * --------------------
 * Data provider for the REPORT module's "Timephasing" tab.
 *
 * Returns every timephasing schedule ("instance") that is LIVE — i.e. a row in
 * brain.tp_instance_main that has at least one matching step row in
 * brain.tp_instance_data (joined on tpi_id). One row per instance (tpi_id).
 *
 * The whole dataset is returned in a single call so the front-end can filter it
 * client-side (DataTables) without further DB churn.
 *
 * DB access follows the app convention used by modules/index-time/INDEX.PHP:
 *   include MYSQLI_COMMON_FUNCTIONS.PHP -> Open_ILink("localhost") ->
 *   ExecuteIQuery($sql,$con) -> mysqli_fetch_assoc loop -> mysqli_close.
 * "localhost" resolves to mxhtafot01l, where the brain and personnel schemas live,
 * so a single connection can join across them with fully-qualified names.
 */

if (!function_exists('GET_TIMEPHASING_SCHEDULES')) {

    /**
     * Fetch all live timephasing schedules.
     *
     * @return array List of assoc rows with keys:
     *               mfg_part_num, fyww, process_type, notes, change_dt, username
     */
    function GET_TIMEPHASING_SCHEDULES() {

        include_once("/var/www/html/MYSQLI_COMMON_FUNCTIONS.PHP");

        $con = Open_ILink("localhost");

        /*
         * - INNER JOIN tp_instance_data enforces "at least one step = live".
         * - GROUP_CONCAT keeps one row per instance even if steps span multiple
         *   parts, rather than silently dropping parts.
         * - tp_instance_main.fyww is a single integer (fiscal_year*100 + week_number);
         *   we split it back out (FLOOR(fyww/100) = year, fyww MOD 100 = week) and
         *   format as the display string FY##_W## (still aliased fyww per spec).
         * - Latest history row (MAX(tph_master_id)) gives the last editor's
         *   change_user (employee_no), joined to personnel.v_workday_memory for
         *   the AD name we surface as "username". LEFT JOINs so an instance with
         *   no history / unmatched employee still lists (blank username).
         * - fyww_status flags each schedule's timeliness for the FYWW column
         *   badge. Each fyww (an integer MFG_YEAR*100+WEEK_NUMBER, whose mfg_date
         *   is always a Sunday) is compared against the CURRENT week's fyww, pulled
         *   as a scalar from shared.DMCLS_MEMORY: the greatest MFG_YEAR*100+
         *   WEEK_NUMBER whose Sunday (mfg_date) is on or before today.
         *   fyww integers sort chronologically (year dominates weeks), so:
         *     m.fyww <  cur_fyww  -> DELINQUENT (red)
         *     m.fyww =  cur_fyww  -> CURRENT    (yellow)
         *     otherwise          -> unflagged.
         *   (cur_fyww is NULL only if the calendar were empty, in which case the
         *   CASE falls through to '' on its own.)
         * - Instances whose fyww is NULL/0 are a data error; the WHERE clause drops
         *   them entirely rather than showing a malformed FYWW.
         */
        $sql = "
            SELECT
                GROUP_CONCAT(DISTINCT d.mfg_part_num ORDER BY d.mfg_part_num SEPARATOR ', ') AS mfg_part_num,
                CONCAT('FY', RIGHT(FLOOR(m.fyww / 100), 2), '_W', LPAD(m.fyww MOD 100, 2, '0')) AS fyww,
                m.process_type AS process_type,
                m.notes AS notes,
                m.change_dt AS change_dt,
                wm.ad_name AS username,
                CASE
                    WHEN m.fyww < (
                        SELECT MAX(c.MFG_YEAR * 100 + c.WEEK_NUMBER)
                        FROM shared.DMCLS_MEMORY c
                        WHERE c.mfg_date <= CURDATE()
                    ) THEN 'delinquent'
                    WHEN m.fyww = (
                        SELECT MAX(c.MFG_YEAR * 100 + c.WEEK_NUMBER)
                        FROM shared.DMCLS_MEMORY c
                        WHERE c.mfg_date <= CURDATE()
                    ) THEN 'current'
                    ELSE ''
                END AS fyww_status
            FROM brain.tp_instance_main m
            JOIN brain.tp_instance_data d
                  ON d.tpi_id = m.tpi_id
            LEFT JOIN (
                SELECT h.tpi_id, h.change_user
                FROM brain.tp_instance_hist_master h
                JOIN (
                    SELECT tpi_id, MAX(tph_master_id) AS max_id
                    FROM brain.tp_instance_hist_master
                    GROUP BY tpi_id
                ) mx ON mx.tpi_id = h.tpi_id AND mx.max_id = h.tph_master_id
            ) lh ON lh.tpi_id = m.tpi_id
            LEFT JOIN personnel.v_workday_memory wm
                  ON wm.employee_no = lh.change_user
            WHERE m.fyww IS NOT NULL AND m.fyww > 0
            GROUP BY m.tpi_id, m.fyww, m.process_type, m.notes, m.change_dt, wm.ad_name
            ORDER BY m.change_dt DESC;";

        $rs = ExecuteIQuery($sql, $con);

        $rows = array();
        if ($rs) {
            while ($line = mysqli_fetch_assoc($rs)) {
                $rows[] = array(
                    "mfg_part_num" => $line["mfg_part_num"],
                    "fyww"         => $line["fyww"],
                    "process_type" => $line["process_type"],
                    "notes"        => $line["notes"],
                    "change_dt"    => $line["change_dt"],
                    "username"     => $line["username"],
                    "fyww_status"  => $line["fyww_status"],
                );
            }
        }

        mysqli_close($con);

        return $rows;
    }
}

if (!function_exists('GET_CURRENT_FYWW')) {

    /**
     * The current week's FYWW as the same display string used in the data rows
     * (FY##_W##). "Current" is the greatest MFG_YEAR*100+WEEK_NUMBER in
     * shared.DMCLS_MEMORY whose Sunday (mfg_date) is on or before today — the same
     * reference the main query classifies rows against. Shown in the FYWW column
     * header so users see which week the delinquent/current badges are relative to.
     *
     * @return string  FY##_W##, or "" if the calendar yields nothing
     */
    function GET_CURRENT_FYWW() {

        include_once("/var/www/html/MYSQLI_COMMON_FUNCTIONS.PHP");

        $con = Open_ILink("localhost");

        $sql = "
            SELECT CONCAT('FY', RIGHT(cur.cur_fyww DIV 100, 2),
                          '_W', LPAD(cur.cur_fyww MOD 100, 2, '0')) AS fyww
            FROM (
                SELECT MAX(c.MFG_YEAR * 100 + c.WEEK_NUMBER) AS cur_fyww
                FROM shared.DMCLS_MEMORY c
                WHERE c.mfg_date <= CURDATE()
            ) cur
            WHERE cur.cur_fyww IS NOT NULL;";

        $rs = ExecuteIQuery($sql, $con);

        $fyww = "";
        if ($rs && ($line = mysqli_fetch_assoc($rs))) {
            $fyww = $line["fyww"];
        }

        mysqli_close($con);

        return ($fyww === null) ? "" : $fyww;
    }
}

if (!function_exists('GET_USERNAME_FOR_EMPLOYEE')) {

    /**
     * Resolve a single employee_no to its ad_name (the "username" used in the
     * schedule listing), from the same personnel.v_workday_memory view the main
     * query joins against. Used to default the Timephasing username filter to the
     * logged-in user so they see their own schedules first.
     *
     * @param  string|int $employee_no  the logged-in user's EMP_NO
     * @return string                    ad_name, or "" if not found / no input
     */
    function GET_USERNAME_FOR_EMPLOYEE($employee_no) {

        if ($employee_no === null || $employee_no === "") {
            return "";
        }

        include_once("/var/www/html/MYSQLI_COMMON_FUNCTIONS.PHP");

        $con = Open_ILink("localhost");

        //employee_no comes from the session (set at login), but escape defensively.
        $safe_emp = mysqli_real_escape_string($con, $employee_no);

        $sql = "
            SELECT wm.ad_name AS username
            FROM personnel.v_workday_memory wm
            WHERE wm.employee_no = '".$safe_emp."'
            LIMIT 1;";

        $rs = ExecuteIQuery($sql, $con);

        $username = "";
        if ($rs && ($line = mysqli_fetch_assoc($rs))) {
            $username = $line["username"];
        }

        mysqli_close($con);

        return ($username === null) ? "" : $username;
    }
}
?>
