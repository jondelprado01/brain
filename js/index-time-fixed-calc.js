 //2026-01-12 RM
labelVG = [];
dataVG = [];

$(document).on('keyup', function(e) {
    if (e.key == "Escape") $("#variableIndexModal").modal("hide");
});

$(document).ready(function(){
    $(".index-link").on("click", function(){
        let url = new URL($(location).attr('href'));
        let tab = $(this).attr("tab-name");
        url.searchParams.set("tab", tab);
        window.history.pushState('state', 'title', url.href);
    });

    //const minIV = document.querySelector('#minIV');
    //const maxIV = document.querySelector('#maxIV');
    //const minUTPI = document.querySelector('#minUTPI');
    //const maxUTPI = document.querySelector('#maxUTPI');

    // const table = new DataTable('#mainTable, #variableTable',
    //     {
    //         scrollY: 'calc(100vh - 570px)',
    //         columns: [
    //             { data: 'HANDLER' },
    //             { data: 'PKG_TYPE' },
    //             { data: 'BODY_SIZE' },
    //             { data: 'LEAD_COUNT_MIN' },
    //             { data: 'LEAD_COUNT_MAX' },
    //             { data: 'TEMP_CLASS' },
    //             { data: 'UTPI' },
    //             { data: 'FIXED_ITPU' },
    //             { data: 'TTPU_THRESHOLD' },
    //             { data: 'THRESHOLD_FORMULA' }
    //         ],
    //         colReorder: {
    //             columns: ':not(:first-child)'
    //         },
    //         columnControl: [
    //             {
    //                 target: 0,
    //                 content: ['order']
    //             },
    //             {
    //                 target: 1,
    //                 content: ['search']
    //             }
    //         ],
    //         ordering: {
    //             indicators: false,
    //             handler: false
    //         },
    //         fixedHeader: true,
    //         autoFill: true,
    //         keys: true,
    //         lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, 'All'] ],
    //         layout: {
    //             topStart: {
    //                 buttons: ['copy', 'csv', 'excel']
    //             },
    //             topEnd: 'pageLength'
    //         }
    //     }
    // );

    function initTable(table_id){
        // export filename depends on which table is being exported
        var exportName = (table_id == "#variableTable")
            ? "INDEX_TIME_VARIABLE"
            : "INDEX_TIME_FIXED";
        return new DataTable(table_id, {
            // persist per-column search values so they survive the redraws that
            // FixedHeader triggers when it clones the header (otherwise the
            // columnControl filter inputs appear to clear themselves)
            stateSave: true,
            columns: getColumnConfig(table_id),
            columnDefs: [
                // ISD_ID is column 0: hidden in the table, but still included in copy/csv/excel exports
                // (the HTML5 export buttons export all columns by default, including hidden ones)
                { targets: 0, visible: false }
            ],
            colReorder: {
                columns: ':not(:lt(2))'  // lock the hidden ISD_ID (0) and Handler (1) columns
            },
            columnControl: [
                {
                    target: 1,
                    content: ['order']
                },
                {
                    target: 2,
                    content: ['search']
                }
            ],
            ordering: {
                indicators: false,
                handler: false
            },
            fixedHeader: true,
            autoFill: true,
            // let the table/columns size to their content instead of being
            // stretched to a computed 100% width (see matching CSS rules)
            autoWidth: false,
            keys: true,
            lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, 'All'] ],
            layout: {
                topStart: {
                    // exclude the Action/Calculation and Matches/View columns
                    // (class "no-export") from every export button
                    buttons: [
                        { extend: 'copy',  exportOptions: { columns: ':not(.no-export)' } },
                        { extend: 'csv',   filename: exportName, exportOptions: { columns: ':not(.no-export)' } },
                        { extend: 'excel', filename: exportName, exportOptions: { columns: ':not(.no-export)' } }
                    ]
                },
                topEnd: 'pageLength'
            }
        });
        // return $(table_id).DataTable({
        //     scrollY: 'calc(100vh - 570px)',
        //     columns: getColumnConfig(selector),
        //     colReorder: {
        //         columns: ':not(:first-child)'
        //     },
        //     columnControl: [
        //         {
        //             target: 0,
        //             content: ['order']
        //         },
        //         {
        //             target: 1,
        //             content: ['search']
        //         }
        //     ],
        //     ordering: {
        //         indicators: false,
        //         handler: false
        //     },
        //     fixedHeader: true,
        //     autoFill: true,
        //     keys: true,
        //     lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, 'All'] ],
        //     layout: {
        //         topStart: {
        //             buttons: ['copy', 'csv', 'excel']
        //         },
        //         topEnd: 'pageLength'
        //     }
        // });
    }

    function getColumnConfig(selector){
        var columns = [
            { data: 'ISD_ID' }, // hidden column 0, included in exports only
                { data: 'HANDLER' },
                { data: 'PKG_TYPE' },
                { data: 'BODY_SIZE' },
                { data: 'LEAD_COUNT_MIN' },
                { data: 'LEAD_COUNT_MAX' },
                { data: 'TEMP_CLASS' },
                { data: 'UTPI' },
                { data: 'FIXED_ITPU' }
        ];
        if (selector == "#variableTable") {
            columns.push(
                { data: 'TTPU_THRESHOLD' },
                { data: 'THRESHOLD_FORMULA' },
                // Action/Calculation column: tagged no-export so it's left out of copy/csv/excel
                { data: 'ACTION', className: 'no-export' },
            );

            //jon - new column 4/9/2026 (index +1 because ISD_ID is now column 0)
            columns.splice(3, 0, {data: 'SOAK_TIME'});
        }

        // "Matches" (View link) then "Edit" link are the last columns in both
        // tables; tagged no-export so they're left out of copy/csv/excel
        columns.push({ data: 'MATCHES', orderable: false, className: 'no-export' });
        columns.push({ data: 'EDIT', orderable: false, className: 'no-export' });

        return columns;
    }

    const fixed_table = initTable("#mainTable");
    const variable_table = initTable("#variableTable");

    fixed_table.search.fixed('range', function (searchStr, data, index) {return true;});
    variable_table.search.fixed('range', function (searchStr, data, index) {return true;});

    // table.search.fixed('range', function (searchStr, data, index) {
        //var srcMinUTPI = parseInt(minUTPI.value, 10);
        //var srcMaxUTPI = parseInt(maxUTPI.value, 10);
        //var srcUTPI = parseInt(data['UTPI']) || 0; // use data for the LC column

        //var srcMinIV = parseFloat(minIV.value, 10);
        //var srcMaxIV = parseFloat(maxIV.value, 10);
        //var srcIV = parseFloat(data['INDEX_VALUE'], 10); // use data for the LC column
        //var LC = parseFloat(data[0]) || 0; // use data for the LC column

        /*
        if (
            (
                (isNaN(srcMinIV) && isNaN(srcMaxIV)) ||
                (isNaN(srcMinIV) && srcIV <= srcMaxIV) ||
                (srcMinIV <= srcIV && isNaN(srcMaxIV)) ||
                (srcMinIV <= srcIV && srcIV <= srcMaxIV)
            )
            &&
            (
                (isNaN(srcMinUTPI) && isNaN(srcMaxUTPI)) ||
                (isNaN(srcMinUTPI) && srcUTPI <= srcMaxUTPI) ||
                (srcMinUTPI <= srcUTPI && isNaN(srcMaxUTPI)) ||
                (srcMinUTPI <= srcUTPI && srcUTPI <= srcMaxUTPI)
            )
        ) {
            return true;
        }
        */

        // return true;
    // });
    
    /*
    minUTPI.addEventListener('input', function () {
        table.draw();
    });
    maxUTPI.addEventListener('input', function () {
        table.draw();
    });
    minIV.addEventListener('input', function () {
        table.draw();
    });
    maxIV.addEventListener('input', function () {
        table.draw();
    });
    */
    
    //VARIABLE INDEX CALCULATION - JON 01/09/2026
    $(document).delegate(".btn-calculation", "click", function(){

        let data = JSON.parse($(this).attr("btn-data"));
        
        $(".vit-handler").text(data['HANDLER']);
        $(".vit-ptype").text((data['PKG_TYPE'] != null && data['PKG_TYPE'] != "") ? data['PKG_TYPE'] : "--");
        $(".vit-stime").text((data['SOAK_TIME'] != null && data['SOAK_TIME'] != "") ? data['SOAK_TIME'] : "--"); //jon - new column 4/9/2026
        $(".vit-bsize").text((data['BODY_SIZE'] != null && data['BODY_SIZE'] != "") ? data['BODY_SIZE'] : "--");
        $(".vit-lmin").text((data['LEAD_COUNT_MIN'] != null && data['LEAD_COUNT_MIN'] != "") ? data['LEAD_COUNT_MIN'] : "--");
        $(".vit-lmax").text((data['LEAD_COUNT_MAX'] != null && data['LEAD_COUNT_MAX'] != "") ? data['LEAD_COUNT_MAX'] : "--");
        $(".vit-temp").text((data['TEMP_CLASS'] != null && data['TEMP_CLASS'] != "") ? data['TEMP_CLASS'] : "--");
        $(".vit-utpi").text(data['UTPI']);
        $(".vit-fitpu").text(parseFloat(data['FIXED_ITPU']).toFixed(2));
        $(".vit-ttpith").text(parseFloat(data['TTPI_THRESHOLD']).toFixed(2));
        $(".vit-thform").text(data['THRESHOLD_FORMULA']);

        let td_color = "";

        //2026-01-12 RM
        aryLabel = [];
        aryLabel.push(data['HANDLER']);
        
        aryPkg = [];

        if(data['PKG_TYPE'] != null) {
            aryPkg.push(data['PKG_TYPE'])
        }
        if(data['BODY_SIZE'] != null) {
            aryPkg.push(data['BODY_SIZE'])
        }
        if(data['SOAK_TIME'] != null) {
            aryPkg.push(data['SOAK_TIME'])
        }
        switch (true) {
            case data['LEAD_COUNT_MIN'] != null && data['LEAD_COUNT_MAX'] != null:
                aryPkg.push(data['LEAD_COUNT_MIN'] + ' to ' + data['LEAD_COUNT_MAX'] + ' pins');
                break;
            case data['LEAD_COUNT_MIN'] != null:
                aryPkg.push(data['LEAD_COUNT_MIN'] + '+ pins');
                break;
            case data['LEAD_COUNT_MAX'] != null:
                aryPkg.push('0 to ' + data['LEAD_COUNT_MAX'] + ' pins');
                break;
        }

        if(aryPkg.length > 0) {
            aryLabel.push('(' + aryPkg.join(' ') + ')');
        }

        if(data['TEMP_CLASS'] != null) {
            aryLabel.push(data['TEMP_CLASS']);
        }
        if(data['UTPI'] != null) {
            aryLabel.push('x' + data['UTPI']);
        }

        strHeader = aryLabel.join(' ');
        labelVG = [];
        dataVG = [];

        $(".td-calc").each(function(){
            let utpi = parseFloat(data['UTPI']);
            let ttpi_inc = parseFloat($(this).attr("data-id"));
            let ttpi_thr = parseFloat(data['TTPI_THRESHOLD']);
            let ttpu_coeff = parseFloat(data['COEFFICIENT']);
            let adder_const = parseFloat(data['CONSTANT']);
            let fixed_itpu = parseFloat(data['FIXED_ITPU']);
            let calc_res = 0;
            
            //2026-01-12 RM
            labelVG.push(ttpi_inc);

            if (ttpi_inc < ttpi_thr) {
                calc_res = utpi*((ttpu_coeff*(ttpi_inc/utpi))+adder_const);
                td_color = $(this).attr("data-color");

            }
            else{
                calc_res = fixed_itpu;

            }

            //2026-01-12 RM
            dataVG.push(calc_res);

            $(this).text(calc_res.toFixed(2));
            $(this).css("background-color", td_color);

        });

        VarGraph_show();
        //x = document.getElementById('VarIndex');
        //x.update();
        $("#variableIndexModal").modal("show");
    });

    // --- STATIC CALC INDX POPUP (index-calc page only) ---------------------
    // Clicking the "View" link in the Matches column opens a popup listing the
    // rows from bods_jda_stage.static_calc_indx that match that row's ISD_ID.
    $(document).delegate("td.scx-matches-cell", "click", function(){
        var isdId   = $(this).attr("data-isd-id");
        var handler = $(this).attr("data-handler");
        showStaticCalcIndx(isdId, handler);
    });

    // --- INDEX OVERRIDE ADD/EDIT (index-calc page only) --------------------
    // Add buttons (one per tab); the variable tab pre-selects Variable type.
    $(document).delegate("#io-add-fixed", "click", function(){
        openIndexEditor(null, "fixed");
    });
    $(document).delegate("#io-add-variable", "click", function(){
        openIndexEditor(null, "variable");
    });

    // Edit cells carry the row payload as JSON in data-row.
    $(document).delegate("td.io-edit-cell", "click", function(e){
        e.preventDefault(); // the inner <a href="#"> would otherwise jump to top
        var row = null;
        try { row = JSON.parse($(this).attr("data-row")); } catch (e2) { row = null; }
        if (!row) { return; }
        openIndexEditor(row, (row.TYPE || "fixed"));
    });

    // Re-validate (and re-run the duplicate check) on any field change.
    $(document).delegate("#io-form input", "input", function(){
        ioRefreshFormulaPreview();
        ioValidateAndGate($(this).hasClass("io-combo"));
    });
    $(document).delegate("input[name='io-index-type']", "change", function(){
        ioApplyType();
        ioRefreshFormulaPreview();
        ioValidateAndGate(true);
    });

    $(document).delegate("#io-save-btn", "click", function(){ ioSave(); });
    $(document).delegate("#io-delete-btn", "click", function(){ ioDelete(); });
});

