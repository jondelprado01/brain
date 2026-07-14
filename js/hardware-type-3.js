$(document).ready(function(){

    //initialize multiple select2
    $(".select2-type3").each(function(){
        let elem_id = $(this).attr("id");
        let has_tags = (elem_id.includes("hw-name")) ? true : false;

        $("#"+elem_id).select2({
            tags: has_tags,
            theme: 'bootstrap-5',
            allowClear: true
        });
    });

    var file_name_type_3 = "";

    //exclude columns in datatable export
    function exportButtonType3(type) {
        let cols = [];
        let title_object = {};
        for (var i = 1; i <= 5; i++) {
            cols.push(i);
        }

        if (type == 'print') {
            title_object = {
                customize: function (win) {
                    win.document.title = 'HW Override [Type 3 - Plan Non-Boards]';
                }
            }
        }
        else{
            title_object = {title: 'BRAIN - HW Override [Type 3 - Plan Non-Boards]'};
            if (type == "pdf") {
                title_object.customize = function(doc){
                    doc.content[1].table.widths =
                    Array(doc.content[1].table.body[0].length + 1).join('*').split('');
                }
            }
        }

        let config_object = {
            extend: type,
            filename: function () {
                return file_name_type_3;
            },
            className: 'd-none buttons-' + type +'-type-3',
            exportOptions: {
                columns: cols
            },
            ...title_object,
        }

        return config_object;
    }

    var table_type_3 = $(".table-test-type3").DataTable({
        // bPaginate: false,
        scrollY: 'calc(100vh - 550px)',
        bSort: false,
        responsive: true,
        layout: {
            topStart: "pageLength",
            top2Start: {
                buttons: [exportButtonType3('copy'), exportButtonType3('csv'), exportButtonType3('excel'), exportButtonType3('pdf'), exportButtonType3('print')],
            },
            bottomStart: "info"
        }
    });

    // -----------------------------------------------------------------------------------EXPORTS------------------------------------------------------------------------------
    $(".btn-export-process-type3").on("click", function(){
        let export_type = $(this).attr("export-type");
        let tab_type = $(this).attr("tab-type");

        if (table_type_3.rows().count() == 0) {
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
            table_type_3.button(".buttons-"+export_type+"-"+tab_type).trigger();
        }
    });

    $(".btn-export").on("click", function(){

        let export_type = $("#export-type").val();
        let filename = $("#export-filename").val();
        let tab_type = $(this).attr("tab-type");

        if (tab_type == "type-3") {
            if (filename != "") {
                file_name_type_3 = "BRAIN_"+filename;
                table_type_3.button(".buttons-"+export_type+"-"+tab_type).trigger();
            }
            else{
                $(".export-error").fadeIn();
            }
        }
    });

    var table_nonboard = $(".table-nonboard-type3").DataTable({
        scrollY: 'calc(100vh - 650px)',
        bSort: false,
        bLengthChange: false,
        responsive: true,
        columnDefs: [
            {width: '80px', targets: 5},
            {width: '120px', targets: 4},
            {width: '120px', targets: [0,1,2]}
        ],
        createdRow: function (row, data, index) {
            let existing_count = 0;
            let row_class;
            let existing_data = JSON.parse(existing_nonboard);
            if (existing_data.length > 0) {
                $.each(existing_data, function(idx, itm){
                    if(data[0] == itm['SITE_NUM'] &&
                       data[1] == itm['RES_AREA'] &&
                       data[2] == itm['HW_TYPE_HMS'] &&
                    //    data[3] == itm['HW_TYPE_SUS'] &&
                       data[4] == itm['HW_NAME']){
                        existing_count++;
                    }
                });
            }
            
            row_class = (existing_count > 0) ? "row-disabled" : "selectable-row";

            $('td', row).addClass(row_class);
        }
    });

    $('.hw-link').on('shown.bs.tab', function (e) {
        table_type_3.columns.adjust().draw();
        table_nonboard.columns.adjust().draw();
    });

    //INCLUDE HW NON-BOARDS TO ALL PARTS
    $('.table-nonboard-type3 tbody').on('click', 'tr', function () {
        $(this).toggleClass('selected');
    });

    //CHECK HW NAME STRING LENGTH - AT LEAST 4 CHARACTERS
    $(".input-hw-name-type3").on("input", function(){
        let is_disabled = true;
        if ($(this).val().length >= 4) {
            is_disabled = false;
        }
        $(".btn-search-type3").prop("disabled", is_disabled);
    });

    //SEARCH NON-BOARDS BY HW_TYPE OR HW_NAME - TYPE 3
    $(".btn-search-type3").on("click", function(){
        let limit_val = $(".input-limit-type3").val();
        let hw_name_val = $(".input-hw-name-type3").val();
        if (hw_name_val == '') { 
            showGenericAlertType3('error', 'Provide at least one: \n HW_NAME');
        }
        else{
            searchDataType3(hw_name_val, limit_val, table_nonboard);
        }
    });

    $(".input-hw-name-type3").on("keypress", function(e){
        if(e.which == 13){
            let limit_val = $(".input-limit-type3").val();
            let hw_name_val = $(this).val();
            if (hw_name_val == '') {
                showGenericAlertType3("error", "Search Field Empty");
                return;
            }
            else if(hw_name_val.length < 5){
                showGenericAlertType3("error", "Must be 5-10 characters long.");
                return;
            }
            else{
                searchDataType3(hw_name_val, limit_val, table_nonboard);
            }
        }
    });

    //SAVE NON-BOARDS - INCLUDE TO ALL PARTS
    $(".btn-save-type3").on("click", function(){
        if (table_nonboard.rows('.selected').data().length > 0) {
            let payload = [];
            $.each(table_nonboard.rows('.selected').data(), function(index, item){
                payload.push([
                    item[0],
                    item[1],
                    item[2],
                    item[3],
                    item[4],
                    item[5]
                ]);
            });
            crudProcessType3("ADD_NON_BOARD", payload);
        }
        else{
            showGenericAlertType3('error', 'Select at least one Non-Board!');
        }
    });

    //VIEW ALL NON-BOARDS - MODAL
    $(".btn-view-nb").on("click", function(){
        let data = JSON.parse($(this).attr("data"));
        preFillElementsType3(data);
    });

    //DELETE ALL NON-BOARDS - ALERT
    $(".btn-delete-type3-all").on("click", function(){
        let data = [];
        let title = 'Delete Non-Boards';
        let msg = 'Are you sure you want to delete: <br/>';
        let items = '';
        $(".type3-check:checked").each(function(){
            let parsed = JSON.parse($(this).val());
            data.push(parsed);
            items += '<b>'+parsed['HW_NAME']+' <br/> '+parsed['HW_TYPE_HMS']+'</b><hr/>';
        });
        showDeleteAlertType3(title, msg+items, data, 'DELETE_NON_BOARD');
    });

    //DELETE ALL NON-BOARDS - SELECTION
    $(".type3-check-all").on("click", function(){
        let is_checked = $(this).is(":checked");
        if (is_checked) {
            $(".btn-delete-type3-container").removeClass("d-none");
        }
        else{
            $(".btn-delete-type3-container").addClass("d-none");
        }
        $(".type3-check").each(function(){
            $(this).prop("checked", is_checked);
        });
    });

    //DELETE MULTIPLE NON-BOARDS - SELECTION
    $(document).delegate(".type3-check", "click", function(){
        let is_checked = $(this).is(":checked");
        if (is_checked) {
            $(".btn-delete-type3-container").removeClass("d-none");
        }
        else{
            if ($(".type3-check:checked").length == 0) {
                $(".btn-delete-type3-container").addClass("d-none");
                $(".type3-check-all").prop("checked", false);
            }
        }
    });

});


