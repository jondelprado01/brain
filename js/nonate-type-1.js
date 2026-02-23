$(document).ready(function(){
    
    //SET CURRENT TAB IN THE URL
    $(".nonate-link").on("click", function(){
        let url = new URL($(location).attr('href'));
        let tab = $(this).attr("tab-name");
        url.searchParams.set("tab", tab);
        window.history.pushState('state', 'title', url.href);
    });

    //DATATABLES
    var table_type_1 = $(".table-non-type1").DataTable({
        scrollY: 'calc(100vh - 650px)',
        bSort: false,
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
                        $(td).addClass('turns-per-week');
                    }
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
    });

    $('.nonate-link').on('shown.bs.tab', function (e) {
        table_type_1.columns.adjust().draw();
    });

    // initialLoadBurnin(existing_burnin, table_type_1);

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
    $(document).delegate(".load-hours", "keydown input", function(event){

        if (event.key === "Enter") {
            event.preventDefault();
            return false;
        }

        let cell_id = $(this).attr("cell-id");
        let default_cell_val = parseFloat($(this).attr("default-val"));
        let cell_val = $(this).text();
        let bi_hours = parseFloat($('.bi-hours[cell-id="'+cell_id+'"]').text());
        let default_load_unload = parseFloat($('.load-unload-hours[cell-id="'+cell_id+'"]').text());
        let load_unload;
        let check_input = /[^a-zA-Z0-9.]/.test(cell_val);

        if (check_input) {
            showGenericAlertType1("error", "Invalid value! Special characters are not allowed");
            $(this).text(default_cell_val);
            return;
        }

        if (parseFloat(cell_val) > 168) {
            showGenericAlertType1("error", "Max Load Hours: 168 Hours");
            load_unload = bi_hours + 10;
            $(this).text(default_cell_val);
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
                showGenericAlertType1("error", "Load Hours must be greater than Zero.");
                load_unload = bi_hours + 10;
                $(this).text(default_cell_val);
                $('td[cell-id="'+cell_id+'"]').each(function(){
                    if ($(this).hasClass("load-hours")) {
                        $(this).addClass('bg-info-subtle');
                    }
                    $(this).removeClass('bg-success-subtle');
                });
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
        
        $('.load-unload-hours[cell-id="'+cell_id+'"]').text(load_unload);
        $('.turns-per-week[cell-id="'+cell_id+'"]').text(parseFloat(168 / load_unload).toFixed(2));
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
                console.log(bi_boards);
                
                if (bi_boards.length > 0) {
                    if (JSON.parse(existing_burnin).length > 0) {
                        $.each(JSON.parse(existing_burnin), function(index, item){
                            if ($.inArray(item['HASH'], existing_cell_id) === -1) {
                                existing_cell_id.push(item['HASH']);
                            }
                        });
                    }
        
                    $.each(bi_boards, function(index, item){
        
                        let load_hours = 10;
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
                            id
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
                            let hash  = item[6];
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

                            item.splice(7, 1);
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

// function initialLoadBurnin(existing_burnin, table_type_1){
//     let rows = [];
//     if (JSON.parse(existing_burnin).length > 0) {
//         $.each(JSON.parse(existing_burnin), function(index, item){
//             rows.push([
//                 item['MFG_PART_NUM'],
//                 item['BOARD'],
//                 item['BI_HOURS'],
//                 item['LOAD_HOURS'],
//                 item['LOAD_UNLOAD'],
//                 item['HASH'],
//                 item['ID']
//             ]);
//         });

//         table_type_1.clear();
//         table_type_1.rows.add(rows);
//         table_type_1.draw();
//     }
// }

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