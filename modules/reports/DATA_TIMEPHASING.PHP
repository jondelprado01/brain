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

if (!function_exists('DMCLS_REFRESH_MEMORY')) {

    /**
     * App rule: shared.check_dmcls_memory() MUST be called before reading
     * shared.dmcls_memory (it refreshes/validates the fiscal calendar). Call this
     * right after opening a connection, before any SELECT that touches
     * shared.dmcls_memory.
     *
     * The proc may emit zero or more result sets; we flush whatever it returns so
     * the next query on the same mysqli connection doesn't fail with
     * "commands out of sync".
     *
     * @param mysqli $con open connection (from Open_ILink)
     */
    function DMCLS_REFRESH_MEMORY($con) {
        $rs = ExecuteIQuery("CALL shared.check_dmcls_memory();", $con);
        if ($rs instanceof mysqli_result) {
            mysqli_free_result($rs);
        }
        // drain any further result sets the CALL produced
        while (mysqli_more_results($con) && mysqli_next_result($con)) {
            $extra = mysqli_store_result($con);
            if ($extra instanceof mysqli_result) {
                mysqli_free_result($extra);
            }
        }
    }
}

if (!function_exists('GET_TIMEPHASING_SCHEDULES')) {

    /**
     * Fetch all live timephasing schedules.
     *
     * @return array List of assoc rows with keys:
     *               mfg_part_num, fyww, process_type, notes, change_dt, username
     */
    function GET_TIMEPHASING_SCHEDULES() {

        include_once("/var/www/html/MYSQLI_COMMON_FUNCTIONS.PHP");

        $iConBRAIN = Open_ILink("localhost");

        //required before reading shared.DMCLS_MEMORY (used by the fyww_status subquery)
        DMCLS_REFRESH_MEMORY($iConBRAIN);

        $strSQL = "
        	SELECT
        	MFG_YEAR*100+WEEK_NUMBER FYWW
        	FROM shared.DMCLS_MEMORY
        	WHERE MFG_DATE = DATE_FORMAT(NOW(),'%Y-%m-%d');";
        $RSMain = ExecuteIQuery($strSQL,$iConBRAIN);
        $intCurrFYWW = null;
        while ($LineMain = mysqli_fetch_assoc($RSMain)) {
        	$intCurrFYWW = $LineMain["FYWW"];
        }

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
        $strSQL = "
			SELECT
			M.TPI_ID,
			MAX(D.MFG_PART_NUM) MFG_PART_NUM,
            GROUP_CONCAT(DISTINCT D.GENERIC ORDER BY D.GENERIC) GENERIC,
			MAX(M.FYWW) FYWW,			
			MAX(M.SAP_RTE_ID) SAP_RTE_ID,
			MAX(M.PROCESS_TYPE) PROCESS_TYPE,
			MAX(M.NOTES) NOTES
			FROM BRAIN.TP_INSTANCE_MAIN M
			INNER JOIN BRAIN.TP_INSTANCE_DATA D ON M.TPI_ID = D.TPI_ID
			WHERE FYWW IS NOT NULL AND FYWW > 0
			GROUP BY M.TPI_ID
			ORDER BY FYWW, MFG_PART_NUM;";
		$RSMain = ExecuteIQuery($strSQL,$iConBRAIN);
		$aryMain = array();
		$aryTPIIDTemp = array();
		$aryReturn = array();

		while ($LineMain = mysqli_fetch_assoc($RSMain)) {
			$intTPIID = $LineMain["TPI_ID"];
			$aryTemp = $LineMain;
			unset($aryTemp["TPI_ID"]);

            #202607-21 RM force something for generic when not found
            if(!is_null($aryTemp["GENERIC"]) && trim($aryTemp["GENERIC"]) != "") {
                #do nothing
            }else{
                $aryTemp["GENERIC"] = "NO_GENERIC";
            }

			$aryMain[$intTPIID] = $aryTemp;
			$aryTPIIDTemp[] = mysqli_real_escape_string($iConBRAIN,$intTPIID);
		}

        $aryHist = array();
		if(count($aryTPIIDTemp) > 0) {
			$strSQL = "
				SELECT
				HM.TPI_ID,
				HM.HIST_TYPE,
				HM.HIST_DT,
				HM.CHANGE_USER,
				CASE TRUE
                    WHEN BUA.EMP_NAME IS NOT NULL THEN BUA.EMP_NAME
                    WHEN WD.AD_NAME IS NOT NULL THEN WD.AD_NAME
                    ELSE HM.CHANGE_USER
                END USERNAME
				FROM BRAIN.TP_INSTANCE_HIST_MASTER HM
				INNER JOIN 
				(
					SELECT
					MAX(TPH_MASTER_ID) TPH_MASTER_ID
					FROM BRAIN.TP_INSTANCE_HIST_MASTER
					GROUP BY TPI_ID
				) HM_MAX ON HM.TPH_MASTER_ID = HM_MAX.TPH_MASTER_ID
                LEFT JOIN BRAIN.USER_ACCOUNT BUA ON HM.CHANGE_USER = BUA.EMP_ID
				LEFT JOIN PERSONNEL.V_WORKDAY_MEMORY WD ON HM.CHANGE_USER = WD.EMPLOYEE_NO
				WHERE HM.TPI_ID IN (".implode(",",$aryTPIIDTemp).");";
			$RSMain = ExecuteIQuery($strSQL,$iConBRAIN);
			while ($LineMain = mysqli_fetch_assoc($RSMain)) {
				$intTPIID = $LineMain["TPI_ID"];
				$aryTemp = $LineMain;
                unset($aryTemp["TPI_ID"]);
                $aryHist[$intTPIID] = $aryTemp;
			}
		}

		mysqli_close($iConBRAIN);

        foreach($aryMain as $intTPIID => $aryMainTemp) {
        	$intFYWW = $aryMainTemp["FYWW"];
            $strFYWW = "FY".substr(floor($intFYWW/100),-2)."_W".str_pad($intFYWW % 100,2,"0",STR_PAD_LEFT);

            $aryHistTemp = array(
            	"HIST_TYPE"=>null,
            	"HIST_DT"=>null,
            	"USERNAME"=>null
            );
            if(isset($aryHist[$intTPIID])) {
            	$aryHistTemp = $aryHist[$intTPIID];
            }

			$aryTemp = array(
				"mfg_part_num"=>$aryMainTemp["MFG_PART_NUM"],
				"generic"=>$aryMainTemp["GENERIC"],
				"fyww"=>$strFYWW,
				"process_type"=>$aryMainTemp["PROCESS_TYPE"],
				"notes"=>$aryMainTemp["NOTES"],
				"hist_type"=>$aryHistTemp["HIST_TYPE"],
				"change_dt"=>$aryHistTemp["HIST_DT"],
				"username"=>$aryHistTemp["USERNAME"],
				'fyww_status'=>''
			);

			switch (true) {
				case $intFYWW < $intCurrFYWW:
					$aryTemp["fyww_status"] = "delinquent";
					break;
				case $intFYWW == $intCurrFYWW:
					$aryTemp['fyww_status'] = 'current';
					break;
			}

			$aryReturn[] = $aryTemp;
		}

        return $aryReturn;
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

        //required before reading shared.DMCLS_MEMORY
        DMCLS_REFRESH_MEMORY($con);

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

if (!function_exists('GET_FYWW_ORDINALS')) {

    /**
     * Chronological ordinal for every FYWW in the fiscal calendar: each week's
     * Sunday (mfg_date) ranked oldest->newest, so consecutive weeks differ by 1
     * REGARDLESS of fiscal-year boundaries (unlike MFG_YEAR*100+WEEK_NUMBER, where
     * FY26_W52 -> FY27_W01 looks like a ~49-week jump). The Timephasing density
     * fishbone uses this to space ribs by true week-distance.
     *
     * Keyed by the SAME display string the rows use (FY##_W##) so the JS can look
     * up an ordinal directly by the fyww it already has.
     *
     * @return array assoc map { "FY##_W##" => int ordinal (0-based) }
     */
    function GET_FYWW_ORDINALS() {

        include_once("/var/www/html/MYSQLI_COMMON_FUNCTIONS.PHP");

        $con = Open_ILink("localhost");

        //required before reading shared.DMCLS_MEMORY
        DMCLS_REFRESH_MEMORY($con);

        //one row per FYWW (calendar has one mfg_date/Sunday per week); order by the
        //week's date so the ordinal is true chronological rank.
        $sql = "
            SELECT CONCAT('FY', RIGHT(c.MFG_YEAR, 2),
                          '_W', LPAD(c.WEEK_NUMBER, 2, '0')) AS fyww
            FROM shared.DMCLS_MEMORY c
            GROUP BY c.MFG_YEAR, c.WEEK_NUMBER
            ORDER BY MIN(c.mfg_date) ASC;";

        $rs = ExecuteIQuery($sql, $con);

        $ordinals = array();
        if ($rs) {
            $i = 0;
            while ($line = mysqli_fetch_assoc($rs)) {
                if ($line["fyww"] !== null && $line["fyww"] !== "") {
                    $ordinals[$line["fyww"]] = $i;
                    $i++;
                }
            }
        }

        mysqli_close($con);

        return $ordinals;
    }
}

if (!function_exists('GET_USERNAME_FOR_EMPLOYEE')) {

    /**
     * Resolve a single employee_no to the SAME "username" string the schedule
     * listing shows for rows that employee edited, so the Timephasing username
     * filter can default to the logged-in user and actually match their rows.
     *
     * This MUST mimic the cascade the main GET_TIMEPHASING_SCHEDULES() history
     * query uses to build USERNAME (its CASE over the two LEFT JOINs on
     * HM.CHANGE_USER), or the default filter value won't equal the displayed
     * name and the user sees an empty grid:
     *   1. BRAIN.USER_ACCOUNT.EMP_NAME       (keyed EMP_ID = employee_no)
     *   2. PERSONNEL.V_WORKDAY_MEMORY.AD_NAME (keyed EMPLOYEE_NO = employee_no)
     *   3. else the raw employee_no itself
     * "IS NOT NULL" semantics are matched: a present-but-null EMP_NAME falls
     * through to the workday name, exactly as the SQL CASE does.
     *
     * Per the app's query convention we don't reproduce the JOINs here; we run
     * two targeted PK/index lookups and resolve the precedence in PHP.
     *
     * @param  string|int $employee_no  the logged-in user's EMP_NO
     * @return string                    the resolved username, or "" if no input
     */
    function GET_USERNAME_FOR_EMPLOYEE($employee_no) {

        if ($employee_no === null || $employee_no === "") {
            return "";
        }

        include_once("/var/www/html/MYSQLI_COMMON_FUNCTIONS.PHP");

        $con = Open_ILink("localhost");

        //employee_no comes from the session (set at login), but escape defensively.
        $safe_emp = mysqli_real_escape_string($con, $employee_no);

        //1) BRAIN.USER_ACCOUNT.EMP_NAME — first preference (EMP_ID = employee_no).
        $username = null;
        $sql = "
            SELECT ua.EMP_NAME AS username
            FROM BRAIN.USER_ACCOUNT ua
            WHERE ua.EMP_ID = '".$safe_emp."'
            LIMIT 1;";
        $rs = ExecuteIQuery($sql, $con);
        if ($rs && ($line = mysqli_fetch_assoc($rs))) {
            $username = $line["username"];   //null if the column is NULL -> fall through
        }

        //2) PERSONNEL.V_WORKDAY_MEMORY.AD_NAME — second preference
        //   (EMPLOYEE_NO = employee_no). Only consulted when EMP_NAME was NULL.
        if ($username === null) {
            $sql = "
                SELECT wm.ad_name AS username
                FROM personnel.v_workday_memory wm
                WHERE wm.employee_no = '".$safe_emp."'
                LIMIT 1;";
            $rs = ExecuteIQuery($sql, $con);
            if ($rs && ($line = mysqli_fetch_assoc($rs))) {
                $username = $line["username"];
            }
        }

        mysqli_close($con);

        //3) fallback: the raw employee_no, mirroring the CASE's ELSE HM.CHANGE_USER
        //   so the default filter still matches rows resolved to the bare emp_no.
        return ($username === null) ? $employee_no : $username;
    }
}

if (!function_exists('GET_MULTI_RTE_EXCEPTIONS')) {

    /**
     * Exception report: MFG_PART_NUMs that map to MORE THAN ONE distinct sap_rte_id
     * for the SAME site_num. A given part at a given site should resolve to a single
     * SAP routing; more than one is a data anomaly worth surfacing at the top of the
     * report.
     *
     * mfg_part_num + site_num come from brain.tp_instance_data; sap_rte_id from
     * brain.tp_instance_main, joined on tpi_id. We count DISTINCT non-null sap_rte_id
     * per (mfg_part_num, site_num) and keep only groups with >1, listing the routes.
     *
     * @return array List of assoc rows:
     *               mfg_part_num, site_num, rte_count, sap_rte_ids (comma list)
     */
    function GET_MULTI_RTE_EXCEPTIONS() {

        include_once("/var/www/html/MYSQLI_COMMON_FUNCTIONS.PHP");

        $con = Open_ILink("localhost");

        $sql = "
            SELECT
                d.mfg_part_num AS mfg_part_num,
                d.site_num     AS site_num,
                COUNT(DISTINCT m.sap_rte_id) AS rte_count,
                GROUP_CONCAT(DISTINCT m.sap_rte_id ORDER BY m.sap_rte_id SEPARATOR ', ') AS sap_rte_ids
            FROM brain.tp_instance_data d
            JOIN brain.tp_instance_main m
                  ON m.tpi_id = d.tpi_id
            WHERE d.mfg_part_num IS NOT NULL AND d.mfg_part_num <> ''
              AND m.sap_rte_id  IS NOT NULL AND m.sap_rte_id  <> ''
            GROUP BY d.mfg_part_num, d.site_num
            HAVING COUNT(DISTINCT m.sap_rte_id) > 1
            ORDER BY d.mfg_part_num, d.site_num;";

        $rs = ExecuteIQuery($sql, $con);

        $rows = array();
        if ($rs) {
            while ($line = mysqli_fetch_assoc($rs)) {
                $rows[] = array(
                    "mfg_part_num" => $line["mfg_part_num"],
                    "site_num"     => $line["site_num"],
                    "rte_count"    => $line["rte_count"],
                    "sap_rte_ids"  => $line["sap_rte_ids"],
                );
            }
        }

        mysqli_close($con);

        return $rows;
    }
}
?>
