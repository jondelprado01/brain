$(document).ready(function(){
    $("#modal-view-data small").addClass("text-muted small");

    var global_existing_list_t3 = [];
    var global_final_list_t3 = [];
    var field_arr_t3 = ["#non-type3-hw-name", "#non-type3-hw-type", "#non-type3-site-num", "#non-type3-res-area", "#non-type3-eff-start option:selected", 
                     "#non-type3-eff-end option:selected", "#non-type3-override-cap", "#non-type3-hms-count"];
    
    //add new override - selection/configuration stage
    $(".non-type3-add").on("click", async function(){
        let has_empty_field = 0;
        let has_invalid_val = 0;
        let raw_es = parseFloat($("#non-type3-eff-start option:selected").attr("raw-value"));
        let raw_ee = parseFloat($("#non-type3-eff-end option:selected").attr("raw-value"));
        $('.input-container-non-type3-v2 [required]').each(function() {
            if ($(this).val() == "" || $(this).val() == null || $(this).val() == undefined) {
                has_empty_field++;
            }
        });
        if (has_empty_field > 0) {
            showToast("Please fill in all required fields.", "error"); return;
        }
        else {
            let invalid_fields_txt = "";
            if (raw_es > raw_ee) {
                has_invalid_val++;
                invalid_fields_txt += "\nEFF_START date cannot exceed EFF_END date";
            }
            let is_valid_num = /^-?\d*\.?\d*$/.test($(field_arr_t3[6]).val());
            if (!is_valid_num) {
                $(field_arr_t3[6]).val('');
                has_invalid_val++;
                invalid_fields_txt += "\nOVERRIDE_CAP must be a valid number.";
            }
            else{
                if(parseFloat($(field_arr_t3[6]).val()) < 0){
                    has_invalid_val++;
                    invalid_fields_txt += "\nOVERRIDE_CAP cannot be negative.";
                }
            }
            if(has_invalid_val > 0){
                showToast("Invalid Values.\n"+invalid_fields_txt+"", "error"); return;
            }
        }
        let is_valid = validateNewHW(global_final_list_t3, field_arr_t3, JSON.parse(existing_capacity));
        if (is_valid) {
            renderMainListType3(global_final_list_t3);
        }
        else{
            showToast("Data insertion failed due to the following reasons: \n\nOverlapping weeks are not allowed. \nRecord already exists or has already been added.", "error"); return;
        }
    });

    //check if hw override cap exists for genpool hw and update hms plannable count accordingly - eff_start/end dropdown onchange
    $(".non-type3-week-field").on("change", function(){
        let curr_raw_es = parseInt("20"+$("#non-type3-eff-start option:selected").val().replace("_W", ""));
        if ($("#non-type3-eff-end option:selected").attr('week-type') !== undefined) {
            let input_year = "20"+curr_raw_es.toString().slice(2, 4);
            let input_week = curr_raw_es.toString().slice(-2);
            generateOpenWeekType3(input_year, input_week);
        }
    });

    //remove mapping from the main display (new mappings that are yet to be saved)
    $(document).delegate(".btn-remove-override", "click", function(){
        if ($(this).attr("remove-type") == "card") {
            let card_id = $(this).attr("card-ht-id");
            $('#ht-card-container div[id="'+card_id+'"]').remove();
            delete global_final_list_t3[card_id];
        }
        else{
            let row_id = $(this).attr("row-hw-id");
            let row_data = JSON.parse($(this).attr("row-hw-data"));
            
            $('tr[id="'+row_id+'"]').remove();
            global_final_list_t3[row_data[1]] = global_final_list_t3[row_data[1]].filter(row => row[10] !== row_data[10]);
            
            if (global_final_list_t3[row_data[1]].length == 0 || $("#"+row_data[1]+" .non-t3-render-table tbody").children().length == 0) {
                $('#ht-card-container div[id="'+row_data[1]+'"]').remove();
                delete global_final_list_t3[row_data[1]];
            }
            renderMainListType3(global_final_list_t3);
        }
    });

    //close modal - reset all global variables and dom
    $(".btn-close-non-t3-modal").on("click", function(){
        $(this).hide();
        $(".btn-prompt-type3").fadeIn();
    });
    $(".btn-link").on("click", function(){
        $(".btn-prompt-type3").hide();
        $(".btn-close-non-t3-modal").show();
        if ($(this).attr("btn-type") == "btn-proceed-yes-type3") {    
            $("#non-type3-eff-start").empty();
            $("#non-type3-eff-end").empty();
            $("#non-type3-current-val").val("");
            $(".input-search-type3").val('');
            $(".input-select-type3").empty().prop("disabled", true);
            $(".btn-add-hw").prop("disabled", true);
            $("#ht-card-container").empty();
            global_final_list_t3 = [];
            $.each(field_arr_t3, function(index, item){
                item = (item.includes(":selected")) ? item.split(':')[0].trim() : item;
                if (!item.includes(":checked")) {
                    if ($(item).is('span')) {
                        $(item).text("0");
                    }
                    else{
                        $(item).val("");
                    }
                }
            });
        }
    });

    //render existing mapping inside popover (initialization of bootstrap's popover)
    $("#modal-add-non-type3").on("mouseenter", ".existing-override-btn", function(event){
        var btn_elem = $(event.target).closest('.existing-override-btn');
        var htid = btn_elem.attr('ht-id');
        var content = "";
        
        let ext_override = getExistingOverride(htid, global_existing_list_t3)[htid];
        
        if (ext_override.length == 0) {
            content = "No Existing Override found for this HW Type.";
        }
        else{
            content = renderExistingListType3(htid, ext_override);
        }
        if (!btn_elem.data('bs.popover')) {
            btn_elem.popover({
                trigger: 'hover',
                html: true,
                sanitize: false,
                container: 'body',
                customClass: 'custom-wide-popover',
                content: function() {
                    return '<div>'+content+'</div>';
                }
            }).popover('show');
        }
    });

    //saving of new hw mapping - v2 (simplified, payload is already validated)
    $(".btn-save-non-t3").on("click", function(){
        let payload = [];
        if (Object.keys(global_final_list_t3).length == 0) {
            showToast("No records have been added. Please include at least one entry before saving.", "error");
            return;
        }
        $.each(Object.keys(global_final_list_t3), function(gfl_idx, gfl_itm){
            let ht_key = gfl_itm;
            $.each(global_final_list_t3[ht_key], function(hwl_idx, hwl_itm){
                payload.push([
                    hwl_itm[0], //hw_name
                    hwl_itm[4], //eff_start
                    hwl_itm[5], //eff_end
                    hwl_itm[6], //override cap
                    hwl_itm[7], //hms count
                    hwl_itm[1], //hw type
                    hwl_itm[0], //hw_name
                    hwl_itm[2], //site_num
                    hwl_itm[3], //res_area
                ]);
            });
        });
        window.crudProcessV2Type3("ADD_HW_CAPACITY", payload, user_details, false);
    });

});

