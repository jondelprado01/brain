$(document).ready(function(){

    var table_type_2 = $(".table-hw-type2").DataTable({
        // bPaginate: false,
        scrollY: 'calc(100vh - 650px)',
        bSort: false,
        responsive: true,
    });

    //ONLY PURPOSE - ADJUSTS COLUMN HEADERS
    $('.hw-link').on('shown.bs.tab', function (e) {
        table_type_2.columns.adjust().draw();
    });


    //ADD HW CAPACITY OVERRIDE FIELDS
    $(".btn-add-hw").on("click", function(){
        let val = $(".input-select-type2").val().split("|");
        let start_options = renderWeeksType2(weeks, '', "EFF_START");
        let end_options = renderWeeksType2(weeks, '', "EFF_END");
        let inputs = renderInputsType2(val, start_options, end_options);
        
        let is_exists = existingFieldType2(val[1], val[3], val[4]);

        if (!is_exists) {
            $(".empty-filler-type2").removeClass('d-flex').hide();
            $(".input-container-type2").prepend(inputs);

            // dup_counter = existingRecordType2(JSON.parse(existing_capacity), "ADD_HW");
            // $(".btn-save-type2").prop("disabled", (dup_counter > 0) ? true : false);

            // if (dup_counter == 0) {
                calculateGenpoolCapacityType2(val[1], val[3], val[4]);
            // }
        }
        else{
            showGenericAlertType2("warning", ""+val[1]+"\n"+val[0]+"\nis already selected.");
        }
    });

    //VALIDATE OVERRIDE VALUE - INCREMENTAL BY .5 ONLY
    let debounceTimerType2;
    $(document).delegate(".input-override-type2", "input", function(){
        let identifier = $(this).attr("identifier");
        let cap_val = $(this).val();

        $(".loader-override-type2").removeClass('d-none').fadeIn();
        $(".btn-save-type2").prop("disabled", true);

        clearTimeout(debounceTimerType2);
        debounceTimerType2 = setTimeout(() => {
            if (cap_val.endsWith('.') && !isNaN(parseFloat(cap_val))) {
                $('.input-override-type2[identifier="'+identifier+'"]').val("");
            }
            else{
                if (cap_val != '') {
                    // if (parseFloat(cap_val) % 0.5 !== 0) {
                    //     showGenericAlertType2("error", "Invalid Override Capacity!");
                    //     $('.input-override-type2[identifier="'+identifier+'"]').val("");
                    // }
                    // else{
                        $(".btn-save-type2").prop("disabled", false);
                    // }
                }
            }
            $(".loader-override-type2").fadeOut();
        }, 1000);
    });

    //VALIDATE OVERLAPPING WEEKS BASED ON EFF_START & EFF_END (ONCHANGE EVENT)
    $(document).delegate(".input-start-select-type2, .input-end-select-type2", "change", function(){
        let identifier = $(this).attr("identifier");
        let hw_name = $('.input-hw-text-type2[identifier="'+identifier+'"]').val();
        let site_num = $('.input-site-hidden-type2[identifier="'+identifier+'"]').val();
        let res_area = $('.input-res-hidden-type2[identifier="'+identifier+'"]').val();
        let new_eff_start = $('.input-start-select-type2[identifier="'+identifier+'"]').val();
        let new_eff_end = $('.input-end-select-type2[identifier="'+identifier+'"]').val();
        let is_valid = weekNumChecker(new_eff_start, new_eff_end, identifier);
        
        if (is_valid) {
            calculateGenpoolCapacityType2(hw_name, site_num, res_area);
        }
    });

    $(document).delegate(".edit-week-type2", "change", function(){
        let id = $(".edit-id-type2").val();
        let hw_name = $('.edit-hw-nm-type2').val().toUpperCase();
        let site_num = $('.edit-site-num-type2').val();
        let res_area = $('.edit-res-area-type2').val();

        let eff_start = $(".edit-start-type2").val();
        let eff_end = $(".edit-end-type2").val();
        let trim_start = parseInt(eff_start.replace("_W", ""));
        let trim_end = parseInt(eff_end.replace("_W", ""));

        let result = (trim_start > trim_end) ? true : false;
        let border = (result) ? 'border-danger' : 'border-success';
        $(".edit-start-type2, .edit-end-type2").removeClass('border-success border-danger');
        $(".edit-start-type2, .edit-end-type2").addClass(border);
        $(".btn-edit-data-type2").prop("disabled", result);
        
        if (!result) {
            calculateGenpoolCapacityType2Edit(hw_name, site_num, res_area, id);
        }
    });

    //VALIDATE OVERRIDE CAP IF HARDWARE HAS DEDICATED MAPPINGS
    $(".edit-override-type2").on("input", function(){

        let new_override_cap = parseFloat($(this).val());
        let hw_name = $(this).attr("data-hw-name");
        let dedicated_cap = 0;
        let override_start = parseInt($(".edit-start-type2").val().replace("_W", ""));
        let override_end = parseInt($(".edit-end-type2").val().replace("_W", ""));
        let mappings = JSON.parse(existing_mapping);
        let res_cap = 0;
        let affected_arr = [];
        let btn_status = false;

        $.each(mappings, function(index, item){
            let mapping_hw_name = item['GENPOOL'];
            let mapping_start = parseInt(item['EFF_START'].replace("_W", ""));
            let mapping_end = parseInt(item['EFF_END'].replace("_W", ""));

            if (hw_name == mapping_hw_name) {
                if (override_start <= mapping_end && mapping_start <= override_end) {
                    dedicated_cap += parseFloat(item['CAPACITY']);
                    if (item['HW_TYPE'] == "DEDICATION") {
                        affected_arr.push(item);
                    }
                }
            }

        });

        res_cap = new_override_cap - dedicated_cap;

        if (!$.isNumeric(res_cap)) {
            return;
        }

        if (res_cap < 0) {
            $(".affected-container-type2").empty();
            let rows = "";
            $.each(affected_arr, function(index, item){
                rows += "<tr><td>"+item['MFG_PART_NUM']+"</td><td>"+item['HW_NM']+"</td><td>"+item['GENPOOL']+"<br>"+item['GP_HW_TYPE']+"</td><td>"+parseFloat(item['CAPACITY'])+"</td></tr>";
            });
            
            $(".affected-container-type2").append(rows);
            $(".alert-exceeded-type2").fadeIn();
            btn_status = true;
        }
        else{
            $(".alert-exceeded-type2").fadeOut();
        }

        $(".btn-edit-data-type2").prop("disabled", btn_status);
    });

    //VALIDATE OVERLAPPING WEEKS BASED ON HW NAME
    $(document).delegate(".input-hw-text-type2", "input", function(){
        let identifier = $(this).attr("identifier");
        let hw_name = $(this).val().toUpperCase();
        let site_num = $('.input-site-hidden-type2[identifier="'+identifier+'"]').val();
        let res_area = $('.input-res-hidden-type2[identifier="'+identifier+'"]').val();
        calculateGenpoolCapacityType2(hw_name, site_num, res_area);
    });

    $(".edit-hw-nm-type2").on("input", function(){
        let id = $(".edit-id-type2").val();
        let hw_name = $(this).val().toUpperCase();
        let site_num = $('.edit-site-num-type2').val();
        let res_area = $('.edit-res-area-type2').val();
        calculateGenpoolCapacityType2Edit(hw_name, site_num, res_area, id);
    });

    //CSV MASS UPLOAD - TYPE2
    var csv_delete_id_arr_type2 = [];
    $(".btn-upload-type2").on("click", function(){
        let target_id_arr = $.unique(JSON.parse(existing_capacity).map(item => item.ID));
        if ($(".input-csv-type2").get(0).files.length > 0) {
            let file = $(".input-csv-type2")[0].files[0];
            var reader = new FileReader();
            $(".error-container-type2").addClass("d-none");
            $(".csv-error-tbody-type2").empty();
            reader.addEventListener('load', function(e) {
                var text = e.target.result.split("\r\n");

                let unaffected = [];
                let hw_opt = [];
                let gp_hw_arr = [];
                let errors = [];
                let invalid = [];
                let invalid_target_id = [];
                let target_id_passed = [];
                
                $.each(text, function(index, item){
                    if (item != "" && item.split(",")[0] != 'HW_NAME') {
                        let gp_hw     = item.split(",")[0];
                        let site_num  = item.split(",")[1];
                        let res_area  = item.split(",")[2];
                        let start     = item.split(",")[3];
                        let end       = item.split(",")[4];
                        let override  = item.split(",")[5];
                        let current   = item.split(",")[6];
                        let hw_type   = item.split(",")[7];
                        let action    = item.split(",")[8];
                        let target_id = item.split(",")[9];
                        let raw_start = start.replace("_W", "");
                        let raw_end   = end.replace("_W", "");
                        let error_type = "";

                        if ($.trim(action) != '') {
                            $.each(text, function(index2, item2){
                                if(index >= index2) return;
                                let uf_target_id_2 = item2.split(",")[9];
                                if (target_id == uf_target_id_2 && target_id != '' && uf_target_id_2 != '') {
                                    invalid_target_id.push(target_id);
                                    invalid_target_id.push(uf_target_id_2);
                                }
                            });

                            if ($.inArray(target_id, target_id_arr) !== -1 && $.inArray(target_id, invalid_target_id) === -1 && action == "DELETE") {
                                csv_delete_id_arr_type2.push(target_id);
                            }
                            else{
                                if (action == "UPDATE" || action == "DELETE") {
                                    if ($.trim(gp_hw) == '' && ($.trim(site_num) == '' || $.trim(res_area) == '' || $.trim(start) == '' || $.trim(override) == '')) {
                                        invalid.push({
                                            GP_HW:          gp_hw,
                                            SITE_NUM:       site_num,
                                            RES_AREA:       res_area,
                                            HW_TYPE:        hw_type,
                                            GENPOOL_QTY:    current,
                                            REQUIRED_QTY:   override,
                                            EFF_START:      start, 
                                            EFF_END:        end,
                                            ACTION:         action,
                                            TARGET_ID:      target_id,
                                            ERROR:          'INVALID ROW'
                                        });
                                    }
                                    else{

                                        if ($.inArray(gp_hw, gp_hw_arr) === -1) {
                                            gp_hw_arr.push(gp_hw);
                                        }

                                        if ($.trim(target_id) == '' || target_id == '') {
                                            concat = (error_type != "") ? "|" : "";
                                            error_type += concat+"MISSING TARGET_ID";
                                        }
                                        else{
                                            if ($.inArray(target_id, target_id_arr) === -1) {
                                                concat = (error_type != "") ? "|" : "";
                                                error_type += concat+"INVALID TARGET_ID";
                                            }
    
                                            if(invalid_target_id.length > 0){
                                                if ($.inArray(target_id, invalid_target_id) !== -1) {
                                                    concat = (error_type != "") ? "|" : "";
                                                    error_type += concat+"DUPLICATE TARGET_ID";
                                                }
                                            }
                                        }
                                        
                                        if (error_type != "") {
                                            errors.push({
                                                GP_HW:          gp_hw,
                                                SITE_NUM:       site_num,
                                                RES_AREA:       res_area,
                                                HW_TYPE:        hw_type,
                                                GENPOOL_QTY:    current,
                                                REQUIRED_QTY:   override,
                                                EFF_START:      start, 
                                                EFF_END:        end,
                                                ACTION:         action,
                                                TARGET_ID:      target_id,
                                                ERROR:          error_type
                                            });
                                            target_id_passed.push(target_id);
                                        }
                                    }
                                }
                            }
                        }

                        if ($.trim(gp_hw) != '' && $.trim(site_num) != '' && $.trim(res_area) != '' && $.trim(start) != '' && $.trim(override) != '' && $.trim(hw_type) != '' && action != 'DELETE') {
                            
                            if ($.inArray(gp_hw, gp_hw_arr) === -1) {
                                gp_hw_arr.push(gp_hw);
                            }
                            
                            override = parseFloat(override);
                            raw_start = parseInt(raw_start);
                            raw_end = parseInt(raw_end);
                            
                            if ((raw_start > raw_end)  || (override == 0) || (action != 'ADD' && (target_id == '' || $.inArray(target_id, target_id_arr) === -1))) {
                                //EFF_START MUST NOT BE GREATER THAN EFF_END
                                if (raw_start > raw_end) {
                                    concat = (error_type != "") ? "|" : "";
                                    error_type += concat+"EFF_START > EFF_END";
                                }

                                //CAPACITY MUST NOT BE ZERO
                                if (override == 0) {
                                    concat = (error_type != "") ? "|" : "";
                                    error_type += concat+"CAPACITY MUST BE GREATER THAN ZERO";
                                }

                                let process_arr = ['ADD', 'UPDATE'];
                                if ($.inArray(action, process_arr) === -1) {
                                    concat = (error_type != "") ? "|" : "";
                                    error_type += concat+"INVALID PROCESS TYPE";
                                }
                                else{
                                    if (action == "UPDATE") {
                                        if ($.trim(target_id) == '' || target_id == '') {
                                            concat = (error_type != "") ? "|" : "";
                                            error_type += concat+"MISSING TARGET_ID";
                                        }
                                        else{
                                            if ($.inArray(target_id, target_id_arr) === -1) {
                                                concat = (error_type != "") ? "|" : "";
                                                error_type += concat+"INVALID TARGET_ID";
                                            }
                                        }
                                    }
                                }

                                if ($.inArray(target_id, target_id_passed) === -1) {
                                    errors.push({
                                        GP_HW:          gp_hw,
                                        SITE_NUM:       site_num,
                                        RES_AREA:       res_area,
                                        HW_TYPE:        hw_type,
                                        GENPOOL_QTY:    current,
                                        REQUIRED_QTY:   override,
                                        EFF_START:      start, 
                                        EFF_END:        end,
                                        ACTION:         action,
                                        TARGET_ID:      target_id,
                                        ERROR:          error_type
                                    });
                                }
                            }
                            else{
                                if ($.inArray(target_id, invalid_target_id) !== -1) {
                                    return true;
                                }

                                unaffected.push({
                                    GP_HW:          gp_hw,
                                    SITE_NUM:       site_num,
                                    RES_AREA:       res_area,
                                    HW_TYPE:        hw_type,
                                    GENPOOL_QTY:    current,
                                    REQUIRED_QTY:   override,
                                    EFF_START:      start, 
                                    EFF_END:        end,
                                    ACTION:         action,
                                    TARGET_ID:      target_id,
                                    ERROR:          'CLEARED'
                                });
                                hw_opt.push([
                                    gp_hw,
                                    site_num,
                                    res_area,
                                    start,
                                    end,
                                    current,
                                    override,
                                    hw_type,
                                    'null',
                                    gp_hw,
                                ]);
                            }

                        }
                        else{

                            if (action == 'DELETE') {
                                return true;
                            }

                            if ($.trim(gp_hw) != '') {
                                gp_hw_arr.push(gp_hw);
                            }

                            if ($.trim(gp_hw) == '' || $.trim(site_num) == '' || $.trim(res_area) == '' || $.trim(start) == '' || $.trim(override) == '') {
                                invalid.push({
                                    GP_HW:          gp_hw,
                                    SITE_NUM:       site_num,
                                    RES_AREA:       res_area,
                                    HW_TYPE:        hw_type,
                                    GENPOOL_QTY:    current,
                                    REQUIRED_QTY:   override,
                                    EFF_START:      start, 
                                    EFF_END:        end,
                                    ACTION:         action,
                                    TARGET_ID:      target_id,
                                    ERROR:          "INVALID ROW"
                                });
                            }
                            else{
                                override = (override != '') ? parseFloat(override) : '';
                                raw_start = parseInt(raw_start);
                                raw_end = parseInt(raw_end);
    
                                let error_type = "EMPTY CELL";
    
                                if ((raw_start > raw_end)  || (override == 0)) {
                                    //EFF_START MUST NOT BE GREATER THAN EFF_END
                                    if (raw_start != '' && raw_end != '') {
                                        if (raw_start > raw_end) {
                                            error_type += "|EFF_START > EFF_END";
                                        }
                                    }
    
                                    //CAPACITY MUST NOT BE ZERO
                                    if (override == 0 && override != '') {
                                        error_type += "|CAPACITY MUST BE GREATER THAN ZERO";
                                    }
                                }
    
                                errors.push({
                                    GP_HW:          gp_hw,
                                    SITE_NUM:       site_num,
                                    RES_AREA:       res_area,
                                    HW_TYPE:        hw_type,
                                    GENPOOL_QTY:    current,
                                    REQUIRED_QTY:   override,
                                    EFF_START:      start, 
                                    EFF_END:        end,
                                    ACTION:         action,
                                    TARGET_ID:      target_id,
                                    ERROR:          error_type
                                });
                            }
                        }
                    }
                });

                //FILTER OUT DUPLICATE ERRORS & INVALID ARRAYS
                function stringifySkipping(obj, skipKey) {
                    return JSON.stringify(obj, function(key, value) {
                        if (key === skipKey) return undefined;  // skip this key
                        return value;
                    });
                }

                let to_splice = [];
                if (errors.length > 0 && invalid.length > 0) {
                    $.each(errors, function(idx1, itm1){
                        let val1 = stringifySkipping(itm1, "ERROR");
                        $.each(invalid, function(idx2, itm2){
                            let val2 = stringifySkipping(itm2, "ERROR");
                            if (val1 == val2) {
                                to_splice.push(idx1);
                            }
                        });
                    });
                }
                
                $.each(to_splice, function(index, item){
                    errors.splice(item, 1);
                });

                if (unaffected.length == 0 && errors.length == 0 && csv_delete_id_arr_type2.length == 0 && invalid.length > 0) {
                    showGenericAlertType2("error", "Error: 0 valid rows found in the CSV. All rows failed validation. Please correct the data and retry.");
                    return;
                }

                //GET GENPOOL HW CAPACITY THEN DO ANOTHER ROUND OF VALIDATIONS (CAPACITY CHECK, OVERLAPPING WEEKS)
                searchGenpoolType2(gp_hw_arr, hw_opt, unaffected, errors, invalid, csv_delete_id_arr_type2);
            });
            reader.readAsText(file);
        }
        else{showGenericAlertType2("error", "Please select a File!");}
    });

    //DOWNLOAD CSV ERRORS - TYPE 1 UPLOAD CSV
    $('.btn-csv-error-type2').click(function() {
        const data = [];
        data.push([
            "HW_NAME",
            "SITE_NUM",
            "RES_AREA",
            "EFF_START",
            "EFF_END",
            "OVERRIDE_CAP",
            "HMS_COUNT",
            "HW_TYPE",
            "PROCESS_TYPE",
            "TARGET_ID",
            "ERROR"
        ]);
        $.each(JSON.parse(sessionStorage.getItem("csv-error-type2")), function(index, item){
            data.push([
                item['GP_HW'],
                item['SITE_NUM'],
                item['RES_AREA'],
                item['EFF_START'],
                item['EFF_END'],
                item['REQUIRED_QTY'],
                item['GENPOOL_QTY'],
                item['HW_TYPE'],
                item['ACTION'],
                item['TARGET_ID'],
                item['ERROR']
            ]);
        });

        // Convert array data to CSV format
        let csvContent = "data:text/csv;charset=utf-8,";
        data.forEach(rowArray => {
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
        });

        // Encode and trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "data.csv");
        document.body.appendChild(link); // Required for Firefox

        link.click(); // Trigger download
        document.body.removeChild(link); // Clean up
    });

    //SAVE HW CAPACITY OVERRIDE
    $(".btn-save-type2").on("click", function(){
        let data = [];
        let idtf_arr = [];
        let zero_cap = 0;
        let empty_counter = 0;

        $(".input-type2").each(function(){
            let identifier = $(this).attr("identifier");
            if ($.inArray(identifier, idtf_arr) === -1) {
                idtf_arr.push(identifier);
            }
        });

        $.each(idtf_arr, function(idx, itm){
            let input_arr = [];
            $('.input-type2[identifier="'+itm+'"]').each(function(index, item){
                if ($(this).hasClass("required")) {
                    if ($(this).val() == '') {
                        empty_counter++;""
                        $(this).removeClass("border-success").addClass("border-danger");
                    }
                    if ($(this).hasClass("input-override-type2")) {
                        if ($(this).val() == '' || $(this).val() == 0) {
                            zero_cap++;
                            $(this).removeClass("border-success").addClass("border-danger");
                        }
                    }
                }
                val = $(this).val();

                if (index == 0) {
                    val = $(this).val().toUpperCase();
                }
                input_arr.push(val);
            });
            data.push(input_arr);
        });


        if (data.length > 0) {
            if (empty_counter == 0) {
                if (zero_cap > 0) {
                    showGenericAlertType2("error", "Hardware Capacity is Required!");
                    return;
                }
                console.log(data);
                // return;
                crudProcessType2("ADD_HW_CAPACITY", data, user_details, false);
            }
            else{
                showGenericAlertType2("error", "Please Fill All Required Fields!");
            }
        }
        else{
            showGenericAlertType2("error", "Please Add HW Capacity Override!");
        }
    });

    // //VIEW HW CAPACITY OVERRIDES - MODAL
    $(".btn-view-hw").on("click", function(){
        let data = JSON.parse($(this).attr("data"));
        preFillElementsType2(data);
    });

    //EDIT HW CAPACITY - MODAL
    $(".btn-edit-hw").on("click", function(){
        let data = JSON.parse($(this).attr("data"));
        preFillInputsType2(data);
    });

    //SAVE EDIT HW CAPACITY
    $(".btn-edit-data-type2").on("click", function(){
        let data = [];
        let empty = 0;
        let type = $(this).attr("process-type");
        $(".edit-data-type2").each(function(){
            data.push($(this).val());
        });

        if (data[2] == '' || data[3] == '' || data[4] == '') {
            empty++;
        }
        else{
            if (data[2] == 0) {
                showGenericAlertType2("error", "Override Capacity Must Be Greater Than Zero.");
                return;
            }
        }

        if (empty == 0 && data[2] != 0) {
            crudProcessType2(type, data, user_details, false);
        }
        else{
            showGenericAlertType2("error", "Please Fill All Required Fields.");
        }
    });


    //DELETE ALL HW CAPACITY OVERRIDES - ALERT
    $(".btn-delete-type2-all").on("click", function(){
        let data = [];
        let title = 'Delete HW Capacity Overrides';
        let msg = 'Are you sure you want to delete: <br/>';
        let items = '';
        $(".type2-check:checked").each(function(){
            let parsed = JSON.parse($(this).val());
            data.push(parsed);
            items += '<b>'+parsed['HW_NM']+' <br/> '+parsed['HW_TYPE']+'</b><hr/>';
        });
        showDeleteAlertType2(title, msg+items, data, 'DELETE_HW_CAPACITY', user_details);
    });

    //DELETE ALL HW CAPACITY OVERRIDES - SELECTION
    $(".type2-check-all").on("click", function(){
        let is_checked = $(this).is(":checked");
        if (is_checked) {
            $(".btn-delete-type2-container").removeClass("d-none");
        }
        else{
            $(".btn-delete-type2-container").addClass("d-none");
        }
        $(".type2-check").each(function(){
            $(this).prop("checked", is_checked);
        });
    });

    //DELETE MULTIPLE HW CAPACITY OVERRIDES - SELECTION
    $(".type2-check").on("click", function(){
        let is_checked = $(this).is(":checked");
        if (is_checked) {
            $(".btn-delete-type2-container").removeClass("d-none");
        }
        else{
            if ($(".type2-check:checked").length == 0) {
                $(".btn-delete-type2-container").addClass("d-none");
                $(".type2-check-all").prop("checked", false);
            }
        }
    });

});