function showStaticCalcIndx(isdId, handler){
    var $modal = $("#staticCalcModal");

    $(".scx-handler", $modal).text(handler || "");
    $(".scx-isdid", $modal).text(isdId || "");
    $(".scx-message", $modal).empty();

    // tear down any prior DataTable before clearing the DOM it manages
    if ($.fn.DataTable && $.fn.DataTable.isDataTable("#staticCalcTable")) {
        $("#staticCalcTable", $modal).DataTable().destroy();
    }
    $("#staticCalcTable thead", $modal).empty();
    $("#staticCalcTable tbody", $modal).empty();

    $modal.modal("show");

    $.ajax({
        type: 'post',
        url: 'STATIC_CALC_INDX.PHP',
        data: { ISD_ID: isdId },
        dataType: 'json',
        beforeSend: function(){
            $(".scx-loader", $modal).removeClass("d-none");
        },
        success: function(res){
            if (!res || res.ok !== true) {
                $(".scx-message", $modal).html(
                    '<div class="alert alert-danger">'
                    + (res && res.error ? res.error : 'Unable to load data.')
                    + '</div>'
                );
                return;
            }

            if (!res.rows || res.rows.length === 0) {
                $(".scx-message", $modal).html(
                    '<div class="alert alert-warning">No matching records in '
                    + 'static_calc_indx for ISD ID ' + res.isd_id + '.</div>'
                );
                return;
            }

            // drop the rcir_id column (case-insensitive) from the display
            var columns = $.grep(res.columns, function(col){
                return String(col).toLowerCase() !== 'rcir_id';
            });

            // is a column one of the INPUT_* fields?
            function isInput(col){
                return String(col).toLowerCase().indexOf('input_') === 0;
            }
            // display name: strip the leading INPUT_ prefix when present
            function displayName(col){
                return isInput(col) ? String(col).substring('input_'.length) : col;
            }

            // two-row header:
            //   top row  - non-INPUT cols (rowspan 2) + an "INPUT" label spanning
            //              each contiguous run of INPUT_* cols (colspan)
            //   bottom   - the de-prefixed names of the INPUT_* cols
            var $thead = $("#staticCalcTable thead", $modal);
            var $top    = $('<tr></tr>');
            var $bottom = $('<tr></tr>');

            for (var i = 0; i < columns.length; i++) {
                if (!isInput(columns[i])) {
                    $top.append($('<th rowspan="2"></th>').text(columns[i]));
                    continue;
                }
                // gather the contiguous run of INPUT_* columns
                var span = 0;
                while (i < columns.length && isInput(columns[i])) {
                    $bottom.append($('<th></th>').text(displayName(columns[i])));
                    span++;
                    i++;
                }
                i--; // step back; the for-loop will advance past the run
                $top.append($('<th colspan="' + span + '"></th>').text('INPUT'));
            }

            $thead.append($top);
            $thead.append($bottom);

            // body rows
            var $tbody = $("#staticCalcTable tbody", $modal);
            $.each(res.rows, function(i, row){
                var $rowTr = $('<tr></tr>');
                $.each(columns, function(j, col){
                    var val = (row[col] === null || row[col] === undefined) ? '' : row[col];
                    $rowTr.append($('<td></td>').text(val));
                });
                $tbody.append($rowTr);
            });

            // basic sorting via DataTables, with a multi-column default order.
            // build the order array from whichever of the preferred columns
            // actually exist (matched case-insensitively against `columns`).
            var defaultSort = [
                'input_mfg_part_num',
                'input_step_nm',
                'input_handler_eng',
                'input_package',
                'input_body_size',
                'input_temp_class',
                'input_lead_count',
                'utpi'
            ];
            var lowerCols = $.map(columns, function(c){ return String(c).toLowerCase(); });
            var order = [];
            $.each(defaultSort, function(i, name){
                var idx = $.inArray(name, lowerCols);
                if (idx !== -1) { order.push([idx, 'asc']); }
            });

            $("#staticCalcTable", $modal).DataTable({
                order: order,
                paging: false,
                searching: false,
                info: false,
                autoWidth: false,
                destroy: true
            });
        },
        error: function(xhr){
            $(".scx-message", $modal).html(
                '<div class="alert alert-danger">Request failed ('
                + xhr.status + ').</div>'
            );
        },
        complete: function(){
            $(".scx-loader", $modal).addClass("d-none");
        }
    });
}


