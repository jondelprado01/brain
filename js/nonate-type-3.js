$(document).ready(function(){

    $(".details-tooltip").tooltip();

    //SET CURRENT TAB IN THE URL
    $(".nonate-link").on("click", function(){
        let url = new URL($(location).attr('href'));
        let tab = $(this).attr("tab-name");
        url.searchParams.set("tab", tab);
        window.history.pushState('state', 'title', url.href);
    });

    //DATATABLES
    var table_type_3 = $(".table-non-type3").DataTable({
        scrollY: 'calc(100vh - 650px)',
        bSort: false,
        responsive: true,
    });

    $('.nonate-link').on('shown.bs.tab', function (e) {
        table_type_3.columns.adjust().draw();
    });

    $(".input-search-type3").on("keypress", function(e){
        if (e.which == 13) {
            let input_val = $(this).val();

            if (input_val == '') {
                showGenericAlertType3("error", "Search Field Empty");
                return;
            }
            else if (input_val.length < 5) {
                showGenericAlertType3("error", "Must be 5-10 characters long.");
                return;
            }
            else{
                searchData(input_val);
            }
        }
    });

    //ADD HW CAPACITY OVERRIDE FIELDS
    $(".btn-add-hw").on("click", function(){
        let val = $(".input-select-type3").val().split("|");
        let start_options = renderWeeksType3(weeks, '', "EFF_START");
        let end_options = renderWeeksType3(weeks, '', "EFF_END");
        let inputs = renderInputsType3(val, start_options, end_options);

        let is_exists = existingFieldType3(val[1], val[3], val[4]);

        if (!is_exists) {
            $(".empty-filler-type3").removeClass('d-flex').hide();
            $(".input-container-type3").prepend(inputs);

            // dup_counter = existingRecordType3(JSON.parse(existing_capacity), "ADD_HW");
            // $(".btn-save-type3").prop("disabled", (dup_counter > 0) ? true : false);

            // if (dup_counter == 0) {
                calculateGenpoolCapacityType3(val[1], val[3], val[4]);
            // }
        }
        else{
            showGenericAlertType3("warning", ""+val[1]+"\n"+val[0]+"\nis already selected.");
        }
    });

    //VALIDATE OVERRIDE VALUE - INCREMENTAL BY .5 ONLY
    let debounceTimerType3;
    $(document).delegate(".input-override-type3", "input", function(){
        let identifier = $(this).attr("identifier");
        let cap_val = $(this).val();
        
        $(".loader-override-type3").removeClass('d-none').fadeIn();
        $(".btn-save-type3").prop("disabled", true);

        clearTimeout(debounceTimerType3);
        debounceTimerType3 = setTimeout(() => {
            if (cap_val.endsWith('.') && !isNaN(parseFloat(cap_val))) {
                $('.input-override-type3[identifier="'+identifier+'"]').val("");
            }
            else{
                if (cap_val != '') {
                    // if (parseFloat(cap_val) % 0.5 !== 0) {
                    //     showGenericAlertType3("error", "Invalid Override Capacity!");
                    //     $('.input-override-type3[identifier="'+identifier+'"]').val("");
                    // }
                    // else{
                        $(".btn-save-type3").prop("disabled", false);
                    // }
                }
            }
            $(".loader-override-type3").fadeOut();
        }, 1000);
    });

    //VALIDATE OVERLAPPING WEEKS BASED ON EFF_START & EFF_END (ONCHANGE EVENT)
    $(document).delegate(".input-start-select-type3, .input-end-select-type3", "change", function(){
        let identifier = $(this).attr("identifier");
        let hw_name = $('.input-hw-text-type3[identifier="'+identifier+'"]').val();
        let site_num = $('.input-site-hidden-type3[identifier="'+identifier+'"]').val();
        let res_area = $('.input-res-hidden-type3[identifier="'+identifier+'"]').val();
        let new_eff_start = $('.input-start-select-type3[identifier="'+identifier+'"]').val();
        let new_eff_end = $('.input-end-select-type3[identifier="'+identifier+'"]').val();
        let new_eff_end_attr = $('.input-end-select-type3[identifier="'+identifier+'"] option:selected').attr("val-type");

        if (typeof(new_eff_end_attr) != 'undefined' && new_eff_end_attr == "OPEN_ENDED") {
            $(".btn-save-type3").prop("disabled", true);
            let fyww_start = new_eff_start.replace("_W", "");
            let year_start = parseInt("20"+fyww_start.slice(0, 2));
            let week_start = parseInt(fyww_start.slice(-2));
            getOpenEndedWeek(year_start, week_start, new_eff_start, "ADD", null, hw_name, site_num, res_area, identifier);
        }
        else{
            let is_valid = weekNumChecker(new_eff_start, new_eff_end, identifier);
        
            if (is_valid) {
                calculateGenpoolCapacityType3(hw_name, site_num, res_area);
            }
        }

    });

    $(document).delegate(".btn-remove-type3", "click", function(){
        let to_remove = $(this).attr("to-remove");
        $("."+to_remove).remove();
        if ($(".input-container-type3").children('.col-lg-12').length == 0) {
            $(".empty-filler-type3").addClass('d-flex').fadeIn();
        }
    });

    $(document).delegate(".edit-week-type3", "change", function(){
        let id = $(".edit-id-type3").val();
        let hw_name = $('.edit-hw-nm-type3').val().toUpperCase();
        let site_num = $('.edit-site-num-type3').val();
        let res_area = $('.edit-res-area-type3').val();
        let eff_start = $(".edit-start-type3").val();
        let eff_end = $(".edit-end-type3").val();
        let eff_end_attr = $(".edit-end-type3 option:selected").attr("val-type");

        if (typeof(eff_end_attr) != 'undefined' && eff_end_attr == "OPEN_ENDED") {
            let fyww_start = eff_start.replace("_W", "");
            let year_start = parseInt("20"+fyww_start.slice(0, 2));
            let week_start = parseInt(fyww_start.slice(-2));
            getOpenEndedWeek(year_start, week_start, eff_start, "EDIT", id, hw_name, site_num, res_area, null, existing_capacity);
        }
        else{
            let trim_start = parseInt(eff_start.replace("_W", ""));
            let trim_end = parseInt(eff_end.replace("_W", ""));
            let result = (trim_start > trim_end) ? true : false;
            let border = (result) ? 'border-danger' : 'border-success';
            $(".edit-start-type3, .edit-end-type3").removeClass('border-success border-danger');
            $(".edit-start-type3, .edit-end-type3").addClass(border);
            $(".btn-edit-data-type3").prop("disabled", result);
            
            if (!result) {
                calculateGenpoolCapacityType3Edit(hw_name, site_num, res_area, id);
            }
        }
    });

    //SAVE HW CAPACITY OVERRIDE
    $(".btn-save-type3").on("click", function(){
        let data = [];
        let idtf_arr = [];
        let zero_cap = 0;
        let empty_counter = 0;

        $(".input-type3").each(function(){
            let identifier = $(this).attr("identifier");
            if ($.inArray(identifier, idtf_arr) === -1) {
                idtf_arr.push(identifier);
            }
        });

        $.each(idtf_arr, function(idx, itm){
            let input_arr = [];
            $('.input-type3[identifier="'+itm+'"]').each(function(index, item){
                if ($(this).hasClass("required")) {
                    if ($(this).val() == '' && $(this).hasClass("input-end-select-type3") === false) {
                        empty_counter++;""
                        $(this).removeClass("border-success").addClass("border-danger");
                    }
                    if ($(this).hasClass("input-override-type3")) {
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
                    showGenericAlertType3("error", "Hardware Capacity is Required!");
                    return;
                }
                crudProcessType3("ADD_HW_CAPACITY", data, user_details);
            }
            else{
                showGenericAlertType3("error", "Please Fill All Required Fields!");
            }
        }
        else{
            showGenericAlertType3("error", "Please Add HW Capacity Override!");
        }
    });

    //VIEW HW CAPACITY OVERRIDES - MODAL
    $(".btn-view-hw").on("click", function(){
        let data = JSON.parse($(this).attr("data"));
        preFillElementsType3(data);
    });

    //EDIT HW CAPACITY - MODAL
    $(".btn-edit-hw").on("click", function(){
        let data = JSON.parse($(this).attr("data"));
        preFillInputsType3(data);
    });

    $(".btn-edit-data-type3").on("click", function(){
        let data = [];
        let type = $(this).attr("process-type");
        // $(".edit-data-type3").each(function(){
        //     data.push($(this).val());
        // });

        data.push([
            $(".edit-hw-nm-type3").val(),
            $(".edit-start-type3").val(),
            $(".edit-end-type3").val(),
            $(".edit-override-type3").val(),
            $(".edit-current-type3").val(),
            $(".edit-hw-type-type3").val(),
            $(".edit-id-type3").val(),
            $(".edit-site-num-type3").val(),
            $(".edit-res-area-type3").val(),
            $(".default-state-type3").attr("default-state-type3")
        ]);

        crudProcessType3(type, data, user_details);
    });

    //DELETE ALL HW CAPACITY OVERRIDES - ALERT
    $(".btn-delete-type3-all").on("click", function(){
        let data = [];
        let title = 'Delete HW Capacity Overrides';
        let msg = 'Are you sure you want to delete: <br/>';
        let items = '';
        $(".type3-check:checked").each(function(){
            let parsed = JSON.parse($(this).val());
            data.push(parsed);
            items += '<b>'+parsed['HW_NM']+' <br/> '+parsed['HW_TYPE']+'</b><hr/>';
        });
        showDeleteAlertType3(title, msg+items, data, 'DELETE_HW_CAPACITY', user_details);
    });

    //DELETE ALL HW CAPACITY OVERRIDES - SELECTION
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

    //DELETE MULTIPLE HW CAPACITY OVERRIDES - SELECTION
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

function getOpenEndedWeek(year, week, new_eff_start, crud_type, id = null, hw_name = null, site_num = null, res_area = null, identifier = null, existing_capacity = null){
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
                $('.input-end-select-type3[identifier="'+identifier+'"] option[val-type="OPEN_ENDED"]').val(new_eff_end);
                let is_valid = weekNumChecker(new_eff_start, new_eff_end, identifier);
        
                if (is_valid) {
                    calculateGenpoolCapacityType3(hw_name, site_num, res_area);
                    $(".btn-save-type3").prop("disabled", false);
                }
            }
            else if(crud_type == "EDIT"){
                $('.edit-end-type3 option[val-type="OPEN_ENDED"]').val(new_eff_end);
                let trim_start = parseInt(new_eff_start.replace("_W", ""));
                let trim_end = parseInt(new_eff_end.replace("_W", ""));
                let result = (trim_start > trim_end) ? true : false;
                let border = (result) ? 'border-danger' : 'border-success';
                $(".edit-start-type3, .edit-end-type3").removeClass('border-success border-danger');
                $(".edit-start-type3, .edit-end-type3").addClass(border);
                $(".btn-edit-data-type3").prop("disabled", result);
                
                if (!result) {
                    calculateGenpoolCapacityType3Edit(hw_name, site_num, res_area, id);
                }
            }
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function searchData(string){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE=SEARCH_HW&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: string},
        beforeSend: function(){
            $(".fa-circle-plus, .fa-magnifying-glass").hide();
            $(".spinner-border").fadeIn();
        },
        success: function(data){
            setTimeout(function(){
                renderOptions(JSON.parse(data));

                $(".fa-circle-plus, .fa-magnifying-glass").fadeIn();
                $(".spinner-border").hide();
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function crudProcessType3(process, payload, user_details){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MODULE_NONATE.PHP?PROCESS_TYPE='+process+'&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: payload, user_details: user_details},
        beforeSend: function(){
            showLoaderType3();
        },
        success: function(data){
            setTimeout(function(){

                if (JSON.parse(data).hasOwnProperty('STATUS')) {
                    if (JSON.parse(data)['STATUS']) {

                        let alert_msg;
                        let return_data = (process.indexOf('EDIT') !== -1) ? payload : JSON.parse(data)['CHANGE_LOG_DATA'];
                        
                        if (process.indexOf('DELETE') != -1) {
                            alert_msg = 'Deleted';
                            addChangeLog(return_data, user_details, "non-ate delete capacity override", JSON.parse(data)['OLD_DATA']);
                        }
                        else{
                            let crud_type = (process.indexOf('ADD') !== -1) ? "add" : "update";
                            let old_data = (process.indexOf('ADD') !== -1) ? [] : JSON.parse(payload[0][9]);
                            alert_msg = 'Saved';
                            addChangeLog(return_data, user_details, "non-ate "+crud_type+" capacity override", (old_data.length > 0) ? [old_data] : old_data);
                        }

                        showGenericAlertType3("success", "Record "+alert_msg+" Successfully!");
                        location.reload();
                    }
                }
                else{
                    showGenericAlertType3("error", "Something Went Wrong!");
                }

            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function dateFormatterType3(date){
    return $.datepicker.formatDate('M dd, yy', new Date(date));
}

function renderOptions(data){
    if (Object.keys(data).length > 0) {
        let optgroup = '';
        for(var key in data) {
            let key_nm = key;
            let options = '';
            if (data[key].length > 0) {
                for (var inner_key in data[key]) {
                    let opt_val;
                    let is_selected;
                    opt_val = key_nm+'|'+data[key][inner_key]['HW_NM']+'|'+data[key][inner_key]['REQUIRED_QTY']+'|'+data[key][inner_key]['SITE_NUM']+'|'+data[key][inner_key]['RES_AREA'];
                    is_selected = '';
                    let option_text = data[key][inner_key]['HW_NM']+' - '+key_nm+' - '+data[key][inner_key]['SITE_NUM']+' - '+data[key][inner_key]['RES_AREA'];
                    options += '<option style="font-size: 13px;" value="'+opt_val+'" '+is_selected+'>'+option_text+'</option>';
                }
                optgroup += '<optgroup label="'+key_nm+'">'+options+'</optgroup>';
            }                    
        }
        let btn_name = 'hw';
        $(".btn-add-"+btn_name+"").prop("disabled", false);
        $(".input-select-type3").empty().prop("disabled", false);
        $(".input-mapping-type3").prop("disabled", false);
        $(".input-select-type3").append(optgroup);
    }
    else{
        let btn_name = 'hw';
        $(".btn-add-"+btn_name+"").prop("disabled", true);
        $(".input-select-type3").empty().prop("disabled", true);
        $(".input-mapping-type3").prop("disabled", true);
        $(".input-select-type3").append('<option value="" selected>No Result Found!</option>'); 
    }
}

function renderWeeksType3(fy_weeks, override_week = null, week_type){
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

function renderInputsType3(data, start_options, end_options){

    let rand_class =  Math.random().toString(36).slice(2, 8);

    let hw_name_field = '<div class="col-lg-2 col-md-4 col-sm-6">'+
                            '<div class="form-floating mb-3">'+
                                '<input identifier="input-type3-'+rand_class+'" type="text" class="form-control input-hw-text-type3 input-type3 border border-success required" site-val="'+data[3]+'" res-val="'+data[4]+'" value="'+data[1]+'" placeholder="" readonly>'+
                                '<label class="label-type"><i class="fa-solid fa-asterisk"></i> HW NAME - '+data[3]+' - '+data[4]+'</label>'+
                            '</div>'+
                        '</div>';
    let eff_start_field  = '<div class="col-lg-2 col-md-4 col-sm-6">'+
                                '<div class="form-floating mb-3">'+
                                    '<select identifier="input-type3-'+rand_class+'" class="form-select input-start-select-type3 input-type3 border border-success required" placeholder="">'+start_options+'</select>'+
                                    '<label class="label-type"><i class="fa-solid fa-asterisk"></i> EFF START</label>'+
                                '</div>'+
                            '</div>';

    let eff_end_field = '<div class="col-lg-2 col-md-4 col-sm-6">'+
                            '<div class="form-floating mb-3">'+
                                '<select identifier="input-type3-'+rand_class+'" class="form-select input-end-select-type3 input-type3 border border-success required" placeholder="">'+end_options+'</select>'+
                                '<label class="label-type"><i class="fa-solid fa-asterisk"></i> EFF END</label>'+
                            '</div>'+
                        '</div>';
    
    let override_field = '<div class="col-lg-2 col-md-4 col-sm-6">'+
                            '<div class="form-floating mb-3">'+
                                '<input identifier="input-type3-'+rand_class+'" type="text" class="form-control input-override-type3 input-type3 border border-success required" placeholder="">'+
                                '<label class="label-type"><i class="fa-solid fa-asterisk"></i> OVERRIDE CAP</label>'+
                            '</div>'+
                         '</div>';
                
    let current_field = '<div class="col-lg-2 col-md-4 col-sm-6">'+
                            '<div class="form-floating mb-3">'+
                                '<input identifier="input-type3-'+rand_class+'" readonly="" type="text" class="form-control input-current-type3 input-type3 border border-success" value="'+data[2]+'" placeholder="">'+
                                '<label class="label-type">HMS COUNT</label>'+
                            '</div>'+
                        '</div>';
            
    let hw_type_field = '<div class="col-lg-2 col-md-4 col-sm-6">'+
                            '<div class="input-group mb-3">'+
                                '<div class="form-floating">'+
                                    '<input identifier="input-type3-'+rand_class+'" readonly="" type="text" class="form-control input-type-type3 input-type3 border border-success" value="'+data[0]+'" placeholder="">'+
                                    '<label class="label-type">HW TYPE</label>'+
                                '</div>'+
                                '<button type="button" to-remove="input-type3-'+rand_class+'" class="btn btn-outline-danger btn-remove-type3 input-group-text">'+
                                    '<i class="fa-solid fa-xmark"></i>'+
                                '</button>'+
                            '</div>'+
                        '</div>';

    let hw_name_hidden = '<input identifier="input-type3-'+rand_class+'" type="hidden" class="form-control input-hw-hidden-type3 input-type3" value="'+data[1]+'">';
    let site_num_hidden = '<input identifier="input-type3-'+rand_class+'" type="hidden" class="form-control input-site-hidden-type3 input-type3" value="'+data[3]+'">';
    let res_area_hidden = '<input identifier="input-type3-'+rand_class+'" type="hidden" class="form-control input-res-hidden-type3 input-type3" value="'+data[4]+'">';

    let fields = hw_name_field+eff_start_field+eff_end_field+override_field+current_field+hw_type_field+hw_name_hidden+site_num_hidden+res_area_hidden;

    return '<div class="col-lg-12 input-type3-'+rand_class+'"><div class="row p-0 m-0">'+fields+'</div></div>';
}

function preFillElementsType3(data){
    let h1_type;
    let h1_record;
    $(".view-part-container, .view-capacity-container").hide();
    $(".view-override-container, .view-current-container, .view-site-num-container, .view-res-area-container").hide();
    h1_type = 'HW Capacity Override'
    h1_record = data['HW_NM'];
    $(".view-override-container, .view-current-container, .view-site-num-container, .view-res-area-container").show();
    $(".view-site-num").html(data['SITE_NUM']);
    $(".view-res-area").html(data['RES_AREA']);
    $(".view-override").html(data['OVERRIDE_CAP']);
    $(".view-current").html(data['CURRENT_CAP']);
    $(".view-type-h1").html(h1_type);
    $(".view-record-h1").html(h1_record);
    $(".view-hw-nm").html(data['HW_NM']);
    $(".view-start").html(data['EFF_START']);
    $(".view-end").html(data['EFF_END']);
    $(".view-hw-type").html(data['HW_TYPE']);
    $(".view-created-at").html(dateFormatterType3(data['CREATED_AT']));
    $(".view-created-by").html(data['CREATED_BY']);
    $(".view-updated-at").html((Date.parse(data['UPDATED_AT'])) ? dateFormatterType3(data['UPDATED_AT']) : '--/--/--');
    $("#modal-view-data").modal('show');
}

function preFillInputsType3(data){
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
    $(".edit-override-container-type3, .edit-current-container-type3").hide();

    $(".default-state-type3").attr("default-state-type3", JSON.stringify(
        [data['EFF_START'], data['EFF_END'], data['OVERRIDE_CAP'], data['CURRENT_CAP'], data['ID']]
    ));

    $.each(data, function(index, item){
        let eff_start; 
        let eff_end;
        if (index == 'EFF_START' || index == 'EFF_END') {                    
            eff_start = renderWeeksType3(weeks, (index == 'EFF_START') ? item : '', "EFF_START");
            eff_end = renderWeeksType3(weeks, (index == 'EFF_END') ? item : '', "EFF_END");
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
    $(".edit-override-container-type3, .edit-current-container-type3").show();
    $(".edit-override-type3").val(val_arr[4]);
    $(".edit-current-type3").val(val_arr[5]);
    attr = 'EDIT_HW_CAPACITY';
    class_name = 'btn-edit-hw-type3';
    
    $(".edit-type-h1-type3").html(h1_type);
    $(".edit-record-h1-type3").html(h1_record);
    $(".edit-id-type3").val(val_arr[0]);
    // $(".edit-genpool").val(genpool_hw);
    $(".edit-hw-nm-type3").val(hw_name);
    $(".edit-start-type3").html(start);
    $(".edit-end-type3").html(end);
    $(".edit-hw-type-type3").val(hw_type);
    $(".edit-site-num-type3").val(site_num);
    $(".edit-res-area-type3").val(res_area);
    $(".edit-created-at-type3").html(dateFormatterType3(created_at));
    $(".edit-updated-at-type3").html((Date.parse(updated_at)) ? dateFormatterType3(updated_at) : '--/--/--');
    $(".edit-created-by-type3").html(created_by);
    $(".btn-edit-data-type3").attr('process-type', attr).addClass(class_name);
    $("#modal-edit-data-type3").modal('show');
}

function existingFieldType3(data, data2, data3){
    
    let existing_counter = 0;
    $(".input-hw-text-type3").each(function(){
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
    $('.input-start-select-type3[identifier="'+identifier+'"], .input-end-select-type3[identifier="'+identifier+'"]').removeClass('border-success border-danger');
    $('.input-start-select-type3[identifier="'+identifier+'"], .input-end-select-type3[identifier="'+identifier+'"]').addClass(border);
    $(".btn-save-type3").prop("disabled", disable);
    return (result == true) ? false : true;
}

function calculateGenpoolCapacityType3(target_hw = null, site_num, res_area){

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

    $(".input-type3").each(function(){
        let identifier = $(this).attr("identifier");
        if ($.inArray(identifier, idtf_arr) === -1) {
            idtf_arr.push(identifier);
        }
    });

    $.each(idtf_arr, function(idx, itm){
        let input_arr = [];
        $('.input-type3[identifier="'+itm+'"]').each(function(index, item){
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
                    if (target_idtf.includes("input-type3")) {
                        $('.input-start-select-type3[identifier="'+target_idtf+'"]').removeClass(to_remove_class).addClass(to_add_class);
                        $('.input-end-select-type3[identifier="'+target_idtf+'"]').removeClass(to_remove_class).addClass(to_add_class);
                    }
                }
    
                // if (idtf2.includes("input-type3")) {
                //     $('.input-start-select-type3[identifier="'+idtf2+'"]').removeClass(to_remove_class).addClass(to_add_class);
                //     $('.input-end-select-type3[identifier="'+idtf2+'"]').removeClass(to_remove_class).addClass(to_add_class);
                // }
            });
        }
        else{
            $('.input-start-select-type3[identifier="'+idtf1+'"]').removeClass("border-danger").addClass("border-success");
            $('.input-end-select-type3[identifier="'+idtf1+'"]').removeClass("border-danger").addClass("border-success");
        }

    });
    
    let is_disabled = (overlap_count > 0) ? true : false
    $(".btn-save-type3").prop("disabled", is_disabled);
}

function calculateGenpoolCapacityType3Edit(target_hw = null, site_num, res_area, existing_id){

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

    $(".edit-data-type3").each(function(){
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
            $('.edit-start-type3').removeClass("border-danger").addClass("border-success");
            $('.edit-end-type3').removeClass("border-danger").addClass("border-success");
        }

    });
    
    if (overlap_count > 0) {
        $('.edit-start-type3').removeClass("border-success").addClass("border-danger");
        $('.edit-end-type3').removeClass("border-success").addClass("border-danger");
        $('.btn-edit-data-type3').prop("disabled", true);
    }
    else{
        $('.edit-start-type3').removeClass("border-danger").addClass("border-success");
        $('.edit-end-type3').removeClass("border-danger").addClass("border-success");
        $('.btn-edit-data-type3').prop("disabled", false);
    }
}

function showGenericAlertType3(icon, title){
    Swal.fire({
        title: title,
        icon: icon
    });
}

function showDeleteAlertType3(title, msg, data, crud, user_details){
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
            crudProcessType3(crud, data, user_details);
        }
    });
}

function showLoaderType3(){
    Swal.fire({
        title: 'Processing... \n Please Wait!',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading()
        },
    });
}