//----------------------------------------------------------------------------DYNAMIC DATA RENDERING-------------------------------------------------------------------
function renderWeeksType2(fy_weeks, override_week = null, week_type){
    let options = '';
    let new_option = 0;
    $.each(JSON.parse(fy_weeks), function(index, item){
        let curr_year = item.toString().slice(2, 4);
        let week_num = item.toString().slice(-2);
        let fy_week = curr_year+'_W'+week_num;
        let selected = '';
        if (override_week != null && override_week != '') {
            if (override_week == fy_week) {
                selected = (override_week == fy_week) ? 'selected' : '';
                new_option++;
            }
        }
        else{
            if (week_type == "EFF_START" && index == 2) {
                selected = 'selected';
            }
            else if(week_type == "EFF_END" && index == 13){
                selected = 'selected';
            }
        }
        options += '<option value="'+fy_week+'" '+selected+'>'+fy_week+'</option>';
    });
    
    if (new_option == 0 && override_week != null && override_week != '') {
        options += '<option value="'+override_week+'" selected>'+override_week+'</option>';
    }
    
    return options;
}

function renderInputsType2(data, start_options, end_options){
    let rand_class =  Math.random().toString(36).slice(2, 8);

    let hw_name_field = '<div class="col-lg-2 col-md-4 col-sm-6">'+
                            '<div class="form-floating mb-3">'+
                                '<input identifier="input-type2-'+rand_class+'" type="text" class="form-control input-hw-text-type2 input-type2 border border-success required" site-val="'+data[3]+'" res-val="'+data[4]+'" value="'+data[1]+'" placeholder="" readonly>'+
                                '<label class="label-type">HW NAME - '+data[3]+' - '+data[4]+'</label>'+
                            '</div>'+
                        '</div>';
    let eff_start_field  = '<div class="col-lg-2 col-md-4 col-sm-6">'+
                                '<div class="form-floating mb-3">'+
                                    '<select identifier="input-type2-'+rand_class+'" class="form-select input-start-select-type2 input-type2 border border-success required" placeholder="">'+start_options+'</select>'+
                                    '<label class="label-type"><i class="fa-solid fa-asterisk"></i> EFF START</label>'+
                                '</div>'+
                            '</div>';

    let eff_end_field = '<div class="col-lg-2 col-md-4 col-sm-6">'+
                            '<div class="form-floating mb-3">'+
                                '<select identifier="input-type2-'+rand_class+'" class="form-select input-end-select-type2 input-type2 border border-success required" placeholder="">'+end_options+'</select>'+
                                '<label class="label-type"><i class="fa-solid fa-asterisk"></i> EFF END</label>'+
                            '</div>'+
                        '</div>';
    
    let override_field = '<div class="col-lg-2 col-md-4 col-sm-6">'+
                            '<div class="form-floating mb-3">'+
                                '<input identifier="input-type2-'+rand_class+'" type="text" class="form-control input-override-type2 input-type2 border border-success required" placeholder="">'+
                                '<label class="label-type"><i class="fa-solid fa-asterisk"></i> OVERRIDE CAP</label>'+
                            '</div>'+
                         '</div>';
                
    let current_field = '<div class="col-lg-2 col-md-4 col-sm-6">'+
                            '<div class="form-floating mb-3">'+
                                '<input identifier="input-type2-'+rand_class+'" readonly="" type="text" class="form-control input-current-type2 input-type2 border border-success" value="'+data[2]+'" placeholder="">'+
                                '<label class="label-type">HMS COUNT</label>'+
                            '</div>'+
                        '</div>';
            
    let hw_type_field = '<div class="col-lg-2 col-md-4 col-sm-6">'+
                            '<div class="input-group mb-3">'+
                                '<div class="form-floating">'+
                                    '<input identifier="input-type2-'+rand_class+'" readonly="" type="text" class="form-control input-type-type2 input-type2 border border-success" value="'+data[0]+'" placeholder="">'+
                                    '<label class="label-type">HW TYPE</label>'+
                                '</div>'+
                                '<button type="button" to-remove="input-type2-'+rand_class+'" class="btn btn-outline-danger btn-remove-type2 input-group-text">'+
                                    '<i class="fa-solid fa-xmark"></i>'+
                                '</button>'+
                            '</div>'+
                        '</div>';

    let hw_name_hidden = '<input identifier="input-type2-'+rand_class+'" type="hidden" class="form-control input-hw-hidden-type2 input-type2" value="'+data[1]+'">';
    let site_num_hidden = '<input identifier="input-type2-'+rand_class+'" type="hidden" class="form-control input-site-hidden-type2 input-type2" value="'+data[3]+'">';
    let res_area_hidden = '<input identifier="input-type2-'+rand_class+'" type="hidden" class="form-control input-res-hidden-type2 input-type2" value="'+data[4]+'">';

    let fields = hw_name_field+eff_start_field+eff_end_field+override_field+current_field+hw_type_field+hw_name_hidden+site_num_hidden+res_area_hidden;

    return '<div class="col-lg-12 input-type2-'+rand_class+'"><div class="row p-0 m-0">'+fields+'</div></div>';
}