function VarGraph_show() {
    try {
        Chart.getChart('VarIndex').destroy();
    } catch { 

    }

    const myChart = new Chart("VarIndex", {
        type: "line",
        data: {
            labels: labelVG,
            datasets: [{
                label: strHeader,
                data: dataVG,
                fill: false,
                borderColor: 'rgb(75, 192, 192)'
            }]
        },
        options: {
            aspectRatio: 4
        }
    });
}


// ===========================================================================
// INDEX OVERRIDE ADD/EDIT EDITOR (index-calc page only)
// Drives #indexOverrideModal and talks to INDEX_OVERRIDE_CRUD.PHP.
// ===========================================================================

// debounce handle for the duplicate-combination check
var ioCheckTimer = null;
// latest known duplicate state (gates the Save button alongside validation)
var ioDuplicate = false;

// trim helper: returns the trimmed value, "" stays ""
function ioVal(sel){
    return $.trim($("#" + sel, "#indexOverrideModal").val() || "");
}

// is the current index type "variable"?
function ioIsVariable(){
    return $("input[name='io-index-type']:checked").val() === "variable";
}

// show/hide the variable-only fields based on the selected type
function ioApplyType(){
    if (ioIsVariable()) {
        $(".io-variable-only").removeClass("d-none");
    } else {
        $(".io-variable-only").addClass("d-none");
    }
}