//-------------------------------------------------------------------------------------API-----------------------------------------------------------------------------
function crudProcessType3(process, payload){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE='+process+'&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: payload, user_details: user_details},
        beforeSend: function(){
            showLoaderType2();
        },
        success: function(data){
            let status = JSON.parse(data)['STATUS'];
            let return_data = [];
            let crud_type;
            let alert_msg;

            if (process == "ADD_NON_BOARD") {
                return_data = JSON.parse(data)['CHANGE_LOG_DATA'];
                alert_msg = 'Saved';
                crud_type = 'add';
            }
            else{
                $.each(payload, function(index, item){
                    return_data.push([
                        item['SITE_NUM'],
                        item['RES_AREA'],
                        item['HW_TYPE_HMS'],
                        item['HW_TYPE_SUS'],
                        item['HW_NAME'],
                        item['CAPACITY'],
                        item['ID']
                    ]);
                });
                alert_msg = 'Deleted';
                crud_type = 'delete';
            }

            setTimeout(function(){
                if (status) {
                    showGenericAlertType3("success", "Record "+alert_msg+" Successfully!");
                    addChangeLog(return_data, user_details, "hw-override "+crud_type+" plan non-board");
                    location.reload();
                }
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function searchDataType3(payload, limit, table_nonboard){
    $(".notif-container-type3").hide();
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=SEARCH_NON_BOARD&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: payload, limit: limit},
        beforeSend: function(){
            $(".notif-retrieve-type3").fadeIn();
        },
        success: function(data){
            setTimeout(function(){
                $(".notif-retrieve-type3").hide();
                let res = JSON.parse(data);
                if (res.length > 0) {
                    let rows = [];

                    $.each(res, function(index, item){
                        rows.push([
                            item['SITE_NUM'],
                            item['RES_AREA'],
                            item['HW_TYPE_HMS'],
                            item['HW_TYPE_SUS'],
                            item['HW_NM'],
                            item['AVAIL_QTY']
                        ]);
                    });
                    
                    table_nonboard.clear();
                    table_nonboard.rows.add(rows);
                    table_nonboard.draw();
                }
                else{
                    $(".notif-no-result-type3").fadeIn();
                }
            }, 1500)
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

//-------------------------------------------------------------------------------------DYNAMIC DATA RENDERING-----------------------------------------------------------------------------
function preFillElementsType3(data){
    $(".view-name-type3").text(data['HW_NAME']);
    $(".view-site-type3").text(data['SITE_NUM']);
    $(".view-area-type3").text(data['RES_AREA']);
    $(".view-cap-type3").text(data['CAPACITY']);
    $(".view-hms-type3").text(data['HW_TYPE_HMS']);
    $(".view-sus-type3").text(data['HW_TYPE_SUS']);
    $(".view-at-type3").text(dateFormatterType3(data['CREATED_AT']));
    $(".view-by-type3").text(data['CREATED_BY']);
    $("#modal-view-data-type3").modal("show");
}

function dateFormatterType3(date){
    return $.datepicker.formatDate('M dd, yy', new Date(date));
}

// -----------------------------------------------------------------------------------FILTERS------------------------------------------------------------------------------
$(document).ready(function(){

    //prefill values first
    preFillInputFiltersType3();

    $(".btn-clear-type3").on("click", function(){
        $(".hwo-inputs-type3").val('').trigger('change');
        $(".hwo-checks-type3").prop("checked", false);
    });

    $(".btn-remove-type3").on("click", function(){
        let curr_url = window.location.href;
        let pos = curr_url.indexOf("&");
        window.location.href = (pos !== -1) ? curr_url.substring(0, pos) : curr_url;
    });

    $('.input-hms-count').on('input', function () {
        let value = $(this).val();
        // Remove non-numeric characters except dot
        value = value.replace(/[^0-9.]/g, '');
        // Remove negative values
        if (parseFloat(value) < 0) {
            value = '';
        }
        $(this).val(value);
    });

    $(".btn-set-type3").on("click", function(){

        let user = user_details['emp_name'];
        let var_arr = {
            HW_NAME: "",
            SITE_NUM: "",
            RES_AREA: "",
            HMS_COUNT: "",
            HW_TYPE: "",
            CREATED_BY: ""
        };
        
        let param_arr = [];
        $(".hwo-inputs-type3").each(function(){

            let input_id = $(this).attr("id");
            let input_val = $(this).val();
            
            if (typeof input_val === "object" && input_val.length > 0) {
                var_arr['HW_NAME'] += (input_id == "hw-name-type3") ? input_val.join(",") : "";
                var_arr['SITE_NUM'] += (input_id == "site-num-type3") ? input_val.join(",") : "";
                var_arr['RES_AREA'] += (input_id == "res-area-type3") ? input_val.join(",") : "";
                var_arr['HW_TYPE'] += (input_id == "hw-type-type3") ? input_val.join(",") : "";
            }
            else if (typeof input_val === "string" && input_val != "") {
                if (input_id == "hms-count-min") {
                    var_arr['HMS_COUNT'] += input_val;
                }
                if (input_id == "hms-count-max") {
                    var_arr['HMS_COUNT'] += ","+input_val;
                }
            }
            // console.log(input_val);
        });

        $(".hwo-checks-type3").each(function(){
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
                if ($.inArray(key, ["HMS_COUNT"]) !== -1) {
                    item = (item.trim().startsWith(",")) ? "0"+item : item;
                }
                param_arr.push(key+"="+item.toUpperCase());
            }
        });

        if (param_arr.length > 0) { 
            let curr_url = window.location.href;
            let pos = curr_url.indexOf("&");
            
            const urlParams = new URLSearchParams(window.location.search);
            const hasTab = (urlParams.has("tab")) ? "" : "?tab=type-3";

            window.location.href = (pos !== -1) ? curr_url.substring(0, pos)+hasTab+"&"+param_arr.join("&") : curr_url+hasTab+"&"+param_arr.join("&");
        }
        else{
            showToast("Please enter at least one filter value.", "error");
        }
    });
});

function preFillInputFiltersType3(){
    
    const params = Object.fromEntries(new URLSearchParams(window.location.search));
    if (params.tab != "type-3") return;
    delete params.tab;
    
    $.each(params, function(index, item){
        if ($.inArray(index, ["HMS_COUNT"]) !== -1) {
            let range_val = item.split(",");
            let num_field_int = (range_val.length > 1) ? ["MIN", "MAX"] : ["MIN"];
            let num_field_date = (range_val.length > 1) ? ["FROM", "TO"] : ["FROM"];;
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
            if (index == "HW_NAME") {
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

function showGenericAlertType3(icon, title){
    Swal.fire({
        title: title,
        icon: icon
    });
}

function showDeleteAlertType3(title, msg, data, crud){
        Swal.fire({
            title: title,
            html: msg,
            icon: "warning",
            showCancelButton: true,
            reverseButtons: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Proceed"
        }).then((result) => {
            if (result.isConfirmed) {
                crudProcessType3(crud, data);
            }
        });
    }