function preFillElementsType2(data){
    let h1_type;
    let h1_record;
    $(".view-override-container-type2, .view-current-container-type2, .view-site-num-container-type2, .view-res-area-container-type2").hide();
    h1_type = 'HW Capacity Override'
    h1_record = data['HW_NM'];
    $(".view-override-container-type2, .view-current-container-type2, .view-site-num-container-type2, .view-res-area-container-type2").show();
    $(".view-site-num-type2").html(data['SITE_NUM']);
    $(".view-res-area-type2").html(data['RES_AREA']);
    $(".view-override-type2").html(data['OVERRIDE_CAP']);
    $(".view-current-type2").html(data['CURRENT_CAP']);
    $(".view-type-h1-type2").html(h1_type);
    $(".view-record-h1-type2").html(h1_record);
    $(".view-hw-nm-type2").html(data['HW_NM']);
    $(".view-start-type2").html(data['EFF_START']);
    $(".view-end-type2").html(data['EFF_END']);
    $(".view-hw-type-type2").html(data['HW_TYPE']);
    $(".view-created-at-type2").html(dateFormatterType2(data['CREATED_AT']));
    $(".view-created-by-type2").html(data['CREATED_BY']);
    $(".view-updated-at-type2").html((Date.parse(data['UPDATED_AT'])) ? dateFormatterType2(data['UPDATED_AT']) : '--/--/--');
    $("#modal-view-data-type2").modal('show');
}

