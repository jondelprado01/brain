$(document).ready(function(){
    
    //initialize multiple select2
    $(".select2-nonate-type1").each(function(){
        let elem_id = $(this).attr("id");
        let has_tags = (elem_id.includes("mfg-partnum") || elem_id.includes("board-name")) ? true : false;

        $("#"+elem_id).select2({
            tags: has_tags,
            theme: 'bootstrap-5',
            allowClear: true
        });
    });

    var file_name_nonate_type_1 = "";

    //exclude columns in datatable export
    function exportButtonNonateType1(type) {
        let cols = [];
        let title_object = {};
        for (var i = 0; i <= 6; i++) {
            cols.push(i);
        }

        if (type == 'print') {
            title_object = {
                customize: function (win) {
                    win.document.title = 'NONATE [Type 1 - Burn-In Load/Unload Hours]';
                }
            }
        }
        else{
            title_object = {title: 'BRAIN - NONATE [Type 1 - Burn-In Load/Unload Hours]'};
        }

        let config_object = {
            extend: type,
            filename: function () {
                return file_name_nonate_type_1;
            },
            className: 'd-none buttons-' + type +'-nonate-type-1',
            exportOptions: {
                columns: cols
            },
            ...title_object,
        }

        
        if (type == "pdf") {
            config_object.orientation = 'landscape';
            config_object.pageSize = 'A4';
        }

        return config_object;
    }

    //SET CURRENT TAB IN THE URL
    $(".nonate-link").on("click", function(){
        let url = new URL($(location).attr('href'));
        let tab = $(this).attr("tab-name");
        url.searchParams.set("tab", tab);
        window.history.pushState('state', 'title', url.href);
    });

    //DATATABLES
    var table_type_1 = $(".table-non-type1").DataTable({
        scrollY: 'calc(100vh - 550px)',
        // bSort: false,
        responsive: true,
        columnDefs: [
            {targets: [2,3,4], width: "15%"},
            {
                targets: "_all",
                createdCell: function(td, cellData, rowData, row, col){
                    $(td).attr('cell-id', rowData[6]);
                    if (col == 2) {
                        $(td).addClass('bi-hours');
                    }
                    if (col == 3) {
                        $(td).attr('contenteditable', 'true');
                        $(td).attr("default-val", rowData[3]);
                        $(td).addClass('load-hours bg-info-subtle');
                    }
                    if (col == 4) {
                        $(td).attr("default-val", rowData[4]);
                        $(td).addClass('load-unload-hours');
                    }
                    if (col == 5) {
                        $(td).attr("default-val", rowData[5]);
                        $(td).addClass('turns-per-week');
                    }
                }
            },
            {
            targets: 6, // first displayed column
                render: function(data, type, row, meta) {
                    return row[8];
                }
            }
        ],
        createdRow: function (row, data, index) {
            if (data[7] !== 'UNCHANGED') {
                $(row).addClass('border border-info-subtle');
            }
            $(row).attr('default-state', JSON.stringify(data));
            $(row).attr('db-id', data[7]);
            $(row).attr('row-id', data[6]);
        },
        layout: {
            topStart: "pageLength",
            top2Start: {
                buttons: [exportButtonNonateType1('copy'), exportButtonNonateType1('csv'), exportButtonNonateType1('excel'), exportButtonNonateType1('pdf'), exportButtonNonateType1('print')]
            },
            bottomStart: "info"
        }
    });

    // -----------------------------------------------------------------------------------EXPORTS------------------------------------------------------------------------------
    $(".btn-export-process-nonate-type1").on("click", function(){
        let export_type = $(this).attr("export-type");
        let tab_type = $(this).attr("tab-type");
        
        if (table_type_1.rows().count() == 0) {
            showToast("No data available to export.", "warning");
            return;
        }

        $(".btn-export").attr("tab-type", tab_type);
        
        if ($.inArray(export_type, ["copy", "print"]) === -1) {
            $(".export-type-title").text(export_type.toUpperCase());
            $("#export-type").val(export_type);
            $("#modal-export").modal("show");
        }
        else{
            table_type_1.button(".buttons-"+export_type+"-nonate-type-1").trigger();
        }
    });

    $(".btn-export").on("click", function(){
        let export_type = $("#export-type").val();
        let filename = $("#export-filename").val();
        let tab_type = $(this).attr("tab-type");
        
        if (tab_type == "type-1") {
            if (filename != "") {
                file_name_nonate_type_1 = "BRAIN_"+filename;
                table_type_1.button(".buttons-"+export_type+"-nonate-"+tab_type).trigger();
            }
            else{
                $(".export-error").fadeIn();
            }
        }

    });

    $('.nonate-link').on('shown.bs.tab', function (e) {
        table_type_1.columns.adjust().draw();
    });

    preloadBurnin(existing_burnin, table_type_1);

    $(document).delegate(".btn-reload-default-type1", "click", function(e){

        $("#modal-reload-data").modal("show");

        $(".btn-continue-reload").on("click", function(){
            var url = window.location.href;
            var needle = 'tab=type-1';
            var pos = url.indexOf(needle);
            if (pos !== -1) {
                window.location.href = url.substring(0, pos + needle.length);
            }
            // $(".default-spinner-type1").show();
            // $(this).prop("disabled", true);
            
            // setTimeout(function(){
            //     $("#dt-search-0").val("").trigger('input');
            //     preloadBurnin(existing_burnin, table_type_1);
            //     $(".btn-reload-default-type1").prop("disabled", false);
            //     $(".default-spinner-type1").hide();
            // }, 1000);
        });
    });

    //SEARCH BOARD
    $("#search-board-field-type1").on("keypress", function(e){
        if(e.which == 13){
            let board = $(this).val();
            if (board == '') {
                showGenericAlertType1("error", "Search Field Empty");
                return;
            }
            else if(board.length < 5){
                showGenericAlertType1("error", "Must be 5-10 characters long.");
                return;
            }
            else{
                getBoardsBurnin(board, table_type_1);
            }
        }
    });

    // ADD BURNIN HOURS
    $(".btn-save-burnin").on("click", function(){
        let cell_ids = [];
        let data = [];

        if ($("td.bg-success-subtle").length > 0) {
            $("td.bg-success-subtle").each(function(){
                if ($.inArray($(this).attr("cell-id"), cell_ids) === -1) {
                    if (typeof($(this).attr("cell-id")) != 'undefined' && $(this).attr("cell-id") != '') {
                        cell_ids.push($(this).attr("cell-id"));
                    }
                }
            });
    
            $.each(cell_ids, function(index, item){
                let temp = [];
                $('[cell-id="'+item+'"]').each(function(){
                    temp.push($(this).text());
                });
                temp.push(item);

                $('[row-id="'+item+'"]').each(function(){
                    temp.push($(this).attr('default-state'));
                    temp.push($(this).attr('db-id'));
                });
                
                data.push(temp);
            });

            addBoardsBurnin(data, user_details);
        }
    });

    //CALCULATE LOAD/UNLOAD HOURS
    function setDefaultValues(cell_id, element, default_val){
        $(element['LOAD_UNLOAD']).text(default_val['LOAD_UNLOAD']);
        $(element['TOTAL_BI_HRS']+'[cell-id="'+cell_id+'"]').text(default_val['TOTAL_BI_HRS']);
        $(element['TURNS_PER_WEEK']+'[cell-id="'+cell_id+'"]').text(default_val['TURNS_PER_WEEK']);
    }

    $(document).delegate(".load-hours", "input", function(event){

        if (event.key === "Enter") {
            event.preventDefault();
            return false;
        }

        let cell_id = $(this).attr("cell-id");
        let cell_val = $(this).text();
        let default_cell_val = parseFloat($(this).attr("default-val"));
        let default_load_unload = parseFloat($('.load-unload-hours[cell-id="'+cell_id+'"]').attr("default-val"));
        let default_turns_per_week = parseFloat($('.turns-per-week[cell-id="'+cell_id+'"]').attr("default-val"));
        let bi_hours = parseFloat($('.bi-hours[cell-id="'+cell_id+'"]').text());
        let load_unload;
        let check_input = /[^a-zA-Z0-9.]/.test(cell_val);
        let default_val_arr  = {LOAD_UNLOAD: default_cell_val, TOTAL_BI_HRS: default_load_unload,  TURNS_PER_WEEK: default_turns_per_week};
        let default_elem_arr = {LOAD_UNLOAD: $(this),          TOTAL_BI_HRS: ".load-unload-hours", TURNS_PER_WEEK: ".turns-per-week"};

        if (check_input) {
            showGenericAlertType1("error", "Invalid value! Special characters are not allowed");
            setDefaultValues(cell_id, default_elem_arr, default_val_arr);
            return;
        }

        if (parseFloat(cell_val) > 168) {
            showGenericAlertType1("error", "Max Load Hours: 168 Hours");
            setDefaultValues(cell_id, default_elem_arr, default_val_arr);

            $('[cell-id="'+cell_id+'"]').each(function(){
                if ($(this).hasClass("load-hours")) {
                    $(this).addClass('bg-info-subtle');
                }
                $(this).removeClass('bg-success-subtle');
            });
            return;
        }
        
        if ($.isNumeric(cell_val)) {
            if (parseFloat(cell_val) <= 0) {
                if (default_cell_val != 0) {
                    showGenericAlertType1("error", "Load Hours must be greater than Zero.");
                    setDefaultValues(cell_id, default_elem_arr, default_val_arr);
    
                    $('td[cell-id="'+cell_id+'"]').each(function(){
                        if ($(this).hasClass("load-hours")) {
                            $(this).addClass('bg-info-subtle');
                        }
                        $(this).removeClass('bg-success-subtle');
                    });
                }
                else{
                    setDefaultValues(cell_id, default_elem_arr, default_val_arr);
                }
            }
            else{
                load_unload = bi_hours + parseFloat(cell_val);
                if (default_cell_val != parseFloat(cell_val) && default_load_unload != load_unload) {
                    $('td[cell-id="'+cell_id+'"]').each(function(){
                        if ($(this).hasClass("load-hours")) {
                            $(this).removeClass('bg-info-subtle');
                        }
                        $(this).addClass('bg-success-subtle');
                    });
                }
                else{
                    $('td[cell-id="'+cell_id+'"]').each(function(){
                        if ($(this).hasClass("load-hours")) {
                            $(this).addClass('bg-info-subtle');
                        }
                        $(this).removeClass('bg-success-subtle');
                    });
                }
            }
        }
        else{
            $(".btn-save-burnin").prop("disabled", true);
            return;
        }
        
        if ($("td.bg-success-subtle").length > 0) {
            $(".btn-save-burnin").prop("disabled", false);
        }
        else{
            $(".btn-save-burnin").prop("disabled", true);
        }
        
        if (load_unload != undefined) {
            $('.load-unload-hours[cell-id="'+cell_id+'"]').text(load_unload);
            $('.turns-per-week[cell-id="'+cell_id+'"]').text(parseFloat(168 / load_unload).toFixed(2));
        }
    });


    //ONE TIME USE ONLY - ENABLE FOR FUTURE USE
    $("#btn-mass-insert-type1").on("click", function(){
        let file = $("#mass-insert-type1")[0].files[0];
        var reader = new FileReader();
        reader.addEventListener('load', function(e) {
            var text = e.target.result.split("\r\n");
            let source_data = [];
            let partnum_arr = [];
            let board_arr = [];
            $.each(text, function(idx, itm){
                if (idx > 0) {
                    let partnum     = itm.split(",")[0];
                    let board       = itm.split(",")[1];
                    // let bi_hours    = itm.split(",")[2];
                    // let load_hours  = itm.split(",")[3];
                    
                    if (partnum != "" && board != "") {
                        if ($.inArray(partnum, partnum_arr) === -1) {
                            partnum_arr.push(partnum);
                        }
        
                        if ($.inArray(board, board_arr) === -1) {
                            board_arr.push(board);
                        }

                        source_data.push(itm.split(","));
                    }

                }
            });
            massGetBoards(source_data, partnum_arr, board_arr);
        });
        reader.readAsText(file);

    });

});

