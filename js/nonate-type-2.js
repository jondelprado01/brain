$(document).ready(function(){

    //initialize multiple select2
    $(".select2-nonate-type2").each(function(){
        let elem_id = $(this).attr("id");
        let has_tags = (elem_id.includes("board-name")) ? true : false;

        $("#"+elem_id).select2({
            tags: has_tags,
            theme: 'bootstrap-5',
            allowClear: true
        });
    });

    var file_name_nonate_type_2= "";

    //exclude columns in datatable export
    function exportButtonNonateType2(type) {
        let cols = [];
        let title_object = {};
        for (var i = 0; i <= 2; i++) {
            cols.push(i);
        }

        if (type == 'print') {
            title_object = {
                customize: function (win) {
                    win.document.title = 'NONATE [Type 2 - Socket Efficiency]';
                }
            }
        }
        else{
            title_object = {title: 'BRAIN - NONATE [Type 2 - Socket Efficiency]'};
        }

        let config_object = {
            extend: type,
            filename: function () {
                return file_name_nonate_type_2;
            },
            className: 'd-none buttons-' + type +'-nonate-type-2',
            exportOptions: {
                columns: cols
            },
            ...title_object,
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
     var table_type_2 = $(".table-non-type2").DataTable({
        scrollY: 'calc(100vh - 550px)',
        bSort: false,
        responsive: true,
        autoWidth: false,
        columnDefs: [
            {targets: 1, width: "15%"},
            {
                targets: "_all",
                createdCell: function(td, cellData, rowData, row, col){
                    if (col == 2) {
                        $(td).attr("contenteditable", true);
                        $(td).attr("default-se", rowData[2]);
                        $(td).addClass("socket-efficiency bg-info-subtle dt-left");
                    }
                    $(td).attr("cell-id-type2", rowData[3]);
                }
            },
        ],
        createdRow: function (row, data, index) {
            data[2] = parseFloat((data[2].replace("%", "") / 100).toFixed(3));
            $(row).attr('default-state-type2', JSON.stringify(data));
            $(row).attr('db-id-type2', data[4]);
            $(row).attr('row-id-type2', data[3]);
        },
        layout: {
            topStart: "pageLength",
            top2Start: {
                buttons: [exportButtonNonateType2('copy'), exportButtonNonateType2('csv'), exportButtonNonateType2('excel'), exportButtonNonateType2('pdf'), exportButtonNonateType2('print')]
            },
            bottomStart: "info"
        }
    });

    // -----------------------------------------------------------------------------------EXPORTS------------------------------------------------------------------------------
    $(".btn-export-process-nonate-type2").on("click", function(){
        let export_type = $(this).attr("export-type");
        let tab_type = $(this).attr("tab-type");
        
        if (table_type_2.rows().count() == 0) {
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
            table_type_2.button(".buttons-"+export_type+"-nonate-type-2").trigger();
        }
    });

    $(".btn-export").on("click", function(){
        let export_type = $("#export-type").val();
        let filename = $("#export-filename").val();
        let tab_type = $(this).attr("tab-type");
        
        if (tab_type == "type-2") {
            if (filename != "") {
                file_name_nonate_type_2 = "BRAIN_"+filename;
                table_type_2.button(".buttons-"+export_type+"-nonate-"+tab_type).trigger();
            }
            else{
                $(".export-error").fadeIn();
            }
        }

    });

    $('.nonate-link').on('shown.bs.tab', function (e) {
        table_type_2.columns.adjust().draw();
    });

    //PRELOAD EXISTING OVERRIDE SOCKET EFFICIENCY
    preloadSocket(existing_socket, table_type_2);
    
    $(document).delegate(".btn-reload-default-type2", "click", function(){

        $("#modal-reload-data").modal("show");

        $(".btn-continue-reload").on("click", function(){
            var url = window.location.href;
            var needle = 'tab=type-2';
            var pos = url.indexOf(needle);
            if (pos !== -1) {
                window.location.href = url.substring(0, pos + needle.length);
            }
        });

        // $(".default-spinner-type2").show();
        // $(this).prop("disabled", true);

        // setTimeout(function(){
        //     $("#dt-search-1").val("").trigger('input');
        //     preloadSocket(existing_socket, table_type_2);
        //     $(".btn-reload-default-type2").prop("disabled", false);
        //     $(".default-spinner-type2").hide();
        // }, 1000);
    });


    //SEARCH BOARD
    $("#search-board-field-type2").on("keypress", function(e){
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
                getBoardsSocket(board, table_type_2);
            }
        }
    });

    //FORMAT SOCKET EFFICIENCY TABLE CELL VALUES
    $(document).delegate("body", "click", function(){
        $('.socket-efficiency')
        .on('focus', function() {
            $(this).text($(this).text().replace("%", ""));
        })
        .on('blur', function() {
            $(this).text($(this).text().replace("%", ""));
            let test = $(this).text()+"%";
            $(this).text(test);
        });     
    });

    $(document).delegate(".socket-efficiency", "input", function(){
        let cell_id = $(this).attr("cell-id-type2");
        let cell_val = $(this).text();
        let default_val = parseFloat($(this).attr("default-se"));
        
        if ($.isNumeric(cell_val) || cell_val == '') {
            if (parseFloat(cell_val) <= 0) {
                showGenericAlertType1("error", "Socket Efficiency must be greater than Zero.");
                $(this).text(default_val+"%");
                $('td[cell-id-type2="'+cell_id+'"]').each(function(){
                    if ($(this).hasClass("socket-efficiency")) {
                        $(this).addClass('bg-info-subtle');
                    }
                    $(this).removeClass('bg-success-subtle');
                });
            }
            else if (parseFloat(cell_val) > 100) {
                showGenericAlertType1("error", "Socket Efficiency must not exceed 100%.");
                $(this).text(default_val+"%");
                $('td[cell-id-type2="'+cell_id+'"]').each(function(){
                    if ($(this).hasClass("socket-efficiency")) {
                        $(this).addClass('bg-info-subtle');
                    }
                    $(this).removeClass('bg-success-subtle');
                });
            }
            else{
                if (default_val == parseFloat(cell_val)) {
                    $('td[cell-id-type2="'+cell_id+'"]').each(function(){
                        if ($(this).hasClass("socket-efficiency")) {
                            $(this).addClass('bg-info-subtle');
                        }
                        $(this).removeClass('bg-success-subtle');
                    });
                }
                else{
                    $('td[cell-id-type2="'+cell_id+'"]').each(function(){
                        if ($(this).hasClass("socket-efficiency")) {
                            $(this).removeClass('bg-info-subtle');
                        }
                        $(this).addClass('bg-success-subtle');
                    });
                }
            }
        }
        else{
            showGenericAlertType1("error", "Input a Numeric Value!");
            $(this).text(default_val+"%");
            $('td[cell-id-type2="'+cell_id+'"]').each(function(){
                if ($(this).hasClass("socket-efficiency")) {
                    $(this).addClass('bg-info-subtle');
                }
                $(this).removeClass('bg-success-subtle');
            });
        }

        if ($("td.bg-success-subtle").length > 0) {
            $(".btn-save-socket").prop("disabled", false);
        }
        else{
            $(".btn-save-socket").prop("disabled", true);
        }

    });

    //SAVE BOARD SOCKET EFFICIENCY
    $(".btn-save-socket").on("click", function(){
        let cell_ids = [];
        let data = [];
        let error = 0;

        if ($("td.bg-success-subtle").length > 0) {
            $("td.bg-success-subtle").each(function(){
                if ($.inArray($(this).attr("cell-id-type2"), cell_ids) === -1) {
                    if (typeof($(this).attr("cell-id-type2")) != 'undefined' && $(this).attr("cell-id-type2") != '') {
                        cell_ids.push($(this).attr("cell-id-type2"));
                    }
                }
            });
    
            $.each(cell_ids, function(index, item){
                let temp = [];

                $('[cell-id-type2="'+item+'"]').each(function(){
                    temp.push($(this).text());
                });

                temp.push(item);

                let socef = temp[2].replace("%", "");
                
                if (socef == '') {
                    error++;
                }
                
                temp[2] = parseFloat((socef / 100).toFixed(3));

                $('[row-id-type2="'+item+'"]').each(function(){
                    temp.push($(this).attr('db-id-type2'));
                    temp.push($(this).attr('default-state-type2'));
                });

                data.push(temp);
            });

            if (error == 0) {
                addSocketEfficiency(data, user_details);
            }
            else{
                showGenericAlertType1("error", "Error: Please review the entered data.");
            }
        }
    });

});