function preFillInputsType2(data){
    let val_arr = [];
    let h1_type;
    let h1_record;
    let hw_name;
    let hw_type;
    let start;
    let end;
    let attr;
    let class_name;
    let created_at;
    let created_by;
    $(".edit-override-container-type2, .edit-current-container-type2").hide();
    $.each(data, function(index, item){
        let eff_start; 
        let eff_end;
        if (index == 'EFF_START' || index == 'EFF_END') {                    
            eff_start = renderWeeksType2(weeks, (index == 'EFF_START') ? item : '', "EFF_START");
            eff_end = renderWeeksType2(weeks, (index == 'EFF_END') ? item : '', "EFF_END");
        }
        if (index == 'EFF_START') {
            item = eff_start;
        }
        if (index == 'EFF_END') {
            item = eff_end;
        }
        val_arr.push(item);
    });
    
    h1_type = 'HW Capacity Override';
    h1_record = val_arr[1];
    hw_name = val_arr[1];
    hw_type = val_arr[6];
    start = val_arr[2];
    end = val_arr[3];
    site_num = val_arr[7];
    res_area = val_arr[8];
    created_at = val_arr[9];
    created_by = val_arr[10];
    updated_at = val_arr[11];
    $(".edit-override-container-type2, .edit-current-container-type2").show();
    $(".edit-override-type2").val(val_arr[4]);
    $(".edit-override-type2").attr("data-hw-name", hw_name);
    $(".edit-current-type2").val(val_arr[5]);
    attr = 'EDIT_HW_CAPACITY';
    class_name = 'btn-edit-hw-type2';
    
    $(".edit-type-h1-type2").html(h1_type);
    $(".edit-record-h1-type2").html(h1_record);
    $(".edit-id-type2").val(val_arr[0]);
    // $(".edit-genpool").val(genpool_hw);
    $(".edit-hw-nm-type2").val(hw_name);
    $(".edit-start-type2").html(start);
    $(".edit-end-type2").html(end);
    $(".edit-hw-type-type2").val(hw_type);
    $(".edit-site-num-type2").val(site_num);
    $(".edit-res-area-type2").val(res_area);
    $(".edit-created-at-type2").html(dateFormatterType2(created_at));
    $(".edit-updated-at-type2").html((Date.parse(updated_at)) ? dateFormatterType2(updated_at) : '--/--/--');
    $(".edit-created-by-type2").html(created_by);
    $(".btn-edit-data-type2").attr('process-type', attr).addClass(class_name);
    $(".alert-exceeded-type2").hide();
    $("#modal-edit-data-type2").modal('show');
}

