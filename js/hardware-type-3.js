$(document).ready(function(){

    var table_type_3 = $(".table-test-type3").DataTable({
        // bPaginate: false,
        scrollY: 'calc(100vh - 650px)',
        bSort: false,
        responsive: true,
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
                       data[3] == itm['HW_TYPE_SUS'] &&
                       data[4] == itm['HW_NAME'] &&
                       data[5] == itm['CAPACITY']){
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
    $(".type3-check").on("click", function(){
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
            setTimeout(function(){
                if (data) {
                    let alert_msg;
                    if (process.indexOf('DELETE') != -1) {
                        alert_msg = 'Deleted';
                    }
                    else{
                        alert_msg = 'Saved';
                    }
                    showGenericAlertType2("success", "Record "+alert_msg+" Successfully!");
                    addChangeLog(payload, user_details, "hw-override plan non-board");
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
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=SEARCH_NON_BOARD&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: payload, limit: limit},
        beforeSend: function(){

        },
        success: function(data){
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