/*
 * report-timephasing.js
 * ---------------------
 * Client-side rendering + filtering + ordering for the REPORTS module's
 * "Timephasing" tab.
 *
 * The full live-schedule dataset is injected by modules/reports/INDEX.PHP as the
 * global `timephasing_data` (array of {mfg_part_num, generic, fyww, process_type,
 * notes, change_dt, username}). `current_username` is the logged-in user's AD name.
 *
 * Behaviours (per spec):
 *  - Filters sit in a row directly under each column header.
 *  - The USERNAME filter is PART-LEVEL: it selects every MFG_PART_NUM the value
 *    touches, then shows ALL schedules for those parts (including rows last
 *    touched by other people). Defaults to the current user on load; clearing it
 *    shows everyone.
 *  - The other column filters (MFG_PART_NUM, FYWW, PROCESS TYPE, NOTES,
 *    CHANGE DATE) are plain row filters.
 *  - Ordering is customizable (explicit sort controls + clickable headers) and is
 *    GROUP-AWARE: all rows sharing a MFG_PART_NUM are always kept contiguous,
 *    positioned where that part first appears under the active order. Default
 *    order is FYWW then MFG_PART_NUM.
 *  - The applied ordering is persisted in localStorage and restored next visit.
 *    (Filters are NOT persisted; username re-defaults to the current user.)
 *
 * Because part-level filtering and group-aware ordering are not native DataTables
 * behaviours, we own the filter+order pipeline here and hand DataTables a
 * pre-arranged array (via clear()/rows.add()/draw()). DataTables still provides
 * paging, global search, and copy/csv/excel export.
 *
 * Export uses the Buttons extension from the datatables-index-time bundle.
 */