//----------------------------------------------------------------------------------VALIDATIONS------------------------------------------------------------------------
function existingFieldType2(data, data2, data3){
    
    let existing_counter = 0;
    $(".input-hw-text-type2").each(function(){
        let site_num = $(this).attr("site-val");
        let res_area = $(this).attr("res-val");
        if (data == $(this).val() && site_num == data2 && res_area == data3) {
            existing_counter++;
        }
    });

    return (existing_counter > 0) ? true : false;
}

function weekNumChecker(eff_start, eff_end, identifier){
    let dup_counter = 0;
    let trim_start = parseInt(eff_start.replace("_W", ""));
    let trim_end = parseInt(eff_end.replace("_W", ""));

    let result = (trim_start > trim_end) ? true : false;
    let border = (result) ? 'border-danger' : 'border-success';
    let disable = (dup_counter > 0) ? (result == false) ? true : result : (result == true) ? result : false;
    $('.input-start-select-type2[identifier="'+identifier+'"], .input-end-select-type2[identifier="'+identifier+'"]').removeClass('border-success border-danger');
    $('.input-start-select-type2[identifier="'+identifier+'"], .input-end-select-type2[identifier="'+identifier+'"]').addClass(border);
    $(".btn-save-type2").prop("disabled", disable);
    return (result == true) ? false : true;
}

function calculateGenpoolCapacityType2(target_hw = null, site_num, res_area){

    let data = [];
    let idtf_arr = [];
    let overlap_count = 0;

    if (JSON.parse(existing_capacity).length > 0) {
        $.each(JSON.parse(existing_capacity), function(index, item){
            if (item['HW_NM'] == target_hw && item['SITE_NUM'] == site_num && item['RES_AREA'] == res_area) {
                data.push([
                    item['HW_NM'],
                    item['EFF_START'],
                    item['EFF_END'],
                    item['OVERRIDE_CAP'],
                    item['CURRENT_CAP'],
                    item['HW_TYPE'],
                    'NOT_AVAILABLE',
                    item['SITE_NUM'],
                    item['RES_AREA'],
                    'EXISTING_DATA'
                ]);
            }
        });
    }

    $(".input-type2").each(function(){
        let identifier = $(this).attr("identifier");
        if ($.inArray(identifier, idtf_arr) === -1) {
            idtf_arr.push(identifier);
        }
    });

    $.each(idtf_arr, function(idx, itm){
        let input_arr = [];
        $('.input-type2[identifier="'+itm+'"]').each(function(index, item){
            val = $(this).val();

            if (index == 0) {
                val = $(this).val().toUpperCase();
            }
            if (index == 6) {
                val = itm;
            }
            input_arr.push(val);
        });
        data.push(input_arr);
    });
    
    //OVERLAP WEEKS CHECKER
    $.each(data, function(index1, item1){ //FINISH EDIT PORTION AND TYPE 3
        let hw_nm1 = item1[0];
        let type1 = item1[5];
        let idtf1 = item1[6];
        let site1 = item1[7];
        let res1 = item1[8];
        let eff_start_1 = parseInt(item1[1].replace("_W", ""));
        let eff_end_1 = parseInt(item1[2].replace("_W", ""));
        
        if (data.length > 1) {
            $.each(data, function(index2, item2){
                if (index1 >= index2) return;
                let to_add_class = "";
                let to_remove_class = "";
                let hw_nm2 = item2[0];
                let type2 = item2[5];
                let idtf2 = item2[6];
                let site2 = item2[7];
                let res2 = item2[8];
                let eff_start_2 = parseInt(item2[1].replace("_W", ""));
                let eff_end_2 = parseInt(item2[2].replace("_W", ""));
                let target_idtf = "";

                if (hw_nm1 == hw_nm2 && type1 == type2 && site1 == site2 && res1 == res2) {
                    let is_overlapping = eff_start_1 <= eff_end_2 && eff_start_2 <= eff_end_1;
                    if (is_overlapping) {
                        overlap_count++;
                        target_idtf = (idtf1 != 'NOT_AVAILABLE') ? idtf1 : idtf2;
                    }
                }
                
                if (overlap_count > 0) {
                    to_add_class = "border-danger";
                    to_remove_class = "border-success";
                }
                else{
                    to_add_class = "border-success";
                    to_remove_class = "border-danger";
                }
                
                if (target_idtf != '') {
                    if (target_idtf.includes("input-type2")) {
                        $('.input-start-select-type2[identifier="'+target_idtf+'"]').removeClass(to_remove_class).addClass(to_add_class);
                        $('.input-end-select-type2[identifier="'+target_idtf+'"]').removeClass(to_remove_class).addClass(to_add_class);
                    }
                }

                // if (idtf2 != 'NOT_AVAILABLE') {
                //     if (idtf2.includes("input-type2")) {
                //         $('.input-start-select-type2[identifier="'+idtf2+'"]').removeClass(to_remove_class).addClass(to_add_class);
                //         $('.input-end-select-type2[identifier="'+idtf2+'"]').removeClass(to_remove_class).addClass(to_add_class);
                //     }
                // }
            });
        }
        else{
            $('.input-start-select-type2[identifier="'+idtf1+'"]').removeClass("border-danger").addClass("border-success");
            $('.input-end-select-type2[identifier="'+idtf1+'"]').removeClass("border-danger").addClass("border-success");
        }

    });
    
    let is_disabled = (overlap_count > 0) ? true : false
    $(".btn-save-type2").prop("disabled", is_disabled);
}

function calculateGenpoolCapacityType2Edit(target_hw = null, site_num, res_area, existing_id){

    let data = [];
    let input_arr = [];
    let overlap_count = 0;

    if (JSON.parse(existing_capacity).length > 0) {
        $.each(JSON.parse(existing_capacity), function(index, item){
            if (item['HW_NM'] == target_hw && item['SITE_NUM'] == site_num && item['RES_AREA'] == res_area && item['ID'] != existing_id) {
                data.push([
                    item['ID'],
                    item['HW_NM'],
                    item['OVERRIDE_CAP'],
                    item['EFF_START'],
                    item['EFF_END'],
                    item['CURRENT_CAP'],
                    item['HW_TYPE'],
                    item['SITE_NUM'],
                    item['RES_AREA'],
                    'EXISTING_DATA'
                ]);
            }
        });
    }

    $(".edit-data-type2").each(function(){
        if ($(this).val() != '' && $(this).val() != null) {
            input_arr.push($(this).val().toUpperCase());
        }
    });
    
    data.push(input_arr);

    //OVERLAP WEEKS CHECKER
    $.each(data, function(index1, item1){
        let hw_nm1 = item1[1];
        let type1 = item1[6];
        let site1 = item1[7];
        let res1 = item1[8];
        let eff_start_1 = parseInt(item1[3].replace("_W", ""));
        let eff_end_1 = parseInt(item1[4].replace("_W", ""));
        
        if (data.length > 1) {
            $.each(data, function(index2, item2){
                if (index1 >= index2) return;
                let hw_nm2 = item2[1];
                let type2 = item2[6];
                let site2 = item2[7];
                let res2 = item2[8];
                let eff_start_2 = parseInt(item2[3].replace("_W", ""));
                let eff_end_2 = parseInt(item2[4].replace("_W", ""));
    
                if (hw_nm1 == hw_nm2 && type1 == type2 && site1 == site2 && res1 == res2) {
                    let is_overlapping = eff_start_1 <= eff_end_2 && eff_start_2 <= eff_end_1;
                    if (is_overlapping) {
                        overlap_count++;
                    }
                }
    
            });
        }
        else{
            $('.edit-start-type2').removeClass("border-danger").addClass("border-success");
            $('.edit-end-type2').removeClass("border-danger").addClass("border-success");
        }

    });
    
    if (overlap_count > 0) {
        $('.edit-start-type2').removeClass("border-success").addClass("border-danger");
        $('.edit-end-type2').removeClass("border-success").addClass("border-danger");
        $('.btn-edit-data-type2').prop("disabled", true);
    }
    else{
        $('.edit-start-type2').removeClass("border-danger").addClass("border-success");
        $('.edit-end-type2').removeClass("border-danger").addClass("border-success");
        $('.btn-edit-data-type2').prop("disabled", false);
    }
}