//-------------------------------------------------------------------------------------API--------------------------------------------------------------------------------
function preloadSocket(board, table_type_2){
    let data = JSON.parse(board);

    if (data.length > 0) {
        let rows = [];
        $.each(data, function(index, item){
            if (parseFloat(item['SOCKET_EFFICIENCY']) != 0.95) {
                rows.push([
                    item['BOARD'],
                    item['HW_TYPE'],
                    parseFloat((item['SOCKET_EFFICIENCY'] * 100).toFixed(2))+'%',
                    item['HASH'],
                    item['ID'],
                ]);
            }
        });
        table_type_2.clear();
        table_type_2.rows.add(rows);
        table_type_2.draw();
        $("body").trigger("click");
    }
}

function getBoardsSocket(board, table_type_2){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=SEARCH_BOARD_SOCKET&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: board},
        beforeSend: function(){
            $(".btn-message-type2").hide();
            $(".btn-loader-type2").fadeIn();
        },
        success: function(data){
            setTimeout(function(){
                let rows = [];
                let existing_cell_id = [];
                let se_boards = JSON.parse(data);
                console.log(se_boards);
                
                if (se_boards.length > 0) {
                    if (JSON.parse(existing_socket).length > 0) {
                        $.each(JSON.parse(existing_socket), function(index, item){
                            if ($.inArray(item['HASH'], existing_cell_id) === -1) {
                                existing_cell_id.push(item['HASH']);
                            }
                        });
                    }
                    
                    $.each(se_boards, function(index, item){
                        let socket_efficiency = 95;
                        let id = "UNCHANGED";
                        
                        if ($.inArray(item['SEID'], existing_cell_id) !== -1) {
                            $.each(JSON.parse(existing_socket), function(idx, itm){
                                if (item['SEID'] == itm['HASH']) {
                                    id = itm['ID'];
                                    socket_efficiency = parseFloat((itm['SOCKET_EFFICIENCY'] * 100).toFixed(2))+'%';
                                }
                            });
                        }
                        else{
                            socket_efficiency = item['SOCKET_EFFICIENCY']+'%';
                        }

                        rows.push([
                            item['BURNIN_BOARD'],
                            item['HW_TYPE'],
                            socket_efficiency,
                            item['SEID'],
                            id
                        ]);
                    });
        
                    table_type_2.clear();
                    table_type_2.rows.add(rows);
                    table_type_2.draw();
        
                    $("body").trigger("click");
                    $(".btn-loader-type2").fadeOut();
                }
                else{
                    $(".btn-loader-type2").hide();
                    $(".btn-no-result-type2").fadeIn();
                }
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function addSocketEfficiency(payload, user_details){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=ADD_SOCKET&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: payload, user_details: user_details},
        beforeSend: function(){
            showLoaderType1();
        },
        success: function(data){
            updateExistingData();
            setTimeout(function(){
                if (JSON.parse(data).hasOwnProperty('STATUS')) {
                    if (JSON.parse(data)['STATUS']) {
                        addChangeLog(JSON.parse(data)['CHANGE_LOG_DATA'], user_details, "non-ate update socket efficiency");
                        showGenericAlertType1("success", "Record Saved Successfully!");
                        if ($('#search-board-field-type2').val() != null && $('#search-board-field-type2').val() != "") {       
                            $('#search-board-field-type2').trigger($.Event('keypress', { which: 13 }));
                        }
                        else{
                            location.reload();
                        }
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

function updateExistingData(){
    $.ajax({
        type: 'get',
        url: 'http://MXHDAFOT01L.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=GET_SOCKET&OUTPUT_TYPE=BODS_JDA_ADI',
        success: function(data){
            existing_socket = data;
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

$(document).ready(function(){
    // -----------------------------------------------------------------------------------------------FILTERS-------------------------------------------------------------------------------
    preFillInputFiltersNonateType2();
    $(".btn-clear-nonate-type2").on("click", function(){
        $(".hwo-inputs-nonate-type2").val('').trigger('change');
        $(".hwo-checks-nonate-type2").prop("checked", false);
    });

    $(".btn-remove-nonate-type2").on("click", function(){
        let curr_url = window.location.href;
        let pos = curr_url.indexOf("&");
        window.location.href = (pos !== -1) ? curr_url.substring(0, pos) : curr_url;
    });

    $(".input-socket-efficiency").on('input', function () {
        let value = $(this).val();
        // Remove non-numeric characters except dot
        value = value.replace(/[^0-9.]/g, '');
        // Remove negative values
        if (parseFloat(value) < 0) {
            value = '';
        }
        $(this).val(value);
    });

    $(".btn-set-nonate-type2").on("click", function(){

        let user = user_details['emp_name'];
        let var_arr = {
            BOARD: "",
            HW_TYPE: "",
            SOCKET_EFFICIENCY: "",
            CREATED_BY: ""
        };
        
        let param_arr = [];
        $(".hwo-inputs-nonate-type2").each(function(){

            let input_id = $(this).attr("id");
            let input_val = $(this).val();
            
            if (typeof input_val === "object" && input_val.length > 0) {
                var_arr['BOARD']   += (input_id == "board-name-nonate-type2")   ? input_val.join(",") : "";
                var_arr['HW_TYPE']      += (input_id == "hw-type-nonate-type2")      ? input_val.join(",") : "";
            }
            else if (typeof input_val === "string" && input_val != "") {
                if (input_id == "socket-efficiency-min") {
                    var_arr['SOCKET_EFFICIENCY'] += input_val;
                }
                if (input_id == "socket-efficiency-max") {
                    var_arr['SOCKET_EFFICIENCY'] += ","+input_val;
                }
            }
        });

        $(".hwo-checks-nonate-type2").each(function(){
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
                if ($.inArray(key, ["SOCKET_EFFICIENCY"]) !== -1) {
                    item = (item.trim().startsWith(",")) ? "0"+item : item;
                }
                param_arr.push(key+"="+item.toUpperCase());
            }
        });
        
        if (param_arr.length > 0) { 
            let curr_url = window.location.href;
            let pos = curr_url.indexOf("&");

            const urlParams = new URLSearchParams(window.location.search);
            const hasTab = (urlParams.has("tab")) ? "" : "?tab=type-2"; 

            window.location.href = (pos !== -1) ? curr_url.substring(0, pos)+hasTab+"&"+param_arr.join("&") : curr_url+hasTab+"&"+param_arr.join("&");
        }
        else{
            showToast("Please enter at least one filter value.", "error");
        }
    });

    function preFillInputFiltersNonateType2(){

        const params = Object.fromEntries(new URLSearchParams(window.location.search));
        if (params.tab != "type-2") return;
        delete params.tab;
        
        $.each(params, function(index, item){
            if ($.inArray(index, ["SOCKET_EFFICIENCY"]) !== -1) {
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
                if ($.inArray(index, ["BOARD"]) !== -1) {
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