$(document).ready(function () {

    // ---- constants -----------------------------------------------------------

    var STORAGE_KEY = "brain.reports.timephasing.sort.v1";

    // column index -> data key (matches the <thead> order in INDEX.PHP)
    var COLS = ["mfg_part_num", "generic", "fyww", "process_type", "notes", "change_dt", "username"];
    var COL_LABELS = {
        mfg_part_num: "MFG PART NUM",
        generic:      "GENERIC",
        fyww:         "FYWW",
        process_type: "PROCESS TYPE",
        notes:        "NOTES",
        change_dt:    "CHANGE DATE",
        username:     "USERNAME"
    };

    // default order: FYWW asc, then MFG_PART_NUM asc
    var DEFAULT_SORT = [
        { key: "fyww",         dir: "asc" },
        { key: "mfg_part_num", dir: "asc" }
    ];

    // Some columns offer a "(no null)" sort variant whose key is the base key plus
    // this suffix. It sorts on the same value BUT forces blank/null cells to the
    // BOTTOM regardless of direction, so they don't float to the top on an ascending
    // sort. Only the columns listed here get the extra dropdown option.
    var NONULL_SUFFIX = "__nonull";
    var NONULL_COLS = ["notes", "username"];

    var ALL_DATA = (typeof timephasing_data !== "undefined" && timephasing_data) ? timephasing_data : [];
    var CURRENT_USER = (typeof current_username !== "undefined" && current_username) ? current_username : "";
    var CURRENT_FYWW = (typeof current_fyww !== "undefined" && current_fyww) ? current_fyww : "";
    // chronological ordinal per FYWW from the fiscal calendar (shared.DMCLS_MEMORY),
    // used to space the fishbone ribs by true week-distance across FY boundaries.
    var FYWW_ORDINALS = (typeof fyww_ordinals !== "undefined" && fyww_ordinals) ? fyww_ordinals : {};

    // FYWW column header text: base label plus the current week's FYWW (same
    // FY##_W## format as the data rows) when known.
    var FYWW_TITLE = CURRENT_FYWW ? ("FYWW (curr: " + CURRENT_FYWW + ")") : "FYWW";

    // ---- helpers -------------------------------------------------------------

    function val(row, key) {
        var v = row[key];
        return (v === null || typeof v === "undefined") ? "" : v;
    }

    // case-insensitive substring match used by the plain row filters
    function matches(cellVal, needle) {
        if (!needle) { return true; }
        return String(cellVal).toLowerCase().indexOf(String(needle).toLowerCase()) !== -1;
    }

    // FYWW timeliness badge markup for a status ("delinquent" | "current" | "").
    // Shared by the FYWW column renderer and the herringbone spine node so the two
    // icon treatments can never drift. Returns "" (no leading space) for no status.
    function fywwBadge(status) {
        if (status === "delinquent") {
            return '<i class="fa-solid fa-circle-exclamation text-danger" title="Delinquent"></i>';
        }
        if (status === "current") {
            return '<i class="fa-solid fa-triangle-exclamation text-warning" title="Current week"></i>';
        }
        return "";
    }

    // summary bar for the density fishbone: counts of SCHEDULES by their FYWW
    // timeliness (delinquent / current="risk" / OK), shown above the diagram.
    // Orientation-independent — both builders prepend it. Returns a jQuery element.
    function hbSummaryBar(rows) {
        var d = 0, c = 0, ok = 0;
        rows.forEach(function (r) {
            var s = val(r, "fyww_status");
            if (s === "delinquent") { d++; }
            else if (s === "current") { c++; }
            else { ok++; }
        });
        return $('<div class="tp-hb-summarybar"></div>')
            .append('<span class="tp-hb-sum tp-hb-sum-del"><i class="fa-solid fa-circle-exclamation text-danger"></i> ' + d + ' delinquent</span>')
            .append('<span class="tp-hb-sum tp-hb-sum-risk"><i class="fa-solid fa-triangle-exclamation text-warning"></i> ' + c + ' risk</span>')
            .append('<span class="tp-hb-sum tp-hb-sum-ok"><i class="fa-solid fa-circle-check text-success"></i> ' + ok + ' OK</span>');
    }

    // parse a FY##_W## display string to its comparable integer (yy*100 + ww).
    // Used to order the herringbone weeks chronologically and to place the
    // current-FYWW marker. Non-matching input sorts last.
    function fywwSortKey(fyww) {
        var m = /FY(\d+)_W(\d+)/i.exec(String(fyww || ""));
        if (!m) { return Number.MAX_SAFE_INTEGER; }
        return parseInt(m[1], 10) * 100 + parseInt(m[2], 10);
    }

    function loadSort() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) { return null; }
            var parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length) {
                // keep only known keys/dirs
                var clean = parsed.filter(function (s) {
                    return s && isKnownSortKey(s.key) && (s.dir === "asc" || s.dir === "desc");
                });
                return clean.length ? clean : null;
            }
        } catch (e) { /* ignore corrupt state */ }
        return null;
    }

    function saveSort(sort) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sort));
        } catch (e) { /* storage may be unavailable; non-fatal */ }
    }

    // the underlying data key for a sort key, stripping the "(no null)" suffix.
    function baseSortKey(key) {
        if (key && key.length > NONULL_SUFFIX.length &&
            key.slice(-NONULL_SUFFIX.length) === NONULL_SUFFIX) {
            return key.slice(0, -NONULL_SUFFIX.length);
        }
        return key;
    }

    // true when this sort key is the "(no null)" variant (blanks forced to bottom).
    function isNoNull(key) {
        return key !== baseSortKey(key);
    }

    // valid sort key: a known column, and if it's a "(no null)" variant the base
    // column must actually offer that option.
    function isKnownSortKey(key) {
        var base = baseSortKey(key);
        if (COLS.indexOf(base) === -1) { return false; }
        return !isNoNull(key) || NONULL_COLS.indexOf(base) !== -1;
    }

    // a comparator over a list of {key,dir}; fyww/change_dt compared as strings
    // (FY##_W## and ISO-ish dates both sort correctly lexicographically).
    // For a "(no null)" key, blank/null cells always sort to the BOTTOM regardless
    // of direction (so ascending doesn't float them to the top).
    function compareBy(sort, a, b) {
        for (var i = 0; i < sort.length; i++) {
            var rawKey = sort[i].key;
            var key = baseSortKey(rawKey);
            var factor = (sort[i].dir === "desc") ? -1 : 1;
            var av = String(val(a, key)).toLowerCase();
            var bv = String(val(b, key)).toLowerCase();
            if (isNoNull(rawKey)) {
                var ae = (av === ""), be = (bv === "");
                if (ae && !be) { return 1; }   // a is blank -> after b
                if (!ae && be) { return -1; }  // b is blank -> after a
            }
            if (av < bv) { return -1 * factor; }
            if (av > bv) { return 1 * factor; }
        }
        return 0;
    }

    /*
     * Group-aware ordering:
     *  1. sort all surviving rows by the active multi-key sort;
     *  2. walk that sorted list; the FIRST time a MFG_PART_NUM is seen fixes that
     *     part's position; all rows for the part are emitted together there,
     *     internally ordered by the same sort.
     * This keeps every part's schedules contiguous under ANY ordering.
     */
    function groupAwareOrder(rows, sort) {
        var sorted = rows.slice().sort(function (a, b) { return compareBy(sort, a, b); });

        var buckets = {};      // part -> [rows]
        var order = [];        // part order of first appearance

        sorted.forEach(function (r) {
            var part = val(r, "mfg_part_num");
            if (!buckets[part]) {
                buckets[part] = [];
                order.push(part);
            }
            buckets[part].push(r);
        });

        var out = [];
        order.forEach(function (part) {
            // bucket rows are already in global sort order (stable), keep as-is
            buckets[part].forEach(function (r) { out.push(r); });
        });
        return out;
    }

    // ---- filter state --------------------------------------------------------

    // per-column filter text; username handled specially (part-level)
    var colFilters = { 0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" };

    function currentSort() {
        var s = [];
        var f1 = $("#tpSortField").val(),  d1 = $("#tpSortDir").val();
        var f2 = $("#tpSortField2").val(), d2 = $("#tpSortDir2").val();
        var f3 = $("#tpSortField3").val(), d3 = $("#tpSortDir3").val();
        if (f1) { s.push({ key: f1, dir: d1 || "asc" }); }
        if (f2 && f2 !== f1) { s.push({ key: f2, dir: d2 || "asc" }); }
        if (f3 && f3 !== f1 && f3 !== f2) { s.push({ key: f3, dir: d3 || "asc" }); }
        return s.length ? s : DEFAULT_SORT.slice();
    }

    /*
     * Build the arranged row set:
     *  - plain row filters on columns 0-4 (mfg_part_num, fyww, process, notes, date)
     *  - USERNAME (col 5) is part-level: find the parts any matching username
     *    touched, then keep ALL rows for those parts
     *  - then apply group-aware ordering
     */
    function arrangedRows() {
        var rows = ALL_DATA;

        // part-level username filter
        var uname = colFilters[6];
        if (uname) {
            var parts = {};
            ALL_DATA.forEach(function (r) {
                if (matches(val(r, "username"), uname)) {
                    parts[val(r, "mfg_part_num")] = true;
                }
            });
            rows = rows.filter(function (r) { return parts[val(r, "mfg_part_num")]; });
        }

        // plain row filters for the other columns
        rows = rows.filter(function (r) {
            return matches(val(r, "mfg_part_num"), colFilters[0]) &&
                   matches(val(r, "generic"),      colFilters[1]) &&
                   matches(val(r, "fyww"),         colFilters[2]) &&
                   matches(val(r, "process_type"), colFilters[3]) &&
                   matches(val(r, "notes"),        colFilters[4]) &&
                   matches(val(r, "change_dt"),    colFilters[5]);
        });

        return groupAwareOrder(rows, currentSort());
    }

    // ---- column dropdown (datalist) facets -----------------------------------

    // rows passing every column filter EXCEPT the given column's own filter.
    // Used to compute a column's dropdown options so the choices reflect the
    // other active filters (cascading) without a column hiding its own values.
    function rowsForFacet(excludeCol) {
        var rows = ALL_DATA;

        // part-level username filter (unless username is the excluded column)
        var uname = (excludeCol === 6) ? "" : colFilters[6];
        if (uname) {
            var parts = {};
            ALL_DATA.forEach(function (r) {
                if (matches(val(r, "username"), uname)) {
                    parts[val(r, "mfg_part_num")] = true;
                }
            });
            rows = rows.filter(function (r) { return parts[val(r, "mfg_part_num")]; });
        }

        return rows.filter(function (r) {
            return (excludeCol === 0 || matches(val(r, "mfg_part_num"), colFilters[0])) &&
                   (excludeCol === 1 || matches(val(r, "generic"),      colFilters[1])) &&
                   (excludeCol === 2 || matches(val(r, "fyww"),         colFilters[2])) &&
                   (excludeCol === 3 || matches(val(r, "process_type"), colFilters[3])) &&
                   (excludeCol === 4 || matches(val(r, "notes"),        colFilters[4])) &&
                   (excludeCol === 5 || matches(val(r, "change_dt"),    colFilters[5]));
        });
    }

    // distinct non-empty values for a column, over the facet rows above.
    // CHANGE DATE (col 4) is reduced to date-only to match its on-screen display
    // (the substring filter still matches the full timestamp).
    function optionsForCol(col) {
        var key = COLS[col];
        var rows = rowsForFacet(col);
        var seen = {}, out = [];
        rows.forEach(function (r) {
            var v = val(r, key);
            v = (v === null || typeof v === "undefined") ? "" : String(v);
            if (col === 5) { v = v.substring(0, 10); }
            v = v.trim();
            if (v === "" || Object.prototype.hasOwnProperty.call(seen, v)) { return; }
            seen[v] = true;
            out.push(v);
        });
        out.sort(function (a, b) {
            var al = a.toLowerCase(), bl = b.toLowerCase();
            return al < bl ? -1 : (al > bl ? 1 : 0);
        });
        return out;
    }

    function escAttr(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function datalistId(col) { return "tpColList" + col; }

    // (re)build every column's <datalist> options. Skips the input the user is
    // currently typing in: its option set excludes its own filter (so it would
    // not change anyway) and replacing nodes could collapse the open dropdown.
    function rebuildDatalists() {
        var active = document.activeElement;
        for (var col = 0; col <= 6; col++) {
            var $input = $('#tpScheduleTable thead .column-filter[data-col="' + col + '"]');
            if (!$input.length || (active && active === $input.get(0))) { continue; }
            var dl = document.getElementById(datalistId(col));
            if (!dl) { continue; }
            var opts = optionsForCol(col);
            var html = "";
            for (var i = 0; i < opts.length; i++) {
                html += '<option value="' + escAttr(opts[i]) + '"></option>';
            }
            dl.innerHTML = html;
        }
    }

    var ALL_DB_BASE = "http://testweb2.maxim-ic.com/ALL_DATABASES/all_db_adi.php?EXACT=1&txtdie=";
    var ALL_DB_TARGET = "brain_alldb";

    // build the per-row "ALL DB" link cell for a MFG_PART_NUM.
    // Uses a fixed window target (not "_blank") so the first click opens one tab and
    // every later click reloads THAT tab with the new part, rather than piling up a
    // tab per part. No rel="noopener" — see the PA note below; noopener suppresses
    // window-name registration and would break tab reuse.
    function allDbCell(part) {
        if (!part) { return ""; }
        var href = ALL_DB_BASE + encodeURIComponent(part);
        return '<a class="btn btn-sm btn-outline-primary all-db-btn" target="' + ALL_DB_TARGET +
               '" href="' + href + '">ALL DB</a>';
    }

    // Planning Assumptions deep-link. This is the SAME navigation the PA page's own
    // "Planning Assumptions" load button performs (custom.js getMainDisplayData ->
    // window.location = ENVIRONMENT + "?partnum[0]=..."); the root INDEX.PHP reads
    // $_REQUEST['partnum'] and renders the main display for that part. So one click
    // here replaces the copy -> open PA -> search -> wait -> checkbox -> load path.
    //
    // The fixed target name (not "_blank") means the first click opens one tab and
    // every later click reuses/reloads THAT tab as the user jumps between parts,
    // rather than piling up a tab per part.
    //
    // NOTE: no rel="noopener" here. Per the HTML spec, "noopener" opens the tab
    // WITHOUT registering its window name, so the name can't be found for reuse and
    // every click spawns a fresh tab. Since the target is the same internal server,
    // omitting noopener is safe (no cross-origin reverse-tabnabbing risk).
    var PA_BASE = "http://mxhtafot01l.maxim-ic.com/TEST/BRAIN_UI_JCDP/INDEX.PHP?partnum[0]=";
    var PA_TARGET = "brain_pa";

    // the PA deep-link URL for a part. Shared by the row PA button and the
    // herringbone's clickable MFG_PART_NUM entries so both jump identically.
    function paHref(part) {
        return PA_BASE + encodeURIComponent(part);
    }

    function paCell(part) {
        if (!part) { return ""; }
        return '<a class="btn btn-sm btn-outline-success pa-btn" target="' + PA_TARGET +
               '" title="Load Planning Assumptions for this part" href="' +
               paHref(part) + '">PA</a>';
    }

    function rowToArray(r) {
        var part = val(r, "mfg_part_num");
        return [
            part,
            val(r, "generic"),
            // FYWW cell carries the raw string; the timeliness badge is added by
            // the column's display renderer (see the columns config), which reads
            // the status packaged onto the value here. We keep the exported/filter
            // value as the plain FYWW string, so the status travels separately.
            { fyww: val(r, "fyww"), status: val(r, "fyww_status") },
            val(r, "process_type"),
            val(r, "notes"),
            val(r, "change_dt"),
            val(r, "username"),
            paCell(part) + " " + allDbCell(part)
        ];
    }

    // ---- DataTable (rendering / paging / search / export only) ---------------

    var tpTable = new DataTable("#tpScheduleTable", {
        data: [],
        // our own ordering is applied via the data array; disable DT's sorting
        // so it never re-orders (which would break grouping).
        ordering: false,
        columns: [
            { title: "MFG PART NUM" },
            { title: "GENERIC" },
            {
                // FYWW cell value is { fyww: "FY##_W##", status: "" | "delinquent"
                // | "current" }. On-screen we append a timeliness badge; export,
                // filter and sort all receive the plain FYWW string so the icon
                // never lands in copied/CSV/Excel output.
                title: FYWW_TITLE,
                render: function (data, type) {
                    var text = (data && typeof data === "object") ? (data.fyww || "") : (data || "");
                    if (type !== "display") { return text; }
                    var status = (data && typeof data === "object") ? data.status : "";
                    var badge = fywwBadge(status);
                    return badge ? (text + " " + badge) : text;
                }
            },
            { title: "PROCESS TYPE" },
            { title: "NOTES" },
            {
                title: "CHANGE DATE",
                // change_dt arrives as a full "YYYY-MM-DD HH:MM:SS" timestamp.
                // On-screen (display) shows the date only; exports request the
                // "export" orthogonal type (set on the buttons below) and get the
                // full timestamp. filter/sort also use the full value.
                render: function (data, type) {
                    if (!data) { return ""; }
                    if (type === "display") { return String(data).substring(0, 10); }
                    return data; // export / filter / sort get the full timestamp
                }
            },
            { title: "USERNAME" },
            { title: '<i class="fa-solid fa-frog"></i> LINKS', className: "no-export", orderable: false, searchable: false }
        ],
        pageLength: 25,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        autoWidth: false,
        // keep DT's own header-cell sort handlers off the filter input row
        orderCellsTop: true,
        // shade/border rows whose MFG_PART_NUM has multiple schedules so grouped
        // parts read as one block. rowMeta is built in refresh() in the same order
        // rows are added (ordering:false => dataIndex == insertion order).
        rowCallback: function (tr, data, displayNum, displayIndex, dataIndex) {
            var meta = rowMeta[dataIndex];
            $(tr).removeClass("tp-group tp-group-alt tp-group-start tp-group-end");
            if (!meta || !meta.grouped) { return; }
            $(tr).addClass("tp-group");
            if (meta.parity) { $(tr).addClass("tp-group-alt"); }
            if (meta.start) { $(tr).addClass("tp-group-start"); }
            if (meta.end)   { $(tr).addClass("tp-group-end"); }
        },
        layout: {
            topStart: {
                buttons: [
                    // explicit data-column indices (0-6) so the LINKS button column
                    // (7) — the PA and ALL DB buttons — can NEVER be exported,
                    // regardless of class-selector timing.
                    // orthogonal:"export" makes CHANGE DATE export the full timestamp
                    // while the on-screen cell shows date-only.
                    { extend: "copy",  exportOptions: { columns: [0, 1, 2, 3, 4, 5, 6], orthogonal: "export" } },
                    { extend: "csv",   filename: "TIMEPHASING_SCHEDULES", exportOptions: { columns: [0, 1, 2, 3, 4, 5, 6], orthogonal: "export" } },
                    { extend: "excel", filename: "TIMEPHASING_SCHEDULES", exportOptions: { columns: [0, 1, 2, 3, 4, 5, 6], orthogonal: "export" } }
                ]
            },
            topEnd: "pageLength"
        }
    });

    // per-row grouping metadata, index-aligned with the rows handed to DataTables
    // (rebuilt every refresh). rowCallback reads it by dataIndex.
    var rowMeta = [];

    // push the currently-arranged rows into the table
    function refresh() {
        var arranged = arrangedRows();

        // Build grouping metadata. A part is "grouped" only when it has >1 row in
        // the current arrangement. We alternate a shade flag between consecutive
        // grouped parts so adjacent groups stay visually distinct, and mark the
        // first/last row of each group for top/bottom borders.
        var counts = {};
        arranged.forEach(function (r) {
            var p = val(r, "mfg_part_num");
            counts[p] = (counts[p] || 0) + 1;
        });

        rowMeta = [];
        var parity = false, prevPart = null;
        arranged.forEach(function (r, i) {
            var part = val(r, "mfg_part_num");
            var grouped = counts[part] > 1;
            if (grouped && part !== prevPart) { parity = !parity; }
            var nextPart = (i + 1 < arranged.length) ? val(arranged[i + 1], "mfg_part_num") : null;
            rowMeta.push({
                grouped: grouped,
                parity:  grouped ? parity : false,
                start:   grouped && part !== prevPart,
                end:     grouped && part !== nextPart
            });
            prevPart = part;
        });

        var rows = arranged.map(rowToArray);
        tpTable.clear();
        tpTable.rows.add(rows);
        tpTable.draw(false);
    }

    // ---- FYWW herringbone (schedule density) ---------------------------------

    // measure rendered text width (works while the modal is hidden). Bold matches
    // the user-header weight so band widths account for the heavier line.
    var _hbCanvas = null;
    function hbTextWidth(text, bold) {
        if (!_hbCanvas) { _hbCanvas = document.createElement("canvas"); }
        var ctx = _hbCanvas.getContext("2d");
        ctx.font = (bold ? "600 " : "") + '12px "Segoe UI", Arial, sans-serif';
        return ctx.measureText(String(text == null ? "" : text)).width;
    }

    /*
     * Build an Ishikawa (cause-and-effect / fishbone) diagram from the CURRENT
     * filter set. Sourced from arrangedRows() (username part-level filter + all
     * column filters, group-aware order) so it always matches the table — and is
     * INDEPENDENT of DataTables paging: every matching schedule is shown.
     *
     * Structure: ONE unbroken horizontal spine (a full-width line under every hub).
     * Each FYWW is an angled RIB off the spine (alternating up/down by index). The
     * week's schedules are HORIZONTAL text lines (never rotated) that STEP along the
     * rib — each successive line offset up/down-and-right by the rib's angle — so the
     * text follows the bone without being skewed. The FYWW label (+ timeliness badge)
     * sits at the rib tip. Schedules group by USERNAME (a bold header line with a
     * count), each entry = MFG_PART_NUM (clickable -> PA) + PROCESS TYPE + a reserved
     * .tp-hb-summary slot for the future per-TPI_ID API change summary. The current
     * FYWW always appears (a short empty rib if it has no schedules).
     *
     * Geometry is computed here (rib length from line count, per-week band width from
     * measured text, uniform half-height so every hub lands on the spine center line)
     * because a pure-CSS angled layout can't size itself to variable content.
     */
    // ---- orientation dispatch ------------------------------------------------
    // Two launchers are offered (see init): "horizontal" (spine left->right, ribs
    // sweep up/down) and "vertical" (spine top->bottom, ribs sweep left/right).
    // buildHerringbone(orientation) renders whichever the clicked button requests.
    function buildHerringbone(orientation) {
        if (orientation === "vertical") {
            return buildHerringboneVertical();
        }
        return buildHerringboneHorizontal();
    }

    // === HORIZONTAL form ========================================================
    function buildHerringboneHorizontal() {
        var rows = arrangedRows();

        // bucket rows by FYWW; preserve first-seen status per week
        var weeks = {};
        rows.forEach(function (r) {
            var fyww = val(r, "fyww");
            if (!fyww) { return; }
            if (!weeks[fyww]) {
                weeks[fyww] = { status: val(r, "fyww_status"), users: {}, order: [], count: 0 };
            }
            var w = weeks[fyww];
            var uname = val(r, "username");
            if (!w.users[uname]) { w.users[uname] = []; w.order.push(uname); }
            w.users[uname].push(r);
            w.count++;
        });
        if (CURRENT_FYWW && !weeks[CURRENT_FYWW]) {
            weeks[CURRENT_FYWW] = { status: "current", users: {}, order: [], count: 0, empty: true };
        }

        // order usernames alphabetically (case-insensitive) within each FYWW bucket
        Object.keys(weeks).forEach(function (k) {
            weeks[k].order.sort(function (a, b) {
                return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
            });
        });

        var weekKeys = Object.keys(weeks).sort(function (a, b) {
            return fywwSortKey(a) - fywwSortKey(b);
        });

        // --- geometry constants ---
        var ANGLE_DEG = 45;          // rib angle off the spine
        var ANGLE = ANGLE_DEG * Math.PI / 180;
        var SIN = Math.sin(ANGLE), COS = Math.cos(ANGLE);
        var V_STEP = 18;             // vertical px between consecutive cause lines
        var D_STEP = V_STEP / SIN;   // matching step measured ALONG the rib
        // along-rib distance to the first line (FYWW). Kept large enough that the
        // first line starts well clear of the spine, leaving room for the on-spine
        // missing-week tickmarks below without the FYWW text landing on them.
        var D0 = 40;
        var TIP_GAP = 20;            // trailing along-rib space past the last line
        var TEXT_GAP = 12;           // horizontal gap between the rib and its text
        var TEXT_H = 16;
        var MIN_W = 90;
        // spine spacing: the spine is a TIME axis. A hub sits PX_PER_WEEK px right of
        // the previous hub per FYWW "week" of separation, so W31->W32 (1 wk) is tight
        // and W35->W38 (3 wk) is ~3x wider — independent of rib text width. A per-rib
        // MIN_STEP floor (from its own text extent) prevents content collisions.
        var PX_PER_WEEK = 46;
        var GAP_MAX = 500;           // clamp so a huge jump can't shove weeks offscreen

        // pass 1: flatten each week's lines, measure, compute rib length + extents.
        // Reading order along the rib from the spine outward: FYWW, then per user
        // the username, then that user's MFG_PART_NUM(s) + PROCESS TYPE.
        var models = weekKeys.map(function (fyww, idx) {
            var w = weeks[fyww];
            var lines = [];          // { bold, build(), width }

            // 1) FYWW header line (with timeliness badge + schedule count) nearest
            //    the spine. The count follows the badge so the reading order is
            //    week -> timeliness -> how many schedules that week holds.
            (function () {
                var badge = fywwBadge(w.status);
                var cnt = w.count;
                lines.push({
                    bold: true,
                    width: hbTextWidth(fyww + (cnt > 0 ? "  " + cnt : ""), true) + 48,
                    build: function () {
                        var $c = $('<div class="tp-hb-cause tp-hb-fyww"></div>').text(fyww);
                        if (badge) { $c.append(" ").append(badge); }
                        if (cnt > 0) { $c.append('<span class="tp-hb-count tp-hb-fyww-count">' + cnt + '</span>'); }
                        return $c;
                    }
                });
            })();

            if (w.empty) {
                lines.push({
                    bold: false,
                    width: hbTextWidth("no schedules", false) + 12,
                    build: function () {
                        return $('<div class="tp-hb-cause tp-hb-empty"></div>').text("no schedules");
                    }
                });
            } else {
                w.order.forEach(function (uname) {
                    var list = w.users[uname];
                    var label = uname ? String(uname) : "(unknown)";
                    // 2) username line
                    lines.push({
                        bold: true,
                        width: hbTextWidth(label + "  " + list.length, true) + 26,
                        build: function () {
                            return $('<div class="tp-hb-cause tp-hb-user"></div>')
                                .text(label)
                                .append('<span class="tp-hb-count">' + list.length + '</span>');
                        }
                    });
                    // 3) that user's parts
                    list.forEach(function (r) {
                        var part = val(r, "mfg_part_num");
                        var proc = val(r, "process_type");
                        var text = (part ? part : "") + (proc ? "  " + proc : "");
                        lines.push({
                            bold: false,
                            width: hbTextWidth(text, false) + 12,
                            build: function () {
                                var $c = $('<div class="tp-hb-cause tp-hb-entry"></div>');
                                if (part) {
                                    $c.addClass("tp-hb-has-part");
                                    $c.append($('<a class="tp-hb-part"></a>')
                                        .attr("href", paHref(part))
                                        .attr("target", PA_TARGET)
                                        .attr("title", "Load Planning Assumptions for this part")
                                        .text(part));
                                }
                                if (proc) { $c.append(' <span class="tp-hb-proc"></span>').find(".tp-hb-proc").text(proc); }
                                $c.append('<span class="tp-hb-summary"></span>');
                                return $c;
                            }
                        });
                    });
                });
            }

            var n = lines.length;
            var L = D0 + (n - 1) * D_STEP + TIP_GAP;
            var tipX = L * COS, tipY = L * SIN;

            var maxRight = 0;
            lines.forEach(function (ln, i) {
                var dx = (D0 + i * D_STEP) * COS;
                maxRight = Math.max(maxRight, dx + TEXT_GAP + ln.width);
            });

            // true chronological ordinal from the fiscal calendar when available;
            // fall back to the yy*100+ww key (correct within a fiscal year).
            var ord = Object.prototype.hasOwnProperty.call(FYWW_ORDINALS, fyww)
                ? FYWW_ORDINALS[fyww] : null;

            // minimum hub-to-hub advance so THIS rib's text clears the next hub.
            // Adjacent ribs alternate up/down, so their horizontal spans may overlap
            // somewhat without visual collision; MIN_OVERLAP scales the floor below
            // the full text extent to keep dense weeks from over-spreading.
            var MIN_OVERLAP = 0.55;
            var minStep = Math.max(MIN_W, Math.ceil(maxRight * MIN_OVERLAP));

            return {
                fyww: fyww, sortKey: fywwSortKey(fyww), ord: ord,
                status: w.status, isCurrent: (fyww === CURRENT_FYWW),
                empty: w.empty, isUp: (idx % 2 === 0),
                lines: lines, L: L, tipX: tipX, tipY: tipY,
                minStep: minStep, maxRight: maxRight,
                halfNeeded: Math.ceil(tipY) + TEXT_H + 14
            };
        });

        var maxHalf = 60;
        models.forEach(function (m) { maxHalf = Math.max(maxHalf, m.halfNeeded); });
        var trackH = 2 * maxHalf;

        // --- assign each rib an absolute X on the spine ---
        // The spine is a TIME axis: hub X advances by (ordinal delta) * PX_PER_WEEK,
        // so W31->W32 (1 wk) is tight and W35->W38 (3 wk) is ~3x wider — INDEPENDENT
        // of how wide each rib's text is. To stop a content-heavy rib from running
        // its text into the next hub, we also enforce a per-rib minimum advance
        // (MIN_STEP); whichever is larger wins, so the time signal shows wherever
        // content allows and collisions are still avoided.
        var hubX = [];
        var x = 20; // left margin before the first rib
        models.forEach(function (m, mi) {
            if (mi > 0) {
                var prev = models[mi - 1];
                var weeks;
                if (m.ord !== null && prev.ord !== null) {
                    weeks = m.ord - prev.ord;
                } else {
                    weeks = m.sortKey - prev.sortKey;
                }
                if (!isFinite(weeks) || weeks < 1) { weeks = 1; }
                var timeStep = Math.min(GAP_MAX, weeks * PX_PER_WEEK);
                // floor so the PREVIOUS rib's widest text clears this hub
                x += Math.max(timeStep, prev.minStep);
            }
            hubX.push(x);
        });
        // track width must reach the FARTHEST rib text, not just the last hub: each
        // rib's text extends maxRight px to the right of its own hub. Take the max
        // over all ribs so no bone/text spills past the background.
        var contentRight = 0;
        models.forEach(function (m, mi) {
            contentRight = Math.max(contentRight, hubX[mi] + m.maxRight);
        });
        var trackW = Math.ceil(contentRight) + 24;

        // pass 2: render
        var $track = $('<div class="tp-hb-track"></div>')
            .css({ height: trackH + "px", width: trackW + "px" });
        $track.append('<div class="tp-hb-spine-line"></div>');

        // small tickmarks on the spine for calendar weeks that have NO schedule.
        // For each gap between consecutive present weeks whose ordinals differ by
        // >1, drop a tick per missing ordinal, positioned by linear interpolation
        // between the surrounding hubs' X (the spine's X isn't a pure linear ordinal
        // map because of minStep, so interpolate). Centered on the spine (maxHalf).
        for (var gi = 1; gi < models.length; gi++) {
            var a = models[gi - 1], b = models[gi];
            if (a.ord === null || b.ord === null) { continue; }
            var span = b.ord - a.ord;
            if (span <= 1) { continue; }
            for (var k = 1; k < span; k++) {
                var frac = k / span;
                var tx = hubX[gi - 1] + (hubX[gi] - hubX[gi - 1]) * frac;
                $track.append($('<div class="tp-hb-tick tp-hb-tick-h"></div>')
                    .css({ left: tx + "px", top: maxHalf + "px" }));
            }
        }

        models.forEach(function (m, mi) {
            var $week = $('<div class="tp-hb-week"></div>')
                .css({ left: hubX[mi] + "px", height: trackH + "px" });
            if (m.isCurrent) { $week.addClass("tp-hb-current"); }
            var dir = m.isUp ? -1 : 1; // up ribs go toward smaller y (up)

            // hub on the spine
            $week.append($('<div class="tp-hb-hub"></div>').css("top", maxHalf + "px"));

            // the angled rib
            $week.append($('<div class="tp-hb-rib"></div>').css({
                width: m.L + "px",
                top: maxHalf + "px",
                transform: "rotate(" + (dir * ANGLE_DEG) + "deg)"
            }));

            // horizontal cause lines stepping along the rib (FYWW, then user, then
            // that user's parts — nearest the spine first)
            m.lines.forEach(function (ln, i) {
                var along = D0 + i * D_STEP;
                var dx = along * COS;
                var dy = along * SIN;
                ln.build()
                    .css({ left: (dx + TEXT_GAP) + "px", top: (maxHalf + dir * dy - TEXT_H / 2) + "px" })
                    .appendTo($week);
            });

            $track.append($week);
        });

        // arrowhead at the spine head (right)
        $track.append('<div class="tp-hb-head"></div>');

        $("#tpHerringbone").empty().append(hbSummaryBar(rows)).append($track);
    }

    // === VERTICAL form ==========================================================
    // Same data + reading order (FYWW, then username, then that user's parts), but
    // the spine runs TOP->BOTTOM: each FYWW is a rib sweeping out to the left or
    // right (alternating), cause lines step downward-and-outward along the rib, and
    // the spine's Y axis is the TIME axis (hub Y advances by ordinal distance).
    function buildHerringboneVertical() {
        var rows = arrangedRows();

        var weeks = {};
        rows.forEach(function (r) {
            var fyww = val(r, "fyww");
            if (!fyww) { return; }
            if (!weeks[fyww]) {
                weeks[fyww] = { status: val(r, "fyww_status"), users: {}, order: [], count: 0 };
            }
            var w = weeks[fyww];
            var uname = val(r, "username");
            if (!w.users[uname]) { w.users[uname] = []; w.order.push(uname); }
            w.users[uname].push(r);
            w.count++;
        });
        if (CURRENT_FYWW && !weeks[CURRENT_FYWW]) {
            weeks[CURRENT_FYWW] = { status: "current", users: {}, order: [], count: 0, empty: true };
        }

        // order usernames alphabetically (case-insensitive) within each FYWW bucket
        Object.keys(weeks).forEach(function (k) {
            weeks[k].order.sort(function (a, b) {
                return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
            });
        });

        var weekKeys = Object.keys(weeks).sort(function (a, b) {
            return fywwSortKey(a) - fywwSortKey(b);
        });

        // --- geometry (mirror of horizontal, axes swapped) ---
        var ANGLE_DEG = 45;
        var ANGLE = ANGLE_DEG * Math.PI / 180;
        var SIN = Math.sin(ANGLE), COS = Math.cos(ANGLE);
        var LINE_H = 20;             // vertical px per cause line (its own text height)
        var D_STEP = LINE_H / COS;   // along-rib step so successive lines drop LINE_H
        var D0 = 22;                 // along-rib distance to the first line (FYWW)
        var TIP_GAP = 20;
        var TEXT_VGAP = 8;           // vertical gap between rib and its text line
        var PX_PER_WEEK = 64;        // spine (time) axis: px per FYWW week of gap
        var GAP_MAX = 500;

        // pass 1: build each week's ordered lines + measure
        var models = weekKeys.map(function (fyww, idx) {
            var w = weeks[fyww];
            var lines = [];

            (function () {
                var badge = fywwBadge(w.status);
                var cnt = w.count;
                lines.push({
                    width: hbTextWidth(fyww + (cnt > 0 ? "  " + cnt : ""), true) + 48,
                    build: function () {
                        var $c = $('<div class="tp-hb-cause tp-hb-fyww"></div>').text(fyww);
                        if (badge) { $c.append(" ").append(badge); }
                        if (cnt > 0) { $c.append('<span class="tp-hb-count tp-hb-fyww-count">' + cnt + '</span>'); }
                        return $c;
                    }
                });
            })();

            if (w.empty) {
                lines.push({
                    width: hbTextWidth("no schedules", false) + 12,
                    build: function () {
                        return $('<div class="tp-hb-cause tp-hb-empty"></div>').text("no schedules");
                    }
                });
            } else {
                w.order.forEach(function (uname) {
                    var list = w.users[uname];
                    var label = uname ? String(uname) : "(unknown)";
                    lines.push({
                        width: hbTextWidth(label + "  " + list.length, true) + 26,
                        build: function () {
                            return $('<div class="tp-hb-cause tp-hb-user"></div>')
                                .text(label)
                                .append('<span class="tp-hb-count">' + list.length + '</span>');
                        }
                    });
                    list.forEach(function (r) {
                        var part = val(r, "mfg_part_num");
                        var proc = val(r, "process_type");
                        lines.push({
                            width: hbTextWidth((part ? part : "") + (proc ? "  " + proc : ""), false) + 12,
                            build: function () {
                                var $c = $('<div class="tp-hb-cause tp-hb-entry"></div>');
                                if (part) {
                                    $c.addClass("tp-hb-has-part");
                                    $c.append($('<a class="tp-hb-part"></a>')
                                        .attr("href", paHref(part))
                                        .attr("target", PA_TARGET)
                                        .attr("title", "Load Planning Assumptions for this part")
                                        .text(part));
                                }
                                if (proc) { $c.append(' <span class="tp-hb-proc"></span>').find(".tp-hb-proc").text(proc); }
                                $c.append('<span class="tp-hb-summary"></span>');
                                return $c;
                            }
                        });
                    });
                });
            }

            var n = lines.length;
            var L = D0 + (n - 1) * D_STEP + TIP_GAP;
            var ribDown = L * COS;   // vertical extent of the rib
            var ord = Object.prototype.hasOwnProperty.call(FYWW_ORDINALS, fyww)
                ? FYWW_ORDINALS[fyww] : null;

            // farthest horizontal reach of any line from the spine = its outward
            // offset (along*sin) + its own text width. Drives lane width so no text
            // spills past the track background.
            var laneNeeded = 0;
            lines.forEach(function (ln, i) {
                var dx = (D0 + i * D_STEP) * SIN;
                laneNeeded = Math.max(laneNeeded, dx + TEXT_VGAP + ln.width);
            });

            // minimum hub-to-hub advance (down the spine) so this rib's lines clear
            // the next hub. Left/right ribs alternate, so vertical spans may overlap
            // somewhat; scale below the full extent.
            var MIN_OVERLAP = 0.55;
            var minStep = Math.max(60, Math.ceil(ribDown * MIN_OVERLAP));

            return {
                fyww: fyww, sortKey: fywwSortKey(fyww), ord: ord,
                status: w.status, isCurrent: (fyww === CURRENT_FYWW),
                empty: w.empty, isRight: (idx % 2 === 0),
                lines: lines, L: L, minStep: minStep,
                ribDown: ribDown, laneNeeded: Math.ceil(laneNeeded)
            };
        });

        // --- spine X from the widest LEFT-side lane; track width adds the widest
        // RIGHT-side lane (ribs alternate right/left by index). Sized to real text
        // extents so no bone/text spills past the background. ---
        var leftMax = 0, rightMax = 0;
        models.forEach(function (m) {
            if (m.isRight) { rightMax = Math.max(rightMax, m.laneNeeded); }
            else           { leftMax  = Math.max(leftMax,  m.laneNeeded); }
        });
        var spineX = Math.ceil(leftMax) + 24;

        // --- per-rib hub Y (time axis) ---
        var hubY = [];
        var y = 30;
        models.forEach(function (m, mi) {
            if (mi > 0) {
                var prev = models[mi - 1];
                var wks;
                if (m.ord !== null && prev.ord !== null) { wks = m.ord - prev.ord; }
                else { wks = m.sortKey - prev.sortKey; }
                if (!isFinite(wks) || wks < 1) { wks = 1; }
                var timeStep = Math.min(GAP_MAX, wks * PX_PER_WEEK);
                y += Math.max(timeStep, prev.minStep);
            }
            hubY.push(y);
        });
        // track height must reach the deepest rib bottom (hub Y + that rib's
        // downward reach), not just the last hub.
        var contentBottom = 0;
        models.forEach(function (m, mi) {
            contentBottom = Math.max(contentBottom, hubY[mi] + m.ribDown + LINE_H);
        });
        var trackH = Math.ceil(contentBottom) + 30;
        var trackW = spineX + Math.ceil(rightMax) + 24;

        // pass 2: render
        var $track = $('<div class="tp-hb-track tp-hb-vertical"></div>')
            .css({ height: trackH + "px", width: trackW + "px" });
        // continuous vertical spine
        $track.append($('<div class="tp-hb-spine-line tp-hb-spine-v"></div>')
            .css({ left: spineX + "px" }));

        // small tickmarks on the spine for calendar weeks that have NO schedule
        // (vertical only). For each gap between consecutive present weeks whose
        // ordinals differ by >1, drop a tick per missing ordinal, positioned by
        // linear interpolation between the two surrounding hubs (the spine's Y
        // isn't a pure linear ordinal map because of minStep, so interpolate).
        for (var gi = 1; gi < models.length; gi++) {
            var a = models[gi - 1], b = models[gi];
            if (a.ord === null || b.ord === null) { continue; }
            var span = b.ord - a.ord;
            if (span <= 1) { continue; }
            for (var k = 1; k < span; k++) {
                var frac = k / span;
                var ty = hubY[gi - 1] + (hubY[gi] - hubY[gi - 1]) * frac;
                $track.append($('<div class="tp-hb-tick"></div>')
                    .css({ left: spineX + "px", top: ty + "px" }));
            }
        }

        models.forEach(function (m, mi) {
            var yHub = hubY[mi];
            var dirX = m.isRight ? 1 : -1;

            var $week = $('<div class="tp-hb-week"></div>');
            if (m.isCurrent) { $week.addClass("tp-hb-current"); }

            // hub on the spine
            $week.append($('<div class="tp-hb-hub"></div>')
                .css({ left: spineX + "px", top: yHub + "px" }));

            // the angled rib (rotate a horizontal bar: right side +45 down, left -135)
            var ribAngle = m.isRight ? ANGLE_DEG : (180 - ANGLE_DEG);
            $week.append($('<div class="tp-hb-rib"></div>').css({
                width: m.L + "px",
                left: spineX + "px",
                top: yHub + "px",
                transformOrigin: "left center",
                transform: "rotate(" + ribAngle + "deg)"
            }));

            // cause lines step down-and-outward along the rib
            m.lines.forEach(function (ln, i) {
                var along = D0 + i * D_STEP;
                var dx = along * SIN * dirX;   // outward
                var dy = along * COS;          // downward
                var $line = ln.build().css({
                    top: (yHub + dy - LINE_H / 2) + "px"
                });
                if (m.isRight) {
                    $line.css("left", (spineX + dx + TEXT_VGAP) + "px");
                } else {
                    // right-align text to the spine side on the left lane
                    $line.css({
                        right: (trackW - (spineX + dx) + TEXT_VGAP) + "px",
                        textAlign: "right"
                    });
                }
                $line.appendTo($week);
            });

            $track.append($week);
        });

        // arrowhead at the spine foot (bottom)
        $track.append($('<div class="tp-hb-head tp-hb-head-v"></div>')
            .css({ left: spineX + "px" }));

        $("#tpHerringbone").empty().append(hbSummaryBar(rows)).append($track);
    }

    // ---- sort controls -------------------------------------------------------

    function populateSortSelects(sort) {
        // build each column's <option>(s): the plain column, and — for columns in
        // NONULL_COLS — a "(no null)" variant DIRECTLY AFTER it whose value carries
        // the NONULL_SUFFIX.
        function colOptions(key) {
            var html = '<option value="' + key + '">' + COL_LABELS[key] + '</option>';
            if (NONULL_COLS.indexOf(key) !== -1) {
                html += '<option value="' + key + NONULL_SUFFIX + '">' +
                        COL_LABELS[key] + ' (no null)</option>';
            }
            return html;
        }
        var opts1 = '', optsN = '<option value="">(none)</option>';
        COLS.forEach(function (key) {
            var o = colOptions(key);
            opts1 += o;
            optsN += o;
        });
        $("#tpSortField").html(opts1);
        $("#tpSortField2").html(optsN);
        $("#tpSortField3").html(optsN);

        // primary
        $("#tpSortField").val(sort[0].key);
        $("#tpSortDir").val(sort[0].dir);
        // secondary (optional)
        if (sort[1]) {
            $("#tpSortField2").val(sort[1].key);
            $("#tpSortDir2").val(sort[1].dir);
        } else {
            $("#tpSortField2").val("");
            $("#tpSortDir2").val("asc");
        }
        // tertiary (optional)
        if (sort[2]) {
            $("#tpSortField3").val(sort[2].key);
            $("#tpSortDir3").val(sort[2].dir);
        } else {
            $("#tpSortField3").val("");
            $("#tpSortDir3").val("asc");
        }
    }

    function onSortChanged() {
        saveSort(currentSort());
        refresh();
    }

    $("#tpSortField, #tpSortDir, #tpSortField2, #tpSortDir2, #tpSortField3, #tpSortDir3").on("change", onSortChanged);

    $("#tpSortReset").on("click", function () {
        populateSortSelects(DEFAULT_SORT);
        saveSort(DEFAULT_SORT.slice());
        refresh();
    });

    // clicking a header label also sets the primary sort (and toggles direction)
    $("#tpScheduleTable").on("click", "thead tr.tp-header-row th", function () {
        var idx = $(this).index();
        var key = COLS[idx];
        if (!key) { return; }
        var cur = currentSort();
        var newDir = (cur[0] && cur[0].key === key && cur[0].dir === "asc") ? "desc" : "asc";
        $("#tpSortField").val(key);
        $("#tpSortDir").val(newDir);
        onSortChanged();
    });

    // ---- column filters (in the header filter row) ---------------------------

    function applyColFilter(input) {
        var col = parseInt($(input).attr("data-col"), 10);
        colFilters[col] = input.value || "";
        // show/hide the clear "x" for this input
        $(input).siblings(".column-filter-clear").toggle(!!input.value);
        // the other columns' dropdown choices cascade off this filter
        rebuildDatalists();
        refresh();
    }

    $("#tpScheduleTable").on("keyup change", "thead .column-filter", function () {
        applyColFilter(this);
    });

    // wrap each filter input so we can overlay a clear "x" for quick removal,
    // and attach a <datalist> so the box also offers the column's distinct values
    // as a dropdown. The native datalist keeps the free-text "filter as I type"
    // behaviour AND narrows its own suggestions as the user types.
    $('#tpScheduleTable thead .column-filter').each(function () {
        var $input = $(this);
        var col = parseInt($input.attr("data-col"), 10);
        if (!$input.parent().hasClass("column-filter-wrap")) {
            $input.wrap('<span class="column-filter-wrap"></span>');
            $input.after('<span class="column-filter-clear" title="Clear filter" style="display:none;">&times;</span>');
        }
        if (!isNaN(col) && !$input.attr("list")) {
            var id = datalistId(col);
            $input.attr("list", id);
            $input.after('<datalist id="' + id + '"></datalist>');
        }
    });

    // clicking the "x" clears that column's filter and re-filters
    $("#tpScheduleTable").on("click", "thead .column-filter-clear", function () {
        var $input = $(this).siblings(".column-filter");
        $input.val("");
        applyColFilter($input.get(0));
        $input.focus();
    });

    // ---- init ----------------------------------------------------------------

    // stamp the current-week FYWW into the FYWW header label (column 1 of the
    // label row). Done explicitly so it holds regardless of how DataTables treats
    // the pre-existing <th>. The clickable-sort handler keys off column index, not
    // this text, so changing it is safe.
    if (CURRENT_FYWW) {
        $("#tpScheduleTable thead tr.tp-header-row th").eq(2).text(FYWW_TITLE);
    }

    // restore persisted sort (or default), populate controls
    populateSortSelects(loadSort() || DEFAULT_SORT);

    // default the username filter to the current user (part-level); leave the
    // input editable/clearable so they can view others.
    if (CURRENT_USER) {
        colFilters[6] = CURRENT_USER;
        var $uname = $('#tpScheduleTable thead .column-filter[data-col="6"]');
        $uname.val(CURRENT_USER);
        $uname.siblings(".column-filter-clear").show();
    }

    // populate every column's dropdown (reflecting the default username filter)
    rebuildDatalists();

    // herringbone launcher: a button in the (otherwise empty) LINKS cell of the
    // column-filter row. Carries no data-col and is outside any body row, so it
    // never affects filtering or exports. Builds from the live filter set on click.
    // Two launchers — horizontal and vertical — each opening its own form. Both
    // sit in the (otherwise empty) LINKS cell of the column-filter row, carry no
    // data-col and are outside any body row, so neither affects filtering/exports.
    // The vertical icon is the same PNG rotated 90deg clockwise (tp-hb-icon-rot).
    var $linksFilterCell = $("#tpScheduleTable thead tr.tp-filter-row th").last();
    if ($linksFilterCell.length && !$linksFilterCell.find("#tpHbBtnH").length) {
        $linksFilterCell.append(
            '<button type="button" id="tpHbBtnH" class="btn btn-sm btn-outline-secondary" ' +
            'title="Schedule density by FYWW (horizontal)">' +
            '<img src="../../img/fishbone_285_139.png" alt="Fishbone (horizontal)" class="tp-hb-btn-icon"></button>' +
            ' <button type="button" id="tpHbBtnV" class="btn btn-sm btn-outline-secondary" ' +
            'title="Schedule density by FYWW (vertical)">' +
            '<img src="../../img/fishbone_285_139.png" alt="Fishbone (vertical)" class="tp-hb-btn-icon tp-hb-icon-rot"></button>'
        );
    }

    // open the modal in the requested orientation; also rotate the modal title
    // icon to match (vertical = 90deg clockwise).
    function openHerringbone(orientation) {
        buildHerringbone(orientation);
        $("#tpHerringboneLabel .tp-hb-title-icon").toggleClass("tp-hb-icon-rot", orientation === "vertical");
        var el = document.getElementById("tpHerringboneModal");
        if (el && window.bootstrap && window.bootstrap.Modal) {
            window.bootstrap.Modal.getOrCreateInstance(el).show();
        }
    }

    // stop the header-click sort handler from firing when a button is clicked
    $("#tpScheduleTable").on("click", "#tpHbBtnH", function (e) {
        e.stopPropagation();
        openHerringbone("horizontal");
    });
    $("#tpScheduleTable").on("click", "#tpHbBtnV", function (e) {
        e.stopPropagation();
        openHerringbone("vertical");
    });

    refresh();

    // recalc column widths when the Timephasing tab becomes visible
    $('button[data-bs-target="#timephasing-pane"]').on("shown.bs.tab", function () {
        tpTable.columns.adjust().draw(false);
    });
});