function calculateGenpoolCapacityCSVType2(target_gp = null, subject_data, target_start){

    let data = [];
    let gp_cap_arr = [];
    let total_gp_cap_rem = 0;
    let error_str = "";

    if (JSON.parse(existing_capacity).length > 0) {
        $.each(JSON.parse(existing_capacity), function(index, item){
            if (item['HW_NM'] == target_gp) {
                data.push([
                    item['HW_NM'],
                    item['SITE_NUM'],
                    item['RES_AREA'],
                    item['EFF_START'],
                    item['EFF_END'],
                    item['OVERRIDE_CAP'],
                    'EXISTING_DATA',
                    item['HW_TYPE'],
                    item['CURRENT_CAP'],
                    item['ID']
                ]);
            }
        });
    }

    $.each(subject_data, function(index, item){
        if (item['EFF_START'] != '' && item['EFF_END'] != '' && item['GP_HW'] != '' && item['REQUIRED_QTY'] && item['GENPOOL_QTY'] != '') {
            if (item['GP_HW'] == target_gp) {
                data.push([
                    item['GP_HW'],
                    item['SITE_NUM'],
                    item['RES_AREA'],
                    item['EFF_START'],
                    item['EFF_END'],
                    item['REQUIRED_QTY'],
                    '',
                    item['HW_TYPE'],
                    item['GENPOOL_QTY'],
                    (item['ACTION'] == 'ADD') ? '' : item['TARGET_ID']
                ]);

                gp_cap_arr[item['GP_HW']] = parseFloat(item['GENPOOL_QTY']);
            }
        }
    });

    //OVERLAP WEEKS CHECKER
    if (data.length > 0) {
        $.each(data, function(index1, item1){
            let hw_nm1 = item1[0];
            let eff_start_1 = parseInt(item1[3].replace("_W", ""));
            let eff_end_1 = parseInt(item1[4].replace("_W", ""));
            let target_id_1 = item1[9];
            
            if (data.length > 1) {
                $.each(data, function(index2, item2){
                    if (index1 >= index2) return;
                    let hw_nm2 = item2[0];
                    let eff_start_2 = parseInt(item2[3].replace("_W", ""));
                    let eff_end_2 = parseInt(item2[4].replace("_W", ""));
                    let target_id_2 = item2[9];

                    if (hw_nm1 == hw_nm2) {

                        if(target_id_1 != "" && target_id_2 != ""){
                            if (target_id_1 == target_id_2) {
                                return true;
                            }
                        }

                        let is_overlapping = eff_start_1 <= eff_end_2 && eff_start_2 <= eff_end_1;
                        if (is_overlapping) {
                            // overlap_count++;
                            error_str = "OVERLAPPING WEEKS ("+hw_nm1+" - "+hw_nm2+")";
                        }
                    }
                });
            }
        });
    }

    // let new_eff_start = parseInt(target_start.replace("_W", ""));
    // let genpool_hw = target_gp;
    // let total_gp_cap = gp_cap_arr[genpool_hw];
    // let capacityByWeek = {};

    // $.each(data, function(index, item){
    //     if (item[0] == genpool_hw) {
    //         let hw_cap = parseFloat(item[5]);
    //         let eff_start = parseInt(item[3].replace("_W", ""));
    //         let eff_end = parseInt(item[4].replace("_W", ""));
            
    //         for (var week = eff_start; week <= eff_end; week++) {
    //             if (typeof capacityByWeek[week] === 'undefined') {
    //                 capacityByWeek[week] = total_gp_cap;
    //             }
    //             capacityByWeek[week] -= hw_cap;
    //         }

    //         var weeks = Object.keys(capacityByWeek).map(function(w) {
    //             return parseInt(w);
    //         });

    //         var minWeek = Math.min.apply(null, weeks);
    //         var maxWeek = Math.max.apply(null, weeks);

    //         for (var week = minWeek; week <= maxWeek; week++) {
    //             if (typeof capacityByWeek[week] === 'undefined') {
    //                 capacityByWeek[week] = total_gp_cap;
    //             }
    //         }
    //     }
    // });
    // total_gp_cap_rem = capacityByWeek[new_eff_start];

    // if (total_gp_cap_rem < 0) {
    //     let delimiter = "";
    //     if (error_str != "") {
    //         delimiter = "|";
    //     }
    //     error_str += delimiter+"MAX CAPACITY LIMIT REACHED";
    // }

    return error_str;
}

//-------------------------------------------------------------------------------------API-----------------------------------------------------------------------------