// numeric? (blank is NOT numeric here; callers decide if blank is allowed)
function ioIsNum(v){
    return v !== "" && !isNaN(parseFloat(v)) && isFinite(v);
}

// open the modal for add (row === null) or edit (row = data-row payload)
function openIndexEditor(row, type){
    var $modal = $("#indexOverrideModal");

    // reset state
    ioDuplicate = false;
    $(".io-message", $modal).empty();
    $(".form-control", $modal).removeClass("is-invalid");

    // identity
    $("#io-isd-id").val(row ? (row.ISD_ID != null ? row.ISD_ID : "") : "");
    $("#io-ism-id").val(row ? (row.ISM_ID != null ? row.ISM_ID : "") : "");

    // type radios
    if (type === "variable") {
        $("#io-type-variable").prop("checked", true);
    } else {
        $("#io-type-fixed").prop("checked", true);
    }

    // field values (blank when adding)
    $("#io-handler").val(row && row.HANDLER != null ? row.HANDLER : "");
    $("#io-package").val(row && row.PACKAGE != null ? row.PACKAGE : "");
    $("#io-soak-time").val(row && row.SOAK_TIME != null ? row.SOAK_TIME : "");
    $("#io-body-size").val(row && row.BODY_SIZE != null ? row.BODY_SIZE : "");
    $("#io-temp-class").val(row && row.TEMP_CLASS != null ? row.TEMP_CLASS : "");
    $("#io-lead-min").val(row && row.LEAD_COUNT_MIN != null ? row.LEAD_COUNT_MIN : "");
    $("#io-lead-max").val(row && row.LEAD_COUNT_MAX != null ? row.LEAD_COUNT_MAX : "");
    $("#io-utpi").val(row && row.UTPI != null ? row.UTPI : "");
    $("#io-index-value").val(row && row.INDEX_VALUE != null ? row.INDEX_VALUE : "");
    $("#io-ttpi-threshold").val(row && row.TTPI_THRESHOLD != null ? row.TTPI_THRESHOLD : "");
    $("#io-coefficient").val(row && row.COEFFICIENT != null ? row.COEFFICIENT : "");
    $("#io-constant").val(row && row.CONSTANT != null ? row.CONSTANT : "");

    // title + delete-button visibility. The type reflects where the editor was
    // launched from (Fixed vs Variable tab / add button).
    var typeLabel = (type === "variable") ? "Variable" : "Fixed";
    if (row) {
        var isdLabel = (row.ISD_ID != null && row.ISD_ID !== "")
            ? " (ISD ID " + row.ISD_ID + ")" : "";
        $("#indexOverrideModalLabel").text("Edit " + typeLabel + " Index Time" + isdLabel);
        $("#io-delete-btn").removeClass("d-none");
    } else {
        $("#indexOverrideModalLabel").text("Add " + typeLabel + " Index Time");
        $("#io-delete-btn").addClass("d-none");
    }

    ioApplyType();
    ioRefreshFormulaPreview();
    ioValidateAndGate(true);

    $modal.modal("show");
}