//-------------------------------------------------------------------------------------API--------------------------------------------------------------------------------
function getExistingBurnin(){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=GET_BOARD_BURNIN&OUTPUT_TYPE=BODS_JDA_ADI',
        success: function(data){
            let updated_existing_boards = JSON.parse(data);
            existing_burnin = JSON.stringify(updated_existing_boards);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

//ONE TIME USE ONLY - ENABLE FOR FUTURE USE
function massGetBoards(source_data, partnum_arr, board_arr){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=MASS_SEARCH_BOARD_BURNIN&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {partnum: partnum_arr, board: board_arr},
        success: function(data){
            $.each(JSON.parse(data), function(index, item){
                var index = source_data.findIndex(
                    row => row[0] === item['MFG_PART_NUM'] && row[1] === item['BURNIN_BOARD']
                );
                
                if (index !== -1) {
                    if (item['BID'] != '') {
                        let total_bi_hours = parseFloat(item['BURNIN_HOURS_1']) + parseFloat($.trim(source_data[index][3]));
                        let turns_per_week = 168 / total_bi_hours;
    
                        source_data[index][2] = item['BURNIN_HOURS_1'];
                        source_data[index][3] = parseFloat($.trim(source_data[index][3]));
                        source_data[index][4] = total_bi_hours;
                        source_data[index][5] = parseFloat(turns_per_week.toFixed(2));
                        source_data[index][6] = item['BID'];
                    }
                }
                
            });

            source_data = source_data.filter(subarray => subarray.length >= 5);
            MassAddBoardsBurnin(source_data);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function MassAddBoardsBurnin(payload){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=ADD_BOARD_BURNIN&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: payload},
        success: function(data){
            console.log(data);  
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function preloadBurnin(board, table_type_1){
    let data = JSON.parse(board);
    if (data.length > 0) {
        let rows = [];
        $.each(data, function(index, item){
            // if (item['LOAD_HOURS'] != 10) { //turned off for now, will revisit logic
                load_unload = parseFloat(item['BI_HOURS']) + parseFloat(item['LOAD_HOURS']);
                rows.push([
                    item['MFG_PART_NUM'],
                    item['BOARD'],
                    item['BI_HOURS'],
                    item['LOAD_HOURS'],
                    load_unload,
                    parseFloat(168 / load_unload).toFixed(2),
                    item['HASH'],
                    item['ID'],
                    item['HW_TYPE']
                ]);
            // }
        });
        table_type_1.clear();
        table_type_1.rows.add(rows);
        table_type_1.draw();
    }
}

function getBoardsBurnin(board, table_type_1){
    getExistingBurnin();
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=SEARCH_BOARD_BURNIN&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: board},
        beforeSend: function(){
            $(".btn-message").hide();
            $(".btn-loader").fadeIn();
        },
        success: function(data){
            setTimeout(function(){
                let rows = [];
                let existing_cell_id = [];
                let bi_boards = JSON.parse(data);
                
                if (bi_boards.length > 0) {
                    if (JSON.parse(existing_burnin).length > 0) {
                        $.each(JSON.parse(existing_burnin), function(index, item){
                            if ($.inArray(item['HASH'], existing_cell_id) === -1) {
                                existing_cell_id.push(item['HASH']);
                            }
                        });
                    }
        
                    $.each(bi_boards, function(index, item){
        
                        let load_hours = (item['BURNIN_TYPE'] != "TCVOS") ? 10 : 0;
                        let load_unload;
                        let id = "UNCHANGED";
        
                        if ($.inArray(item['BID'], existing_cell_id) !== -1) {
                            $.each(JSON.parse(existing_burnin), function(idx, itm){
                                if (item['BID'] == itm['HASH']) {
                                    id = itm['ID'];
                                    load_hours = itm['LOAD_HOURS'];
                                    load_unload = parseFloat(itm['BI_HOURS']) + parseFloat(itm['LOAD_HOURS']);
                                }
                            });
                        }
                        else{
                            load_unload = parseFloat(item['BURNIN_HOURS_1']) + load_hours;
                        }
        
                        rows.push([
                            item['MFG_PART_NUM'],
                            item['BURNIN_BOARD'],
                            item['BURNIN_HOURS_1'],
                            load_hours,
                            load_unload,
                            parseFloat(168 / load_unload).toFixed(2),
                            item['BID'],
                            id,
                            item['BURNIN_TYPE']
                        ]);
                    });
        
                    table_type_1.clear();
                    table_type_1.rows.add(rows);
                    table_type_1.draw();
                    $(".btn-loader").fadeOut();
                }
                else{
                    $(".btn-loader").hide();
                    $(".btn-no-result").fadeIn();
                }
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function addBoardsBurnin(payload, user_details){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=ADD_BOARD_BURNIN&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: payload, user_details: user_details},
        beforeSend: function(){
            showLoaderType1();
        },
        success: function(data){
            setTimeout(function(){

                if (JSON.parse(data).hasOwnProperty('STATUS')) {
                    if (JSON.parse(data)['STATUS']) {
                        
                        addChangeLog(JSON.parse(data)['CHANGE_LOG_DATA'], user_details, "non-ate update burn-in load/unload hours");

                        let new_existing_burnin = JSON.parse(existing_burnin);
                        $.each(payload, function(index, item){
                            let part  = item[0];
                            let board = item[1];
                            let hash  = item[7];
                            let load  = item[3];
                            let uload = item[4];

                            let get_index = new_existing_burnin.findIndex(item => item.MFG_PART_NUM === part && item.HASH === hash && item.BOARD === board);
                            
                            if (get_index >= 0) {
                                new_existing_burnin[get_index]['LOAD_HOURS'] = load;
                                new_existing_burnin[get_index]['LOAD_UNLOAD'] = uload;
                            }
                            else{
                                getExistingBurnin(existing_burnin);
                            }

                            $('.load-hours[cell-id="'+hash+'"]').attr("default-val", load);

                            item.splice(8, 1);
                            $('[row-id="'+hash+'"]').attr('default-state', JSON.stringify(item));
                        });

                        existing_burnin = JSON.stringify(new_existing_burnin);

                        showGenericAlertType1("success", "Record Saved Successfully!");
                        // location.reload();
                        $("td").removeClass("bg-success-subtle");
                        $(".load-hours").addClass("bg-info-subtle");
                    }
                }
                else{
                    showGenericAlertType1("error", "Something Went Wrong!");
                }
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

$(document).ready(function(){
    // -----------------------------------------------------------------------------------------------FILTERS-------------------------------------------------------------------------------
    preFillInputFiltersNonateType1();
    $(".btn-clear-nonate-type1").on("click", function(){
        $(".hwo-inputs-nonate-type1").val('').trigger('change');
        $(".hwo-checks-nonate-type1").prop("checked", false);
    });

    $(".btn-remove-nonate-type1").on("click", function(){
        let curr_url = window.location.href;
        let pos = curr_url.indexOf("&");
        window.location.href = (pos !== -1) ? curr_url.substring(0, pos) : curr_url;
    });

    $(".input-bi-hours, .input-load-unload, .input-total-bi").on('input', function () {
        let value = $(this).val();
        // Remove non-numeric characters except dot
        value = value.replace(/[^0-9.]/g, '');
        // Remove negative values
        if (parseFloat(value) < 0) {
            value = '';
        }
        $(this).val(value);
    });

    $(".btn-set-nonate-type1").on("click", function(){

        let user = user_details['emp_name'];
        let var_arr = {
            MFG_PART_NUM: "",
            BOARD: "",
            BI_HOURS: "",
            LOAD_UNLOAD: "",
            TOTAL_BI: "",
            TURNS_WEEK: "",
            HW_TYPE: "",
            CREATED_BY: ""
        };
        
        let param_arr = [];
        $(".hwo-inputs-nonate-type1").each(function(){

            let input_id = $(this).attr("id");
            let input_val = $(this).val();
            
            if (typeof input_val === "object" && input_val.length > 0) {
                var_arr['MFG_PART_NUM'] += (input_id == "mfg-partnum-nonate-type1")  ? input_val.join(",") : "";
                var_arr['BOARD']   += (input_id == "board-name-nonate-type1")   ? input_val.join(",") : "";
                var_arr['HW_TYPE']      += (input_id == "hw-type-nonate-type1")      ? input_val.join(",") : "";
            }
            else if (typeof input_val === "string" && input_val != "") {
                if (input_id == "bi-hours-min") {
                    var_arr['BI_HOURS'] += input_val;
                }
                if (input_id == "bi-hours-max") {
                    var_arr['BI_HOURS'] += ","+input_val;
                }
                if (input_id == "load-unload-min") {
                    var_arr['LOAD_UNLOAD'] += input_val;
                }
                if (input_id == "load-unload-max") {
                    var_arr['LOAD_UNLOAD'] += ","+input_val;
                }
                if (input_id == "total-bi-min") {
                    var_arr['TOTAL_BI'] += input_val;
                }
                if (input_id == "total-bi-max") {
                    var_arr['TOTAL_BI'] += ","+input_val;
                }
                if (input_id == "turns-week-min") {
                    var_arr['TURNS_WEEK'] += input_val;
                }
                if (input_id == "turns-week-max") {
                    var_arr['TURNS_WEEK'] += ","+input_val;
                }
            }
            // console.log(input_val);
        });

        $(".hwo-checks-nonate-type1").each(function(){
            let input_id = $(this).attr("id");
            let input_val = $(this).val();
            if ($(this).is(":checked")) {
                if (input_val == "MY_RECORDS") {
                    var_arr['CREATED_BY'] += user;
                }
                else{
                    if (input_id.includes("-dates") === false) {
                        var_arr['CREATED_BY'] += input_val;
                    }
                }
            }
        });
        
        $.each(var_arr, function(key, item){
            if (item != "") {
                if ($.inArray(key, ["BI_HOURS", "LOAD_UNLOAD", "TOTAL_BI", "TURNS_WEEK"]) !== -1) {
                    item = (item.trim().startsWith(",")) ? "0"+item : item;
                }
                param_arr.push(key+"="+item.toUpperCase());
            }
        });

        if (param_arr.length > 0) { 
            let curr_url = window.location.href;
            let pos = curr_url.indexOf("&");

            const urlParams = new URLSearchParams(window.location.search);
            const hasTab = (urlParams.has("tab")) ? "" : "?tab=type-1"; 

            window.location.href = (pos !== -1) ? curr_url.substring(0, pos)+hasTab+"&"+param_arr.join("&") : curr_url+hasTab+"&"+param_arr.join("&");
        }
        else{
            showToast("Please enter at least one filter value.", "error");
        }
    });

    function preFillInputFiltersNonateType1(){

        const params = Object.fromEntries(new URLSearchParams(window.location.search));
        if (params.tab != "type-1") return;
        delete params.tab;
        
        $.each(params, function(index, item){
            if ($.inArray(index, ["BI_HOURS", "LOAD_UNLOAD", "TOTAL_BI", "TURNS_WEEK"]) !== -1) {
                let range_val = item.split(",");
                let num_field_int = (range_val.length > 1) ? ["MIN", "MAX"] : ["MIN"];
                let first_val;
                let second_val;
                $.each(num_field_int, function(idx, itm){
                    $('[input-name="'+index+'_'+itm+'"]').val(range_val[idx]);
                });
            }
            else if($.inArray(index, ["CREATED_BY"]) !== -1){
                let param_val = item.split("_")[0];
                
                if (index == "CREATED_BY") {
                    param_val = ($.inArray(item, ["OTHERS", "ALL"]) === -1) ? "MY" : item.split("_")[0];
                }
                
                $('[input-name="'+index+'_'+param_val+'"]').prop("checked", true);
            }
            else{
                if ($.inArray(index, ["MFG_PART_NUM", "BOARD"]) !== -1) {
                    $.each(item.split(","), function(idx, itm){
                        $('[input-name="'+index+'"]').append(new Option(itm, itm, true, true)).trigger('change');
                    });
                }
                else{
                    $('[input-name="'+index+'"]').val(item.split(",")).trigger('change');
                }
            }
        });

    }
});

function showGenericAlertType1(icon, title){
    Swal.fire({
        title: title,
        icon: icon
    });
}

function showLoaderType1(){
    Swal.fire({
        title: 'Processing... \n Please Wait!',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading()
        },
    });
}