function searchGenpoolType2(genpool_hw, hw_opt, unaffected, errors, invalid, csv_delete_id_arr_type2){
    
    if (errors.length == 0 && unaffected.length == 0) {

        $(".btn-validate-csv-type2").fadeIn();

        setTimeout(function(){
            $(".btn-validate-csv-type2").fadeOut();
            if (invalid.length > 0) {
                let subject_data = [];
                let row = '';
                $.each(invalid, function(index, item){
                    if (index <= 4) {
                        row += '<tr>'+
                            '<td>'+item['GP_HW']+'</td>'+
                            '<td>'+item['SITE_NUM']+'</td>'+
                            '<td>'+item['RES_AREA']+'</td>'+
                            '<td>'+item['EFF_START']+'</td>'+
                            '<td>'+item['EFF_END']+'</td>'+
                            '<td>'+item['REQUIRED_QTY']+'</td>'+
                            '<td>'+item['GENPOOL_QTY']+'</td>'+
                            '<td>'+item['HW_TYPE']+'</td>'+
                            '<td>'+item['ACTION']+'</td>'+
                            '<td>'+item['TARGET_ID']+'</td>'+
                            '<td class="text-danger">'+item['ERROR']+'</td>'+
                        '</tr>';
                    }
                    subject_data.push(item);
                });
        
                sessionStorage.setItem("csv-error-type2", JSON.stringify(subject_data));
                $(".error-container-type2").removeClass("d-none");
                $(".csv-error-tbody-type2").append(row);
                $(".csv-error-count-type2").text(invalid.length);
                return;
            }
            else{
                if (csv_delete_id_arr_type2.length > 0) {
                    crudProcessType2("DELETE_HW_CAPACITY_CSV", [], user_details, true, csv_delete_id_arr_type2);
                }
                return;
            }
        }, 1500);

    }

    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=SEARCH_GP_HW&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: genpool_hw},
        beforeSend: function(){
            $(".btn-validate-csv-type2").fadeIn();
        },
        success: function(data){
            setTimeout(function(){
                $(".btn-validate-csv-type2").fadeOut();
                let genpool_data = JSON.parse(data);
                let current_list_csv = [];
                let subject_data = [];
                let additional_errors = 0;
    
                // if (errors.length == 0) {
                //     subject_data = unaffected;
                // }
                // else{
                    $.each(unaffected, function(index, item){
                        let criteria = {HW_NM: item['GP_HW']};
                        let gp_cap = genpool_data.find(obj =>
                            Object.entries(criteria).every(([key, value]) => obj[key] === value)
                        );
                        if (typeof(gp_cap) != 'undefined') {
                            item['GENPOOL_QTY'] = gp_cap['REQUIRED_QTY'];
                        }
                        subject_data.push(item);
                    });
                    $.each(errors, function(index, item){
                        let criteria = {HW_NM: item['GP_HW']};
                        let gp_cap = genpool_data.find(obj =>
                            Object.entries(criteria).every(([key, value]) => obj[key] === value)
                        );
                        if (typeof(gp_cap) != 'undefined') {
                            item['GENPOOL_QTY'] = gp_cap['REQUIRED_QTY'];
                        }
                        subject_data.push(item);
                    });
                // }
    
                let temp_arr;
                var promises;
    
                function handleDataRecordFindType2(){
                    subject_data = temp_arr;
    
                    $.each(subject_data, function(index, item){
    
                        let trim_start = item.EFF_START.replace("_W", "");
                        let start_year = "20"+trim_start.slice(0, 2);
                        let start_week = trim_start.slice(-2);
    
                        if (item['ERROR'] == "RECORD_NOT_FOUND") {
                            errors.push(item);
                        }
    
                        //ADD OPENENDEDWEEKPROMISE
                        if (item['EFF_END'] == '') {
                                
                            promises = subject_data.map((item, index) => {
                                let trim_start_promise = item.EFF_START.replace("_W", "");
                                let start_year_promise = "20"+trim_start_promise.slice(0, 2);
                                let start_week_promise = trim_start_promise.slice(-2);
    
                                return getOpenEndedWeekPromiseType2(start_year_promise, start_week_promise).then(res => {
                                    subject_data[index]['EFF_END'] = res;
                                    new_eff_end = res;
                                    handleDataType2();
                                });
                            });
    
                            function handleDataType2() {
                                subject_data[index]['EFF_END'] = new_eff_end;
                            }
                            getOpenEndedWeekPromiseType2(start_year, start_week).then(function(res) {
                                new_eff_end = res;
                                handleDataType2();
                            });
                        }
                        
                        if (typeof(promises) != 'undefined') {
                            if (item['EFF_START'] != '' && item['EFF_END'] != '' && item['GENPOOL_QTY'] != '' && $.inArray(item['ERROR'], ['INVALID TARGET_ID', 'MISSING TARGET_ID', 'DUPLICATE TARGET_ID']) === -1) {
                                let res_gp = calculateGenpoolCapacityCSVType2(item['GP_HW'], subject_data, item['EFF_START']);
                                if (res_gp != '') {
                                    let error_str = "";
                                    let delimiter = (item['ERROR'] != "CLEARED") ? "|" : "";
                                    error_str = delimiter+res_gp;
                                    if (item['ERROR'] != "CLEARED") {
                                        item['ERROR'] += error_str;
                                    }
                                    else{
                                        item['ERROR'] = error_str;
                                        errors.push(item);
                                    }
                                    additional_errors++;
                                }
                            }
                            else{
                                if (item['GENPOOL_QTY'] == '') {
                                    let error_str = "";
                                    let delimiter = (item['ERROR'] != "CLEARED") ? "|" : "";
                                    error_str = delimiter+"GENPOOL HW NAME/SPEC NOT FOUND";
                                    if (item['ERROR'] != "CLEARED") {
                                        item['ERROR'] += error_str;
                                    }
                                    else{
                                        item['ERROR'] = error_str;
                                        errors.push(item);
                                    }
                                    additional_errors++;
                                }
                            }
                        }
                        else{
                            if (item['EFF_START'] != '' && item['EFF_END'] != '' && item['GENPOOL_QTY'] != '' && $.inArray(item['ERROR'], ['INVALID TARGET_ID', 'MISSING TARGET_ID', 'DUPLICATE TARGET_ID']) === -1) {
                                let res_gp = calculateGenpoolCapacityCSVType2(item['GP_HW'], subject_data, item['EFF_START']);
                                if (res_gp != '') {
                                    let error_str = "";
                                    let delimiter = (item['ERROR'] != "CLEARED") ? "|" : "";
                                    error_str = delimiter+res_gp;
                                    if (item['ERROR'] != "CLEARED") {
                                        item['ERROR'] += error_str;
                                    }
                                    else{
                                        item['ERROR'] = error_str;
                                        errors.push(item);
                                    }
                                    additional_errors++;
                                }
                            }
                            else{
                                if (item['GENPOOL_QTY'] == '') {
                                    let error_str = "";
                                    let delimiter = (item['ERROR'] != "CLEARED") ? "|" : "";
                                    error_str = delimiter+"GENPOOL HW NAME/SPEC NOT FOUND";
                                    if (item['ERROR'] != "CLEARED") {
                                        item['ERROR'] += error_str;
                                    }
                                    else{
                                        item['ERROR'] = error_str;
                                        errors.push(item);
                                    }
                                    additional_errors++;
                                }
                            }
                        }
    
                    });
    
                    // Wait for all AJAX calls to finish
                    if (typeof(promises) != "undefined") {
                        Promise.all(promises).then(() => {
                            // const copy = subject_data.map(item => item.EFF_END);
                            if (errors.length > 0 || additional_errors > 0) {
                                let row = '';
                                $.each(errors, function(index, item){
                                    if (index <= 4) {
                                        row += '<tr>'+
                                                    '<td>'+item['GP_HW']+'</td>'+
                                                    '<td>'+item['SITE_NUM']+'</td>'+
                                                    '<td>'+item['RES_AREA']+'</td>'+
                                                    '<td>'+item['EFF_START']+'</td>'+
                                                    '<td>'+item['EFF_END']+'</td>'+
                                                    '<td>'+item['REQUIRED_QTY']+'</td>'+
                                                    '<td>'+item['GENPOOL_QTY']+'</td>'+
                                                    '<td>'+item['HW_TYPE']+'</td>'+
                                                    '<td>'+item['ACTION']+'</td>'+
                                                    '<td>'+item['TARGET_ID']+'</td>'+
                                                    '<td class="text-danger">'+item['ERROR']+'</td>'+
                                                '</tr>';
                                    }
                                });
    
                                $.each(invalid, function(index, item){
                                    if (errors.length < 4) {
                                        if (index <= 4) {
                                            row += '<tr>'+
                                                        '<td>'+item['GP_HW']+'</td>'+
                                                        '<td>'+item['SITE_NUM']+'</td>'+
                                                        '<td>'+item['RES_AREA']+'</td>'+
                                                        '<td>'+item['EFF_START']+'</td>'+
                                                        '<td>'+item['EFF_END']+'</td>'+
                                                        '<td>'+item['REQUIRED_QTY']+'</td>'+
                                                        '<td>'+item['GENPOOL_QTY']+'</td>'+
                                                        '<td>'+item['HW_TYPE']+'</td>'+
                                                        '<td>'+item['ACTION']+'</td>'+
                                                        '<td>'+item['TARGET_ID']+'</td>'+
                                                        '<td class="text-danger">'+item['ERROR']+'</td>'+
                                                    '</tr>';
                                        }
                                    }
                                    subject_data.push(item);
                                });
    
                                sessionStorage.setItem("csv-error-type2", JSON.stringify(subject_data));
                                $(".error-container-type2").removeClass("d-none");
                                $(".csv-error-tbody-type2").append(row);
                                $(".csv-error-count-type2").text(errors.length + additional_errors);
                            }
                            else{
                                $.each(subject_data, function(index, item){
                                    current_list_csv.push([
                                        item['GP_HW'],
                                        item['EFF_START'],
                                        item['EFF_END'],
                                        item['REQUIRED_QTY'],
                                        item['GENPOOL_QTY'],
                                        item['HW_TYPE'],
                                        item['SITE_NUM'],
                                        item['RES_AREA'],
                                        (item['TARGET_ID'] != '') ? item['TARGET_ID'] : 'null',
                                        item['ACTION']
                                    ]);
                                });
                                crudProcessType2("ADD_HW_CAPACITY", current_list_csv, user_details, false, csv_delete_id_arr_type2);
                            }
                        });
                    }
                    else{
                        if (errors.length > 0 || additional_errors > 0) {
                            let row = '';
                            $.each(errors, function(index, item){
                                if (index <= 4) {
                                    row += '<tr>'+
                                                '<td>'+item['GP_HW']+'</td>'+
                                                '<td>'+item['SITE_NUM']+'</td>'+
                                                '<td>'+item['RES_AREA']+'</td>'+
                                                '<td>'+item['EFF_START']+'</td>'+
                                                '<td>'+item['EFF_END']+'</td>'+
                                                '<td>'+item['REQUIRED_QTY']+'</td>'+
                                                '<td>'+item['GENPOOL_QTY']+'</td>'+
                                                '<td>'+item['HW_TYPE']+'</td>'+
                                                '<td>'+item['ACTION']+'</td>'+
                                                '<td>'+item['TARGET_ID']+'</td>'+
                                                '<td class="text-danger">'+item['ERROR']+'</td>'+
                                            '</tr>';
                                }
                            });
    
                            $.each(invalid, function(index, item){
                                if (errors.length < 4) {
                                    if (index <= 4) {
                                        row += '<tr>'+
                                                    '<td>'+item['GP_HW']+'</td>'+
                                                    '<td>'+item['SITE_NUM']+'</td>'+
                                                    '<td>'+item['RES_AREA']+'</td>'+
                                                    '<td>'+item['EFF_START']+'</td>'+
                                                    '<td>'+item['EFF_END']+'</td>'+
                                                    '<td>'+item['REQUIRED_QTY']+'</td>'+
                                                    '<td>'+item['GENPOOL_QTY']+'</td>'+
                                                    '<td>'+item['HW_TYPE']+'</td>'+
                                                    '<td>'+item['ACTION']+'</td>'+
                                                    '<td>'+item['TARGET_ID']+'</td>'+
                                                    '<td class="text-danger">'+item['ERROR']+'</td>'+
                                                '</tr>';
                                    }
                                }
                                subject_data.push(item);
                            });
    
                            sessionStorage.setItem("csv-error-type2", JSON.stringify(subject_data));
                            $(".error-container-type2").removeClass("d-none");
                            $(".csv-error-tbody-type2").append(row);
                            $(".csv-error-count-type2").text(errors.length + additional_errors);
                        }
                        else{
                            $.each(subject_data, function(index, item){
                                current_list_csv.push([
                                    item['GP_HW'],
                                    item['EFF_START'],
                                    item['EFF_END'],
                                    item['REQUIRED_QTY'],
                                    item['GENPOOL_QTY'],
                                    item['HW_TYPE'],
                                    item['SITE_NUM'],
                                    item['RES_AREA'],
                                    (item['TARGET_ID'] != '') ? item['TARGET_ID'] : 'null',
                                    item['ACTION']
                                ]);
                            });
                            crudProcessType2("ADD_HW_CAPACITY", current_list_csv, user_details, false, csv_delete_id_arr_type2);
                        }
                    }
    
                }
    
                validateCSVrowDataPromiseType2(subject_data).then(function(res) {
                    temp_arr = res;
                    handleDataRecordFindType2();
                });
            }, 1500);

        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function getOpenEndedWeekPromiseType2(year, week){
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'post',
            url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=GET_OPEN_WEEK&OUTPUT_TYPE=BODS_JDA_ADI',
            data: {year: year, week: week},
            success: function(data) {
                let open_fyww = JSON.parse(data)[0];
                let open_year = open_fyww.toString().slice(2, 4);
                let open_week = open_fyww.toString().slice(-2);
                let result_week = open_year+'_W'+open_week;
                resolve(result_week);
            },
            error: function(xhr, status, error) {
                reject(error); 
            }
        });
    });
}

