/*
 * report-timephasing.js
 * ---------------------
 * Client-side rendering + filtering + ordering for the REPORTS module's
 * "Timephasing" tab.
 *
 * The full live-schedule dataset is injected by modules/reports/INDEX.PHP as the
 * global `timephasing_data` (array of {mfg_part_num, fyww, process_type, notes,
 * change_dt, username}). `current_username` is the logged-in user's AD name.
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
    var COLS = ["mfg_part_num", "fyww", "process_type", "notes", "change_dt", "username"];
    var COL_LABELS = {
        mfg_part_num: "MFG PART NUM",
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

    var ALL_DATA = (typeof timephasing_data !== "undefined" && timephasing_data) ? timephasing_data : [];
    var CURRENT_USER = (typeof current_username !== "undefined" && current_username) ? current_username : "";
    var CURRENT_FYWW = (typeof current_fyww !== "undefined" && current_fyww) ? current_fyww : "";

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

    function loadSort() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) { return null; }
            var parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length) {
                // keep only known keys/dirs
                var clean = parsed.filter(function (s) {
                    return s && COLS.indexOf(s.key) !== -1 && (s.dir === "asc" || s.dir === "desc");
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

    // a comparator over a list of {key,dir}; fyww/change_dt compared as strings
    // (FY##_W## and ISO-ish dates both sort correctly lexicographically)
    function compareBy(sort, a, b) {
        for (var i = 0; i < sort.length; i++) {
            var key = sort[i].key;
            var factor = (sort[i].dir === "desc") ? -1 : 1;
            var av = String(val(a, key)).toLowerCase();
            var bv = String(val(b, key)).toLowerCase();
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
    var colFilters = { 0: "", 1: "", 2: "", 3: "", 4: "", 5: "" };

    function currentSort() {
        var s = [];
        var f1 = $("#tpSortField").val(), d1 = $("#tpSortDir").val();
        var f2 = $("#tpSortField2").val(), d2 = $("#tpSortDir2").val();
        if (f1) { s.push({ key: f1, dir: d1 || "asc" }); }
        if (f2 && f2 !== f1) { s.push({ key: f2, dir: d2 || "asc" }); }
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
        var uname = colFilters[5];
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
                   matches(val(r, "fyww"),         colFilters[1]) &&
                   matches(val(r, "process_type"), colFilters[2]) &&
                   matches(val(r, "notes"),        colFilters[3]) &&
                   matches(val(r, "change_dt"),    colFilters[4]);
        });

        return groupAwareOrder(rows, currentSort());
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

    function paCell(part) {
        if (!part) { return ""; }
        var href = PA_BASE + encodeURIComponent(part);
        return '<a class="btn btn-sm btn-outline-success pa-btn" target="' + PA_TARGET +
               '" title="Load Planning Assumptions for this part" href="' +
               href + '">PA</a>';
    }

    function rowToArray(r) {
        var part = val(r, "mfg_part_num");
        return [
            part,
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
                    if (status === "delinquent") {
                        return text + ' <i class="fa-solid fa-circle-exclamation text-danger" title="Delinquent"></i>';
                    }
                    if (status === "current") {
                        return text + ' <i class="fa-solid fa-triangle-exclamation text-warning" title="Current week"></i>';
                    }
                    return text;
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
                    // explicit data-column indices (0-5) so the LINKS button column
                    // (6) — the PA and ALL DB buttons — can NEVER be exported,
                    // regardless of class-selector timing.
                    // orthogonal:"export" makes CHANGE DATE export the full timestamp
                    // while the on-screen cell shows date-only.
                    { extend: "copy",  exportOptions: { columns: [0, 1, 2, 3, 4, 5], orthogonal: "export" } },
                    { extend: "csv",   filename: "TIMEPHASING_SCHEDULES", exportOptions: { columns: [0, 1, 2, 3, 4, 5], orthogonal: "export" } },
                    { extend: "excel", filename: "TIMEPHASING_SCHEDULES", exportOptions: { columns: [0, 1, 2, 3, 4, 5], orthogonal: "export" } }
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

    // ---- sort controls -------------------------------------------------------

    function populateSortSelects(sort) {
        var opts1 = '', opts2 = '<option value="">(none)</option>';
        COLS.forEach(function (key) {
            opts1 += '<option value="' + key + '">' + COL_LABELS[key] + '</option>';
            opts2 += '<option value="' + key + '">' + COL_LABELS[key] + '</option>';
        });
        $("#tpSortField").html(opts1);
        $("#tpSortField2").html(opts2);

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
    }

    function onSortChanged() {
        saveSort(currentSort());
        refresh();
    }

    $("#tpSortField, #tpSortDir, #tpSortField2, #tpSortDir2").on("change", onSortChanged);

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
        refresh();
    }

    $("#tpScheduleTable").on("keyup change", "thead .column-filter", function () {
        applyColFilter(this);
    });

    // wrap each filter input so we can overlay a clear "x" for quick removal
    $('#tpScheduleTable thead .column-filter').each(function () {
        var $input = $(this);
        if ($input.parent().hasClass("column-filter-wrap")) { return; }
        $input.wrap('<span class="column-filter-wrap"></span>');
        $input.after('<span class="column-filter-clear" title="Clear filter" style="display:none;">&times;</span>');
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
        $("#tpScheduleTable thead tr.tp-header-row th").eq(1).text(FYWW_TITLE);
    }

    // restore persisted sort (or default), populate controls
    populateSortSelects(loadSort() || DEFAULT_SORT);

    // default the username filter to the current user (part-level); leave the
    // input editable/clearable so they can view others.
    if (CURRENT_USER) {
        colFilters[5] = CURRENT_USER;
        var $uname = $('#tpScheduleTable thead .column-filter[data-col="5"]');
        $uname.val(CURRENT_USER);
        $uname.siblings(".column-filter-clear").show();
    }

    refresh();

    // recalc column widths when the Timephasing tab becomes visible
    $('button[data-bs-target="#timephasing-pane"]').on("shown.bs.tab", function () {
        tpTable.columns.adjust().draw(false);
    });
});