// rebuild the read-only formula previews from the current inputs, mirroring
// the server IO_BUILD_FORMULAS() concatenation exactly (raw token text).
// Reduce a numeric token to significant digits for use inside a formula:
// drop trailing zeros after the decimal (and a bare trailing point), so
// -0.990 -> -0.99, 5.00 -> 5. Mirrors io_sig() in INDEX_OVERRIDE_CRUD.PHP so
// the preview matches exactly what the server stores.
function ioSig(v){
    var s = (v === null || v === undefined) ? "" : String(v).trim();
    if (s === "") { return s; }
    if (/^[+-]?\d*\.\d+$/.test(s)) {
        s = s.replace(/0+$/, "").replace(/\.$/, "");
    }
    return s;
}

function ioRefreshFormulaPreview(){
    if (!ioIsVariable()) {
        $("#io-threshold-formula-preview").val("");
        $("#io-final-formula-preview").val("");
        return;
    }
    var coeff = ioSig(ioVal("io-coefficient"));
    var konst = ioSig(ioVal("io-constant"));
    var thr   = ioSig(ioVal("io-ttpi-threshold"));
    var idx   = ioSig(ioVal("io-index-value"));

    var threshold = "UTPI*((" + coeff + "*TESTTIME)+" + konst + ")";
    var final     = "IF(TTPI>=" + thr + "," + idx + ",UTPI*((" + coeff + "*TTPU)+" + konst + "))";

    $("#io-threshold-formula-preview").val(threshold);
    $("#io-final-formula-preview").val(final);
}