function validateCSVrowDataPromiseType2(src_data){ 
    return new Promise((resolve, reject) => {

        let hw_name_arr = $.map(src_data, function(item) {
            return item.GP_HW;
        });

        $.ajax({
            type: 'post',
            url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=SEARCH_HW&OUTPUT_TYPE=BODS_JDA_ADI',
            data: {payload: hw_name_arr},
            success: function(data){

                $.each(src_data, function(index, item){
                    // let src_genpool = item['GP_HW'];
                    let src_hw_type = item['HW_TYPE'];
                    let src_index   = index;

                    if (typeof(JSON.parse(data)[src_hw_type]) != 'undefined') {
                        let hw_type_arr = $.map(JSON.parse(data)[src_hw_type], function(item) {
                            return item.HW_TYPE;
                        });

                        if ($.inArray(src_hw_type, hw_type_arr) === -1) {
                            if (src_data[src_index]['ERROR'] == "CLEARED") {
                                src_data[src_index]['ERROR'] = 'RECORD_NOT_FOUND';
                            }
                            else{
                                src_data[src_index]['ERROR'] += "|RECORD_NOT_FOUND";
                            }
                        }
                    }
                    else{
                        if (src_data[src_index]['ERROR'] == "CLEARED") {
                            src_data[src_index]['ERROR'] = 'RECORD_NOT_FOUND';
                        }
                        else{
                            src_data[src_index]['ERROR'] += "|RECORD_NOT_FOUND";
                        }
                    }
                });

                resolve(src_data);
            },
            error: function(xhr, status, error) {
                reject(error); 
            }
        });

    });
}

function crudProcessType2(process, payload, user_details, is_csv, csv_delete_id_arr_type2 = []){

    

    if (is_csv) {
        showLoaderType2();
        csvMassDeleteType2(csv_delete_id_arr_type2);
        setTimeout(function(){
            showGenericAlertType2("success", "Record Deleted Successfully!");
            location.reload();
        }, 1500);
    }
    else{
        $.ajax({
            type: 'post',
            url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE='+process+'&OUTPUT_TYPE=BODS_JDA_ADI',
            data: {payload: payload, user_details: user_details},
            beforeSend: function(){
                showLoaderType2();
            },
            success: function(data){
                setTimeout(function(){
                    let alert_msg;

                    if (JSON.parse(data).hasOwnProperty('STATUS')) {
                        if (JSON.parse(data)['STATUS']) {
                            if (process.indexOf('DELETE') === -1) {
                                alert_msg = 'Saved';
                                console.log(JSON.parse(data)['CHANGE_LOG_DATA']);
                                addChangeLog(JSON.parse(data)['CHANGE_LOG_DATA'], user_details, "hw-override add capacity override");
                            }
                        }
                    }
                    else{
                        alert_msg = 'Deleted';
                    }

                    showGenericAlertType2("success", "Record "+alert_msg+" Successfully!");
                    if (csv_delete_id_arr_type2.length > 0) {
                        csvMassDeleteType2(csv_delete_id_arr_type2);
                    }
                    location.reload();
                }, 1500);
            },
            error: function(xhr, status, error) {
                console.log(xhr);
            }
        });
    }
}

//FOR CSV MASS UPLOAD - DELETE ONLY
function csvMassDeleteType2(data){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=DELETE_HW_CAPACITY_CSV&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: data, user_details: user_details},
        success: function(data){
            console.log(data);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function addChangeLog(payload, user_details, module){
    $.ajax({
        type: 'post',
        url: 'http://mxhtafot01l.maxim-ic.com/TEST/BRAIN_CHANGE_LOG.PHP',
        data: {payload: payload, user_details: user_details, module: module},
        success: function(data){
            console.log(data);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

// ------------------------------------------------------------------------------DATA MANIPULATION------------------------------------------------------------------------
function dateFormatterType2(date){
    return $.datepicker.formatDate('M dd, yy', new Date(date));
}


// -----------------------------------------------------------------------------------ALERTS------------------------------------------------------------------------------
function showGenericAlertType2(icon, title){
    Swal.fire({
        title: title,
        icon: icon
    });
}

function showDeleteAlertType2(title, msg, data, crud, user_details){
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
            crudProcessType2(crud, data, user_details, false);
        }
    });
}

function showLoaderType2(){
    Swal.fire({
        title: 'Processing... \n Please Wait!',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading()
        },
    });
}
