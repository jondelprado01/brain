// 2026-09-01 RM (AI: Claude Code): alternate default-atom page (INDEX_NEW.PHP).
// Differences vs default-atom.js:
//   - column order: DA_ID first, then TYPE/SITE/RES_AREA/ENG/ATOM, then CHANGED_BY/CHANGED_DT, ACTION last
//   - DA_ID, CHANGED_BY, CHANGED_DT are now VISIBLE (were hidden in the original page)
//   - DataTables 2 layout + Buttons: Copy / CSV / Excel(.xlsx); ACTION column excluded via the no-export class
// Column index map used throughout this file (must match the <thead> in INDEX_NEW.PHP):
//   0 DA_ID | 1 TYPE | 2 SITE | 3 RES_AREA | 4 ENG_NAME | 5 ATOM_NAME | 6 CHANGED_BY | 7 CHANGED_DT | 8 ACTION
$(document).ready(function(){
    // Table display mirrors the index-time module: per-column search + order controls, fixed header,
    // column reorder, export buttons. stateSave is required so the columnControl filter inputs are not
    // wiped by the redraws FixedHeader triggers when it clones the header (same reason as index-time).

    // 2026-09-01 RM (AI: Claude Code): shared export config for Copy / CSV / Excel so all three behave identically.
    //   - columns: drop the ACTION column (class no-export).
    //   - customizeData: the header comes from dt.table().header.structure(), which - because ColumnControl puts the
    //     per-column search inputs on their own header-row layer (target:1) - contains a SECOND header row whose cell
    //     titles are empty. That empty row exports as a blank line right under the column names. Keep only the first
    //     header row (the column-name layer) so the export has exactly one header line and no trailing blank row.
    //   - format.body: our null cells are rendered as the "--" placeholder; blank those out so exports show empty cells.
    // Title/messageTop/messageBottom are suppressed per-button below (Copy and Excel prepend a title by default; CSV
    // has no title concept). Together these remove: the copied title, the blank row before the header (title spacer),
    // the blank row after the header (ColumnControl search row), and the "--" placeholders.
    // 2026-09-01 RM (AI: Claude Code): CSV/Excel filename = "BRAIN_DEFAULT_ATOM_<yyyymmdd>" (DataTables appends the
    // .csv / .xlsx extension itself, so no extension here). Zero-pad month/day to keep the stamp fixed-width.
    function daExportFilename(){
        var d  = new Date();
        var mm = ('0' + (d.getMonth() + 1)).slice(-2);
        var dd = ('0' + d.getDate()).slice(-2);
        return 'BRAIN_DEFAULT_ATOM_' + d.getFullYear() + mm + dd;
    }

    var daExportOptions = {
        columns: ':not(.no-export)',
        customizeData: function(data){
            if (data.headerStructure && data.headerStructure.length > 1) {
                data.headerStructure = [ data.headerStructure[0] ];
            }
        },
        format: {
            body: function(inner){
                return (inner === '--') ? '' : inner;
            }
        }
    };

    var table_default_atom = $(".table-default-atom").DataTable({
        stateSave: true,
        deferRender: true,
        // Match INDEX.PHP's ordering (first data column = TYPE, ascending) rather than DA_ID.
        // DA_ID is column 0 and TYPE is column 1, so sort by column 1 - NOT by DA_ID.
        order: [[1, 'asc']],
        columnDefs: [
            // ACTION column holds the Edit button - not sortable, and kept out of exports (no-export)
            { targets: 8, orderable: false, className: 'no-export' }
        ],
        colReorder: {
            columns: ':not(:lt(1))'   // lock DA_ID (column 0) so it stays first
        },
        // per-column controls: put the "order" control on the header row itself (target 0) so the sort arrows sit on the
        // SAME line as the column name, then a "search" row directly beneath every header (target 1).
        columnControl: [
            { target: 0, content: ['order'] },
            { target: 1, content: ['search'] }
        ],
        ordering: {
            indicators: false,
            handler: false
        },
        fixedHeader: true,
        autoFill: true,
        autoWidth: false,
        keys: true,
        pageLength: 25,   // 2026-09-01 RM (AI: Claude Code): default to 25 entries per page
        lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, 'All'] ],
        layout: {
            topStart: {
                // Copy / CSV / Excel. All share daExportOptions (drop ACTION column, drop the ColumnControl search
                // header row, blank out "--"). title/messageTop/messageBottom emptied on Copy + Excel to stop them
                // prepending the page/table title and its blank spacer row (CSV never emits a title).
                // The Excel button (buttons.html5 + JSZip) produces a .xlsx file.
                buttons: [
                    { extend: 'copy',  title: '', messageTop: '', messageBottom: '', exportOptions: daExportOptions },
                    { extend: 'csv',   filename: daExportFilename, exportOptions: daExportOptions },
                    { extend: 'excel', filename: daExportFilename, title: '', messageTop: '', messageBottom: '', exportOptions: daExportOptions }
                ]
            },
            topEnd: 'pageLength'
        },
        createdRow: function(row, data, dataIndex) {
           $(row).attr('row-id', data[0]);   // DA_ID is column 0
        },
        drawCallback: function() {
            // Keep the per-column search boxes from inflating column width. In an auto-layout table the column is sized by
            // the max-content of its cells, and a text <input> defaults to size=20 (~235px) - so an empty search box would
            // force every column wide. size=1 makes the input's intrinsic width tiny (so the column is sized by its real
            // data), while the CSS width:100% still stretches the box to fill that column. Re-applied each draw so it
            // survives ColumnControl/state rebuilds.
            $(".table-default-atom").find("thead .dtcc-search input").attr("size", 1);
        }
    });

    //GET DEFAULT ATOM DATA
    getDefaultAtom(table_default_atom);

    //OPEN DEFAULT ATOM MODAL
    $(document).delegate(".btn-default-atom-modal", "click", function(){
        let row_data = table_default_atom.row('[row-id="'+$(this).attr("row-id")+'"]').data();

        // 2026-09-01 RM (AI: Claude Code): preselect the row's existing RES_AREA in the "Change RES_AREA" dropdown so the edit
        // popup opens showing the current value (e.g. DA_ID 10 -> "ATE FT"). "--" (or blank/unknown) means not set, so leave
        // the dropdown on its blank option and no selection is made. .val() only matches an existing option, so an out-of-list
        // value safely falls back to blank as well.
        var current_res_area = row_data[3];       // RES_AREA
        $(".input-res-area").val((current_res_area && current_res_area !== '--') ? current_res_area : '');
        $(".input-atom").val(row_data[0]);        // DA_ID
        $(".input-atom-name").val(row_data[5]);   // ATOM_NAME
        $(".atom-option").remove();
        $(".li-type").text(row_data[1]);          // TYPE
        $(".li-site").text(row_data[2]);          // SITE
        $(".li-res").text(row_data[3]);           // RES_AREA
        $(".li-eth").text(row_data[4]);           // ENG_NAME
        $(".li-ath").text(row_data[5]);           // ATOM_NAME
        $(".li-by").text(row_data[6]);            // CHANGED_BY
        $(".li-date").text(row_data[7]);          // CHANGED_DT

        //API CALL FOR RETRIEVING ATOMS (POPULATE DROPDOWN ATOM) - args: type, site, atom
        getAtom(row_data[1], row_data[2], row_data[5]);

        $(".atom-search").val("");
        $("#defaultAtomModal").modal('show');
    });

    //SAVE DEFAULT ATOM
    $(".btn-save-atom").on("click", function(){
        let atom_data = $(".input-atom").val();
        let atom_name = $(".dropdown-atom-name").val();
        let res_area = ($(".input-res-area").val() != '') ? $(".input-res-area").val() : '--';
        let default_atom_name = $(".input-atom-name").val();
        let default_res_area = $(".li-res").text();

        if (atom_name != '' && atom_name != null && res_area != '--') {
            if (default_atom_name != atom_name || res_area != default_res_area) {
                let change_log_payload = {
                    data: {
                        atom_id: atom_data,
                        atom_name: (atom_name != '--') ? atom_name : null,
                        res_area: (res_area != '--') ? res_area : null,
                        type: ($(".li-type").text() != '--') ? $(".li-type").text() : null,
                        site: ($(".li-site").text() != '--') ? $(".li-site").text() : null,
                        eng_name: ($(".li-eth").text() != '--') ? $(".li-eth").text() : null
                    },
                    old_data: {
                        old_atom_name: (default_atom_name != '--') ? default_atom_name : null,
                        old_res_area: (default_res_area != '--') ? default_res_area : null
                    }
                }
                assignAtom(atom_data, atom_name, res_area, user_details, table_default_atom, change_log_payload);
            }
            else{
                showGenericAlert("info", "No Changes Detected!");
            }
        }
        else{
            showGenericAlert("error", "Please Select an Atom / RES_AREA!");
        }
    });


    //SEARCH ATOM NAME FROM ATOM-NAME DROPDOWN
    $(".atom-search").on("keyup", function(){
        let string = $(this).val().toUpperCase();
        if (string.length > 0) {
            $(".atom-option").each(function(){
                if ($(this).val().indexOf(string) === -1) {
                    $(this).addClass("d-none");
                }
                else{
                    $(this).removeClass("d-none");
                }
            });
        }
        else{
            $(".atom-option").removeClass("d-none");
        }
    });

    // 2026-09-01 RM (AI: Claude Code): BULK EDIT (paste-from-Excel) wiring. Modeled on index-time's Bulk Add/Edit, but this
    // is edit-only against BRAIN.DEFAULT_ATOM via DEFAULT_ATOM_BULK_CRUD.PHP. "Check" validates the paste (Execute stays
    // disabled until the server reports every row valid); "Execute" applies. table_default_atom is passed to daBulkRun so a
    // successful LIVE apply can reload the grid. These handlers live here (inside ready) so table_default_atom is in scope.
    $("#da-bulk-ups-check").on("click", function(){ daBulkCheck(); });
    $("#da-bulk-ups-run").on("click",   function(){ daBulkRun(table_default_atom); });

    // Reset the modal each time it opens: clear the paste + results, re-disable Execute (Check must pass again first),
    // and sync the mode banner to the current Dry Run state.
    $("#defaultAtomBulkUpsertModal").on("show.bs.modal", function(){
        $("#da-bulk-ups-paste").val("");
        $(".da-bulk-ups-message", this).empty();
        $("#da-bulk-ups-run").prop("disabled", true);
        daBulkUpdateBanner();
    });

    // Any edit to the paste, or toggling Dry Run, invalidates a prior Check result: re-disable Execute until re-checked.
    // Toggling Dry Run also swaps the mode banner (preview vs LIVE caution).
    $("#da-bulk-ups-paste").on("input", function(){ $("#da-bulk-ups-run").prop("disabled", true); });
    $("#da-bulk-ups-dry").on("change",  function(){ $("#da-bulk-ups-run").prop("disabled", true); daBulkUpdateBanner(); });
});