function renderType3Fields(weeks, selected_hw, existing_capacity){
    let combi_val = selected_hw.split("|");
    let non_t3_hwtype = combi_val[0];
    let non_t3_hwname = combi_val[1];
    let non_t3_gpcap = combi_val[2];
    let non_t3_site = combi_val[3];
    let non_t3_res = combi_val[4];

    if ($("#non-type3-current-val").val() == selected_hw) {
        showToast(""+non_t3_hwname+" - "+non_t3_hwtype+" - "+non_t3_site+" - "+non_t3_res+" is already selected.", "error");
        return;
    }

    $(".non-type3-fields").each(function(){
        $(this).val("");
    });

    $("#non-type3-current-val").val(selected_hw);
    $("#non-type3-hw-type").val(non_t3_hwtype);
    $("#non-type3-hw-name").val(non_t3_hwname);
    $("#non-type3-hms-count").text(non_t3_gpcap);
    $("#non-type3-site-num").val(non_t3_site);
    $("#non-type3-res-area").val(non_t3_res);

    renderType3Weeks(weeks);
}

// renders all fyww 
function renderType3Weeks(weeks){
    let non_t3_es_opt = "";
    let non_t3_ee_opt = "";
    $.each(JSON.parse(weeks), function(index, item){
        let slice = item.slice(2);
        let week_arr = [slice.slice(0, 2), slice.slice(2)];
        let fyww = week_arr[0]+"_W"+week_arr[1];
        let is_selected = "";
        let eff_date_arr = ["START", "END"];
        
        $.each(eff_date_arr, function(idx, itm){
            if (itm == "START") {
                is_selected = (index == 2) ? "selected" : "";
                non_t3_es_opt += '<option raw-value="'+item+'" value="'+fyww+'" '+is_selected+'>'+fyww+'</option>';
            }
            else{
                is_selected = (index == 13) ? "selected" : "";
                non_t3_ee_opt += '<option raw-value="'+item+'" value="'+fyww+'" '+is_selected+'>'+fyww+'</option>';
            }
        });

    });
    $("#non-type3-eff-start").append(non_t3_es_opt);
    $("#non-type3-eff-end").append(non_t3_ee_opt+'<option week-type="OPEN_ENDED_FIELD">--/--</option>');
}