// validate the form, set is-invalid states, gate the Save button, and (when
// the combination fields are individually valid) kick off the duplicate check.
// runComboCheck=true requests a fresh server duplicate check.
function ioValidateAndGate(runComboCheck){
    var valid = true;

    // nullable-but-positive numerics
    var posIds = ["io-soak-time", "io-lead-min", "io-lead-max"];
    for (var i = 0; i < posIds.length; i++) {
        var v = ioVal(posIds[i]);
        var bad = (v !== "" && (!ioIsNum(v) || parseFloat(v) <= 0));
        $("#" + posIds[i]).toggleClass("is-invalid", bad);
        if (bad) { valid = false; }
    }

    // when both lead counts are present, min must be <= max
    var lcMin = ioVal("io-lead-min");
    var lcMax = ioVal("io-lead-max");
    var leadOrderBad = (lcMin !== "" && lcMax !== ""
        && ioIsNum(lcMin) && ioIsNum(lcMax)
        && parseFloat(lcMin) > parseFloat(lcMax));
    if (leadOrderBad) {
        $("#io-lead-min").addClass("is-invalid");
        $("#io-lead-max").addClass("is-invalid");
        valid = false;
    }

    // handler: required, never blank
    var handlerBad = (ioVal("io-handler") === "");
    $("#io-handler").toggleClass("is-invalid", handlerBad);
    if (handlerBad) { valid = false; }

    // utpi: required integer >= 1
    var utpi = ioVal("io-utpi");
    var utpiBad = !/^\d+$/.test(utpi) || parseInt(utpi, 10) < 1;
    $("#io-utpi").toggleClass("is-invalid", utpiBad);
    if (utpiBad) { valid = false; }

    // index value: required, numeric, non-zero
    var idx = ioVal("io-index-value");
    var idxBad = !ioIsNum(idx) || parseFloat(idx) === 0;
    $("#io-index-value").toggleClass("is-invalid", idxBad);
    if (idxBad) { valid = false; }

    // variable-only: ttpi_threshold, coefficient, constant required numeric
    if (ioIsVariable()) {
        var varIds = ["io-ttpi-threshold", "io-coefficient", "io-constant"];
        for (var j = 0; j < varIds.length; j++) {
            var vv = ioVal(varIds[j]);
            var vbad = !ioIsNum(vv);
            $("#" + varIds[j]).toggleClass("is-invalid", vbad);
            if (vbad) { valid = false; }
        }
    }

    // combination-field validity is what the duplicate check depends on:
    // handler + utpi must be valid, lead min/max ordered, positive-numerics ok.
    var comboValid = !utpiBad && !handlerBad && !leadOrderBad;
    for (var k = 0; k < posIds.length; k++) {
        if ($("#" + posIds[k]).hasClass("is-invalid")) { comboValid = false; }
    }

    if (runComboCheck && comboValid) {
        ioScheduleDuplicateCheck();
    }

    ioUpdateSaveButton(valid);
    return valid;
}