//-----------------------------------------------------------------------API---------------------------------------------------------------------

//GET DEFAULT ATOM LIST FROM BRAIN.DEFAULT_ATOM TABLE
function getDefaultAtom(table_default_atom) {
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/DEFAULT_ATOM.PHP?PROCESS_TYPE=GET_LIST',
        success: function(data){
            $.each(JSON.parse(data), function(index, item){
                if(item['ZERO_CAP'] == 1) {
                    strButton = '<button type="button" class="btn btn-primary btn-sm btn-default-atom-modal" row-id='+item['DA_ID']+'>Zero Cap! <i class="fa-solid fa-pen-to-square" style="color:red"></i></button>';
                }else{
                    strButton = '<button type="button" class="btn btn-primary btn-sm btn-default-atom-modal" row-id='+item['DA_ID']+'>Edit <i class="fa-solid fa-pen-to-square"></i></button>';
                }
                // Column order MUST match the <thead> in INDEX_NEW.PHP:
                // 0 DA_ID | 1 TYPE | 2 SITE | 3 RES_AREA | 4 ENG_NAME | 5 ATOM_NAME | 6 CHANGED_BY | 7 CHANGED_DT | 8 ACTION
                let row_node = table_default_atom.row.add([
                    item['DA_ID'],
                    (item['RESOURCE_TYPE'] != '' && item['RESOURCE_TYPE'] != null) ? item['RESOURCE_TYPE'] : "--",
                    (item['SITE_NUM']      != '' && item['SITE_NUM'] != null)      ? item['SITE_NUM']      : "--",
                    (item['RES_AREA']      != '' && item['RES_AREA'] != null)      ? item['RES_AREA']      : "--",
                    (item['ENG_NAME']      != '' && item['ENG_NAME'] != null)      ? item['ENG_NAME']      : "--",
                    (item['ATOM_NAME']     != '' && item['ATOM_NAME'] != null)     ? item['ATOM_NAME']     : "--",
                    (item['CHANGED_BY']    != '' && item['CHANGED_BY'] != null)    ? item['CHANGED_BY']    : "--",
                    // CHANGED_DT arrives as "YYYY-MM-DD HH:MM:SS"; show date only (split off the time)
                    (item['CHANGED_DT']    != '' && item['CHANGED_DT'] != null)    ? String(item['CHANGED_DT']).split(' ')[0] : "--",
                    strButton
                ]);
            });
            setTimeout(function(){
                $(".loading-alert").fadeOut();
                table_default_atom.draw(false);
            },1000);
        },
        complete: function(){
            $('.modal').modal('hide');
            swal.close();
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function getAtom(type, site, atom){
    $.ajax({
        type: 'get',
        url: 'http://afotcosj004.maxim-ic.com/API/MAPPER_EQUIP_TEST_ONLY_RM.PHP?INPUT_TYPE=JSON&OUTPUT_TYPE=RES_NM&INPUT=[{"SITE_NUM":["'+site+'"],"RESOURCE_TYPE":["'+type+'"]}]',
        beforeSend: function(){
            $(".dropdown-atom-name").empty();
            $(".atom-loader").fadeIn();
        },
        success: function(data){
            setTimeout(function(){
                $(".atom-loader").fadeOut();
                if (Object.keys(JSON.parse(data)['DATA'][0]).length > 0) {
                    let options = "";
                    let raw_atoms = JSON.parse(data)['DATA'][0];
                    let atom_names = Object.keys(raw_atoms);
                    if (atom != null && atom != '--') {
                        let index = atom_names.indexOf(atom);
                        if (index > -1) {
                            atom_names.splice(index, 1);
                            atom_names.unshift(atom);
                        }
                    }
                    $.each(atom_names, function(idx, itm){
                        let selected = "";
                        if (atom != null && atom != '--') {
                            selected = (atom == itm) ? "selected" : "";
                        }

                        if (raw_atoms[itm]['CONFIG_PCNT'] > 0) {
                            options += '<option class="fw-bold atom-option" value="'+itm+'" '+selected+'>'+itm+'</option>';
                        }

                    });
                    $(".dropdown-atom-name").append(options);
                }
                else{
                    $(".dropdown-atom-name").append('<option class="fw-bold atom-option-no-data" disabled>No Data Found!</option>');
                }
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function assignAtom(id, atom, res_area, user_details, table_default_atom, change_log_payload){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/DEFAULT_ATOM.PHP?PROCESS_TYPE=ASSIGN_ATOM',
        data: {id: id, atom: atom, res_area: res_area, user_details: user_details},
        beforeSend: function(){
            showLoader('Processing... \n Please Wait!');
        },
        success: function(data){
            setTimeout(function(){
                if (data) {
                    showSuccess("Record Saved Succesfully!");
                    table_default_atom.clear();
                    getDefaultAtom(table_default_atom);
                    addChangeLog(change_log_payload, user_details, "assign default atom");
                }
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function addChangeLog(payload, user_details, module){
    $.ajax({
        type: 'post',
        url: 'http://mxhtafot01l.maxim-ic.com/TEST/BRAIN_CHANGE_LOG.PHP',
        data: {payload: payload, user_details: user_details, module: module},
        success: function(data){
            console.log(data);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}
//---------------------------------------------------------------------END API---------------------------------------------------------------------



//--------------------------------------------------------------------BULK EDIT---------------------------------------------------------------------
// 2026-09-01 RM (AI: Claude Code): paste-from-Excel Bulk Edit, mirroring index-time's bulk-upsert helpers but edit-only.
// Columns are matched BY HEADER NAME, not by position - the paste may put the columns in ANY order. The first non-blank
// row MUST be a header naming the columns; CHANGED BY / CHANGED DT and any unrecognized columns are ignored (the server
// stamps CHANGED_*). Server endpoint: DEFAULT_ATOM_BULK_CRUD.PHP, actions bulk_edit_check (validate) / bulk_edit (apply).
//
// Recognized headers (spaces / underscores / case ignored): DA_ID, TYPE, SITE, RES_AREA, ENG_NAME, ATOM_NAME.
// Required headers: DA_ID, SITE, RES_AREA, ATOM_NAME. TYPE and ENG_NAME are optional (verify-only, non-editable).
var DA_BULK_URL = "DEFAULT_ATOM_BULK_CRUD.PHP";

// Swap the mode banner to match the Dry Run checkbox: checked = grey preview note; unchecked = red LIVE caution.
function daBulkUpdateBanner(){
    var $b = $("#da-bulk-mode-banner");
    if ($b.length === 0) { return; }
    if ($("#da-bulk-ups-dry").is(":checked")) {
        $b.removeClass("alert-danger").addClass("alert-secondary")
          .html('<i class="fa-solid fa-flask"></i> Dry Run is ON &mdash; Execute previews the SQL only; no changes are written to the DB.');
    } else {
        $b.removeClass("alert-secondary").addClass("alert-danger")
          .html('<i class="fa-solid fa-triangle-exclamation"></i> Changes will be processed against live DB. Proceed with caution.');
    }
}

// Minimal HTML escaper for values rendered into the results table.
function daBulkEsc(s){
    return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Normalize a header cell to a canonical field key, or "" if it is not a column we care about. Case-insensitive and
// blind to whether the source used spaces or underscores (e.g. "ENG NAME", "eng_name", "Eng  Name" all -> eng_name).
function daBulkHeaderField(h){
    var k = String(h == null ? "" : h).trim().toLowerCase().replace(/[\s_]+/g, " ");
    switch (k) {
        case "da id":                       return "da_id";
        case "type": case "resource type":  return "type";
        case "site": case "site num": case "site number": return "site";
        case "res area": case "resource area":            return "res_area";
        case "eng name": case "engineer": case "engineer name": case "eng": return "eng_name";
        case "atom name": case "atom":      return "atom_name";
        default:                            return ""; // CHANGED BY / CHANGED DT / anything else -> ignored
    }
}

// Parse the pasted TSV block into row objects using the header row to locate each column. Returns { rows, parseErrors }.
function daBulkParse(text){
    var lines = String(text || "").split(/\r?\n/);
    var raw = [];
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].replace(/\s+/g, "") === "") { continue; } // skip blank lines
        raw.push(lines[i].split("\t"));
    }
    if (raw.length === 0) {
        return { rows: [], parseErrors: ["Nothing to parse."] };
    }

    // First non-blank row is the header. Build field -> column-index map (first occurrence wins on duplicates).
    var headerCells = raw.shift();
    var colOf = {};
    for (var h = 0; h < headerCells.length; h++) {
        var field = daBulkHeaderField(headerCells[h]);
        if (field !== "" && !(field in colOf)) { colOf[field] = h; }
    }

    // Every required column must be named in the header, or we cannot map the paste (and must not guess the order).
    var requiredCols = ["da_id", "site", "res_area", "atom_name"];
    var missing = [];
    for (var m = 0; m < requiredCols.length; m++) {
        if (!(requiredCols[m] in colOf)) { missing.push(requiredCols[m].toUpperCase()); }
    }
    if (missing.length > 0) {
        return { rows: [], parseErrors: [
            "Header row is missing required column(s): " + missing.join(", ") + ". " +
            "Include a header naming your columns (DA_ID, SITE, RES_AREA, ATOM_NAME; TYPE / ENG_NAME optional). " +
            "Columns may be in any order."
        ] };
    }
    if (raw.length === 0) {
        return { rows: [], parseErrors: ["No data rows found (only a header?)."] };
    }

    var rows = [];
    var parseErrors = [];
    for (var j = 0; j < raw.length; j++) {
        var cells = raw[j];
        var at = function(field){
            if (!(field in colOf)) { return ""; }              // optional column not present
            var idx = colOf[field];
            return (idx < cells.length) ? String(cells[idx]).trim() : "";
        };
        rows.push({
            da_id:     at("da_id"),
            type:      at("type"),
            site:      at("site"),
            res_area:  at("res_area"),
            eng_name:  at("eng_name"),
            atom_name: at("atom_name")
        });
    }
    return { rows: rows, parseErrors: parseErrors };
}

// Render parse errors into the modal message area; returns true if any (so callers can abort before the AJAX call).
function daBulkShowParseErrors($area, parseErrors){
    if (!parseErrors || parseErrors.length === 0) { return false; }
    var html = '<div class="alert alert-danger mb-0"><strong>Could not parse:</strong><ul class="mb-0">';
    for (var i = 0; i < parseErrors.length; i++) {
        html += "<li>" + daBulkEsc(parseErrors[i]) + "</li>";
    }
    html += "</ul></div>";
    $area.html(html);
    return true;
}

// Human-readable, color-coded status text for one validated row.
function daBulkStatusText(r){
    switch (r.status) {
        case "ok":            return '<span class="text-success">&#10003; Will update</span>';
        case "no_change":     return '<span class="text-warning-emphasis">No change (skipped)</span>';
        case "not_found":     return '<span class="text-danger">DA_ID not found</span>';
        case "type_mismatch": return '<span class="text-danger">TYPE does not match record' +
                                     (r.db_type ? ' (record is "' + daBulkEsc(r.db_type) + '")' : '') +
                                     ' &mdash; TYPE is not editable</span>';
        case "eng_mismatch":  return '<span class="text-danger">ENG_NAME does not match record' +
                                     (r.db_eng ? ' (record is "' + daBulkEsc(r.db_eng) + '")' : '') +
                                     ' &mdash; ENG_NAME is not editable</span>';
        case "dup_in_paste":  return '<span class="text-danger">Duplicate DA_ID in paste</span>';
        case "invalid":       return '<span class="text-danger">' + daBulkEsc((r.errors || []).join(" ")) + '</span>';
        default:              return daBulkEsc(r.status);
    }
}

// Render the per-row results table. Error rows -> red (table-danger); no-change rows -> yellow (table-warning); rows that
// will update -> normal. A bottom banner tells the user whether they can proceed.
function daBulkRenderResults($area, res){
    var rows = res.rows || [];
    var html = '<div class="mb-2"><strong>Result:</strong> ' + res.update_count + ' to update, ' +
               res.no_change_count + ' unchanged, ' + res.error_count + ' error(s).</div>';
    html += '<table class="table table-sm table-bordered"><thead><tr>' +
            '<th>#</th><th>DA_ID</th><th>Status</th></tr></thead><tbody>';
    for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var cls = "";
        if (r.status === "no_change") { cls = ' class="table-warning"'; }
        else if (r.status !== "ok")   { cls = ' class="table-danger"'; }
        html += "<tr" + cls + "><td>" + (r.index + 1) + "</td><td>" +
                (r.da_id === "" ? "<em>(blank)</em>" : daBulkEsc(r.da_id)) + "</td><td>" +
                daBulkStatusText(r) + "</td></tr>";
    }
    html += "</tbody></table>";
    if (res.all_valid === true) {
        if (res.update_count > 0) {
            html += '<div class="alert alert-success mb-0">All rows valid. Click <strong>Execute</strong> to apply ' +
                    'the ' + res.update_count + ' update(s).</div>';
        } else {
            html += '<div class="alert alert-info mb-0">All rows valid, but nothing would change (no updates to apply).</div>';
        }
    } else {
        html += '<div class="alert alert-warning mb-0">Fix all red rows before executing (all-or-nothing).</div>';
    }
    $area.html(html);
}

// Dry-run preview: show the exact SQL the server would have run (and rolled back).
function daBulkShowSql($area, res){
    var lines = (res && res.sql) ? res.sql : [];
    var body = "";
    for (var i = 0; i < lines.length; i++) {
        body += daBulkEsc(lines[i]);
        if (i < lines.length - 1) { body += "\n"; }
    }
    var head = (lines.length === 0)
        ? 'No UPDATE statements &mdash; nothing to change.'
        : 'SQL that WOULD run (not executed):';
    $area.html(
        '<div class="alert alert-info mb-0">'
        + '<strong>DRY RUN &mdash; ' + res.update_count + ' update(s), ' + res.no_change_count
        + ' unchanged. No SQL was run against the database.</strong>'
        + '<div class="mt-1 small">' + head + '</div>'
        + '<pre class="mt-2 mb-0" style="white-space:pre-wrap;font-size:12px;">' + body + '</pre></div>'
    );
}

// CHECK: parse -> validate on the server -> render results -> enable Execute only when the server reports all_valid.
function daBulkCheck(){
    var $area = $(".da-bulk-ups-message", "#defaultAtomBulkUpsertModal");
    $("#da-bulk-ups-run").prop("disabled", true);
    var parsed = daBulkParse($("#da-bulk-ups-paste").val());
    if (daBulkShowParseErrors($area, parsed.parseErrors)) { return; }
    if (parsed.rows.length === 0) {
        $area.html('<div class="alert alert-danger mb-0">Nothing to check.</div>');
        return;
    }

    $.ajax({
        type: "post",
        url: DA_BULK_URL,
        data: { action: "bulk_edit_check", rows: JSON.stringify(parsed.rows) },
        dataType: "json",
        success: function(res){
            if (!res || res.ok !== true) {
                $area.html('<div class="alert alert-danger mb-0">' +
                    ((res && res.error) ? daBulkEsc(res.error) : "Validation failed.") + '</div>');
                return;
            }
            daBulkRenderResults($area, res);
            if (res.all_valid === true) {
                $("#da-bulk-ups-run").prop("disabled", false);
            }
        },
        error: function(xhr){
            $area.html('<div class="alert alert-danger mb-0">Request failed (' + xhr.status + ').' +
                       (xhr.status === 403 ? ' You may not have the required role.' : '') + '</div>');
        }
    });
}

// EXECUTE: re-parse -> confirm (LIVE only) -> apply. Dry Run previews the SQL; a LIVE apply reloads the grid on success.
function daBulkRun(table_default_atom){
    var $area = $(".da-bulk-ups-message", "#defaultAtomBulkUpsertModal");
    var parsed = daBulkParse($("#da-bulk-ups-paste").val());
    if (daBulkShowParseErrors($area, parsed.parseErrors)) { return; }
    if (parsed.rows.length === 0) {
        $area.html('<div class="alert alert-danger mb-0">Nothing to execute.</div>');
        return;
    }

    var dryRun = $("#da-bulk-ups-dry").is(":checked");
    // Only a LIVE (non-dry) apply is destructive, so only that path gets the final confirm - worded LIVE + PERMANENT.
    if (!dryRun) {
        if (!window.confirm(
            "Apply these edits to the LIVE database now?\n\n" +
            "These changes are PERMANENT and IRREVERSIBLE."
        )) { return; }
    }

    $("#da-bulk-ups-run").prop("disabled", true);
    $.ajax({
        type: "post",
        url: DA_BULK_URL,
        data: { action: "bulk_edit", dry_run: (dryRun ? "1" : "0"), rows: JSON.stringify(parsed.rows) },
        dataType: "json",
        success: function(res){
            if (res && res.ok === true) {
                if (res.dry_run === true) {
                    daBulkShowSql($area, res);
                    // dry-run is enforced server-side right now (nothing was written) - re-enable Execute so the user
                    // can re-preview; when LIVE writes are re-enabled later this same button performs the real apply.
                    $("#da-bulk-ups-run").prop("disabled", false);
                    return;
                }
                // LIVE success: report, close the modal, and reload the grid so the edits are visible.
                showSuccess(res.update_count + " record(s) updated (" + res.no_change_count + " unchanged).");
                $("#defaultAtomBulkUpsertModal").modal("hide");
                table_default_atom.clear();
                getDefaultAtom(table_default_atom);
                return;
            }
            // server rejected (e.g. no longer valid): re-render the results table if present, else a plain error.
            if (res && res.rows) {
                daBulkRenderResults($area, res);
            } else {
                $area.html('<div class="alert alert-danger mb-0">' +
                    ((res && res.error) ? daBulkEsc(res.error) : "Execute failed.") + '</div>');
            }
        },
        error: function(xhr){
            $area.html('<div class="alert alert-danger mb-0">Request failed (' + xhr.status + ').' +
                       (xhr.status === 403 ? ' You may not have the required role.' : '') + '</div>');
        }
    });
}
//------------------------------------------------------------------END BULK EDIT-------------------------------------------------------------------



//----------------------------------------------------------------------ALERTS----------------------------------------------------------------------
function showGenericAlert(icon, title){
    Swal.fire({
        title: title,
        icon: icon
    });
}

function showLoader(title){
    Swal.fire({
        title: title,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading()
        },
    });
}

function showSuccess(title){
    Swal.fire({
        title: title,
        icon: "success"
    });
}
