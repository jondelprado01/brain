$(document).ready(function(){

    $("#modal-view-data small, #modal-view-data-type2 small").addClass("text-muted small");

    var global_existing_list = [];
    var global_weeknum_with_cap_list = [];
    var global_final_list = [];
    var field_arr = ["#hwo-type1-mfg-partnum", "#hwo-type1-genpool", "#hwo-type1-gpcap", "#hwo-type1-hw-type", "#hwo-type1-site-num", "#hwo-type1-hw-name", 
                         "#hwo-type1-eff-start option:selected", "#hwo-type1-eff-end option:selected", "#hwo-type1-jda-feed", '[name="input-mapping-type1"]:checked', 
                         "#hwo-type1-current-val", "#hwo-type1-partnum-container", "#hwo-type1-mapping-type"];


    //add new mapping - selection/configuration stage
    $(".hwo-type1-add").on("click", async function(){
        let has_empty_field = 0;
        let has_invalid_val = 0;
        let raw_es = parseFloat($("#hwo-type1-eff-start option:selected").attr("raw-value"));
        let raw_ee = parseFloat($("#hwo-type1-eff-end option:selected").attr("raw-value"));
        $('.input-container-hwo-type1-v2 [required]').each(function() {
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

            let is_valid_num = /^-?\d*\.?\d*$/.test($(field_arr[8]).val());
            if (!is_valid_num) {
                $(field_arr[8]).val('');
                has_invalid_val++;
                invalid_fields_txt += "\nJDA_FEED must be a valid number.";
            }
            else{
                if ($(field_arr[12]).val() == "DEDICATION") {
                    if (parseFloat($(field_arr[8]).val()) > parseFloat($(field_arr[2]).val())) {
                        has_invalid_val++;
                        invalid_fields_txt += "\nJDA_FEED exceeds max HMS plannable count.";
                    }
                }
                else if(parseFloat($(field_arr[8]).val()) < 0){
                    has_invalid_val++;
                    invalid_fields_txt += "\nJDA_FEED cannot be negative.";
                }
            }

            if(has_invalid_val > 0){
                showToast("Invalid Values.\n"+invalid_fields_txt+"", "error"); return;
            }
        }

        //check if a genpool hw has a override_cap
        updateHMS(JSON.parse(existing_capacity), $(field_arr[1]).val(), raw_es, raw_ee, parseFloat($(field_arr[10]).val().split("|")[2]));

        let hw_name_trim = $("#hwo-type1-hw-name").val().trimEnd();
        $("#hwo-type1-hw-name").val(hw_name_trim);
        
        //updates the global_existing_list first before adding new record
        try {
            const response = await getExistingMapping($(field_arr[1]).val(), global_existing_list, global_weeknum_with_cap_list, global_final_list);
            let is_valid = validateNewPartnum(global_final_list, field_arr, global_existing_list);
            if (is_valid[0]) {
                let remaining_cap = Math.min(...generateWeeknumCapList(global_weeknum_with_cap_list, field_arr, is_valid[1], "input"));
                if (remaining_cap < 0) {
                    let invalid_partnum_idx = global_final_list[$(field_arr[1]).val()].findIndex(gfl_item => gfl_item[12] == is_valid[2]);
                    if (invalid_partnum_idx != -1) {
                        global_final_list[$(field_arr[1]).val()].splice(invalid_partnum_idx, 1);
                    }
                    showToast("Capacity limit reached.", "error"); return;
                }
                renderMainList(global_final_list, global_weeknum_with_cap_list);
            }
            else{
                showToast("Data insertion failed due to the following reasons: \n\nOverlapping weeks are not allowed. \nRecord already exists or has already been added.", "error"); return;
            }
            // console.log(global_final_list); 
            // console.log(global_weeknum_with_cap_list);
            // console.log(global_existing_list);
        } catch (error) {
            console.error('Error:', error);
            return;
        }
        //demo then upload code, implement site_num in csv upload (go to line 2420 to see duplicate/overlapping weeks checker - site_num is a unique criteria) - CONTINUE!!! - don't forget to re-enable all existing records api call when uploading the code.
    });

    //check if hw override cap exists for genpool hw and update hms plannable count accordingly - eff_start/end dropdown onchange
    $(".hwo-type1-week-field").on("change", function(){
        let hwo_t1_genpool = $("#hwo-type1-genpool").val();
        let hwo_t1_gpcap = $("#hwo-type1-current-val").val().split("|")[2];
        let curr_raw_es = parseInt("20"+$("#hwo-type1-eff-start option:selected").val().replace("_W", ""));
        let curr_raw_ee = parseInt("20"+$("#hwo-type1-eff-end option:selected").val().replace("_W", ""));

        if ($("#hwo-type1-eff-end option:selected").attr('week-type') !== undefined) {
            let input_year = "20"+curr_raw_es.toString().slice(2, 4);
            let input_week = curr_raw_es.toString().slice(-2);
            generateOpenWeek(input_year, input_week);
        }

        updateHMS(JSON.parse(existing_capacity), hwo_t1_genpool, curr_raw_es, curr_raw_ee, hwo_t1_gpcap);
    });

    //remove mapping from the main display (new mappings that are yet to be saved)
    $(document).delegate(".btn-remove-record", "click", function(){
        if ($(this).attr("remove-type") == "card") {
            let card_id = $(this).attr("card-gp-id");
            $('#gp-card-container div[id="'+card_id+'"]').remove();
            delete global_final_list[card_id];
            delete global_weeknum_with_cap_list[card_id];
            delete global_existing_list[card_id];
        }
        else{
            let row_id = $(this).attr("row-part-id");
            let row_data = JSON.parse($(this).attr("row-part-data"));
            
            $('tr[id="'+row_id+'"]').remove();
            global_final_list[row_data[1]] = global_final_list[row_data[1]].filter(row => row[12] !== row_data[12]);
            
            if (global_final_list[row_data[1]].length == 0 || $("#"+row_data[1]+" .hwo-t1-render-table tbody").children().length == 0) {
                $('#gp-card-container div[id="'+row_data[1]+'"]').remove();
                delete global_final_list[row_data[1]];
                delete global_weeknum_with_cap_list[row_data[1]];
                delete global_existing_list[row_data[1]];
            }
            else{
                if (row_data[9] == "DEDICATION") {
                    let link_arr = [];
                    if (row_data[13] == "UNIQUE") {
                        $.each(global_final_list[row_data[1]], function(index, item){
                            if (item[13].includes(row_data[12])) {
                                link_arr.push(item);
                            }
                        });
                        
                        if (link_arr.length > 0) {
                            let new_link_parent = link_arr[0][12];
                            $.each(global_final_list[row_data[1]], function(index, item){
                                if (item[12] == new_link_parent) {
                                    global_final_list[row_data[1]][index][13] = "UNIQUE";
                                }
                                if (item[13].includes(row_data[12]) && item[12] != new_link_parent) {
                                    global_final_list[row_data[1]][index][13] = "LINK|"+ new_link_parent;
                                }
                            });
                        }
                        else{
                            for (let i = row_data[10]; i <= row_data[11]; i++) {
                                if (typeof global_weeknum_with_cap_list[row_data[1]][i] != "undefined") {
                                    global_weeknum_with_cap_list[row_data[1]][i][0] -= parseFloat(row_data[8]);
                                    global_weeknum_with_cap_list[row_data[1]][i][1] += parseFloat(row_data[8]);
                                }
                            }
                        }
                    }
                }
            }
            renderMainList(global_final_list, global_weeknum_with_cap_list);
        }
    });

    //close modal - reset all global variables and dom
    $(".btn-close-hwo-t1-modal").on("click", function(){
        $(this).hide();
        $(".btn-prompt-type1").fadeIn();
    });
    $(".btn-link").on("click", function(){
        $(".btn-prompt-type1").hide();
        $(".btn-close-hwo-t1-modal").show();

        if ($(this).attr("btn-type") == "btn-proceed-yes-type1") {
            
            $(".input-search-type1").val('');
            $(".input-select-type1").empty().prop("disabled", true);
            $('[name="input-mapping-type1"][value="DUMMY"]').prop("checked", true).trigger("change");
            $(".btn-add-dummy").prop("disabled", true);
            $(".input-container-type1 :not(.empty-filler-type1)").remove();
            $(".empty-filler-type1").addClass('d-flex').fadeIn();

            $("#gp-card-container").empty();
            global_weeknum_with_cap_list = [];
            global_final_list = [];

            $.each(field_arr, function(index, item){
                item = (item.includes(":selected")) ? item.split(':')[0].trim() : item;
                if (!item.includes(":checked")) {
                    $(item).val("");
                }
            });
        }
    });

    //render existing mapping inside popover (initialization of bootstrap's popover)
    $("#modal-add-dummy-type1").on("mouseenter", ".existing-mapping-btn", function(event){
        var btn_elem = $(event.target).closest('.existing-mapping-btn');
        var gpid = btn_elem.attr('gp-id');
        var content = "";
        
        let ext_ded_mapping = global_existing_list[gpid]['DEDICATION'];
        let ext_dum_mapping = global_existing_list[gpid]['DUMMY'];
        
        if (ext_ded_mapping.length == 0 && ext_dum_mapping.length == 0) {
            content = "No Existing Mapping found for this GENPOOL HW.";
        }
        else{
            content = renderExistingList(gpid, global_existing_list, global_weeknum_with_cap_list);
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
    $(".btn-save-hwo-t1").on("click", function(){
        let payload = [];
        if (Object.keys(global_final_list).length == 0) {
            showToast("No records have been added. Please include at least one entry before saving.", "error");
            return;
        }
        $.each(Object.keys(global_final_list), function(gfl_idx, gfl_itm){
            let gp_key = gfl_itm;
            $.each(global_final_list[gp_key], function(ptl_idx, ptl_itm){
                if (ptl_itm[14] === undefined) { //don't include existing record inside global_final_list
                    payload.push([
                        ptl_itm[0], //mfg_part_num
                        ptl_itm[5], //hw_name/mapping name
                        ptl_itm[6], //eff_start
                        ptl_itm[7], //eff_end
                        ptl_itm[8], //jda_feed
                        ptl_itm[9], //mapping type
                        'null',     //db id (for update only)
                        ptl_itm[1], //genpool hw
                        ptl_itm[2], //hms plannable count
                        ptl_itm[3], //hw type
                        ptl_itm[4], //site_num
                    ]);
                }
            });
        });
        window.crudProcessV2("ADD_DUMMY_HW", payload, user_details);
    });

});

//get existing mapping from db - adi_hw_override_type1 table
function getExistingMapping(genpool_hw, global_existing_list, global_weeknum_with_cap_list, global_final_list){

    if (!(genpool_hw in global_existing_list)) {
        global_existing_list[genpool_hw] = {
            'DEDICATION': [],
            'DUMMY': []
        };  
    }
    else{
        if (Object.values(global_existing_list[genpool_hw]).some(arr => Array.isArray(arr) && arr.length > 0)) return false;
    }

    return $.ajax({
        type: 'post',
        url: 'http://MXHDAFOT01L.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=GET_DUMMY_HW&OUTPUT_TYPE=BODS_JDA_ADI&INPUT='+JSON.stringify({"tab": "type-1", "GENPOOL_HW": genpool_hw, "CREATED_BY": "ALL", "EMP_NAME": user_details['emp_name']})+'',
        success: function(data){
            let data_res = JSON.parse(data);
            if (data_res.length > 0) {
                $.each(data_res, function(index, item){
                    let format_item = [
                        item['MFG_PART_NUM'], item['GENPOOL'],
                        item['GENPOOL_CAPACITY'], item['GP_HW_TYPE'],
                        item['SITE_NUM'], item['HW_NM'],
                        item['EFF_START'], item['EFF_END'],
                        item['CAPACITY'], item['HW_TYPE'],
                        parseInt("20"+item['EFF_START'].replace("_W", "")), parseInt("20"+item['EFF_END'].replace("_W", "")),
                        item['ID'], "UNIQUE", []
                    ];

                    if (item['HW_TYPE'] == "DEDICATION") {
                        if (global_existing_list[item['GENPOOL']]['DEDICATION'].length > 0) {
                            let link_matched = true;
                            let parent_unique_id = 0;
                            let parent_unique_idx = 0;

                            $.each(global_existing_list[item['GENPOOL']]['DEDICATION'], function(idx, itm){
                                $.each(Object.keys(itm), function(iidx, iitm){
                                    if (iitm == 0 || iitm == 12 || iitm == 14) return true;
                                    if (itm[iitm] != format_item[iitm]) {
                                        link_matched = false; return false;
                                    }
                                });
                                parent_unique_id = itm[12];
                                parent_unique_idx = idx;
                            });

                            if (link_matched) {
                                format_item[13] = "LINK|"+parent_unique_id;
                                global_existing_list[item['GENPOOL']]['DEDICATION'][parent_unique_idx][14].push(format_item);
                            }
                            else{
                                global_existing_list[item['GENPOOL']]['DEDICATION'].push(format_item);
                            }
                        }
                        else{
                            global_existing_list[item['GENPOOL']]['DEDICATION'].push(format_item);
                        }
                    }
                    else{
                        global_existing_list[item['GENPOOL']]['DUMMY'].push(format_item);
                    }
                });

                if (!(genpool_hw in global_final_list)) {
                    global_final_list[genpool_hw] = [];
                }

                $.each(global_existing_list[genpool_hw]['DEDICATION'], function(index, item){
                    if (item.length > 0) {
                        generateWeeknumCapList(global_weeknum_with_cap_list, item, false, "table");
                        global_final_list[genpool_hw].push(item);

                        //if mapping has link/identical mappings
                        if (item[14].length > 0) {
                            $.each(item[14], function(lk_index, lk_item){
                                global_final_list[genpool_hw].push(lk_item);
                            });
                        }
                    }
                });
            }
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

//global list that holds all weeknums and its remaining capacity
function generateWeeknumCapList(global_weeknum_with_cap_list, field_arr, is_link, source){
    let hwo_t1_genpool  = (source == "input") ? $(field_arr[1]).val()               : field_arr[1];
    let hwo_t1_gpcap    = (source == "input") ? parseFloat($(field_arr[2]).val())   : parseFloat(field_arr[2]);
    let hwo_t1_es_week  = (source == "input") ? $(field_arr[6]).val().split("_W")   : field_arr[6].split("_W");
    let hwo_t1_ee_week  = (source == "input") ? $(field_arr[7]).val().split("_W")   : field_arr[7].split("_W");
    let hwo_t1_jda_feed = (source == "input") ? parseFloat($(field_arr[8]).val())   : parseFloat(field_arr[8]);
    let hwo_t1_mtype    = (source == "input") ? $(field_arr[9]).val()               : field_arr[9];
    
    let startYear = parseInt("20"+hwo_t1_es_week[0]);
    let startWeek = hwo_t1_es_week[1];
    let endYear = parseInt("20"+hwo_t1_ee_week[0]);
    let endWeek = hwo_t1_ee_week[1];
    let weeks = [];
    let cap_res = [];
    
    while (startYear < endYear || (startYear === endYear && startWeek <= endWeek)) {
        weeks.push(startYear + String(startWeek).padStart(2, '0'));
        startWeek++;
        if (startWeek > 52) { startWeek = 1; startYear++; }
    }

    if (!(hwo_t1_genpool in global_weeknum_with_cap_list)) {
        global_weeknum_with_cap_list[hwo_t1_genpool] = [];
    }

    $.each(weeks, function(index, week) {
        let cap_res_val = -1;
        if (!(week in global_weeknum_with_cap_list[hwo_t1_genpool])) {
            global_weeknum_with_cap_list[hwo_t1_genpool][week] = [0, hwo_t1_gpcap];
        }
        if (hwo_t1_mtype == "DUMMY" || is_link === true) {
            cap_res_val = hwo_t1_gpcap;
        }
        else{
            if (global_weeknum_with_cap_list[hwo_t1_genpool][week][1] > 0) {
                //check if the new jda_feed will exceed the remaining capacity resulting to negative value. if so, revert to current value;
                let temp_current_feed = global_weeknum_with_cap_list[hwo_t1_genpool][week][0];
                let temp_total_feed =  temp_current_feed + hwo_t1_jda_feed;
                let temp_rem_capacity = hwo_t1_gpcap - temp_total_feed;

                if (temp_rem_capacity >= 0) {

                    global_weeknum_with_cap_list[hwo_t1_genpool][week][0] += hwo_t1_jda_feed;
                    global_weeknum_with_cap_list[hwo_t1_genpool][week][1] = hwo_t1_gpcap - global_weeknum_with_cap_list[hwo_t1_genpool][week][0];

                    if (parseInt(week) >= parseInt(startYear+startWeek) && parseInt(week) <= parseInt(endYear+endWeek)) {
                        cap_res_val = global_weeknum_with_cap_list[hwo_t1_genpool][week][1];
                    }
                }
            }
        }

        if ($.inArray(cap_res_val, cap_res) === -1) {
            cap_res.push(cap_res_val);
        }
    });
    
    return cap_res;
}

//handles all appropriate validations to check if a partnum is good (no overlapping, can allocate requested jda_feed, valid mapping/hw name, etc.)
function validateNewPartnum(global_final_list, field_arr, global_existing_list){
    let hwo_t1_genpool = $(field_arr[1]).val();
    let hwo_t1_es_raw = parseInt($("#hwo-type1-eff-start option:selected").attr("raw-value"));
    let hwo_t1_ee_raw = parseInt($("#hwo-type1-eff-end option:selected").attr("raw-value"));
    let random_id = generateRandomId(global_final_list);
    let is_unique = "UNIQUE";
    let is_link = false;
    let proceed = true;

    if (!(hwo_t1_genpool in global_final_list)) {
        global_final_list[hwo_t1_genpool] = [];
        global_final_list[hwo_t1_genpool].push([
            $(field_arr[0]).val(), $(field_arr[1]).val(),
            $(field_arr[2]).val(), $(field_arr[3]).val(),
            $(field_arr[4]).val(), $(field_arr[5]).val(),
            $(field_arr[6]).val(), $(field_arr[7]).val(),
            $(field_arr[8]).val(), $(field_arr[9]).val(),
            hwo_t1_es_raw, hwo_t1_ee_raw,
            random_id, is_unique
        ]);
    }
    else{
        if ($(field_arr[9]).val() == "DUMMY") {
            var matching_partnum = global_existing_list[hwo_t1_genpool]['DUMMY'].filter(row => row.includes($(field_arr[0]).val()) && row[9] == "DUMMY"); //ui temp global final list removed. merge the two (ui entries and existing db records)
            var matching_site_num = matching_partnum.filter(row => row.includes($(field_arr[4]).val()));
            if(matching_site_num.length > 0){
                $.each(matching_site_num, function(index, item){
                    if ($(field_arr[0]).val() == item[0] && $(field_arr[5]).val() == item[5]) {
                        if (hwo_t1_es_raw <= parseInt(item[11]) && hwo_t1_ee_raw >= parseInt(item[10])) {
                            proceed = false;
                        }
                    }
                });
            }
        }
        else{
            var matching_partnum = global_final_list[hwo_t1_genpool].filter(row => row.includes($(field_arr[0]).val()) && row[9] == "DEDICATION");
            if (matching_partnum.length > 0) {

                var matching_site_num = global_final_list[hwo_t1_genpool].filter(row => row.includes($(field_arr[4]).val()));
                if(matching_site_num.length > 0){
                    $.each(matching_site_num, function(index, item){
                        if ($(field_arr[0]).val() == item[0] && $(field_arr[5]).val() == item[5]) {
                            if (hwo_t1_es_raw <= parseInt(item[11]) && hwo_t1_ee_raw >= parseInt(item[10])) {
                                proceed = false;
                            }
                        }
                        else if($(field_arr[0]).val() != item[0] && $(field_arr[5]).val() == item[5]){
                            if ($(field_arr[4]).val() == item[4] && $(field_arr[5]).val() == item[5] && $(field_arr[6]).val() == item[6] && $(field_arr[7]).val() == item[7] && $(field_arr[8]).val() == item[8] && item[13] == "UNIQUE") {
                                is_unique = "LINK|"+item[12]+"";
                                is_link = true;
                            }
                        }
                    });
                }
            }
            else{
                var matching_site_num = global_final_list[hwo_t1_genpool].filter(row => row.includes($(field_arr[4]).val()) && row[9] == "DEDICATION");
                if(matching_site_num.length > 0){
                    $.each(matching_site_num, function(index, item){
                        if ($(field_arr[4]).val() == item[4] && $(field_arr[5]).val() == item[5] && $(field_arr[6]).val() == item[6] && $(field_arr[7]).val() == item[7] && $(field_arr[8]).val() == item[8] && item[13] == "UNIQUE") {
                            is_unique = "LINK|"+item[12]+"";
                            is_link = true;
                        }
                    });
                }
            }
        }

        if (proceed) {
            global_final_list[hwo_t1_genpool].push([
                $(field_arr[0]).val(), $(field_arr[1]).val(),
                $(field_arr[2]).val(), $(field_arr[3]).val(),
                $(field_arr[4]).val(), $(field_arr[5]).val(),
                $(field_arr[6]).val(), $(field_arr[7]).val(),
                $(field_arr[8]).val(), $(field_arr[9]).val(),
                hwo_t1_es_raw, hwo_t1_ee_raw,
                random_id, is_unique
            ]);
        }
    }
    return [proceed, is_link, random_id];
}

//ptl = global_final_list, wkl = global_weeknum_capacity_list
function renderMainList(ptl, wkl){
    $("#gp-card-container").empty();
    $.each(Object.keys(ptl), function(gp_idx, gp_itm){

        let card = cardTemplate(gp_itm);

        $("#gp-card-container").append(card).show();
        $('#'+gp_itm+'').find('.hwo-t1-render-genpool-hwtype').text(ptl[gp_itm][0][1]+" - "+ptl[gp_itm][0][3]);
        $('#'+gp_itm+'').find('.hwo-t1-render-hms-count').text(ptl[gp_itm][0][2]);
        $('#'+gp_itm+'').find('[remove-type="card"]').attr("card-gp-id", ptl[gp_itm][0][1]);

        const all_counts = Object.values(wkl[gp_itm]).map(arr => arr.at(-1));
        
        $('#'+gp_itm+' .card-footer').find('.hwo-t1-render-hms-min').text(Math.min(...all_counts));
        $('#'+gp_itm+' .card-footer').find('.hwo-t1-render-hms-max').text(Math.max(...all_counts));
        
        //sorts the partnum list and group together all valid links (partnums that are identical to each other and shares one hms count value) 
        let group_link_ptl = ptl[gp_itm].filter(row => row[13] === "UNIQUE").map(row => row[12]);
        let grouped = ptl[gp_itm].reduce((acc, row) => {
            if (group_link_ptl.some(target => row[13].includes(target)) && row[13].includes("LINK|")) {
                acc.matched.push(row);
            } else {
                acc.others.push(row);
            }
            return acc;
        }, { matched: [], others: [] });

        let combined = grouped.others.flatMap(item => {
            let match = grouped.matched.filter(m => m[13].includes(item[12]));
            return [item, ...match];
        });

        $.each(combined, function(ptl_idx, ptl_itm){
            //don't render existing mapping, they have their own list/container
            if (Object.keys(ptl_itm).length >= 15) {
                return true;
            }
            let row = rowTemplate(gp_itm, ptl_itm[12], ptl_itm[13], ptl_itm[9], [], []);
            let add_class = (ptl_itm[9] == "DUMMY") ? "text-bg-secondary" : "text-bg-success";
            let remove_class = (ptl_itm[9] == "DUMMY") ? "text-bg-success" : "text-bg-secondary";
            // let remcap_val = (ptl_itm[9] == "DUMMY") ? "N/A" : wkl[gp_itm][ptl_itm[10]][1];
            
            $('#'+gp_itm+'').find('.hwo-t1-render-table tbody').append(row).show();
            $('#'+ptl_itm[12]+'').find('.hwo-t1-render-partnum').text(ptl_itm[0]);
            $('#'+ptl_itm[12]+'').find('.hwo-t1-render-sitenum').text(ptl_itm[4]);
            $('#'+ptl_itm[12]+'').find('.hwo-t1-render-mappingtype').addClass(add_class).removeClass(remove_class).text(ptl_itm[9]);
            $('#'+ptl_itm[12]+'').find('.hwo-t1-render-mappingname').text(ptl_itm[5]);
            $('#'+ptl_itm[12]+'').find('.hwo-t1-render-weekrange').text(ptl_itm[6]+" - "+ptl_itm[7]);
            $('#'+ptl_itm[12]+'').find('.hwo-t1-render-jdafeed').text(ptl_itm[8]);
            // $('#'+ptl_itm[12]+'').find('.hwo-t1-render-remcap').text(remcap_val);
            $('#'+ptl_itm[12]+'').find('[remove-type="row"]').attr("row-part-data", JSON.stringify(ptl_itm)).attr("row-part-id", ptl_itm[12]);
        });
    });
}

//render existing list (popover), gpid = genpool hw name, exl = global_existing_list, wkl = global_weeknum_capacity_list
function renderExistingList(gpid, exl, wkl){
    let tbl_header = '<thead style="font-size: 11px;"><tr><th>MFG_PART_NUM</th><th>SITE_NUM</th><th>TYPE</th><th>HW_NAME</th><th>WEEK</th><th>JDA_FEED</th><th>&nbsp;</th></tr></thead>';
    let table = $('<table style="font-size: 14px;" class="table table-sm">'+tbl_header+'</table>');
    let row = "";

    $.each(exl[gpid]['DEDICATION'], function(index, item){
        if (item[13] == "UNIQUE") {
            row += rowTemplate(item[1], item[12], item[13], "DEDICATION", item, wkl);
            if (item[14].length > 0) {
                $.each(item[14], function(link_idx, link_itm){
                    row += rowTemplate(link_itm[1], link_itm[12], link_itm[13], "DEDICATION", link_itm, wkl);
                });
            }
        }
    });

    $.each(exl[gpid]['DUMMY'], function(index, item){
        if (index <= 9) {
            row += rowTemplate(item[1], item[12], item[13], "DUMMY", item, wkl);
        }
        else{
            row += '<tr><td colspan="6">Showing 10 of '+exl[gpid]['DUMMY'].length+' records found.</td></tr>';
            return false;
        }
    });

    let tbody = '<tbody>'+row+'</tbody>';
    table.append(tbody);
    return table.prop('outerHTML');
}

//dynamically renders all values/records of selected partnum to input fields
function renderType1Fields(weeks, selected_partnum, existing_capacity){
    let combi_val = selected_partnum.split("|");
    let hwo_t1_partnum = combi_val[0];
    let hwo_t1_genpool = combi_val[1];
    let hwo_t1_gpcap = combi_val[2];
    let hwo_t1_hwtype = combi_val[3];
    let hwo_t1_site = combi_val[4];
    let has_valid_site = 0;

    $("#hwo-type1-current-val").val(selected_partnum);
    $("#hwo-type1-mfg-partnum").val(hwo_t1_partnum);
    $("#hwo-type1-genpool").val(hwo_t1_genpool);
    $("#hwo-type1-gpcap").val(hwo_t1_gpcap);
    $("#hwo-type1-hw-type").val(hwo_t1_hwtype);
    $("#hwo-type1-partnum-container").val(combi_val[0]+" / "+combi_val[1]+" / "+combi_val[3]);

    $.each(["ADGT", "ADPI"], function(index, item){
        if ($.inArray(item, hwo_t1_site.split(",")) !== -1){
            has_valid_site++;
        }
        else{
            $('#hwo-type1-site-num option[value="'+item+'"]').prop('disabled', true);
        }
    });

    if (has_valid_site > 0) {
        $("#hwo-type1-site-num").val(hwo_t1_site).trigger('change').prop("disabled", false);
    }
    else{
        $("#hwo-type1-site-num").val("").prop("disabled", true);
    }

    $("#hwo-type1-hw-name").val(hwo_t1_genpool+"_"+$('[name="input-mapping-type1"]:checked').val());
    $("#hwo-type1-mapping-type").val($('[name="input-mapping-type1"]:checked').val());
    $("#hwo-type1-jda-feed").val("");
    $("#hwo-type1-hms-count").text(hwo_t1_gpcap);
    renderType1Weeks(weeks);

    let raw_es = parseInt("20"+$("#hwo-type1-eff-start option:selected").val().replace("_W", ""));
    let raw_ee = parseInt("20"+$("#hwo-type1-eff-end option:selected").val().replace("_W", ""));
    updateHMS(existing_capacity, hwo_t1_genpool, raw_es, raw_ee, hwo_t1_gpcap);
}

//update hms plannable count using existing override capacity records
function updateHMS(existing_capacity, hwo_t1_genpool, raw_es, raw_ee, orig_hms){
    let gp_oc_arr = [];
    const gp_override_cap = existing_capacity.filter(item => item.HW_NM === hwo_t1_genpool);
    $.each(gp_override_cap, function(gpoc_idx, gpoc_itm){
        let gp_oc_start_raw = parseInt("20"+gpoc_itm['EFF_START'].replace("_W", ""));
        let gp_oc_end_raw   = parseInt("20"+gpoc_itm['EFF_END'].replace("_W", ""));
        
        if (raw_es <= gp_oc_end_raw && raw_ee >= gp_oc_start_raw) {
            gp_oc_arr.push(parseFloat(gpoc_itm['OVERRIDE_CAP']));
        }
    });
    
    let curr_hms = (gp_oc_arr.length > 0) ? Math.min(...gp_oc_arr) : parseFloat(orig_hms);
    $("#hwo-type1-gpcap").val(curr_hms);
    $("#hwo-type1-hms-count").text(curr_hms);
}

// renders all fyww 
function renderType1Weeks(weeks){
    let hwo_t1_es_opt = "";
    let hwo_t1_ee_opt = "";
    $.each(JSON.parse(weeks), function(index, item){
        let slice = item.slice(2);
        let week_arr = [slice.slice(0, 2), slice.slice(2)];
        let fyww = week_arr[0]+"_W"+week_arr[1];
        let is_selected = "";
        let eff_date_arr = ["START", "END"];
        
        $.each(eff_date_arr, function(idx, itm){
            if (itm == "START") {
                is_selected = (index == 2) ? "selected" : "";
                hwo_t1_es_opt += '<option raw-value="'+item+'" value="'+fyww+'" '+is_selected+'>'+fyww+'</option>';
            }
            else{
                is_selected = (index == 13) ? "selected" : "";
                hwo_t1_ee_opt += '<option raw-value="'+item+'" value="'+fyww+'" '+is_selected+'>'+fyww+'</option>';
            }
        });

    });
    $("#hwo-type1-eff-start").append(hwo_t1_es_opt);
    $("#hwo-type1-eff-end").append(hwo_t1_ee_opt+'<option week-type="OPEN_ENDED_FIELD">--/--</option>');
}

//random id generator for partnum's row elements?
function generateRandomId(global_final_list) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    var exists = Object.values(global_final_list).some(function(row) {
        return row.includes(result);
    });

    if (exists) {
        return generateRandomId(global_final_list);
    }
    return result;
}

function generateOpenWeek(year, week){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=GET_OPEN_WEEK&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {year: year, week: week},
        success: function(data){
            let open_fyww = JSON.parse(data)[0];
            let open_year = open_fyww.toString().slice(2, 4);
            let open_week = open_fyww.toString().slice(-2);
            new_eff_end = open_year+'_W'+open_week;
            
            $('#hwo-type1-eff-end option[week-type="OPEN_ENDED_FIELD"]').val(new_eff_end);
            $('#hwo-type1-eff-end option[week-type="OPEN_ENDED_FIELD"]').attr("raw-value", open_fyww);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

//card template for genpool hw 
function cardTemplate(id){
    let tbl_header = '<thead style="font-size: 11px;"><tr><th>MFG_PART_NUM</th><th>SITE_NUM</th><th>TYPE</th><th>HW_NAME</th><th>WEEK</th><th>JDA_FEED</th><th>&nbsp;</th></tr></thead>';
    return '<div id="'+id+'" class="card mb-3">'+
                '<div class="card-header d-flex justify-content-between">'+
                    '<div class="p-0"><i remove-type="card" class="fa-regular fa-circle-xmark text-danger btn-remove-record"></i><span>&nbsp;&nbsp;<b class="hwo-t1-render-genpool-hwtype"></b></span></div>'+
                    '<div>'+
                        '<button gp-id="'+id+'" type="button" class="btn btn-link text-secondary existing-mapping-btn p-0"><small>Existing Mapping</small></button>'+
                    '</div>'+
                '</div>'+
                '<div class="card-body"><table style="font-size: 14px;" class="table table-sm table-hover hwo-t1-render-table">'+tbl_header+'<tbody></tbody></table></div>'+
                '<div class="card-footer d-flex justify-content-between">'+
                    // '<span>[<small>HMS Plannable Count - <b class="fs-6 hwo-t1-render-hms-count"></b></small>]</span>'+
                    '<span><span class="badge text-bg-info">Min: <span class="hwo-t1-render-hms-min"></span></span> | <span class="badge text-bg-danger">Max: <span class="hwo-t1-render-hms-max"></span></span></span>'+
                '</div>'+
            '</div>';
}

//row template for partnum
function rowTemplate(id, rid, link_id, type, data = [], wkl = []){
    let ext_mfg_part_num = (data.length > 0) ? data[0] : "";
    let ext_site_num     = (data.length > 0) ? data[4] : "";
    let ext_mapping_type = (data.length > 0) ? data[9] : "";
    let ext_mapping_name = (data.length > 0) ? data[5] : "";
    let ext_week_range   = (data.length > 0) ? data[6]+' - '+ data[7] : "";
    let ext_jda_feed     = (data.length > 0) ? data[8] : "";
    // let ext_remcap       = (data.length > 0) ? wkl[data[1]][data[10]][1] : "";

    let link_highlight   = (link_id.includes("LINK|") && type == "DEDICATION") ? "table-info" : "";
    let btn_string       = (data.length > 0) ? '' : '<td><i remove-type="row" class="fa-regular fa-circle-xmark text-danger btn-remove-record '+link_highlight+'"></i></td>';
    let mtype_color      = (data.length > 0) ? (data[9] == "DEDICATION") ? "text-bg-success" : "text-bg-secondary" : "text-bg-secondary";
    
    return '<tr class="'+link_highlight+'" id="'+rid+'">'+
                '<td style="font-size: 12px!important;" class="hwo-t1-render-partnum">'+ext_mfg_part_num+'</td>'+
                '<td style="font-size: 12px!important;" class="hwo-t1-render-sitenum">'+ext_site_num+'</td>'+
                '<td><span class="badge '+mtype_color+' hwo-t1-render-mappingtype">'+ext_mapping_type+'</span></td>'+
                '<td style="font-size: 12px!important;" class="hwo-t1-render-mappingname">'+ext_mapping_name+'</td>'+
                '<td class="hwo-t1-render-weekrange">'+ext_week_range+'</td>'+
                '<td><span class="badge text-bg-warning hwo-t1-render-jdafeed">'+ext_jda_feed+'</span></td>'+
                // '<td><span class="badge text-bg-info hwo-t1-render-remcap">'+ext_remcap+'</span></td>'+
                btn_string+
            '</tr>'
}