function renderMainListType3(hwl){
    $("#ht-card-container").empty();
    $.each(Object.keys(hwl), function(ht_idx, ht_itm){
        let card = cardTemplateType3(ht_itm);
        $("#ht-card-container").append(card).show();
        $('#'+ht_itm+'').find('.non-t3-render-hw-type').text(ht_itm);
        $('#'+ht_itm+'').find('[remove-type="card"]').attr("card-ht-id", ht_itm);

        $.each(hwl[ht_itm], function(hw_idx, hw_itm){
            let row = rowTemplateType3(hw_itm[10], []);
            $('#'+ht_itm+'').find('.non-t3-render-table tbody').append(row).show();
            $('#'+hw_itm[10]+'').find('.non-t3-render-hwname').text(hw_itm[0]);
            $('#'+hw_itm[10]+'').find('.non-t3-render-sitenum').text(hw_itm[2]);
            $('#'+hw_itm[10]+'').find('.non-t3-render-resarea').text(hw_itm[3]);
            $('#'+hw_itm[10]+'').find('.non-t3-render-weekrange').text(hw_itm[4]+" - "+hw_itm[5]);
            $('#'+hw_itm[10]+'').find('.non-t3-render-hmscount').text(hw_itm[7]);
            $('#'+hw_itm[10]+'').find('.non-t3-render-override').text(hw_itm[6]);
            $('#'+hw_itm[10]+'').find('[remove-type="row"]').attr("row-hw-data", JSON.stringify(hw_itm)).attr("row-hw-id", hw_itm[10]);
        });
    });
}

//render existing list (popover), htid = hw type, exl = global_existing_list_t3
function renderExistingListType3(htid, exl){
    let tbl_header = '<thead style="font-size: 10px;"><tr><th>HW_NM</th><th>SITE_NUM</th><th>RES_AREA</th><th>WEEK</th><th>OVERRIDE_CAP</th><th>&nbsp;</th></tr></thead>';
    let table = $('<table style="font-size: 12px;" class="table table-sm">'+tbl_header+'</table>');
    let row = "";
    $.each(exl, function(index, item){
        if (index <= 9) {
            row += rowTemplateType3(item[10], item);
        }
        else{
            row += '<tr><td colspan="6">Showing 10 of '+exl.length+' records found.</td></tr>';
            return false;
        }
    });

    let tbody = '<tbody>'+row+'</tbody>';
    table.append(tbody);
    return table.prop('outerHTML');
}

