// let existing_oee = JSON.parse($("#existing-data").val());
        // removed_columns = [];
        // oee_main.columns([0,1,2,3,4,5]).visible(true);
        // $(".common-data, .ignore-data").remove();
        
        // if (existing_oee.length > 0) {
        //     $.each(existing_oee, function(index, item){
        //         if (item[1] != "main") {
        //             let retcol = oeeColumnIndexChecker(item[2]);
        //             let process_type = item[1];
        //             let colindex = retcol.column_index;
        //             OEEModify(item[2], process_type, colindex);
        //         }
        //     });
        // }
        // else{
        //     $(".common-empty, .ignore-empty").show();
        //     resetOEETable(JSON.parse(oee_default_data));
        // }


//OEE VALUE ONCHANGE EVENT (UPDATE OEE VALUE & HIGHLIGHT)
    // var prev_val;
    // var new_val;
    // oee_main.on('key-focus', function (e, datatable, cell) {
    //     var rowData = datatable.row(cell.index().row).data();
    //     prev_val = rowData[6];
    // })
    // .on('key-blur', function (e, datatable, cell) {
    //     cell.data($(cell.node()).html()); 
    //     var rowData = datatable.row(cell.index().row).data();
    //     new_val = rowData[6];
        
    //     if ($(cell.node()).hasClass('oee-input')) {
    //         if (prev_val != new_val) {
    //             $(cell.node()).addClass("oee-highlight");
    //         }
    //     }
    // });

    //HANDLES OEE CORE PROCESS
    // let removed_columns = [];
    // function OEEModify(type, process_type, colindex) {
    //     let default_data = JSON.parse($("#default-data").val());
    //     let column_index;
    //     let display_data;
    //     let filtered = [];
    //     let range = [];
    //     let altered_data = [];
    //     let final_data = [];

    //     //RETRIEVE COLUMN INDEX
    //     let retcol = oeeColumnIndexChecker(type);
    //     column_index = retcol.column_index;
    //     display_data = retcol.display_data;        
    //     removed_columns.push(column_index);

    //     $.each(default_data, function(index, item){
    //         let temp_var = [];
    //         let key;
    //         $.each(item, function(idx, itm){
    //             if ($.inArray(idx, removed_columns) === -1) {
    //                 temp_var.push(itm);
    //             }
    //         });
    //         switch (removed_columns.length) {
    //             case 1:
    //                 key = temp_var[0]+'|'+temp_var[1]+'|'+temp_var[2]+'|'+temp_var[3]+'|'+temp_var[4];
    //                 range[key] = [];
    //                 break;
    //             case 2:
    //                 key = temp_var[0]+'|'+temp_var[1]+'|'+temp_var[2]+'|'+temp_var[3];
    //                 range[key] = [];
    //                 break;
    //             case 3:
    //                 key = temp_var[0]+'|'+temp_var[1]+'|'+temp_var[2];
    //                 range[key] = [];
    //                 break;
    //             case 4:
    //                 key = temp_var[0]+'|'+temp_var[1];
    //                 range[key] = [];
    //                 break;

    //             case 5:
    //                 key = temp_var[0];
    //                 range[key] = [];           
    //                 break;
    //         }

    //         filtered.push(temp_var);
    //     });

    //     if (removed_columns.length <= 5) {
    //         $.each(filtered, function(index, item){
    //             let value;
    //             let target_key;
    //             switch (removed_columns.length) {
    //                 case 1:
    //                     value = 5;
    //                     target_key = item[0]+'|'+item[1]+'|'+item[2]+'|'+item[3]+'|'+item[4];
    //                     break;
    //                 case 2:
    //                     value = 4;
    //                     target_key = item[0]+'|'+item[1]+'|'+item[2]+'|'+item[3];
    //                     break;
    //                 case 3:
    //                     value = 3;
    //                     target_key = item[0]+'|'+item[1]+'|'+item[2];
    //                     break;
    //                 case 4:
    //                     value = 2;
    //                     target_key = item[0]+'|'+item[1];
    //                     break;
    //                 case 5:
    //                     value = 1;
    //                     target_key = item[0];
    //                     break;
    //             }
    //             range[target_key].push(item[value]);
    //         });

    //         for (var key in range) {
    //             if (range.hasOwnProperty(key)) {
    //                 let range_arr = [];
    //                 $.each(range[key], function(index, item){
    //                     range_arr.push(item);
    //                 });
                    
    //                 let min_oee = Math.min(...range_arr);
    //                 let max_oee = Math.max(...range_arr);
    //                 let oee = (min_oee != max_oee) ? min_oee +' - '+ max_oee : min_oee.toFixed(3);
    //                 let split = key.split("|");

    //                 if (split.length >= 1) {
    //                     let altered_data_col;
    //                     switch (split.length) {
    //                         case 1:
    //                             altered_data_col = [split[0], oee, 'Y'];
    //                             break;
    //                         case 2:
    //                             altered_data_col = [split[0], split[1], oee, 'Y'];
    //                             break;
    //                         case 3:
    //                             altered_data_col = [split[0], split[1], split[2], oee, 'Y'];
    //                             break;
    //                         case 4:
    //                             altered_data_col = [split[0], split[1], split[2], split[3], oee, 'Y'];
    //                             break;
    //                         case 5:
    //                             altered_data_col = [split[0], split[1], split[2], split[3], split[4], oee, 'Y'];
    //                             break;
    //                     }
    //                     altered_data.push(altered_data_col);
    //                 }
    //                 else{
    //                     altered_data.push([split[0], oee, 'Y']);
    //                 }
    //             }
    //         }
    //     }
    //     else{
    //         let temp_arry = [];
    //         $.each(filtered, function(index, item){
    //             if ($.inArray(item[0], temp_arry) === -1) {
    //                 temp_arry.push(item[0]);
    //                 altered_data.push(item);
    //             }
    //         });
    //     }

    //     //ASSIGN VALUES TO ALL COLUMNS
    //     $.each(altered_data, function(index, item){
    //         let col_arr = [0,1,2,3,4,5,6,7];
    //         let col = {};
    //         $.each(removed_columns, function(idx, itm){
    //             switch (itm) {
    //                 case 0:
    //                     col[itm] = null;
    //                     break;
    //                 case 1:
    //                     col[itm] = null;
    //                     break;
    //                 case 2:
    //                     col[itm] = null;
    //                     break;
    //                 case 3:
    //                     col[itm] = null;
    //                     break;
    //                 case 4:
    //                     col[itm] = null;
    //                     break;
    //                 case 5:
    //                     col[itm] = null;
    //                     break;
    //             }

    //             col_arr = $.grep(col_arr, function(value) {
    //                 return value != itm;
    //             });
    //         });

    //         $.each(col_arr, function(idx, itm){
    //             col[itm] = item[idx];
    //         });

    //         final_data.push([col[0], col[1], col[2], col[3], col[4], col[5], col[6], col[7]]);
    //     });

    //     oee_main.columns(removed_columns).visible(false);
    //     resetOEETable(final_data);
    //     oee_hidden_col = removed_columns;

    //     let colname = $("#"+display_data).attr("column-name");
    //     let colval = JSON.parse($("#"+display_data).val());
    //     let list = '';
    //     if (process_type == 'common') {
    //         $.each(colval, function(index, item){
    //             list += '<li>'+item+'</li>';
    //         });   
    //     }
    //     $("."+process_type+"-empty").hide();
    //     if ($("#"+process_type+'-'+type).length == 0) {
    //         $("."+process_type+"-list").append(
    //             '<div style="font-size: .82em!important;" id="'+process_type+'-'+type+'" class="alert alert-secondary alert-dismissible fade show '+process_type+'-data" role="alert">'+
    //                 '<strong>'+colname+'</strong>'+
    //                 '<input type="hidden" class="input-'+process_type+'" name="input-'+process_type+'[]" value-type="'+type+'" value="'+colval+'">'+
    //                 '<button data-type="'+type+'" data-text="'+process_type+'" data-index="'+colindex+'" type="button" class="btn-close btn-remove-modifier" data-bs-dismiss="alert" aria-label="Close"></button>'+
    //                 '<ul class="m-0">'+list+'</ul>'+
    //             '</div>'
    //         );
    //     }
    // }

    // //RESET COMMON/IGNORE DATA (RETURN DATA TO MAIN)- TESTER/HANDLER OEE
    
    // $(document).delegate(".btn-remove-modifier", "click", function(){
    //     let process_type = $(this).attr("data-text");
    //     let column_index = parseInt($(this).attr("data-index"));
    //     removed_columns = [];
    //     oee_hidden_col = [];
        
    //     if ($(".btn-remove-modifier").length > 1) {
    //         $(".btn-remove-modifier").each(function(){
    //             if ($(this).attr("data-index") == column_index) {
    //                 oee_main.column(column_index).visible(true);
    //             }
    //             if ($(this).attr("data-index") != column_index) {
    //                 OEEModify($(this).attr("data-type"), $(this).attr("data-text"), $(this).attr("data-index"));
    //             }
    //         });
    //     }
    //     else{
    //         oee_main.column(column_index).visible(true);
    //         $(".common-empty, .ignore-empty").show();
    //         resetOEETable(JSON.parse(oee_default_data));
    //     }
        
    //     $(".dropdown-menu").removeClass('show');
    // });

    // //RESET ALL BUTTON - TESTER/HANDLER OEE
    // $(".btn-reset").on("click", function(){
    //     if ($(".common-data").length > 0 || $(".ignore-data").length > 0) {
    //         $(".common-empty, .ignore-empty").show();
    //         $(".common-data, .ignore-data").remove();
            
    //         oee_main.columns(oee_hidden_col).visible(true);
    //         resetOEETable(JSON.parse(oee_default_data));
    //         oee_hidden_col = [];
    //         removed_columns = [];
    //     }
    // });

    // //RESET OEE TABLE - NEW VALUE
    // function resetOEETable(table_data){
    //     //CHECK IF THERE'S EXISTING OEE OVERRIDE (GET ONLY THE MAIN COMBINATION);
    //     let existing_main = JSON.parse($("#existing-main").val());
    //     let main_data = (table_data.length != existing_main.length) ? table_data : existing_main;
        
    //     oee_main.clear();
    //     oee_main.rows.add(main_data);
    //     oee_main.draw();
    // }

    // //SAVE OEE OVERRIDE COMBINATION
    // $(".btn-save-oee").on("click", function(){
    //     //CHECK FOR NON NUMERICAL VALUES (RANGE VALUE NOT ALLOWED) FOR OEE
    //     let counter = 0;
    //     let common_div = $(".common-data").length;
    //     let ignore_div = $(".ignore-data").length;

    //     $.each(oee_main.rows().data(), function(index, item){
    //         if (!$.isNumeric(item[6])){
    //             counter++;
    //         }
    //     });
        
    //     if (common_div > 0 || ignore_div > 0) {
    //         if (counter > 0){
    //             showGenericAlert("error", "Invalid OEE Value");
    //         }
    //         else{
    //             let oee_main_data = [];
    //             let oee_common = [];
    //             let oee_ignore = [];
    //             let combination = [];
    //             let oee_partnum = JSON.parse($("#no-partnum").val());

    //             $.each(oee_main.rows().data(), function(index, item){
    //                 oee_main_data.push(item);
    //             });

    //             $("[name='input-common[]']").each(function(){
    //                 oee_common.push({
    //                     type: $(this).attr("value-type"),
    //                     value: $(this).val()
    //                 });
    //             });

    //             $("[name='input-ignore[]']").each(function(){
    //                 oee_ignore.push({
    //                     type: $(this).attr("value-type"),
    //                     value: $(this).val()
    //                 });
    //             });

    //             combination.push({
    //                 main: oee_main_data,
    //                 common: oee_common,
    //                 ignore: oee_ignore,
    //                 partnum: oee_partnum
    //             });
                
    //             setOEEOverride(combination);
    //         }
    //     }
    //     else{showGenericAlert("error", "Please Set an OEE Combination");}
        
    // });


    // function setOEEOverride(combination){
//     $.ajax({
//         type: 'post',
//         url: 'http://mxhtafot01l.maxim-ic.com/TEST/OEE_OVERRIDE.PHP?INPUT_TYPE=COMBINATION&OUTPUT_TYPE=BODS_JDA_ADI',
//         data: {payload: combination, user_details: user_details},
//         beforeSend: function(){
//             showLoader('Processing... \n Please Wait!');
//         },
//         success: function(data){
//             setTimeout(function(){
//                 if (data) {
//                     showSuccess("Record Saved Succesfully!");
//                     location.reload();
//                 }
//             }, 1500);
//         },
//         error: function(xhr, status, error) {
//             console.log(xhr);
//         }
//     });
// }