// enable Save only when the form is valid AND no duplicate combination exists
function ioUpdateSaveButton(formValid){
    var enable = formValid && !ioDuplicate;
    $("#io-save-btn").prop("disabled", !enable);
}

// debounced AJAX duplicate check against the combination fields
function ioScheduleDuplicateCheck(){
    if (ioCheckTimer) { clearTimeout(ioCheckTimer); }
    ioCheckTimer = setTimeout(ioRunDuplicateCheck, 300);
}

function ioRunDuplicateCheck(){
    var payload = {
        action:         "check",
        handler:        ioVal("io-handler"),
        package:        ioVal("io-package"),
        soak_time:      ioVal("io-soak-time"),
        body_size:      ioVal("io-body-size"),
        lead_count_min: ioVal("io-lead-min"),
        lead_count_max: ioVal("io-lead-max"),
        temp_class:     ioVal("io-temp-class"),
        utpi:           ioVal("io-utpi")
    };
    // in edit mode, exclude the row's own ISD_ID from the match
    var isdId = ioVal("io-isd-id");
    if (isdId !== "") { payload.isd_id = isdId; }

    $.ajax({
        type: "post",
        url: "INDEX_OVERRIDE_CRUD.PHP",
        data: payload,
        dataType: "json",
        success: function(res){
            if (res && res.ok === true && res.exists === true) {
                ioDuplicate = true;
                $(".io-message", "#indexOverrideModal").html(
                    '<div class="alert alert-warning mb-0">This combination / lead-count '
                    + 'range overlaps an existing record (ISD ID ' + res.isd_id
                    + '). Saving is disabled.</div>'
                );
            } else {
                ioDuplicate = false;
                $(".io-message", "#indexOverrideModal").empty();
            }
            // re-gate Save using the latest duplicate state
            ioUpdateSaveButton(ioValidateNoSideEffects());
        }
    });
}

// run the same validation logic without triggering another duplicate check
function ioValidateNoSideEffects(){
    return ioValidateAndGate(false);
}

// collect the form into the POST payload for save
function ioCollectPayload(){
    var payload = {
        action:         "save",
        index_type:     ioIsVariable() ? "variable" : "fixed",
        handler:        ioVal("io-handler"),
        package:        ioVal("io-package"),
        soak_time:      ioVal("io-soak-time"),
        body_size:      ioVal("io-body-size"),
        lead_count_min: ioVal("io-lead-min"),
        lead_count_max: ioVal("io-lead-max"),
        temp_class:     ioVal("io-temp-class"),
        utpi:           ioVal("io-utpi"),
        index_value:    ioVal("io-index-value"),
        ttpi_threshold: ioVal("io-ttpi-threshold"),
        coefficient:    ioVal("io-coefficient"),
        constant:       ioVal("io-constant")
    };
    var isdId = ioVal("io-isd-id");
    var ismId = ioVal("io-ism-id");
    if (isdId !== "") { payload.isd_id = isdId; }
    if (ismId !== "") { payload.ism_id = ismId; }
    return payload;
}