function generateOpenWeekType3(year, week){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=GET_OPEN_WEEK&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {year: year, week: week},
        success: function(data){
            let open_fyww = JSON.parse(data)[0];
            let open_year = open_fyww.toString().slice(2, 4);
            let open_week = open_fyww.toString().slice(-2);
            new_eff_end = open_year+'_W'+open_week;
            
            $('#non-type3-eff-end option[week-type="OPEN_ENDED_FIELD"]').val(new_eff_end);
            $('#non-type3-eff-end option[week-type="OPEN_ENDED_FIELD"]').attr("raw-value", open_fyww);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function validateNewHW(global_final_list_t3, field_arr_t3, existing_capacity){
    let non_t3_hwtype = $(field_arr_t3[1]).val();
    let non_t3_es_raw = parseInt($("#non-type3-eff-start option:selected").attr("raw-value"));
    let non_t3_ee_raw = parseInt($("#non-type3-eff-end option:selected").attr("raw-value"));
    let random_id = generateRandomIdType3(global_final_list_t3);
    let proceed = true;

    if (existing_capacity.length > 0) {
        const exists = existing_capacity.some(
            item => item.HW_NM === $(field_arr_t3[0]).val() && item.HW_TYPE === $(field_arr_t3[1]).val()
                    && item.SITE_NUM === $(field_arr_t3[2]).val() && item.RES_AREA === $(field_arr_t3[3]).val()
                    && (non_t3_es_raw  <= parseInt("20"+item.EFF_END.replace("_W", "")) && non_t3_ee_raw >= parseInt("20"+item.EFF_START.replace("_W", "")))
        );
        if (exists) {return false;}
    }
    if (!(non_t3_hwtype in global_final_list_t3)) {
        global_final_list_t3[non_t3_hwtype] = [];
        global_final_list_t3[non_t3_hwtype].push([
            $(field_arr_t3[0]).val(), $(field_arr_t3[1]).val(),
            $(field_arr_t3[2]).val(), $(field_arr_t3[3]).val(),
            $(field_arr_t3[4]).val(), $(field_arr_t3[5]).val(),
            $(field_arr_t3[6]).val(), $(field_arr_t3[7]).text(),
            non_t3_es_raw, non_t3_ee_raw, random_id
        ]);
    }
    else{
        var matching_hw = global_final_list_t3[non_t3_hwtype].filter(row => row.includes($(field_arr_t3[0]).val()));
        if (matching_hw.length > 0) {
            var matching_site_num = matching_hw.filter(row => row.includes($(field_arr_t3[2]).val()));
            if(matching_site_num.length > 0){
                $.each(matching_site_num, function(index, item){
                    if ($(field_arr_t3[3]).val() == item[3]) { //checks res_area values
                        if (non_t3_es_raw <= parseInt(item[9]) && non_t3_ee_raw >= parseInt(item[8])) { //checks overlapping weeks
                            proceed = false;
                        }
                    }
                });
            }
        }
        if (proceed) {
            global_final_list_t3[non_t3_hwtype].push([
                $(field_arr_t3[0]).val(), $(field_arr_t3[1]).val(),
                $(field_arr_t3[2]).val(), $(field_arr_t3[3]).val(),
                $(field_arr_t3[4]).val(), $(field_arr_t3[5]).val(),
                $(field_arr_t3[6]).val(), $(field_arr_t3[7]).text(),
                non_t3_es_raw, non_t3_ee_raw, random_id
            ]);
        }
    }
    return proceed;
}

function getExistingOverride(hw_type, global_existing_list_t3){

    let ext_cap_list = JSON.parse(existing_capacity);
    global_existing_list_t3[hw_type] = [];
    
    if (ext_cap_list.length > 0) {
        $.each(ext_cap_list, function(ecl_idx, ecl_itm){
            let raw_es = parseInt("20"+ecl_itm['EFF_START'].replace("_W", ""));
            let raw_ee = parseInt("20"+ecl_itm['EFF_END'].replace("_W", ""));
            if (ecl_itm['HW_TYPE'] == hw_type) {
                global_existing_list_t3[hw_type].push([
                    ecl_itm['HW_NM'],
                    ecl_itm['HW_TYPE'],
                    ecl_itm['SITE_NUM'],
                    ecl_itm['RES_AREA'],
                    ecl_itm['EFF_START'],
                    ecl_itm['EFF_END'],
                    ecl_itm['OVERRIDE_CAP'],
                    ecl_itm['CURRENT_CAP'],
                    raw_es,
                    raw_ee,
                    ecl_itm['ID']
                ]);
            }
        })
    }
    return global_existing_list_t3;
}

//random id generator for partnum's row elements
function generateRandomIdType3(global_final_list_t3) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    var exists = Object.values(global_final_list_t3).some(function(row) {
        return row.includes(result);
    });

    if (exists) {
        return generateRandomIdType3(global_final_list_t3);
    }
    return result;
}

//card template for hw type
function cardTemplateType3(id){
    let tbl_header = '<thead style="font-size: 12px;"><tr><th>HW_NM</th><th>SITE_NUM</th><th>RES_AREA</th><th>WEEK</th><th style="font-size: 10px!important;">HMS_PLANNABLE_COUNT</th><th>OVERRIDE_CAP</th><th>&nbsp;</th></tr></thead>';
    return '<div id="'+id+'" class="card mb-3">'+
                '<div class="card-header d-flex justify-content-between">'+
                    '<div class="p-0"><i card-ht-id="'+id+'" remove-type="card" class="fa-regular fa-circle-xmark text-danger btn-remove-override"></i><span>&nbsp;&nbsp;<b class="non-t3-render-hw-type"></b></span></div>'+
                    '<div>'+
                        '<button ht-id="'+id+'" type="button" class="btn btn-link text-secondary existing-override-btn p-0"><small>Existing Override</small></button>'+
                    '</div>'+
                '</div>'+
                '<div class="card-body"><table style="font-size: 14px;" class="table table-sm table-hover non-t3-render-table">'+tbl_header+'<tbody></tbody></table></div>'+
            '</div>';
}

//row template for partnum
function rowTemplateType3(rid, data = []){
    let ext_hw_name      = (data.length > 0) ? data[0] : "";
    let ext_site_num     = (data.length > 0) ? data[2] : "";
    let ext_res_area     = (data.length > 0) ? data[3] : "";
    let ext_week_range   = (data.length > 0) ? data[4]+' - '+ data[5] : "";
    let ext_override_cap = (data.length > 0) ? data[6] : "";
    let ext_hms_count    = (data.length > 0) ? data[7] : "";
    let btn_string       = (data.length > 0) ? '' : '<td><i remove-type="row" class="fa-regular fa-circle-xmark text-danger btn-remove-override"></i></td>';
    
    return '<tr id="'+rid+'">'+
                '<td class="non-t3-render-hwname">'+ext_hw_name+'</td>'+
                '<td class="non-t3-render-sitenum">'+ext_site_num+'</td>'+
                '<td class="non-t3-render-resarea">'+ext_res_area+'</td>'+
                '<td class="non-t3-render-weekrange">'+ext_week_range+'</td>'+
                '<td class="non-t3-render-hmscount">'+ext_hms_count+'</td>'+
                '<td><span class="badge text-bg-warning non-t3-render-override">'+ext_override_cap+'</span></td>'+
                btn_string+
            '</tr>'
}