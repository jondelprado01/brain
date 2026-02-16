$(document).ready(function(){
    
    var hw_override_table = $(".table-dummy-type1").DataTable({
        // bPaginate: false,
        scrollY: 'calc(100vh - 650px)',
        bSort: false,
        responsive: true,
    });

    //ONLY PURPOSE - ADJUSTS COLUMN HEADERS
    $('.hw-link').on('shown.bs.tab', function (e) {
        hw_override_table.columns.adjust().draw();
    });

    $(".details-tooltip").tooltip();
    $(".remarks-type1").tooltip();
    var default_parts       = [];
    var current_list_db     = [];
    var current_list_csv    = [];
    
    //SET CURRENT TAB IN THE URL
    $(".hw-link").on("click", function(){
        let url = new URL($(location).attr('href'));
        let tab = $(this).attr("tab-name");
        url.searchParams.set("tab", tab);
        window.history.pushState('state', 'title', url.href);
    });
    
    //CHECK FILE EXTENSION
    $(".input-csv-type1, .input-csv-type2").on("change", function(){
        $(".alert-invalid").hide();
        let file_type = $(this).val().split('.').pop().toLowerCase();
        if (file_type != 'csv') {
            $(".alert-invalid").fadeIn();
            $(this).val('');
        }
    });

    // ------------------------------------------------------------------------------------EVENTS-------------------------------------------------------------------------

    //RESET ALL FIELDS (ALL MODALS)
    $(".btn-close-modal-type1, .btn-close-modal-type2").on("click", function(){
        let type = $(this).attr('process-type');        
        resetModals(type);
    });

    //RESET ALL INPUT FILES
    $(".btn-close-upload-type1, .btn-close-upload-type2").on("click", function(){
        let type = $(this).attr('process-type');
        $(".input-csv-"+type+"").val('');
        $(".error-container").addClass("d-none");
        $(".error-container-type2").addClass("d-none");
    });

    // ------------------------------------------------------------------------------------TYPE 1-------------------------------------------------------------------------

    // SEARCH PART
    $(".input-search-type1, .input-search-type2").on("keypress", function(e){
        if (e.which == 13) {
            let input_val = $(this).val();
            let identifier = $(this).attr("identifier");

            if (input_val == '') {
                showGenericAlert("error", "Search Field Empty");
                return;
            }
            else if (input_val.length < 5) {
                showGenericAlert("error", "Must be 5-10 characters long.");
                return;
            }
            else{
                searchData(identifier, input_val);
            }
        }
    });

    //ADD NEW DUMMY
    $(".btn-add-dummy").on("click", function(){
        let dup_counter = 0;
        let mapping = $("[name='input-mapping-type1']:checked").val();
        let exists = existingField("type1", ".input-part-select option:selected");
        let selected_part = exists['selected_data'];
        let is_selected = exists['counter'];
        
        if (is_selected == 0) {
            let is_exists = isExists('type1', selected_part);
            let genpool_hw = is_exists['selected_data'].split('|')[1];
            let genpool_cap = parseFloat(is_exists['selected_data'].split('|')[2]).toFixed(2);
            let inputs = renderInputs('1', is_exists['selected_data'], is_exists['start_options'], is_exists['end_options'], is_exists['border'], null, mapping, genpool_cap);
            $(".empty-filler-type1").removeClass('d-flex').hide();
            $(".input-container-type1").prepend(inputs);
            dup_counter = existingRecord("type1", JSON.parse(existing_mapping));
            $(".btn-save-type1").prop("disabled", (dup_counter > 0) ? true : false);
            if (dup_counter == 0) {
                if (mapping == "DEDICATION") {
                    calculateGenpoolCapacity(genpool_hw);
                }
            }
        }
        else{
            showGenericAlert("warning", ""+selected_part.split("|")[0]+"\n"+selected_part.split("|")[2]+"\nis already selected.");
        }
    });

    //GEN POOL HW NAME CHECKER FOR HW NAME INPUT FIELD (INPUT EVENT - SAME HW NAME AND GENPOOL HW NAME IS NOT ALLOWED)
    $(document).delegate(".input-hw-text", "input", function(){
        let dup_counter = 0;
        $(".input-hw-text").each(function(){
            let input_val = $(this).val();
            let identifier = $(this).attr("identifier");
            let genpool_hw_name = $('.input-part-select[identifier="'+identifier+'"]').val().split('|')[1];
            let border = 'border-success';

            if (genpool_hw_name == input_val) {
                border = 'border-danger';
                dup_counter++;
            }
            $(this).addClass(border);
        });

        dup_counter = existingRecord("type1", JSON.parse(existing_mapping));
        $(".btn-save-type1").prop("disabled", (dup_counter > 0) ? true : false);

        if (dup_counter == 0) {
            let mapping_type = $(".input-hidden-type[identifier='"+$(this).attr("identifier")+"']").val();
            if (mapping_type == "DEDICATION") {
                calculateGenpoolCapacity($('.input-part-select[identifier="'+$(this).attr("identifier")+'"]').val().split('|')[1]);
            }
        }
    });

    //GEN POOL CAPACITY CHECKER (FROM CAPACITY FIELD INPUT EVENT)
    let debounceTimer;
    $(document).delegate(".input-number", "input", function(){
        let identifier = $(this).attr("identifier");
        let cap_val = $(this).val();
        let genpool_hw = $(this).attr("parent-genpool");
        let mapping_type = $(".input-hidden-type[identifier='"+identifier+"']").val();

        $(".loader-hms-type1").removeClass('d-none').fadeIn();
        $(".btn-save-type1").prop("disabled", true);
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (cap_val.endsWith('.') && !isNaN(parseFloat(cap_val))) {
                $('.input-number[identifier="'+identifier+'"]').val("");
                calculateGenpoolCapacity(genpool_hw);
            }
            else{
                if (mapping_type == "DEDICATION") {
                    if (cap_val == '') {
                        calculateGenpoolCapacity(genpool_hw);
                        $(".btn-save-type1").prop("disabled", false);
                    }
                    else{
                        if (cap_val != '') {
                            // if (parseFloat(cap_val) % 0.5 !== 0) {
                            //     showGenericAlert("error", "Invalid JDA Feed!");
                            //     $('.input-number[identifier="'+identifier+'"]').val("");
                            // }
                            // else{
                                $(".btn-save-type1").prop("disabled", false);
                            // }
                            calculateGenpoolCapacity(genpool_hw);
                        }
                    }
                    
                    let gen_pool = parseFloat($("."+identifier+" .genpool-cap").text());
                    if (gen_pool < 0) {
                        showGenericAlert("error", "Capacity Limit Exceeded!");
                        $(this).val("");
                        calculateGenpoolCapacity(genpool_hw);
                    }
                }
            }
            $(".loader-hms-type1").fadeOut();
        }, 1000);

    });

    //GEN POOL CAPACITY CALCULATION FOR EFF_START & EFF_END (ONCHANGE EVENT)
    $(document).delegate(".input-start-select, .input-end-select", "change", function(){
        let identifier = $(this).attr("identifier");
        let genpool_hw = $(this).attr("parent-genpool");
        let new_eff_start = $('.input-start-select[identifier="'+identifier+'"]').val();
        let new_eff_end = $('.input-end-select[identifier="'+identifier+'"]').val();
        let new_eff_end_attr = $('.input-end-select[identifier="'+identifier+'"] option:selected').attr("val-type");

        if (typeof(new_eff_end_attr) != 'undefined' && new_eff_end_attr == "OPEN_ENDED") {
            let fyww_start = new_eff_start.replace("_W", "");
            let year_start = parseInt("20"+fyww_start.slice(0, 2));
            let week_start = parseInt(fyww_start.slice(-2));
            getOpenEndedWeek(year_start, week_start, new_eff_start, "ADD", null, genpool_hw, identifier, existing_mapping);
        }
        else{
            let dup_counter = 0;
            let is_valid = weekNumChecker(new_eff_start, new_eff_end, identifier);
            let mapping_type = $(".input-hidden-type[identifier='"+identifier+"']").val()
            if (is_valid) {
                dup_counter = existingRecord("type1", JSON.parse(existing_mapping));
                $(".btn-save-type1").prop("disabled", (dup_counter > 0) ? true : false);

                if (dup_counter == 0 && mapping_type == "DEDICATION") {
                    calculateGenpoolCapacity(genpool_hw);
                }
            }
        }

    });

    //REMOVE DUMMY
    $(document).delegate(".btn-remove-type1, .btn-remove-type1-upload, .btn-remove-type2", "click", function(){
        let to_remove = $(this).attr("to-remove");
        $("."+to_remove).remove();
        resetPartsArr();        
        if ($(".input-container-type1").children('.col-lg-12').length == 0) {
            $(".empty-filler-type1").addClass('d-flex').fadeIn();
        }
    });

    //EDIT DUMMY - TYPE 1 EXISTING DATA CHECKER
    $(".edit-hw-nm").on("input", function(){
        let id = $(".edit-id").val();
        let genpool_hw = $(".edit-genpool").val();
        let mapping_type = $(".edit-hw-type").val();
        existingRecordEdit();
        if (mapping_type == "DEDICATION") {
            calculateGenpoolCapacityEdit(genpool_hw, id);
        }
    });

    //EDIT DUMMY - TYPE 1 WEEK NUMBER CHECKER
    $(".edit-week").on("change", function(){
        let id = $(".edit-id").val();
        let genpool_hw = $(".edit-genpool").val();
        let eff_start = $(".edit-start").val();
        let eff_end = $(".edit-end").val();
        let eff_end_attr = $(".edit-end option:selected").attr("val-type");
        
        if (typeof(eff_end_attr) != 'undefined' && eff_end_attr == "OPEN_ENDED") {
            let fyww_start = eff_start.replace("_W", "");
            let year_start = parseInt("20"+fyww_start.slice(0, 2));
            let week_start = parseInt(fyww_start.slice(-2));
            getOpenEndedWeek(year_start, week_start, eff_start, "EDIT", id, genpool_hw);
        }
        else{
            let mapping_type = $(".edit-hw-type").val();
            let trim_start = parseInt(eff_start.replace("_W", ""));
            let trim_end = parseInt(eff_end.replace("_W", ""));
            let result = (trim_start > trim_end) ? true : false;
            let border = (result) ? 'border-danger' : 'border-success';
            $(".edit-start, .edit-end").removeClass('border-success border-danger');
            $(".edit-start, .edit-end").addClass(border);
            $(".btn-edit-dummy-type1").prop("disabled", result);

            if (!result) {
                existingRecordEdit();
                if (mapping_type == "DEDICATION") {
                    calculateGenpoolCapacityEdit(genpool_hw, id);
                }
            }
        }
    });
    
    //CSV MASS UPLOAD - TYPE1
    var csv_delete_id_arr = [];
    $(".btn-upload-type1").on("click", function(){
        let target_id_arr = $.unique(JSON.parse(existing_mapping).map(item => item.ID));
        if ($(".input-csv-type1").get(0).files.length > 0) {
            let file = $(".input-csv-type1")[0].files[0];
            var reader = new FileReader();
            $(".error-container").addClass("d-none");
            $(".csv-error-tbody").empty();
            reader.addEventListener('load', function(e) {
                var text = e.target.result.split("\r\n");
                let unaffected = [];
                let parts_opt = [];
                let gp_hw_arr = [];
                let errors = [];
                let invalid = [];
                let invalid_target_id = [];
                let target_id_passed = [];
                // $.each(text, function(index, item){
                    // if (item != '') {
                        // let split       = item.split(",");
                        // let partnum     = split[0];
        
                        $.each(text, function(idx, itm){
                            if (itm != '' && itm.split(",")[0] != 'MFG_PART_NUM') {
                                let partnum     = itm.split(",")[0];
                                let gp_hw       = itm.split(",")[1];
                                let hw_name     = itm.split(",")[2];
                                let hw_type     = itm.split(",")[7];
                                let gp_cap      = itm.split(",")[5];
                                let capacity    = itm.split(",")[6];
                                let start       = itm.split(",")[3];
                                let end         = itm.split(",")[4];
                                let action      = itm.split(",")[8];
                                let target_id   = itm.split(",")[9];
                                let raw_start   = start.replace("_W", "");
                                let raw_end     = end.replace("_W", "");
                                let error_type  = "";

                                if ($.trim(action) != '') {
                                    $.each(text, function(index2, item2){
                                        if(idx >= index2) return;
                                        let uf_target_id_2 = item2.split(",")[9];
                                        if (target_id == uf_target_id_2 && target_id != '' && uf_target_id_2 != '') {
                                            invalid_target_id.push(target_id);
                                            invalid_target_id.push(uf_target_id_2);
                                        }
                                    });

                                    if ($.inArray(target_id, target_id_arr) !== -1 && $.inArray(target_id, invalid_target_id) === -1 && action == "DELETE") {
                                        csv_delete_id_arr.push(target_id);
                                    }
                                    else{
                                        if (action == "UPDATE" || action == "DELETE") {
                                            if ($.trim(gp_hw) == '' && ($.trim(partnum) == '' || $.trim(hw_name) == '' || $.trim(hw_type) == '' ||  $.trim(start) == '' || $.trim(capacity) == '')) {
                                                invalid.push({
                                                    MFG_PART_NUM:   partnum,
                                                    GP_HW:          gp_hw,
                                                    HW_NM:          hw_name,
                                                    HW_TYPE:        hw_type,
                                                    GENPOOL_QTY:    gp_cap,
                                                    REQUIRED_QTY:   capacity,
                                                    EFF_START:      start, 
                                                    EFF_END:        end,
                                                    ACTION:         action,
                                                    TARGET_ID:      target_id,
                                                    ERROR:          "INVALID ROW"
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
                                                        MFG_PART_NUM:   partnum,
                                                        GP_HW:          gp_hw,
                                                        HW_NM:          hw_name,
                                                        HW_TYPE:        hw_type,
                                                        GENPOOL_QTY:    gp_cap,
                                                        REQUIRED_QTY:   capacity,
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
                                
                                if ($.trim(partnum) != '' && $.trim(gp_hw) != '' && $.trim(hw_name) != '' && $.trim(start) != '' && $.trim(capacity) != '' && $.trim(hw_type) != '' && action != 'DELETE') {

                                    if ($.inArray(gp_hw, gp_hw_arr) === -1) {
                                        gp_hw_arr.push(gp_hw);
                                    }
                                    capacity = parseFloat(capacity);
                                    raw_start = parseInt(raw_start);
                                    raw_end = parseInt(raw_end);

                                    if ((gp_hw == hw_name) || (raw_start > raw_end)  || (capacity == 0) || (action != 'ADD' && (target_id == '' || $.inArray(target_id, target_id_arr) === -1))) {
                                        //GENPOOL HW & HW_NAME MUST NOT BE EQUAL, HW_NAME MUST SUBSTRING
                                        if (gp_hw == hw_name) {
                                            concat = (error_type != "") ? "|" : "";
                                            error_type += concat+"SAME HW_NAME & GENPOOL HW_NAME/SPEC";
                                        }
                                        
                                        //EFF_START MUST NOT BE GREATER THAN EFF_END
                                        if (raw_start > raw_end) {
                                            concat = (error_type != "") ? "|" : "";
                                            error_type += concat+"EFF_START > EFF_END";
                                        }

                                        //CAPACITY MUST NOT BE ZERO
                                        if (capacity == 0) {
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
                                                MFG_PART_NUM:   partnum,
                                                GP_HW:          gp_hw,
                                                HW_NM:          hw_name,
                                                HW_TYPE:        hw_type,
                                                GENPOOL_QTY:    gp_cap,
                                                REQUIRED_QTY:   capacity,
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
                                            MFG_PART_NUM:   partnum,
                                            GP_HW:          gp_hw,
                                            HW_NM:          hw_name,
                                            HW_TYPE:        hw_type,
                                            GENPOOL_QTY:    gp_cap,
                                            REQUIRED_QTY:   capacity,
                                            EFF_START:      start, 
                                            EFF_END:        end,
                                            ACTION:         action,
                                            TARGET_ID:      target_id,
                                            ERROR:          'CLEARED'
                                        });
                                        parts_opt.push([
                                            partnum,
                                            hw_name,
                                            start,
                                            end,
                                            gp_cap,
                                            capacity,
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

                                    if ($.trim(partnum) == '' || $.trim(gp_hw) == '' || $.trim(hw_name) == '' || $.trim(hw_type) == '' ||  $.trim(start) == '' || $.trim(capacity) == '') {
                                        invalid.push({
                                            MFG_PART_NUM:   partnum,
                                            GP_HW:          gp_hw,
                                            HW_NM:          hw_name,
                                            HW_TYPE:        hw_type,
                                            GENPOOL_QTY:    gp_cap,
                                            REQUIRED_QTY:   capacity,
                                            EFF_START:      start,
                                            EFF_END:        end,
                                            ACTION:         action,
                                            TARGET_ID:      target_id,
                                            ERROR:          'INVALID ROW'
                                        });
                                    }
                                    else{
                                        capacity = parseFloat(capacity);
                                        raw_start = parseInt(raw_start);
                                        raw_end = parseInt(raw_end);

                                        let error_type = "EMPTY CELL";

                                        if ((gp_hw == hw_name) || (raw_start > raw_end)  || (capacity == 0)) {
                                            //GENPOOL HW & HW_NAME MUST NOT BE EQUAL, HW_NAME MUST SUBSTRING
                                            if (gp_hw != '' && hw_name != '') {
                                                if (gp_hw == hw_name) {
                                                    error_type += "|SAME HW_NAME & GENPOOL HW_NAME/SPEC";
                                                }
                                            }
                                            
                                            //EFF_START MUST NOT BE GREATER THAN EFF_END
                                            if (raw_start != '' && raw_end != '') {
                                                if (raw_start > raw_end) {
                                                    error_type += "|EFF_START > EFF_END";
                                                }
                                            }

                                            //CAPACITY MUST NOT BE ZERO
                                            if (capacity == 0 && capacity != '') {
                                                error_type += "|CAPACITY MUST BE GREATER THAN ZERO";
                                            }
                                        }

                                        errors.push({
                                            MFG_PART_NUM:   partnum,
                                            GP_HW:          gp_hw,
                                            HW_NM:          hw_name,
                                            HW_TYPE:        hw_type,
                                            GENPOOL_QTY:    gp_cap,
                                            REQUIRED_QTY:   capacity,
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
                    // }
                // });
                
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

                if (unaffected.length == 0 && errors.length == 0 && csv_delete_id_arr.length && invalid.length > 0) {
                    showGenericAlert("error", "Error: 0 valid rows found in the CSV. All rows failed validation. Please correct the data and retry.");
                    return;
                }

                //GET GENPOOL HW CAPACITY THEN DO ANOTHER ROUND OF VALIDATIONS (CAPACITY CHECK, OVERLAPPING WEEKS)
                current_list_csv = parts_opt;
                searchGenpool(gp_hw_arr, parts_opt, unaffected, errors, invalid, csv_delete_id_arr);
            });
            reader.readAsText(file);
        }
        else{showGenericAlert("error", "Please select a File!");}
    });

    //DOWNLOAD CSV ERRORS - TYPE 1 UPLOAD CSV
    $('.btn-csv-error').click(function() {
        const data = [];
        data.push([
            "MFG_PART_NUM",
            "GENPOOL_HW_SPEC",
            "HW_NAME",
            "EFF_START",
            "EFF_END",
            "HMS_COUNT",
            "JDA_FEED",
            "MAPPING_TYPE",
            "PROCESS_TYPE",
            "TARGET_ID",
            "ERROR"
        ]);
        $.each(JSON.parse(sessionStorage.getItem("csv-error")), function(index, item){
            data.push([
                item['MFG_PART_NUM'],
                item['GP_HW'],
                item['HW_NM'],
                item['EFF_START'],
                item['EFF_END'],
                item['GENPOOL_QTY'],
                item['REQUIRED_QTY'],
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

    //VIEW DUMMY - MODAL
    $(document).delegate(".btn-view-dummy", "click", function(){
        let data = JSON.parse($(this).attr("data"));
        preFillElements('type1', data);
    });

    //EDIT DUMMY - MODAL
    $(document).delegate(".btn-edit-dummy", "click", function(){
        let data = JSON.parse($(this).attr("data"));        
        preFillInputs('type1', data);
    });
    
    //SAVE DUMMY - EDIT
    $(document).delegate(".btn-edit-dummy-type1", "click", function(){
        let process_type = $(this).attr("process-type");
        let data = [];
        let compile_data = [];
        let existing_data_id = [];
        let existing_genpool = [];
        let edit_start_week = parseInt($(".edit-start").val().replace("_W", ""));
        $(".edit-data").each(function(){
            compile_data.push($(this).val());
            if ($(this).hasClass("edit-id")) {
                existing_data_id.push($(this).val());
            }
            if ($(this).hasClass("edit-genpool")) {
                existing_genpool.push($(this).val());
            }
        });

        data.push(compile_data);

        let gp_cap_arr = [];
        let total_gp_cap_rem = 0;
        if (JSON.parse(existing_mapping).length > 0) {
            $.each(JSON.parse(existing_mapping), function(index, item){
                if ($.inArray(item['GENPOOL'], existing_genpool) !== -1 && $.inArray(item['ID'], existing_data_id) === -1) {
                    gp_cap_arr[item['GENPOOL']] = item['GENPOOL_CAPACITY'];
                    data.push([
                        item['ID'],
                        item['GENPOOL'],
                        item['MFG_PART_NUM'],
                        item['HW_NM'],
                        item['EFF_START'],
                        item['EFF_END'],
                        item['CAPACITY'],
                        "","",
                        item['HW_TYPE'],
                        item['GENPOOL_CAPACITY'],
                        "EXISTING_DATA"
                    ]);
                }
            });
        }
        
        $.each(Object.keys(gp_cap_arr), function(idx, itm){
            
            let total_gp_cap = parseFloat(gp_cap_arr[itm]);
            let capacityByWeek = {};
            
            $.each(data, function(index, item){       
                if (item[1] == itm) {
                    let hw_cap = parseFloat(item[6]);
                    let mapping = item[9];
                    let eff_start = parseInt(item[4].replace("_W", ""));
                    let eff_end = parseInt(item[5].replace("_W", ""));
                    
                    if (mapping == "DEDICATION") {
                        for (var week = eff_start; week <= eff_end; week++) {
                            if (typeof capacityByWeek[week] === 'undefined') {
                                capacityByWeek[week] = total_gp_cap;
                            }
                            capacityByWeek[week] -= hw_cap;
                        }
    
                        var weeks = Object.keys(capacityByWeek).map(function(w) {
                            return parseInt(w);
                        });
    
                        var minWeek = Math.min.apply(null, weeks);
                        var maxWeek = Math.max.apply(null, weeks);
    
                        for (var week = minWeek; week <= maxWeek; week++) {
                            if (typeof capacityByWeek[week] === 'undefined') {
                                capacityByWeek[week] = total_gp_cap;
                            }
                        }
                    }
                }
            });

            // total_gp_cap_rem = Math.min(...Object.values(capacityByWeek));
            total_gp_cap_rem = capacityByWeek[edit_start_week];
        });
        
        if (total_gp_cap_rem < 0) {
            showGenericAlert("error", "Genpool HW Capacity Limit Exceeded!");
            return;
        }

        data = data.filter(item => !item.includes("EXISTING_DATA"));
        crudProcess(process_type, data[0], user_details);
    });

    //DELETE DUMMY - ALERT
    $(".btn-delete-hw-all").on("click", function(){
        // let data = JSON.parse($(this).attr("data"));

        let data = [];
        let title = 'Delete HW Dummy Mapping';
        let msg = 'Are you sure you want to delete: <br/>';
        let items = '';
        $(".dummy-hw-check:checked").each(function(){
            let parsed = JSON.parse($(this).val());
            data.push(parsed);
            items += '<b>'+parsed['MFG_PART_NUM']+' <br/> '+parsed['HW_NM']+'</b><hr/>';
        });

        showDeleteAlert(title, msg+items, data, 'DELETE_DUMMY_HW', user_details);
    });

    //DELETE ALL HW MAPPING - SELECTION
    $(".dummy-hw-check-all").on("click", function(){
        let is_checked = $(this).is(":checked");
        if (is_checked) {
            $(".btn-delete-hw-container").removeClass("d-none");
        }
        else{
            $(".btn-delete-hw-container").addClass("d-none");
        }
        $(".dummy-hw-check").each(function(){
            $(this).prop("checked", is_checked);
        });
    });

    //DELETE MULTIPLE HW MAPPING - SELECTION
    $(".dummy-hw-check").on("click", function(){
        let is_checked = $(this).is(":checked");
        if (is_checked) {
            $(".btn-delete-hw-container").removeClass("d-none");
        }
        else{
            if ($(".dummy-hw-check:checked").length == 0) {
                $(".btn-delete-hw-container").addClass("d-none");
                $(".dummy-hw-check-all").prop("checked", false);
            }
        }
    });


    // --------------------------------------------------------------------------------------------SAVE RECORD (NEW) ALL TYPES-------------------------------------------------------------------------------
    //TYPE 1 SAVE DUMMY - ADD
    $(".btn-save-type1").on("click", function(){
        let type = $(this).attr("process-type");
        let func = 'ADD_DUMMY_HW';
        let msg = 'HW Mapping';
        let data = [];
        let idtf_arr = [];
        let gp_cap_arr = [];
        let zero_cap = 0;
        let total_gp_cap_rem = 0;
        let existing_record = 0;
        
        if (JSON.parse(existing_mapping).length > 0) {
            $.each(JSON.parse(existing_mapping), function(index, item){
                data.push([
                    item['MFG_PART_NUM'],
                    item['HW_NM'],
                    item['EFF_START'],
                    item['EFF_END'],
                    item['CAPACITY'],
                    item['HW_TYPE'],
                    'EXISTING_DATA',
                    item['GENPOOL'],
                    item['GENPOOL_CAPACITY']
                ]);
            });
        }

        $(".input-"+type+", .input-"+type+"-upload").each(function(){
            let identifier = $(this).attr("identifier");
            if ($.inArray(identifier, idtf_arr) === -1) {
                idtf_arr.push(identifier);

                let genpool_hw = $('.input-genpool[identifier="'+identifier+'"]').val();
                let genpool_cap = parseFloat($("."+identifier+"-orig").attr("orig-capacity"));
                let gen_pool = parseFloat($("."+identifier+" .genpool-cap").text());
                $('.'+identifier+' .input-genpool-cap').val(genpool_cap);

                gp_cap_arr[genpool_hw] = genpool_cap;
            }
        });
        
        $.each(idtf_arr, function(index, item){
            let input_arr = [];
            $("[identifier='"+item+"']").each(function(){
                let val = ($(this).val().indexOf('|')) ? $(this).val().split('|')[0] : $(this).val();
                input_arr.push(val);
            });
            if ($('.input-number[identifier="'+item+'"]').val() == 0) {
                zero_cap++;
            }
            data.push(input_arr);
        });

        // $.each(Object.keys(gp_cap_arr), function(idx, itm){
            
        //     let total_gp_cap = gp_cap_arr[itm];
        //     let capacityByWeek = {};
            
        //     $.each(data, function(index, item){
        //         if (item[7] == itm) {
        //             let hw_cap = parseFloat(item[4]);
        //             // let hw_name = item[7];
        //             let mapping = item[5];
        //             let eff_start = parseInt(item[2].replace("_W", ""));
        //             let eff_end = parseInt(item[3].replace("_W", ""));
                    
        //             if (mapping == "DEDICATION") {
        //                 for (var week = eff_start; week <= eff_end; week++) {
        //                     if (typeof capacityByWeek[week] === 'undefined') {
        //                         capacityByWeek[week] = total_gp_cap;
        //                     }
        //                     capacityByWeek[week] -= hw_cap;
        //                 }
    
        //                 var weeks = Object.keys(capacityByWeek).map(function(w) {
        //                     return parseInt(w);
        //                 });
    
        //                 var minWeek = Math.min.apply(null, weeks);
        //                 var maxWeek = Math.max.apply(null, weeks);
    
        //                 for (var week = minWeek; week <= maxWeek; week++) {
        //                     if (typeof capacityByWeek[week] === 'undefined') {
        //                         capacityByWeek[week] = total_gp_cap;
        //                     }
        //                 }
        //             }
        //         }
        //     });
            
        //     total_gp_cap_rem = Math.min(...Object.values(capacityByWeek));
        // });

        if (data.length > 0) {
            if (zero_cap > 0) {
                showGenericAlert("error", "Hardware Capacity is Required!");
                return;
            }

            if (total_gp_cap_rem < 0) {
                showGenericAlert("error", "Genpool HW Capacity Limit Exceeded!");
                return;
            }

            $.each(data, function(index1, item1){
                let part1 = item1[0];
                let hw_name1 = item1[1];
                let eff_start1 = item1[2];
                let eff_end1 = item1[3];
                let jda_feed1 = item1[4];
                let gp_hw1 = item1[7];
                $.each(data, function(index2, item2){
                    if (index1 >= index2) return;
                    let part2 = item2[0];
                    let hw_name2 = item2[1];
                    let eff_start2 = item2[2];
                    let eff_end2 = item2[3];
                    let jda_feed2 = item2[4];
                    let gp_hw2 = item2[7];
                    let gp_cap2 = item2[8];

                    if (part1 == part2 && hw_name1 == hw_name2 && eff_start1 == eff_start2 && eff_end1 == eff_end2 && jda_feed1 == jda_feed2) {
                        existing_record++;
                        // let select_val = hw_name1+"|"+gp_hw2+"|"+gp_cap2+"|CNTCR";
                        // $('.input-part-select option[value="'+select_val+'"]').attr("class");                        
                        $('.input-hw-text[value="'+hw_name1+'"]').removeClass("border-success").addClass("border-danger");
                    }
                });
            });
        
            if (existing_record == 0) {
                data = data.filter(item => !item.includes("EXISTING_DATA"));
                crudProcess(func, data, user_details);
            }
            else{
                showGenericAlert("error", "Override Already Existing!");
            }

        }
        else{
            showGenericAlert("error", "Please Fill All Required Fields!");
        }
    });

    // -----------------------------------------------------------------------------------------API--------------------------------------------------------------------------

    //TYPE 1 - SEARCH PARTS
    function searchData(type, string){
        let func;
        switch (type) {
            case 'type1':
                func = 'SEARCH_PART';
                break;
            case 'type2':
                func = 'SEARCH_HW';
                break;
        }
        
        $.ajax({
            type: 'post',
            url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE='+func+'&OUTPUT_TYPE=BODS_JDA_ADI',
            data: {payload: string},
            beforeSend: function(){
                $(".fa-circle-plus, .fa-magnifying-glass").hide();
                $(".spinner-border").fadeIn();
            },
            success: function(data){
                setTimeout(function(){
                    if (type == 'type1') {
                        current_list_db = JSON.parse(data);                    
                    }
                    renderOptions(type.replace('type',''), JSON.parse(data));

                    $(".fa-circle-plus, .fa-magnifying-glass").fadeIn();
                    $(".spinner-border").hide();
                }, 1500);
            },
            error: function(xhr, status, error) {
                console.log(xhr);
            }
        });
    }

    function searchGenpool(genpool_hw, parts_opt, unaffected, errors, invalid, csv_delete_id_arr){

        if (errors.length == 0 && unaffected.length == 0) {

            $(".btn-validate-csv").fadeIn();

            setTimeout(function(){
                $(".btn-validate-csv").fadeOut();
                if (invalid.length > 0) {
                    let subject_data = [];
                    let row = '';
                    $.each(invalid, function(index, item){
                        if (index <= 4) {
                            row += '<tr>'+
                                        '<td>'+item['MFG_PART_NUM']+'</td>'+
                                        '<td>'+item['GP_HW']+'</td>'+
                                        '<td>'+item['HW_NM']+'</td>'+
                                        '<td>'+item['EFF_START']+'</td>'+
                                        '<td>'+item['EFF_END']+'</td>'+
                                        '<td>'+item['GENPOOL_QTY']+'</td>'+
                                        '<td>'+item['REQUIRED_QTY']+'</td>'+
                                        '<td>'+item['HW_TYPE']+'</td>'+
                                        '<td>'+item['ACTION']+'</td>'+
                                        '<td>'+item['TARGET_ID'] +'</td>'+
                                        '<td class="text-danger">'+item['ERROR']+'</td>'+
                                '</tr>';
                        }
                        subject_data.push(item);
                    });
        
                    sessionStorage.setItem("csv-error", JSON.stringify(subject_data));
                    $(".error-container").removeClass("d-none");
                    $(".csv-error-tbody").append(row);
                    $(".csv-error-count").text(invalid.length);
                    return;
                }
                else{
                    if (csv_delete_id_arr.length > 0) {
                        crudProcess("DELETE_DUMMY_HW_CSV", [], user_details, true);
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
                $(".btn-validate-csv").fadeIn();
            },
            success: function(data){
                setTimeout(function(){
                    $(".btn-validate-csv").fadeOut();
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
                                item['GP_HW_TYPE'] = gp_cap['HW_TYPE'];
                            }
                            subject_data.push(item);
                        });
                        $.each(errors, function(index, item){
                            if (item['ACTION'] != 'DELETE') {
                                let criteria = {HW_NM: item['GP_HW']};
                                let gp_cap = genpool_data.find(obj =>
                                    Object.entries(criteria).every(([key, value]) => obj[key] === value)
                                );
                                if (typeof(gp_cap) != 'undefined') {
                                    item['GENPOOL_QTY'] = gp_cap['REQUIRED_QTY'];
                                    item['GP_HW_TYPE'] = gp_cap['HW_TYPE'];
                                }
                                subject_data.push(item);
                            }
                        });
                    // }
    
                    let temp_arr;
                    var promises;
                    function handleDataRecordFind() {
                        subject_data = temp_arr;
                        $.each(subject_data, function(index, item){
                            let trim_start = item.EFF_START.replace("_W", "");
                            let start_year = "20"+trim_start.slice(0, 2);
                            let start_week = trim_start.slice(-2);
    
                            if (item['ERROR'] == "RECORD_NOT_FOUND") {
                                errors.push(item);
                            }
    
                            if (item['EFF_END'] == '') {
                                promises = subject_data.map((item, index) => {
                                    let trim_start_promise = item.EFF_START.replace("_W", "");
                                    let start_year_promise = "20"+trim_start_promise.slice(0, 2);
                                    let start_week_promise = trim_start_promise.slice(-2);
    
                                    return getOpenEndedWeekPromise(start_year_promise, start_week_promise).then(res => {
                                        subject_data[index]['EFF_END'] = res;
                                        new_eff_end = res;
                                        handleData();
                                    });
                                });
    
                                function handleData() {
                                    subject_data[index]['EFF_END'] = new_eff_end;
                                }
                                getOpenEndedWeekPromise(start_year, start_week).then(function(res) {
                                    new_eff_end = res;
                                    handleData();
                                });
                            }
    
                            if (typeof(promises) != 'undefined') {
                                Promise.all(promises).then(() => {
                                    if (item['GENPOOL_QTY'] != '') {
                                        let override_hw_data = $.grep(JSON.parse(existing_capacity), function(itm) {
                                            let int_start = parseInt(itm.EFF_START.replace("_W", ""));
                                            let int_end   = parseInt(itm.EFF_END.replace("_W", ""));
                                            let int_new_start = parseInt(item['EFF_START'].replace("_W", ""));
                                            let int_new_end   = parseInt(item['EFF_END'].replace("_W", ""));
                                            return itm.HW_NM == item['GP_HW'] && (int_start <= int_new_end && int_new_start <= int_end);
                                        });
            
                                        subject_data[index]['GENPOOL_QTY'] = (override_hw_data.length > 0) ? override_hw_data[0]['OVERRIDE_CAP'] : item['GENPOOL_QTY'];
                                    }
            
                                    if (item['EFF_START'] != '' && item['GP_HW'] != '' && item['HW_NM'] && item['GENPOOL_QTY'] != '' && item['HW_TYPE'] == 'DEDICATION' && $.inArray(item['ERROR'], ['INVALID TARGET_ID', 'MISSING TARGET_ID', 'DUPLICATE TARGET_ID']) === -1) {
            
                                        let res_gp = calculateGenpoolCapacityCSV(item['GP_HW'], subject_data, item['EFF_START']);
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
            
                                            // if (errors.length == 0) {
                                                // errors.push(item);
                                            // }
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
            
                                            // if (errors.length == 0) {
                                                // errors.push(item);
                                            // }
                                        }
                                    }
                                });
                            }
                            else{
                                if (item['GENPOOL_QTY'] != '') {
                                    let override_hw_data = $.grep(JSON.parse(existing_capacity), function(itm) {
                                        let int_start = parseInt(itm.EFF_START.replace("_W", ""));
                                        let int_end   = parseInt(itm.EFF_END.replace("_W", ""));
                                        let int_new_start = parseInt(item['EFF_START'].replace("_W", ""));
                                        let int_new_end   = parseInt(item['EFF_END'].replace("_W", ""));
                                        return itm.HW_NM == item['GP_HW'] && (int_start <= int_new_end && int_new_start <= int_end);
                                    });
        
                                    subject_data[index]['GENPOOL_QTY'] = (override_hw_data.length > 0) ? override_hw_data[0]['OVERRIDE_CAP'] : item['GENPOOL_QTY'];
                                }
        
                                if (item['EFF_START'] != '' && item['GP_HW'] != '' && item['HW_NM'] && item['GENPOOL_QTY'] != '' && item['HW_TYPE'] == 'DEDICATION' && $.inArray(item['ERROR'], ['INVALID TARGET_ID', 'MISSING TARGET_ID', 'DUPLICATE TARGET_ID']) === -1) {
        
                                    let res_gp = calculateGenpoolCapacityCSV(item['GP_HW'], subject_data, item['EFF_START']);
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
        
                                        // if (errors.length == 0) {
                                            // errors.push(item);
                                        // }
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
        
                                        // if (errors.length == 0) {
                                            // errors.push(item);
                                        // }
                                    }
                                }
                            }
    
                        });
                        
                        // Wait for all AJAX calls to finish
                        if (typeof(promises) != "undefined") {
                            Promise.all(promises).then(() => {
                                const copy = subject_data.map(item => item.EFF_END);
                                if (errors.length > 0 || additional_errors > 0) {
                                    let row = '';
                                    $.each(errors, function(index, item){
                                        if (index <= 4) {
                                            row += '<tr>'+
                                                        '<td>'+item['MFG_PART_NUM']+'</td>'+
                                                        '<td>'+item['GP_HW']+'</td>'+
                                                        '<td>'+item['HW_NM']+'</td>'+
                                                        '<td>'+item['EFF_START']+'</td>'+
                                                        '<td>'+item['EFF_END']+'</td>'+
                                                        '<td>'+item['GENPOOL_QTY']+'</td>'+
                                                        '<td>'+item['REQUIRED_QTY']+'</td>'+
                                                        '<td>'+item['HW_TYPE']+'</td>'+
                                                        '<td>'+item['ACTION']+'</td>'+
                                                        '<td>'+item['TARGET_ID'] +'</td>'+
                                                        '<td class="text-danger">'+item['ERROR']+'</td>'+
                                                '</tr>';
                                        }
                                    });
    
                                    $.each(invalid, function(index, item){
                                        if (errors.length < 4) {
                                            if (index <= 4) {
                                                row += '<tr>'+
                                                            '<td>'+item['MFG_PART_NUM']+'</td>'+
                                                            '<td>'+item['GP_HW']+'</td>'+
                                                            '<td>'+item['HW_NM']+'</td>'+
                                                            '<td>'+item['EFF_START']+'</td>'+
                                                            '<td>'+item['EFF_END']+'</td>'+
                                                            '<td>'+item['GENPOOL_QTY']+'</td>'+
                                                            '<td>'+item['REQUIRED_QTY']+'</td>'+
                                                            '<td>'+item['HW_TYPE']+'</td>'+
                                                            '<td>'+item['ACTION']+'</td>'+
                                                            '<td>'+item['TARGET_ID'] +'</td>'+
                                                            '<td class="text-danger">'+item['ERROR']+'</td>'+
                                                    '</tr>';
                                            }
                                        }
                                        subject_data.push(item);
                                    });
    
                                    sessionStorage.setItem("csv-error", JSON.stringify(subject_data));
                                    $(".error-container").removeClass("d-none");
                                    $(".csv-error-tbody").append(row);
                                    $(".csv-error-count").text(errors.length + additional_errors);
                                }
                                else{
                                    $.each(subject_data, function(index, item){
                                        current_list_csv.push([
                                            item['MFG_PART_NUM'],
                                            item['HW_NM'],
                                            item['EFF_START'],
                                            item['EFF_END'],
                                            item['REQUIRED_QTY'],
                                            item['HW_TYPE'],
                                            (item['TARGET_ID'] != '' && item['ACTION'] != 'ADD') ? item['TARGET_ID'] : 'null', 
                                            item['GP_HW'],
                                            item['GENPOOL_QTY'],
                                            item['GP_HW_TYPE'],
                                            item['ACTION']
                                        ]);
                                    });
                                    crudProcess("ADD_DUMMY_HW", current_list_csv, user_details);
                                }
                            });
                        }
                        else{
                            if (errors.length > 0 || additional_errors > 0) {
                                let row = '';
                                $.each(errors, function(index, item){
                                    if (index <= 4) {
                                        row += '<tr>'+
                                                    '<td>'+item['MFG_PART_NUM']+'</td>'+
                                                    '<td>'+item['GP_HW']+'</td>'+
                                                    '<td>'+item['HW_NM']+'</td>'+
                                                    '<td>'+item['EFF_START']+'</td>'+
                                                    '<td>'+item['EFF_END']+'</td>'+
                                                    '<td>'+item['GENPOOL_QTY']+'</td>'+
                                                    '<td>'+item['REQUIRED_QTY']+'</td>'+
                                                    '<td>'+item['HW_TYPE']+'</td>'+
                                                    '<td>'+item['ACTION']+'</td>'+
                                                    '<td>'+item['TARGET_ID'] +'</td>'+
                                                    '<td class="text-danger">'+item['ERROR']+'</td>'+
                                            '</tr>';
                                    }
                                });
    
                                $.each(invalid, function(index, item){
                                    if (errors.length < 4) {
                                        if (index <= 4) {
                                            row += '<tr>'+
                                                        '<td>'+item['MFG_PART_NUM']+'</td>'+
                                                        '<td>'+item['GP_HW']+'</td>'+
                                                        '<td>'+item['HW_NM']+'</td>'+
                                                        '<td>'+item['EFF_START']+'</td>'+
                                                        '<td>'+item['EFF_END']+'</td>'+
                                                        '<td>'+item['GENPOOL_QTY']+'</td>'+
                                                        '<td>'+item['REQUIRED_QTY']+'</td>'+
                                                        '<td>'+item['HW_TYPE']+'</td>'+
                                                        '<td>'+item['ACTION']+'</td>'+
                                                        '<td>'+item['TARGET_ID'] +'</td>'+
                                                        '<td class="text-danger">'+item['ERROR']+'</td>'+
                                                '</tr>';
                                        }
                                    }
                                    subject_data.push(item);
                                });
    
                                sessionStorage.setItem("csv-error", JSON.stringify(subject_data));
                                $(".error-container").removeClass("d-none");
                                $(".csv-error-tbody").append(row);
                                $(".csv-error-count").text(errors.length + additional_errors);
                            }
                            else{
                                $.each(subject_data, function(index, item){
                                    current_list_csv.push([
                                        item['MFG_PART_NUM'],
                                        item['HW_NM'],
                                        item['EFF_START'],
                                        item['EFF_END'],
                                        item['REQUIRED_QTY'],
                                        item['HW_TYPE'],
                                        (item['TARGET_ID'] != '' && item['ACTION'] != 'ADD') ? item['TARGET_ID'] : 'null', 
                                        item['GP_HW'],
                                        item['GENPOOL_QTY'],
                                        item['GP_HW_TYPE'],
                                        item['ACTION']
                                    ]);
                                });
                                crudProcess("ADD_DUMMY_HW", current_list_csv, user_details);
                            }
                        }
    
                    }
                    validateCSVrowDataPromise(subject_data, hw_override_table).then(function(res) {
                        temp_arr = res;
                        handleDataRecordFind();
                    });
                }, 1500);

            },
            error: function(xhr, status, error) {
                console.log(xhr);
            }
        });
    }

    function getOpenEndedWeek(year, week, new_eff_start, crud_type, id = null, genpool_hw = null, identifier = null, existing_mapping = null){
        $.ajax({
            type: 'post',
            url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=GET_OPEN_WEEK&OUTPUT_TYPE=BODS_JDA_ADI',
            data: {year: year, week: week},
            success: function(data){
                let open_fyww = JSON.parse(data)[0];
                let open_year = open_fyww.toString().slice(2, 4);
                let open_week = open_fyww.toString().slice(-2);
                new_eff_end = open_year+'_W'+open_week;

                if (crud_type == "ADD") {
                    $('.input-end-select[identifier="'+identifier+'"] option[val-type="OPEN_ENDED"]').val(new_eff_end);
                    let dup_counter = 0;
                    let is_valid = weekNumChecker(new_eff_start, new_eff_end, identifier);
                    let mapping_type = $(".input-hidden-type[identifier='"+identifier+"']").val();
                    if (is_valid) {
                        dup_counter = existingRecord("type1", JSON.parse(existing_mapping));
                        $(".btn-save-type1").prop("disabled", (dup_counter > 0) ? true : false);
    
                        if (dup_counter == 0 && mapping_type == "DEDICATION") {
                            calculateGenpoolCapacity(genpool_hw);
                        }
                    }
                }
                else if(crud_type == "EDIT"){
                    let mapping_type = $(".edit-hw-type").val();
                    let trim_start = parseInt(new_eff_start.replace("_W", ""));
                    let trim_end = parseInt(new_eff_end.replace("_W", ""));
                    let result = (trim_start > trim_end) ? true : false;
                    let border = (result) ? 'border-danger' : 'border-success';
                    $('.edit-end option[val-type="OPEN_ENDED"]').val(new_eff_end);
                    $(".edit-start, .edit-end").removeClass('border-success border-danger');
                    $(".edit-start, .edit-end").addClass(border);
                    $(".btn-edit-dummy-type1").prop("disabled", result);

                    if (!result) {
                        existingRecordEdit();
                        if (mapping_type == "DEDICATION") {
                            calculateGenpoolCapacityEdit(genpool_hw, id);
                        }
                    }
                }
            },
            error: function(xhr, status, error) {
                console.log(xhr);
            }
        });
    }

    function getOpenEndedWeekPromise(year, week){
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

    function validateCSVrowDataPromise(src_data, hw_override_table){ 
        return new Promise((resolve, reject) => {
            // let type1_data = hw_override_table.rows().data();
            let partnum_arr = $.map(src_data, function(item) {
                return item.MFG_PART_NUM;
            });
            
            $.ajax({
                type: 'post',
                url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=SEARCH_PART&OUTPUT_TYPE=BODS_JDA_ADI',
                data: {payload: partnum_arr},
                success: function(data){
                    // FIRST CHECK: PARTNUM + GENPOOL HW + HW_NAME COMBO
                    $.each(src_data, function(index, item){
                        let src_partnum = item['MFG_PART_NUM'];
                        let src_genpool = item['GP_HW'];
                        let src_index   = index;

                        if (typeof(JSON.parse(data)[src_partnum]) != 'undefined') {
                            let hw_nm_arr = $.map(JSON.parse(data)[src_partnum], function(item) {
                                return item.HW_NM;
                            });

                            if ($.inArray(src_genpool, hw_nm_arr) === -1) {
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

    //TYPE 1 - ADD, EDIT, DELETE DUMMY HW MAPPING
    function crudProcess(process, payload, user_details, is_csv = false){
        if (is_csv) {
            showLoader();
            csvMassDelete(csv_delete_id_arr);
            setTimeout(function(){
                showGenericAlert("success", "Record Deleted Successfully!");
                location.reload();
            }, 1500);
        }
        else{
            $.ajax({
                type: 'post',
                url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE='+process+'&OUTPUT_TYPE=BODS_JDA_ADI',
                data: {payload: payload, user_details: user_details},
                beforeSend: function(){
                    showLoader();
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
                            showGenericAlert("success", "Record "+alert_msg+" Successfully!");
                            csvMassDelete(csv_delete_id_arr);
                            location.reload();  // DON'T ALLOW UPDATE AND DELETE RECORD TO HAVE THE SAME ID, WILL RESULT TO CONFLICTING PROCESS.
                        }
                    }, 1500);
                },
                error: function(xhr, status, error) {
                    console.log(xhr);
                }
            });
        }
    }

    //FOR CSV MASS UPLOAD - DELETE ONLY
    function csvMassDelete(data){
        $.ajax({
            type: 'post',
            url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_HW_OVERRIDE.PHP?PROCESS_TYPE=DELETE_DUMMY_HW_CSV&OUTPUT_TYPE=BODS_JDA_ADI',
            data: {payload: data, user_details: user_details},
            success: function(data){
                console.log(data);
            },
            error: function(xhr, status, error) {
                console.log(xhr);
            }
        });
    }

    // --------------------------------------------------------------------------------------DYNAMIC RENDERING-----------------------------------------------------------------

    function renderWeeks(fy_weeks, override_week = null, week_type){
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
        
        if (week_type == "EFF_END") {
            options += '<option val-type="OPEN_ENDED" value="">--/--</option>';
        }

        return options;
    }

    function renderInputs(type, data, start_options, end_options, source, existing = null, mapping = null, genpool_cap = null){
        let fields          = '';
        let split           = (data != null) ? data.split("|") : '';
        let rand_class      =  Math.random().toString(36).slice(2, 8);
        let asterisk        = '<i class="fa-solid fa-asterisk"></i>';
        let part_data       = (type == 1 || type == '1-upload') ? split[0]+'|'+split[1] : '';
        let hw_name_data    = (type == 1 || type == '1-upload' || type == 2 || type == '2-upload') ? split[1] : '';
        let hw_name_mapping = (type == 1) ? '_'+mapping : '';
        let hw_type_data    = (type == 1 || type == '1-upload') ? mapping : split[0];
        let capacity_data   = (type == 1 || type == '1-upload' || type == 2 || type == '2-upload') ? (genpool_cap != null) ? genpool_cap : split[2] : '';
        let orig_capacity   = (type == 1) ? data.split("|")[2] : '';
        // let capacity_val    = (capacity_data > 0) ? 1 : capacity_data;
        let capacity_val    = '';
        let override_data   = (type == 2 || type == '2-upload') ? split[3] : '';
        let current_list    = (type != '1-upload') ? current_list_db : current_list_csv;
        let part_options;
        if (type != 2) {
            part_options = renderOptions('inner-part', current_list, part_data);
        }
        let part =      '<div class="col-lg-3 col-md-4 col-sm-6"><div class="form-floating mb-3"><select disabled identifier="input-type'+type+'-'+rand_class+'" class="form-control input-part-select input-type'+type+' '+source+'" placeholder="'+type+'">'+part_options+'</select><label class="label-type">PART</label></div></div>';
        let hw_name =   '<div class="col-lg-2 col-md-4 col-sm-6"><div class="form-floating mb-3"><input identifier="input-type'+type+'-'+rand_class+'" value="'+hw_name_data+hw_name_mapping+'" type="text" class="form-control input-hw-text input-type'+type+' '+source+'" placeholder="'+type+' '+source+'"><label class="label-type">'+asterisk+' HW NAME</label></div></div>';
        let hw_hidden = '<input type="hidden" identifier="input-type'+type+'-'+rand_class+'" class="input-hw-hidden input-type'+type+'" value="'+data+'">';
        let eff_start = '<div class="col-lg-2 col-md-4 col-sm-6"><div class="form-floating mb-3"><select identifier="input-type'+type+'-'+rand_class+'" class="form-select input-start-select input-type'+type+' '+source+'" placeholder="'+type+'" parent-genpool="'+hw_name_data+'">'+start_options+'</select><label class="label-type">'+asterisk+' EFF START</label></div></div>';
        let eff_end =   '<div class="col-lg-2 col-md-4 col-sm-6"><div class="form-floating mb-3"><select identifier="input-type'+type+'-'+rand_class+'" class="form-select input-end-select input-type'+type+' '+source+'" placeholder="'+type+'" parent-genpool="'+hw_name_data+'">'+end_options+'</select><label class="label-type">'+asterisk+' EFF END</label></div></div>';
        let capacity =  '<div class="col-lg-3 col-md-4 col-sm-6"><div class="input-group mb-3"><span class="input-group-text '+source+'"><small class="input-type'+type+'-'+rand_class+'-orig" orig-capacity="'+orig_capacity+'">HMS Count</small>&nbsp;<span class="badge text-bg-info input-type'+type+'-'+rand_class+' genpool-cap">'+capacity_data+'</span></span><div class="form-floating"><input identifier="input-type'+type+'-'+rand_class+'" value="'+capacity_val+'" type="text" class="form-control input-type'+type+' input-number '+source+'" step="0.5" min="0" placeholder="'+type+'" parent-genpool="'+hw_name_data+'"><label class="label-type">'+asterisk+' JDA FEED</label></div><button type="button" to-remove="input-type'+type+'-'+rand_class+'" class="btn btn-outline-danger btn-remove-type'+type+' input-group-text"><i class="fa-solid fa-xmark"></i></button></div></div>';
        let override =  '<div class="col-lg-2 col-md-4 col-sm-6"><div class="form-floating mb-3"><input identifier="input-type'+type+'-'+rand_class+'" value="'+override_data+'" type="number" class="form-control input-type'+type+' '+source+'" placeholder="'+type+'"><label class="label-type">'+asterisk+' OVERRIDE CAP</label></div></div>';
        let current =   '<div class="col-lg-2 col-md-4 col-sm-6"><div class="form-floating mb-3"><input identifier="input-type'+type+'-'+rand_class+'" readonly type="text" value="'+capacity_data+'" class="form-control input-type'+type+' '+source+'" placeholder="'+type+'"><label class="label-type">CURRENT CAP</label></div></div>';
        let hw_type1 =  '<input identifier="input-type'+type+'-'+rand_class+'" type="hidden" class="form-control input-hidden-type input-type'+type+' '+source+'" value="'+hw_type_data+'">';
        let hw_type2 =  '<div class="col-lg-2 col-md-4 col-sm-6"><div class="input-group mb-3"><div class="form-floating"><input identifier="input-type'+type+'-'+rand_class+'" readonly type="text" class="form-control input-type'+type+' '+source+'" value="'+hw_type_data+'"><label class="label-type">HW TYPE</label></div><button type="button" to-remove="input-type'+type+'-'+rand_class+'" class="btn btn-outline-danger btn-remove-type'+type+' input-group-text"><i class="fa-solid fa-xmark"></i></button></div></div>';
        
        let field1 =    (type == 1 || type == '1-upload') ? part : hw_name;
        let field2 =    (type == 1 || type == '1-upload') ? hw_name : eff_start;
        let field3 =    (type == 1 || type == '1-upload') ? eff_start : eff_end;
        let field4 =    (type == 1 || type == '1-upload') ? eff_end: override;
        let field5 =    (type == 1 || type == '1-upload') ? capacity: current;
        let field6 =    (type == 1 || type == '1-upload') ? hw_type1 : hw_type2;
        let field7 =    '<input type="hidden" identifier="input-type'+type+'-'+rand_class+'" class="input-hidden-id input-type'+type+'-'+rand_class+'" value="'+existing+'">';
        let field8 =    (type == 2 || type == '2-upload') ? hw_hidden : '';
        let field9 =    (type == 1 || type == '1-upload') ? '<input type="hidden" identifier="input-type'+type+'-'+rand_class+'" class="input-type'+type+'-'+rand_class+' input-genpool" value="'+hw_name_data+'">' : '';
        let field10 =   (type == 1 || type == '1-upload') ? '<input type="hidden" identifier="input-type'+type+'-'+rand_class+'" class="input-type'+type+'-'+rand_class+' input-genpool-cap" value="">' : '';
        let field11 =   (type == 1 || type == '1-upload') ? '<input type="hidden" identifier="input-type'+type+'-'+rand_class+'" class="input-type'+type+'-'+rand_class+' input-genpool-type" value="'+split[3]+'">' : '';

        fields += field1+field2+field3+field4+field5+field6+field7+field8+field9+field10+field11;

        return '<div class="col-lg-12 input-type'+type+'-'+rand_class+'"><div class="row p-0 m-0">'+fields+'</div></div>';
    }

    function renderOptions(type, data, selected_option = null){
        if (type == '1' || type == '2' || type == 'inner-part') {
            if (Object.keys(data).length > 0) {
                let optgroup = '';
                // if (type == '1' || type == 'inner-part') {
                    for(var key in data) {
                        let key_nm = key;
                        let options = '';
                        if (data[key].length > 0) {
                            for (var inner_key in data[key]) {
                                let opt_val;
                                let is_selected;
                                switch (type) {
                                    case '1':
                                    case 'inner-part':
                                        opt_val = key_nm+'|'+data[key][inner_key]['HW_NM']+'|'+data[key][inner_key]['REQUIRED_QTY']+'|'+data[key][inner_key]['HW_TYPE'];
                                        is_selected = (selected_option != null && selected_option == key_nm+'|'+data[key][inner_key]['HW_NM']) ? 'selected' : '';
                                        break;
                                    case '2':
                                        opt_val = key_nm+'|'+data[key][inner_key]['HW_NM']+'|'+data[key][inner_key]['REQUIRED_QTY']+'|'+data[key][inner_key]['SITE_NUM']+'|'+data[key][inner_key]['RES_AREA'];
                                        is_selected = (selected_option != null && selected_option == key_nm+'|'+data[key][inner_key]['HW_NM']) ? 'selected' : '';
                                        break;
                                }
                                let option_text = (type != '2') ? key_nm+' - '+data[key][inner_key]['HW_NM'] + ' [' + data[key][inner_key]['HW_TYPE'] + ']' : data[key][inner_key]['HW_NM']+' - '+key_nm+' - '+data[key][inner_key]['SITE_NUM']+' - '+data[key][inner_key]['RES_AREA'];
                                options += '<option style="font-size: 13px;" value="'+opt_val+'" '+is_selected+'>'+option_text+'</option>';
                            }
                            optgroup += '<optgroup label="'+key_nm+'">'+options+'</optgroup>';
                        }                    
                    }
                if (type == '1' || type == '2') {
                    let btn_name = (type == '1') ? 'dummy' : 'hw';
                    $(".btn-add-"+btn_name+"").prop("disabled", false);
                    $(".input-select-type"+type+"").empty().prop("disabled", false);
                    $(".input-mapping-type"+type+"").prop("disabled", false);
                    $(".input-select-type"+type+"").append(optgroup);   
                }
                else{
                    return optgroup;
                }
            }
            else{
                let btn_name = (type == '1') ? 'dummy' : 'hw';
                $(".btn-add-"+btn_name+"").prop("disabled", true);
                $(".input-select-type"+type+"").empty().prop("disabled", true);
                $(".input-mapping-type"+type+"").prop("disabled", true);
                $(".input-select-type"+type+"").append('<option value="" selected>No Result Found!</option>'); 
            }
        }
    }

    // --------------------------------------------------------------------------------------------------RENDER EXISTING DATA-------------------------------------------------------------------------------------------------
    function preFillInputs(type, value){
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
        $(".edit-part-container, .edit-capacity-container").hide();
        $(".edit-override-container, .edit-current-container").hide();
        $.each(value, function(index, item){
            let eff_start; 
            let eff_end;
            if (index == 'EFF_START' || index == 'EFF_END') {                    
                eff_start = renderWeeks(weeks, (index == 'EFF_START') ? item : '', "EFF_START");
                eff_end = renderWeeks(weeks, (index == 'EFF_END') ? item : '', "EFF_END");
            }
            if (index == 'EFF_START') {
                item = eff_start;
            }
            if (index == 'EFF_END') {
                item = eff_end;
            }
            val_arr.push(item);
        });
        
        if (type == 'type1') {
            h1_type = 'HW Mapping';
            h1_record = val_arr[1];
            hw_name = val_arr[2];
            hw_type = val_arr[8];
            start = val_arr[3];
            end = val_arr[4];
            created_at = val_arr[9];
            created_by = val_arr[10];
            updated_at = val_arr[11];
            genpool_hw = val_arr[5];
            genpool_hw_cap = val_arr[6];
            $(".edit-part-container, .edit-capacity-container").show();
            $(".edit-part").val(val_arr[1]);
            $(".edit-capacity").val(val_arr[7]);
            attr = 'EDIT_DUMMY_HW';
            class_name = 'btn-edit-dummy-type1';
        }
        
        $(".edit-type-h1").html(h1_type);
        $(".edit-record-h1").html(h1_record);
        $(".edit-id").val(val_arr[0]);
        $(".edit-genpool").val(genpool_hw);
        $(".edit-genpool-cap").val(genpool_hw_cap);
        $(".edit-hw-nm").val(hw_name);
        $(".edit-start").html(start);
        $(".edit-end").html(end);
        $(".edit-hw-type").val(hw_type);
        $(".edit-created-at").html(dateFormatter(created_at));
        $(".edit-created-by").html(created_by);
        $(".edit-updated-at").html((Date.parse(updated_at)) ? dateFormatter(updated_at) : '--/--/--');
        $(".btn-edit-data").attr('process-type', attr).addClass(class_name);
        $("#modal-edit-data").modal('show');
    }

    function preFillElements(type, value){
        let h1_type;
        let h1_record;
        $(".view-part-container, .view-capacity-container").hide();
        $(".view-override-container, .view-current-container").hide();
        if (type == 'type1') {
            h1_type = 'HW Mapping'
            h1_record = value['MFG_PART_NUM'];
            $(".view-part-container, .view-capacity-container").show();
            $(".view-part").html(value['MFG_PART_NUM']);
            $(".view-capacity").html(value['CAPACITY']);
        }

        $(".view-type-h1").html(h1_type);
        $(".view-record-h1").html(h1_record);
        $(".view-hw-nm").html(value['HW_NM']);
        $(".view-start").html(value['EFF_START']);
        $(".view-end").html(value['EFF_END']);
        $(".view-hw-type").html(value['HW_TYPE']);
        $(".view-created-at").html(dateFormatter(value['CREATED_AT']));
        $(".view-created-by").html(value['CREATED_BY']);
        $(".view-updated-at").html((Date.parse(value['UPDATED_AT'])) ? dateFormatter(value['UPDATED_AT']) : '--/--/--');
        $("#modal-view-data").modal('show');
    }

    // ----------------------------------------------------------------------------------------------------CALCULATIONS-----------------------------------------------------------------------
    // TYPE - 1 REAL-TIME CALCULATION OF REMAINING GENPOOL CAPACITY BASED ON CURRENT SELECTION AND EXISTING MAPPINGS
    function calculateGenpoolCapacity(target_gp = null){

        let data = [];
        let attr_arr = [];
        let gp_cap_arr = [];
        let total_gp_cap_rem = 0;
        let overlap_count = 0;
        let identical_data = [];
        let identical_attr_arr = [];
        let hash_arr = [];

        if (JSON.parse(existing_mapping).length > 0) {
            $.each(JSON.parse(existing_mapping), function(index, item){
                if (item['GENPOOL'] == target_gp && item['HW_TYPE'] == "DEDICATION") {
                    data.push([
                        item['MFG_PART_NUM'],
                        item['HW_NM'],
                        item['EFF_START'],
                        item['EFF_END'],
                        item['CAPACITY'],
                        item['HW_TYPE'],
                        'EXISTING_DATA',
                        item['GENPOOL'],
                        item['GENPOOL_CAPACITY']
                    ]);
                }
            });
        }

        $(".input-type1").each(function(){
            let attr = $(this).attr("identifier");
            if ($('.input-hidden-type[identifier="'+attr+'"]').val() == "DEDICATION") {
                if ($.inArray(attr, attr_arr) === -1) {
                    attr_arr.push(attr);
                }
            }
        });

        $.each(attr_arr, function(index, item){
            let genpool_hw = $('.input-genpool[identifier="'+item+'"]').val();
            if (genpool_hw == target_gp) {
                let input_arr = [];
                $("[identifier='"+item+"']").each(function(idx, itm){
                    let val = ($(this).val().indexOf('|')) ? $(this).val().split('|')[0] : $(this).val();
                    if (idx == 4) {
                        if (val == '') {
                            val = 0;
                        }
                    }
                    if (idx == 8) {
                        val = item;
                    }
                    if (idx == 1) {
                        val = val.toUpperCase();
                    }
                    input_arr.push(val);
                });

                if (input_arr[5] == "DEDICATION") {
                    data.push(input_arr);

                    let override_gp_cap = '';
                    let override_hw_data = $.grep(JSON.parse(existing_capacity), function(item) {
                        let int_start = parseInt(item.EFF_START.replace("_W", ""));
                        let int_end   = parseInt(item.EFF_END.replace("_W", ""));
                        let int_new_start = parseInt(input_arr[2].replace("_W", ""));
                        let int_new_end   = parseInt(input_arr[3].replace("_W", ""));
                        return item.HW_NM == target_gp && (int_start <= int_new_end && int_new_start <= int_end);
                    });
                    
                    override_gp_cap = (override_hw_data.length > 0) ? override_hw_data[0]['OVERRIDE_CAP'] : $("."+item+"-orig").attr("orig-capacity");       
                    gp_cap_arr[genpool_hw] = parseFloat(override_gp_cap);
                }
            }
        });

        //OVERLAP WEEKS CHECKER
        $.each(data, function(index1, item1){
            let part1 = item1[0];
            let map1 = item1[5];
            let idtf1 = item1[8];
            let hw_nm1 = item1[1];
            let gp_hw1 = item1[7];
            let jda_feed1 = item1[4];
            let eff_start_1 = parseInt(item1[2].replace("_W", ""));
            let eff_end_1 = parseInt(item1[3].replace("_W", ""));

            if (data.length > 1) {
                $.each(data, function(index2, item2){
                    if (index1 >= index2) return;
                    let to_add_class = "";
                    let to_remove_class = "";
                    let part2 = item2[0];
                    let map2 = item2[5];
                    let idtf2 = item2[8];
                    let hw_nm2 = item2[1];
                    let gp_hw2 = item2[7];
                    let jda_feed2 = item2[4];
                    let eff_start_2 = parseInt(item2[2].replace("_W", ""));
                    let eff_end_2 = parseInt(item2[3].replace("_W", ""));

                    if (part1 == part2 && gp_hw1 == gp_hw2 && hw_nm1 == hw_nm2 && map1 == "DEDICATION" && map2 == "DEDICATION") {
                        let is_overlapping = eff_start_1 <= eff_end_2 && eff_start_2 <= eff_end_1;
                        if (is_overlapping) {
                            overlap_count++;
                        }

                        if (overlap_count > 0) {
                            to_add_class = "border-danger";
                            to_remove_class = "border-success";
                        }
                        else{
                            to_add_class = "border-success";
                            to_remove_class = "border-danger";
                        }

                        if (idtf1.includes("input-type1")) {
                            $('.input-start-select[identifier="'+idtf1+'"]').removeClass(to_remove_class).addClass(to_add_class);
                            $('.input-end-select[identifier="'+idtf1+'"]').removeClass(to_remove_class).addClass(to_add_class);
                        }

                        if (idtf2.includes("input-type1")) {
                            $('.input-start-select[identifier="'+idtf2+'"]').removeClass(to_remove_class).addClass(to_add_class);
                            $('.input-end-select[identifier="'+idtf2+'"]').removeClass(to_remove_class).addClass(to_add_class);
                        }
                    }
                    else if(part1 != part2 && gp_hw1 == gp_hw2 && hw_nm1 == hw_nm2 && map1 == "DEDICATION" && map2 == "DEDICATION" && 
                            eff_start_1 == eff_start_2 && eff_end_1 == eff_end_2 && jda_feed1 == jda_feed2 && jda_feed1 != 0 && jda_feed2 != 0){
                        
                        if($.inArray(idtf1, identical_attr_arr) === -1){
                            identical_attr_arr.push(idtf1);
                        }
                        if($.inArray(idtf2, identical_attr_arr) === -1){
                            identical_attr_arr.push(idtf2);
                        }

                        // identical_data.push(item1);
                        // identical_data.push(item2);
                    }
                });
            }
            else{
                $('.input-start-select[identifier="'+idtf1+'"]').removeClass("border-danger").addClass("border-success");
                $('.input-end-select[identifier="'+idtf1+'"]').removeClass("border-danger").addClass("border-success");
            }
        });

        
        //FILTER OUT IDENTICAL MAPPINGS
        let uniqueIndexes = [1, 2, 3, 4, 5, 7]; // specify which indexes to check for uniqueness
        let seen = new Set();
        let result = [];

        for (let row of data) {
            // Create a unique key by joining only the selected index values
            let key = uniqueIndexes.map(i => row[i]).join("||");

            if (!seen.has(key)) {
                seen.add(key);
                result.push(row);
            }
        }

        // console.log(identical_attr_arr);
        

        if (identical_attr_arr.length > 0) {
            // let orig_capacity = 0;
            // let dedicated_cap = 0;

            $.each(identical_attr_arr, function(index, item){
                // orig_capacity = parseFloat($("."+item+"-orig").attr("orig-capacity"));
                let idtf_attr = item;
                if (typeof($('.input-part-select[identifier="'+item+'"]').val()) != 'undefined') {
                    let part1 = $('.input-part-select[identifier="'+item+'"]').val().split("|")[0];
                    let map1 = $('.input-hidden-type[identifier="'+item+'"]').val();
                    let hw_nm1 = $('.input-hw-text[identifier="'+item+'"]').val();
                    let gp_hw1 = $('.input-genpool[identifier="'+item+'"]').val();
                    let jda_feed1 = parseFloat($('.input-number[identifier="'+item+'"]').val());
                    let eff_start_1 = parseInt($('.input-start-select[identifier="'+item+'"]').val().replace("_W", ""));
                    let eff_end_1 = parseInt($('.input-end-select[identifier="'+item+'"]').val().replace("_W", ""));

                    
                    $.each(result, function(idx, itm){
                        if (map1 == itm[5] &&
                            hw_nm1 == itm[1] &&
                            gp_hw1 == itm[7] &&
                            jda_feed1 == parseFloat(itm[4]) &&
                            eff_start_1 == parseInt(itm[2].replace("_W", "")) &&
                            eff_end_1 ==  parseInt(itm[3].replace("_W", ""))) {
                                
                                var to_hash = map1+"|"+hw_nm1+"|"+gp_hw1+"|"+jda_feed1+"|"+eff_start_1+"|"+eff_end_1;
                                hash_arr.push(idtf_attr+"|"+CryptoJS.SHA256(to_hash).toString());
                                
                                // dedicated_cap = jda_feed1;
                        }
                        else{
                            // dedicated_cap += jda_feed1;
                        }
                    });
                }
                
            });
            
            // let new_capacity  = orig_capacity - dedicated_cap; // CHANGE THIS, IT SHOULD NOT BE ORIG CAP. MUST BE REMAINING CAP.

            // $.each(identical_attr_arr, function(index, item){
            //     $("."+item+" .genpool-cap").text(new_capacity.toFixed(2));
            // });
        }

        // console.log(hash_arr);
        // console.log(data);
        // console.log(result);
        

        $.each(attr_arr, function(idx, itm){
            // if ($.inArray(itm, identical_attr_arr) === -1) {
                let new_eff_start = parseInt($('.input-start-select[identifier="'+itm+'"]').val().replace("_W", ""));
                let genpool_hw = $('.input-genpool[identifier="'+itm+'"]').val();
                let total_gp_cap = gp_cap_arr[genpool_hw];
                let capacityByWeek = {};
            
                $.each(result, function(index, item){
                    if (item[7] == genpool_hw) {
                        let hw_nm = item[1];
                        let gp_hw = item[7];
                        let hw_cap = parseFloat(item[4]);
                        let mapping = item[5];
                        let eff_start = parseInt(item[2].replace("_W", ""));
                        let eff_end = parseInt(item[3].replace("_W", ""));
                        if (mapping == "DEDICATION") {
                            for (var week = eff_start; week <= eff_end; week++) {
                                if (typeof capacityByWeek[week] === 'undefined') {
                                    capacityByWeek[week] = total_gp_cap;
                                }
                                capacityByWeek[week] -= hw_cap;
                            }
        
                            var weeks = Object.keys(capacityByWeek).map(function(w) {
                                return parseInt(w);
                            });
        
                            var minWeek = Math.min.apply(null, weeks);
                            var maxWeek = Math.max.apply(null, weeks);
        
                            for (var week = minWeek; week <= maxWeek; week++) {
                                if (typeof capacityByWeek[week] === 'undefined') {
                                    capacityByWeek[week] = total_gp_cap;
                                }
                            }
                        }
                    }
                });
    
                total_gp_cap_rem = capacityByWeek[new_eff_start];

                if (overlap_count == 0) {
                    $("."+itm+" .genpool-cap").text((typeof(total_gp_cap_rem) != 'undefined') ? total_gp_cap_rem.toFixed(2) : total_gp_cap_rem);


                }
            // }
        });

        if (overlap_count > 0) {
            $(".btn-save-type1").prop("disabled", true);
        }
    }
    
    function calculateGenpoolCapacityCSV(target_gp = null, subject_data, target_start){ //ADD LOGIC FOR IDENTICAL HW MAPPINGS & ADJUST CSV FORMAT (format and logic) - ADD COLUMN NAMES

        let data = [];
        let gp_cap_arr = [];
        let total_gp_cap_rem = 0;
        let error_str = "";

        if (JSON.parse(existing_mapping).length > 0) {
            $.each(JSON.parse(existing_mapping), function(index, item){
                if (item['GENPOOL'] == target_gp && item['HW_TYPE'] == "DEDICATION") {
                    data.push([
                        item['MFG_PART_NUM'],
                        item['HW_NM'],
                        item['EFF_START'],
                        item['EFF_END'],
                        item['CAPACITY'],
                        item['HW_TYPE'],
                        'EXISTING_DATA',
                        item['GENPOOL'],
                        item['GENPOOL_CAPACITY'],
                        item['ID']
                    ]);
                }
            });
        }

        $.each(subject_data, function(index, item){
            if (item['EFF_START'] != '' && item['EFF_END'] != '' && item['GP_HW'] != '' && item['HW_NM'] && item['GENPOOL_QTY'] != '') {
                if (item['GP_HW'] == target_gp && item['HW_TYPE'] == "DEDICATION") {
                    data.push([
                        item['MFG_PART_NUM'],
                        item['HW_NM'],
                        item['EFF_START'],
                        item['EFF_END'],
                        item['REQUIRED_QTY'],
                        item['HW_TYPE'],
                        '',
                        item['GP_HW'],
                        item['GENPOOL_QTY'],
                        (item['ACTION'] == 'ADD') ? '' : item['TARGET_ID']
                    ]);

                    let override_gp_cap = '';
                    let override_hw_data = $.grep(JSON.parse(existing_capacity), function(itm) {
                        let int_start = parseInt(itm.EFF_START.replace("_W", ""));
                        let int_end   = parseInt(itm.EFF_END.replace("_W", ""));
                        let int_new_start = parseInt(item['EFF_START'].replace("_W", ""));
                        let int_new_end   = parseInt(item['EFF_END'].replace("_W", ""));
                        return itm.HW_NM == target_gp && (int_start <= int_new_end && int_new_start <= int_end);
                    });
                    
                    override_gp_cap = (override_hw_data.length > 0) ? override_hw_data[0]['OVERRIDE_CAP'] : item['GENPOOL_QTY'];       
                    gp_cap_arr[item['GP_HW']] = parseFloat(override_gp_cap);
                }
            }
        });

        //OVERLAP WEEKS CHECKER
        if (data.length > 0) {
            $.each(data, function(index1, item1){
                let part1 = item1[0];
                let map1 = item1[5];
                let hw_nm1 = item1[1];
                let gp_hw1 = item1[7];
                let partnum_1 = item1[0];
                let eff_start_1 = parseInt(item1[2].replace("_W", ""));
                let eff_end_1 = parseInt(item1[3].replace("_W", ""));
                let target_id_1 = item1[9];
                
                if (data.length > 1) {
                    $.each(data, function(index2, item2){
                        if (index1 >= index2) return;
                        let part2 = item2[0];
                        let map2 = item2[5];
                        let hw_nm2 = item2[1];
                        let gp_hw2 = item2[7];
                        let partnum_2 = item2[0];
                        let eff_start_2 = parseInt(item2[2].replace("_W", ""));
                        let eff_end_2 = parseInt(item2[3].replace("_W", ""));
                        let target_id_2 = item2[9];

                        if (part1 == part2 && gp_hw1 == gp_hw2 && hw_nm1 == hw_nm2 && map1 == "DEDICATION" && map2 == "DEDICATION" ) { //INVESTIGATE GENPOOL CAPACITY AGAIN, BOTH ADD AND EDIT - NORMAL & CSV MASS UPLOAD

                            if(target_id_1 != "" && target_id_2 != ""){
                                if (target_id_1 == target_id_2) {
                                    return true;
                                }
                            }

                            let is_overlapping = eff_start_1 <= eff_end_2 && eff_start_2 <= eff_end_1;
                            if (is_overlapping) {
                                // overlap_count++;
                                error_str = "OVERLAPPING WEEKS ("+partnum_1+" - "+partnum_2+")";
                            }
                        }
                    });
                }
            });
        }

        console.log(data);
        console.log(error_str);
        
        
        
        //FILTER OUT IDENTICAL MAPPINGS
        let uniqueIndexes = [1, 2, 3, 4, 5, 7]; // specify which indexes to check for uniqueness
        let seen = new Set();
        let result = [];

        for (let row of data) {
            // Create a unique key by joining only the selected index values
            let key = uniqueIndexes.map(i => row[i]).join("||");

            if (!seen.has(key)) {
                seen.add(key);
                result.push(row);
            }
        }

        let new_eff_start = parseInt(target_start.replace("_W", ""));
        let genpool_hw = target_gp;
        let total_gp_cap = gp_cap_arr[genpool_hw];
        let capacityByWeek = {};

        $.each(result, function(index, item){
            if (item[7] == genpool_hw) {
                let hw_cap = parseFloat(item[4]);
                let mapping = item[5];
                let eff_start = parseInt(item[2].replace("_W", ""));
                let eff_end = parseInt(item[3].replace("_W", ""));
                
                if (mapping == "DEDICATION") {
                    for (var week = eff_start; week <= eff_end; week++) {
                        if (typeof capacityByWeek[week] === 'undefined') {
                            capacityByWeek[week] = total_gp_cap;
                        }
                        capacityByWeek[week] -= hw_cap;
                    }

                    var weeks = Object.keys(capacityByWeek).map(function(w) {
                        return parseInt(w);
                    });

                    var minWeek = Math.min.apply(null, weeks);
                    var maxWeek = Math.max.apply(null, weeks);

                    for (var week = minWeek; week <= maxWeek; week++) {
                        if (typeof capacityByWeek[week] === 'undefined') {
                            capacityByWeek[week] = total_gp_cap;
                        }
                    }
                }
            }
        });
        total_gp_cap_rem = capacityByWeek[new_eff_start];

        if (total_gp_cap_rem < 0) {
            let delimiter = "";
            if (error_str != "") {
                delimiter = "|";
            }
            error_str += delimiter+"MAX CAPACITY LIMIT REACHED";
        }

        return error_str;
    }

    function calculateGenpoolCapacityEdit(target_gp = null, existing_id){
        let data = [];
        let input_arr = [];
        let gp_cap_arr = [];
        let overlap_count = 0;
        let edit_start = '';
        let total_gp_cap_rem = 0;

        if (JSON.parse(existing_mapping).length > 0) {
            $.each(JSON.parse(existing_mapping), function(index, item){
                if (item['GENPOOL'] == target_gp && item['ID'] != existing_id && item['HW_TYPE'] == "DEDICATION") {
                    data.push([
                        item['ID'],
                        item['GENPOOL'],
                        item['MFG_PART_NUM'],
                        item['HW_NM'],
                        item['EFF_START'],
                        item['EFF_END'],
                        item['CAPACITY'],
                        item['HW_TYPE'],
                        'EXISTING_DATA'
                    ]);
                }
            });
        }

        $(".edit-data").each(function(index){
            if ($(this).val() != '' && $(this).val() != null) {
                input_arr.push($(this).val().toUpperCase());
                if (index == 4) {
                    edit_start = parseInt($(this).val().replace("_W", ""));
                }
                
                if (input_arr[7] == "DEDICATION") {
                    let genpool_hw = input_arr[1];
                    let genpool_hw_cap = input_arr[8];
                    let override_gp_cap = '';
                    let override_hw_data = $.grep(JSON.parse(existing_capacity), function(item) {
                        let int_start = parseInt(item.EFF_START.replace("_W", ""));
                        let int_end   = parseInt(item.EFF_END.replace("_W", ""));
                        let int_new_start = parseInt(input_arr[4].replace("_W", ""));
                        let int_new_end   = parseInt(input_arr[5].replace("_W", ""));
                        return item.HW_NM == target_gp && (int_start <= int_new_end && int_new_start <= int_end);
                    });
                    
                    override_gp_cap = (override_hw_data.length > 0) ? override_hw_data[0]['OVERRIDE_CAP'] : genpool_hw_cap;       
                    gp_cap_arr[genpool_hw] = parseFloat(override_gp_cap);
                }
            }
        });

        data.push(input_arr);

        //OVERLAP WEEKS CHECKER
        $.each(data, function(index1, item1){
            if (item1[7] == "DEDICATION") {
                let part1 = item1[2];
                let map1 = item1[7];
                let hw_nm1 = item1[3];
                let gp_hw1 = item1[1];
                let eff_start_1 = parseInt(item1[4].replace("_W", ""));
                let eff_end_1 = parseInt(item1[5].replace("_W", ""));
                
                if (data.length > 1) {
                    $.each(data, function(index2, item2){
                        if (index1 >= index2) return;
                        let part2 = item2[2];
                        let map2 = item2[7];
                        let hw_nm2 = item2[3];
                        let gp_hw2 = item2[1];
                        let eff_start_2 = parseInt(item2[4].replace("_W", ""));
                        let eff_end_2 = parseInt(item2[5].replace("_W", ""));
        
                        if (part1 == part2 && gp_hw1 == gp_hw2 && hw_nm1 == hw_nm2 && map1 == "DEDICATION" && map2 == "DEDICATION") {
                            let is_overlapping = eff_start_1 <= eff_end_2 && eff_start_2 <= eff_end_1;
                            
                            if (is_overlapping) {
                                overlap_count++;
                            }
                        }
                    });
                }
            }
        });

        let genpool_hw = target_gp;
        let total_gp_cap = gp_cap_arr[genpool_hw];
        let capacityByWeek = {};
        
        console.log(data);
        
        
        $.each(data, function(index, item){
            if (item[1] == genpool_hw) {
                let hw_cap = parseFloat(item[6]);
                let mapping = item[7];
                let eff_start = parseInt(item[4].replace("_W", ""));
                let eff_end = parseInt(item[5].replace("_W", ""));
                
                if (mapping == "DEDICATION") {
                    for (var week = eff_start; week <= eff_end; week++) {
                        if (typeof capacityByWeek[week] === 'undefined') {
                            capacityByWeek[week] = total_gp_cap;
                        }
                        capacityByWeek[week] -= hw_cap;
                    }

                    var weeks = Object.keys(capacityByWeek).map(function(w) {
                        return parseInt(w);
                    });

                    var minWeek = Math.min.apply(null, weeks);
                    var maxWeek = Math.max.apply(null, weeks);

                    for (var week = minWeek; week <= maxWeek; week++) {
                        if (typeof capacityByWeek[week] === 'undefined') {
                            capacityByWeek[week] = total_gp_cap;
                        }
                    }
                }
            }
        });

        total_gp_cap_rem = capacityByWeek[edit_start];
        
        if (overlap_count > 0 || total_gp_cap_rem < 0) {
            if (total_gp_cap_rem < 0) {
                $('.edit-capacity').removeClass("border-success").addClass("border-danger");
            }
            if (overlap_count > 0) {
                $('.edit-start').removeClass("border-success").addClass("border-danger");
                $('.edit-end').removeClass("border-success").addClass("border-danger");
            }
            $('.btn-edit-dummy-type1').prop("disabled", true);
        }
        else{
            $('.edit-capacity').removeClass("border-danger").addClass("border-success");
            $('.edit-start').removeClass("border-danger").addClass("border-success");
            $('.edit-end').removeClass("border-danger").addClass("border-success");
            $('.btn-edit-dummy-type1').prop("disabled", false);
        }

    } //FINISH ADD DELETE TYPE 2 OVERRIDE CAP - CONNECTION TO TYPE 1, VALIDATION BEFORE ADDING, EDITING, DELETING RECORD (VALIDATE ALL OVERLAPPING WEEKS AGAINST TYPE 1)

    // -----------------------------------------------------------------------------------------------------VALIDATIONS-----------------------------------------------------------------------
    function isExists(type, selected_data){
        let existing_data = (type.indexOf('type1') != -1) ? existing_mapping : existing_capacity;
        let existing_id = null;
        let existing_override;
        let existing_start;
        let existing_end;
        let border = 'border ';
        let start_options;
        let end_options;

        $.each(JSON.parse(existing_data), function(index, item){
            let split = selected_data.split("|");
            let remove_dummy = item['HW_NM'];
            let existing = (type.indexOf('type1') != -1) ? item['MFG_PART_NUM']+'|'+remove_dummy : item['HW_TYPE']+'|'+item['HW_NM'];
            let selected = split[0]+'|'+split[1];
            if (existing == selected) {
                existing_override = (type.indexOf('type1') != -1) ? existing+'|'+item['CAPACITY']+'|'+item['HW_TYPE'] : existing+'|'+item['CURRENT_CAP']+'|'+item['OVERRIDE_CAP'];
                existing_start = item['EFF_START'];
                existing_end = item['EFF_END'];
                existing_id = item['ID'];
            }
        });
        
        selected_data   = (existing_override != undefined) ? existing_override : selected_data;
        border          += (existing_override != undefined) ? 'border-warning' : (type.indexOf('upload') != -1) ? 'border-primary' : 'border-success';
        start_options   = (existing_override != undefined) ? renderWeeks(weeks, existing_start, "EFF_START") : (type == ''+type+'-upload') ? selected_data.split("|")[4].toUpperCase() : renderWeeks(weeks, '', "EFF_START");
        end_options     = (existing_override != undefined) ? renderWeeks(weeks, existing_end, "EFF_END") : (type == ''+type+'-upload') ? selected_data.split("|")[5].toUpperCase() : renderWeeks(weeks, '', "EFF_END");

        return {
            selected_data:  selected_data,
            border:         border,
            start_options:  start_options,
            end_options:    end_options,
            existing_id:    existing_id
        }
    }

    function existingRecord(type, existing_data){
        if (type == "type1") {
            let data = [];
            let attr_arr = [];
            let affected_inputs = [];
            let revert_inputs = [];
            let return_counter = 0;

            $(".input-type1").each(function(){
                let attr = $(this).attr("identifier");
                if ($.inArray(attr, attr_arr) === -1) {
                    attr_arr.push(attr);
                }
            });

            $.each(attr_arr, function(index, item){
                let input_arr = [];
                $("[identifier='"+item+"']").each(function(idx, itm){
                    let val = ($(this).val().indexOf('|')) ? $(this).val().split('|')[0] : $(this).val();
                    if (idx == 4) {
                        if (val == '') {
                            val = 0;
                        }
                    }
                    if (idx == 8) {
                        val = item;
                    }
                    input_arr.push(val);
                });
                data.push(input_arr);
            });

            if (existing_data.length > 0) {
                $.each(data, function(index, item){
                    let partnum = item[0];
                    let hw_name = item[1];
                    let eff_start = item[2];
                    let enf_end = item[3];
                    let gen_pool = item[7];
                    let idtf_attr = item[8];

                    $.each(existing_data, function(idx, itm){
                        let em_partnum = itm['MFG_PART_NUM'];
                        let em_hw_name = itm['HW_NM'];
                        let em_eff_start = itm['EFF_START'];
                        let em_enf_end = itm['EFF_END'];
                        let em_gen_pool = itm['GENPOOL'];
                        
                        if (partnum == em_partnum &&
                            hw_name == em_hw_name &&
                            eff_start == em_eff_start &&
                            enf_end == em_enf_end &&
                            gen_pool == em_gen_pool
                        ) {
                            affected_inputs.push(idtf_attr);
                            return_counter++;
                        }
                        else{
                            revert_inputs.push(idtf_attr);
                        }
                    });
                });
            }

            $.each(data, function(index, item){
                let partnum = item[0];
                let hw_name = item[1];
                let eff_start = item[2];
                let enf_end = item[3];
                let gen_pool = item[7];
                let idtf_attr = item[8];
                
                $.each(data, function(idx, itm){

                    if (index >= idx) return;
                    
                    let em_partnum = itm[0];
                    let em_hw_name = itm[1];
                    let em_eff_start = itm[2];
                    let em_enf_end = itm[3];
                    let em_gen_pool = itm[7];
                    
                    if (partnum == em_partnum &&
                        hw_name == em_hw_name &&
                        eff_start == em_eff_start &&
                        enf_end == em_enf_end &&
                        gen_pool == em_gen_pool
                    ) {
                        affected_inputs.push(idtf_attr);
                        return_counter++;
                    }
                    else{
                        revert_inputs.push(idtf_attr);
                    }
                });
            });

            if (return_counter > 0) {
                $.each(affected_inputs, function(index, item){
                    $('.input-hw-text[identifier="'+item+'"]').removeClass("border-success").addClass("border-danger");
                });
            }
            else{
                $.each(revert_inputs, function(index, item){
                    $('.input-hw-text[identifier="'+item+'"]').removeClass("border-danger").addClass("border-success");
                });
            }

            return return_counter;
        }
    }

    function existingRecordEdit(){

        let data_arr = [];
        let existing_counter = 0;
        $(".edit-data").each(function(){
            if ($(this).val() != "" && $(this).val() != null) {
                data_arr.push($(this).val().toUpperCase());
            }
        });
        
        $.each(JSON.parse(existing_mapping), function(index, item){
            if (item['ID'] != data_arr[0] &&
                item['GENPOOL'] == data_arr[1] &&
                item['MFG_PART_NUM'] == data_arr[2] &&
                item['HW_NM'] == data_arr[3] &&
                item['EFF_START'] == data_arr[4] &&
                item['EFF_END'] == data_arr[5] &&
                item['HW_TYPE'] == data_arr[7]
            ) {
                existing_counter++;
            }
            
        });

        if (existing_counter > 0) {
            $(".edit-hw-nm").removeClass("border-success").addClass("border-danger");
            $(".btn-edit-dummy-type1").prop("disabled", true);
        }
        else{
            $(".edit-hw-nm").removeClass("border-danger").addClass("border-success");
            $(".btn-edit-dummy-type1").prop("disabled", false);
        }
    }

    function existingField(type, class_name = null){
        let counter = 0;
        let current_cap = 0;
        let selected_data = '';
        let part_list = $(".input-select-"+type+"").val();

        if (type == 'type1') {
            let idtf_arr = [];
            let mapping_type = $('[name="input-mapping-type1"]:checked').val();

            $('.input-hw-text').each(function(){
                let identifier = $(this).attr('identifier');
                if ($.inArray(identifier, idtf_arr) === -1 && (identifier != '' || identifier != null)) {
                    idtf_arr.push(identifier);
                }
            });

            if (idtf_arr.length > 0) {
                $.each(idtf_arr, function(index, item){
                    let existing_part_num = $('.input-part-select[identifier="'+item+'"]').val();
                    let existing_hw_name = $('.input-hw-text[identifier="'+item+'"]').val();
                    let split_existing = existing_part_num.split('|');
                    let split_list = part_list.split('|');
                    let existing_data = split_existing[0]+'|'+split_existing[1]+'|'+existing_hw_name;
                    let selected = split_list[0]+'|'+split_list[1]+'|'+split_list[1]+'_'+mapping_type;
                    if (existing_data == selected) {
                        counter++;
                        selected_data = existing_data;
                        return false;
                    }
                    else{
                        selected_data = part_list;
                    }
                });
            }
            else{
                selected_data = part_list;
            }
        }
        else{
            let split_data = part_list.split("|");
            let selected = (type == 'type2') ? split_data[0]+'|'+split_data[1] : part_list;
            current_cap = (type == 'type2') ? '|'+split_data[2] : '';
            
            $.each($(''+class_name+''), function(){
                let split = $(this).val().split('|');
                let input_val = (type == 'type2') ? split[0]+'|'+split[1] : $(this).val();
                if (selected == input_val) {
                    counter++;
                }
                selected_data = selected+current_cap;
            });
        }

        return {
            'counter': counter,
            'selected_data': selected_data,
        };
    }

    function resetModals(type){
        let btn_name = (type == 'type1') ? 'dummy' : 'hw';
        if (type == 'type1') {
            default_parts = [];
            current_list_db = [];
            current_list_csv = [];
        }
        $(".input-search-"+type+"").val('');
        $(".input-select-"+type+"").empty().prop("disabled", true);
        $(".input-mapping-"+type+"").val('DUMMY').prop("disabled", true);
        $(".btn-add-"+btn_name+"").prop("disabled", true);
        $(".input-container-"+type+" :not(.empty-filler-"+type+")").remove();
        $(".empty-filler-"+type+"").addClass('d-flex').fadeIn();
    }

    function resetPartsArr(){
        default_parts = [];
        $(".input-part-select option:selected").each(function(){
            default_parts.push($(this).val());
        });
    }

    function weekNumChecker(eff_start, eff_end, identifier, is_edit = false){
        let dup_counter = 0;
        let trim_start = parseInt(eff_start.replace("_W", ""));
        let trim_end = parseInt(eff_end.replace("_W", ""));

        let result = (trim_start > trim_end) ? true : false;
        let border = (result) ? 'border-danger' : 'border-success';
        let disable = (dup_counter > 0) ? (result == false) ? true : result : (result == true) ? result : false;
        $('.input-start-select[identifier="'+identifier+'"], .input-end-select[identifier="'+identifier+'"]').removeClass('border-success border-danger');
        $('.input-start-select[identifier="'+identifier+'"], .input-end-select[identifier="'+identifier+'"]').addClass(border);
        $(".btn-save-type1").prop("disabled", disable);
        return (result == true) ? false : true;
    }

    // -----------------------------------------------------------------------------------------DATA MANIPULATION---------------------------------------------------------------------------
    function dateFormatter(date){
        return $.datepicker.formatDate('M dd, yy', new Date(date));
    }

    function getRawWeekDate(type, data){
        let raw_date = (type == 'week-num') ? "20"+data.replace("_W", "") : data;
        let raw_year = raw_date.slice(2, 4);
        let raw_week = raw_date.slice(-2);

        return {
            year: parseInt(raw_year),
            week: parseInt(raw_week)
        }
    }

    // -----------------------------------------------------------------------------------------------ALERTS--------------------------------------------------------------------------------
    function showGenericAlert(icon, title){
        Swal.fire({
            title: title,
            icon: icon
        });
    }

    function showDeleteAlert(title, msg, data, crud, user_details){
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
                crudProcess(crud, data, user_details);
            }
        });
    }

    function showLoader(){
        Swal.fire({
            title: 'Processing... \n Please Wait!',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading()
            },
        });
    }
});