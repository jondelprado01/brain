$(document).ready(function(){

    //SET CURRENT TAB IN THE URL
    $(".nonate-link").on("click", function(){
        let url = new URL($(location).attr('href'));
        let tab = $(this).attr("tab-name");
        url.searchParams.set("tab", tab);
        window.history.pushState('state', 'title', url.href);
    });

    //DATATABLES
     var table_type_2 = $(".table-non-type2").DataTable({
        scrollY: 'calc(100vh - 650px)',
        bSort: false,
        responsive: true,
        autoWidth: false,
        columnDefs: [
            {targets: 1, width: "15%"},
            {
                targets: "_all",
                createdCell: function(td, cellData, rowData, row, col){
                    if (col == 1) {
                        $(td).attr("contenteditable", true);
                        $(td).attr("default-se", rowData[1]);
                        $(td).addClass("socket-efficiency bg-info-subtle dt-left");
                    }
                    $(td).attr("cell-id-type2", rowData[2]);
                }
            },
        ]
    });

    $('.nonate-link').on('shown.bs.tab', function (e) {
        table_type_2.columns.adjust().draw();
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
                let socef = temp[1].replace("%", "");
                
                if (socef == '') {
                    error++;
                }
                
                temp[1] = parseFloat((socef / 100).toFixed(3));
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
                                id = itm['ID'];
                                if (item['SEID'] == itm['HASH']) {
                                    socket_efficiency = parseFloat((itm['SOCKET_EFFICIENCY'] * 100).toFixed(2))+'%';
                                }
                            });
                        }
                        else{
                            socket_efficiency = item['SOCKET_EFFICIENCY']+'%';
                        }

                        rows.push([
                            item['BURNIN_BOARD'],
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
                if (data) {
                    showGenericAlertType1("success", "Record Saved Successfully!");
                    $('#search-board-field-type2').trigger($.Event('keypress', { which: 13 }));
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