// preserve the active tab across the post-save reload
function ioReloadPreservingTab(){
    var tab = ioIsVariable() ? "variable" : "fixed";
    var url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.location.href = url.href;
}

// dry-run: show the SQL the server executed-then-rolled-back, instead of
// reloading (there is nothing new to reload). Escapes text for safe display.
function ioShowDryRunSql(res, verb){
    var lines = (res && res.sql) ? res.sql : [];
    var body = "";
    for (var i = 0; i < lines.length; i++) {
        body += String(lines[i])
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (i < lines.length - 1) { body += "\n"; }
    }
    var idInfo = "";
    if (res && res.isd_id) { idInfo += " ISD_ID=" + res.isd_id; }
    if (res && res.ism_id) { idInfo += " ISM_ID=" + res.ism_id; }
    $(".io-message", "#indexOverrideModal").html(
        '<div class="alert alert-info mb-0">'
        + '<strong>DRY RUN &mdash; ' + verb + ' rolled back, nothing was saved.</strong>'
        + (idInfo ? '<div class="small mt-1">Would-be ids:' + idInfo + '</div>' : '')
        + '<pre class="mt-2 mb-0" style="white-space:pre-wrap;font-size:12px;">'
        + body + '</pre></div>'
    );
}

function ioSave(){
    if (!ioValidateAndGate(false) || ioDuplicate) { return; }

    $("#io-save-btn").prop("disabled", true);

    $.ajax({
        type: "post",
        url: "INDEX_OVERRIDE_CRUD.PHP",
        data: ioCollectPayload(),
        dataType: "json",
        success: function(res){
            if (res && res.ok === true) {
                if (res.no_change === true) {
                    $(".io-message", "#indexOverrideModal").html(
                        '<div class="alert alert-secondary mb-0">No fields changed &mdash; '
                        + 'nothing to update.</div>'
                    );
                    ioUpdateSaveButton(ioValidateNoSideEffects());
                    return;
                }
                if (res.dry_run === true) {
                    ioShowDryRunSql(res, (res.mode === "update" ? "Update" : "Insert"));
                    ioUpdateSaveButton(ioValidateNoSideEffects());
                    return;
                }
                ioReloadPreservingTab();
                return;
            }
            // defense-in-depth: server caught a duplicate the client missed
            if (res && res.duplicate === true) {
                ioDuplicate = true;
                $(".io-message", "#indexOverrideModal").html(
                    '<div class="alert alert-warning mb-0">This combination / lead-count '
                    + 'range overlaps an existing record (ISD ID ' + res.isd_id
                    + '). Saving is disabled.</div>'
                );
            } else {
                var msg = (res && res.errors) ? res.errors.join(" ")
                        : ((res && res.error) ? res.error : "Save failed.");
                $(".io-message", "#indexOverrideModal").html(
                    '<div class="alert alert-danger mb-0">' + msg + '</div>'
                );
            }
            ioUpdateSaveButton(ioValidateNoSideEffects());
        },
        error: function(xhr){
            $(".io-message", "#indexOverrideModal").html(
                '<div class="alert alert-danger mb-0">Request failed (' + xhr.status + ').</div>'
            );
            ioUpdateSaveButton(ioValidateNoSideEffects());
        }
    });
}

function ioDelete(){
    var isdId = ioVal("io-isd-id");
    if (isdId === "") { return; }
    if (!window.confirm("Delete this index time record? This cannot be undone.")) { return; }

    $("#io-delete-btn").prop("disabled", true);

    $.ajax({
        type: "post",
        url: "INDEX_OVERRIDE_CRUD.PHP",
        data: { action: "delete", isd_id: isdId },
        dataType: "json",
        success: function(res){
            if (res && res.ok === true) {
                if (res.dry_run === true) {
                    ioShowDryRunSql(res, "Delete");
                    $("#io-delete-btn").prop("disabled", false);
                    return;
                }
                ioReloadPreservingTab();
                return;
            }
            $(".io-message", "#indexOverrideModal").html(
                '<div class="alert alert-danger mb-0">'
                + ((res && res.error) ? res.error : "Delete failed.") + '</div>'
            );
            $("#io-delete-btn").prop("disabled", false);
        },
        error: function(xhr){
            $(".io-message", "#indexOverrideModal").html(
                '<div class="alert alert-danger mb-0">Request failed (' + xhr.status + ').</div>'
            );
            $("#io-delete-btn").prop("disabled", false);
        }
    });
}