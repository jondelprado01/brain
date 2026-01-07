
var all_primary_setup       = []; 
var all_primary_hardware    = []; 
var all_original_primary    = []; 
var all_original_alternate  = [];
var discarded_pool          = [];
var new_primary_setup       = []; //always one
var current_hardware        = [];
var selected_hardware_alt   = [];
var selected_hardware_prm   = [];
var plannable_setups        = [];
var oee_onchange            = 0;
var data_set = [];
var group_header = [];

$(document).ready(function(){
    //POPOVER INITIALIZATION
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl, {
        trigger: 'focus',
        html: true
    }));

    // ---------------------------------------------------------------------------------SESSION VARIABLES--------------------------------------------------------------------------
    var session_search =  sessionStorage.getItem('session_search');
    var session_filters = JSON.parse(sessionStorage.getItem('session_filters'));
    var session_part_selections = JSON.parse(sessionStorage.getItem('session_part_selections'));

    //PART SELECTION DATATABLE
    var part_selection = $(".part-selection-table").DataTable({
        paging: false,
        scrollCollapse: true,
        scrollY: '600px',
        bLengthChange: false,
        ordering: false,
        bInfo: false,
        searching: false,
        bPaginate: false,
        responsive: true,
        createdRow: function (row, data, index) {
            if (data[1] === '&nbsp;') {
                $('td', row).addClass('group-header');
                $('td', row).eq(0).addClass('group-title');
            }
            else{
                $('td', row).css("font-size", "15px");
            }
        },
        rowCallback: function (row, data, index) {
            $(row).on('click', function (e) {
                if (data[1] != '&nbsp;') {
                    e.currentTarget.classList.toggle('selected');
                }
                
                let selected_rows = part_selection.rows('.selected').data().length;
                
                if (selected_rows > 0) {
                    $(".btn-modify").removeClass("btn-secondary").addClass("btn-info").prop("disabled", false);
        
                    if (selected_rows > 1) {
                        btn_text = "Batch Planning Assumptions";
                    }
                    else{
                        btn_text = "Planning Assumptions";
                    }
                    $(".btn-modify").html(btn_text);
                }
                else{
                    $(".btn-modify").removeClass("btn-info").addClass("btn-secondary").prop("disabled", true);
                }
            });
        }
    });

    $('.toast').toast('show');
    var current_primary_data = null;
    var group_header_arr = [];
    if ($(".pre-data").val() != "") {
        current_primary_data = JSON.parse($(".pre-data").val());
        let new_data = formatData(null, current_primary_data, "resource-dropdown");

        $.each(current_primary_data, function(index, item){
            group_header_arr.push(item[3]);
        });
        
        let data_set = (session_part_selections != null) ? session_part_selections['data_set'] : current_primary_data;
        let record_count = (session_part_selections != null) ? session_part_selections['record_count'] : null;
        let group_header = (session_part_selections != null) ? session_part_selections['group_header'] : group_header_arr;
        populateDropdown((session_filters != null) ? session_filters : new_data);
        renderPartSelectionTable(data_set, record_count, group_header, part_selection);
    }
    else{
        if (session_part_selections != null && session_filters != null) {
            let data_set = (session_part_selections != null) ? session_part_selections['data_set'] : current_primary_data;
            let record_count = (session_part_selections != null) ? session_part_selections['record_count'] : null;
            let group_header = (session_part_selections != null) ? session_part_selections['group_header'] : group_header_arr;
    
            populateDropdown((session_filters != null) ? session_filters : new_data);
            renderPartSelectionTable(data_set, record_count, group_header, part_selection);
        }
    }

    //----------------------------------------------------------------------------DATATABLES - MAIN DISPLAY-------------------------------------------------------------

    var tp_id = $('.table_primary').map(function() {
        return $(this).attr('id');
    });
    
    //PLANNING ASSUMPTION DATATABLES
    var primary_markers = [];
    var current_primary_markers = [];
    var source_markers = [];
    
    for (let index = 0; index < tp_id.length; index++) {
        let table_primary_id = tp_id[index].replace(".", "_").replace("#", "_").replace("-", "_");
        let table_source_id = tp_id[index].replace("primary", "source");
        let hardware_change_btn = table_primary_id.replace("table_primary", "HWCH");
        let hardware_change_exists = $("#"+hardware_change_btn).length;
        
        primary_markers[index] = $("#"+table_primary_id).DataTable({
            oLanguage: {
                sEmptyTable: "Drag & Drop Alternate Setup Here"
            },
            responsive: true,
            searching: false,
            ordering: false,
            bLengthChange: false,
            bInfo: false,
            bPaginate: false,
            language : {
                zeroRecords: "&nbsp;"             
            },
            columnDefs: [{
                targets: '_all',
                createdCell: function (td, cellData, rowData, row, col) {
                    let user_group = JSON.parse(user_details['emp_user_group']);
                    if ($.inArray('SCM Cap Planning', user_group) !== -1 || user_group.length == 0) {
                        $(td).addClass('draggable_tr');
                    }

                    $(td).attr('hash-data', rowData[13]);
                    const col_arr = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
                    if (col_arr.includes(col)) {
                        $(td).css('display', 'none');
                    }
                    if (col == 0) {
                        $(td).removeClass('draggable_tr');
                    }

                    //ADD ATTRIBUTES TO ALL SETUPS IF AN INSTANCE IS LOADED
                    const queryString = window.location.search;
                    const urlParams = new URLSearchParams(queryString);
                    const parameterExists = urlParams.has('timephase-instance');
                    const parameterValue = urlParams.get('timephase-instance');

                    if (parameterExists) {
                        let cell_inputs = [5, 6, 7, 8];
                        let field_val;
                        let idtf_val = rowData[31];
                        if ($.inArray(col, cell_inputs) !== -1) {
                            switch (col) {
                                case 5:
                                    field_val = 'TTPI';
                                    break;

                                case 6:
                                    field_val = 'UTPI';
                                    break;

                                case 7:
                                    field_val = 'INDX';
                                    break;
                            
                                default:
                                    field_val = 'OEE';
                                    break;
                            }
                            $(td).attr({
                                'contenteditable': true,
                                'instance-data-id': parameterValue,
                                'instance-field': field_val,
                                'instance-default': cellData,
                                'instance-identifier': idtf_val,
                            });

                            $(td).addClass('instance-input');
                        }
                    }
                }
            }],
            createdRow: function (row, data, dataIndex) {
                $(row).attr('part-data', data[15]);
                $(row).attr('table-id', table_primary_id);
                //GET CURRENT PRIMARY HARDWARE
                current_hardware.push(data[19]+'_'+data[20]);
            },
        });

        //GET ALL EXISTING AND ORIGINAL PRIMARY SETUP
        $.each(primary_markers[index].rows().data(), function(idx, itm){
            all_original_primary.push(itm);
        });
        
        source_markers[index] = $("#"+table_source_id).DataTable({
            order: [[18, 'asc']],
            responsive: true,
            // ordering: false,
            searching: false,
            bLengthChange: false,
            bInfo: false,
            bPaginate: false,
            language : {
                zeroRecords: "&nbsp;"             
            },
            aaSorting: [[ 6, "asc" ]],
            columnDefs: [
                // { width: '20px', targets: [0,5,7] },
                // {targets: [5], orderable: false},
                // { targets: '_all', className: 'dt-center' },
                {
                    targets: '_all',
                    createdCell: function (td, cellData, rowData, row, col) {

                        const queryString = window.location.search;
                        const urlParams = new URLSearchParams(queryString);
                        const parameterExists = urlParams.has('timephase-instance');
                        const parameterValue = urlParams.get('timephase-instance');                        

                        //DISABLE SETUPS WITH NONE VALUES
                        if (rowData[1] == 'NONE') {
                            $(td).addClass('table-disabled');
                            $('[atom-group="NONE|NONE"]').prop("disabled", true);
                        }
                        else{
                            let add_class = "";
                            // if ($.inArray(col, [1,2,3,4]) === -1) {
                            if (hardware_change_exists == 0) {
                                let user_group = JSON.parse(user_details['emp_user_group']);
                                if ($.inArray('SCM Cap Planning', user_group) !== -1 || user_group.length == 0) {
                                    add_class = "draggable_tr";
                                }
                            }
                            else{
                                add_class = "table-disabled";
                                // $(".btn-dedication-"+table_source_id+", .btn-dedication-"+table_primary_id+"").prop("disabled", true);
                                $('.dedication-config[table-id="'+table_source_id+'"]').prop("disabled", true);
                                $('.dedication-config[table-id="'+table_primary_id+'"]').prop("disabled", true);
                            }
                            
                            // console.log(add_class);
                            

                            // if (col != 0) {
                                $(td).addClass(add_class);
                            // }
    
                            $(td).attr('hash-data', rowData[13]);
                            const col_arr = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
                            if (col_arr.includes(col)) {
                                $(td).css('display', 'none');
                            }
                            
                            if (col == 0) {
                                $(td).removeClass('draggable_tr');
                                $(td).addClass('config');
                            }
                            
                            if (parameterExists) {
                                if ($.inArray(col, [5, 6, 7, 8]) !== -1) {
                                    $(td).removeClass('draggable_tr');
                                }
                            }
                        }

                        //ADD ATTRIBUTES TO ALL SETUPS IF AN INSTANCE IS LOADED
                        if (parameterExists) {
                            let cell_inputs = [5, 6, 7, 8];
                            let field_val;
                            let idtf_val = rowData[31];
                            if ($.inArray(col, cell_inputs) !== -1) {
                                switch (col) {
                                    case 5:
                                        field_val = 'TTPI';
                                        break;

                                    case 6:
                                        field_val = 'UTPI';
                                        break;

                                    case 7:
                                        field_val = 'INDX';
                                        break;
                                
                                    default:
                                        field_val = 'OEE';
                                        break;
                                }
                                $(td).attr({
                                    'contenteditable': true,
                                    'instance-data-id': parameterValue,
                                    'instance-field': field_val,
                                    'instance-default': cellData,
                                    'instance-identifier': idtf_val,
                                });

                                $(td).addClass('instance-input');
                            }
                        }
                    }
                }
            ],
            createdRow: function (row, data, dataIndex) {
                //DISABLE STEP'S SETUPS THAT HAVE A PENDING HW CHANGE - HANDSHAKE PROCESS
                if (hardware_change_exists > 0) {
                    let flag_attr = $('.unplannable-flag').attr("part-flag-data");
                    $('.unplannable-flag[part-flag-data="'+flag_attr+'"]').each(function(){
                        $(this).prop("disabled", true);
                    });
                }

                //DISABLE SETUPS WITH MISSING HW_SET_ID
                let hw_set_arr = JSON.parse(data[14]);
                if (Object.keys(hw_set_arr[data[19]]).length == 0) {
                    $(row).addClass('table-disabled');
                    $(row).find('td').removeClass('draggable_tr');
                }

                $(row).attr('part-data', data[15]);
                $(row).attr('table-id', table_source_id);
            },
            drawCallback: function(){
                $("#"+table_source_id+" tr .draggable_tr").draggable({
                    snap: "#"+table_primary_id,
                    revert: true, helper: "clone",
                    start: function(e, ui)
                    {
                     $(ui.helper).addClass("ui-draggable-helper");                     
                    },
                    helper: function(){
                        var init_table1 = $("#"+table_primary_id).DataTable();
                        current_primary_markers[index] = init_table1.row('.odd').data();
                        
                        // init_table1.row($('[role="row"]')).remove().draw(false);
                        var selected = $('tr.selectedRow');
                        if (selected.length === 0) {
                            selected = $(this).closest('tr').addClass('selectedRow');
                        }

                        var container = $('<div/>').attr('id', 'draggingContainer');
                        container.append(selected.clone().removeClass("selectedRow"));
                        return container;
                        
                    }
                });
            }
        });

        

        //GET ALL EXISTING AND ORIGINAL ALTERNATE SETUP
        $.each(source_markers[index].rows().data(), function(idx, itm){
            all_original_alternate.push(itm);
        });

        $(document).delegate('#'+table_primary_id+' tr', 'click', function (event) {  
            if (typeof($(event.target).attr('class')) != 'undefined') {
                if ($(event.target).attr('class').indexOf('dt-control') !== -1) {
                    var tr = $(this).closest('tr');
                    $(this).toggleClass("collapsed");
                    var row = primary_markers[index].row(tr);
                    retrieveHardware(row);
                }
            }
        });

        $(document).delegate('#'+table_source_id+' tr', 'click', function (event) {
            if (typeof($(event.target).attr('class')) != 'undefined') {
                if ($(event.target).attr('class').indexOf('dt-control') !== -1) {
                    var tr = $(this).closest('tr');
                    $(this).toggleClass("collapsed");
                    var row = source_markers[index].row(tr);
                    retrieveHardware(row);
                }
            }
        });
        
        if ($("#"+table_source_id).DataTable().rows().data().length > 0) {
            let cell_identifier = "";
            cell_identifier = $("#"+table_source_id).DataTable().rows().data()[0][26];

            $("#"+table_primary_id).droppable({
                // accept: '.'+cell_identifier,
                drop: function (event, ui) {
                    var dropTable = $(this).DataTable();
                    dropTable.rows().remove().draw();
                    var drop_node = dropTable.row.add(ui.helper.children()).draw(false).node();
                    primary = dropTable.row().data();
                    all_primary_setup.push(primary[13]);
    
                    //RETURN TO DEFAULT COLOR CODING - PRIMARY SETUP (IF EXIST)
                    let is_default_primary;
                    if (primary[27] == "DEFAULT" || primary[27] == "DEDICATION") { //IF SETUPS ARE DEFAULT (NO INSTANCE LOADED)
                        is_default_primary = all_original_primary.some(function(o){return o[13] === primary[13] && o[19] === primary[19] && o[27] === primary[27];});
                    }
                    else{
                        is_default_primary = all_original_primary.some(function(o){return o[24] === primary[24] && o[19] === primary[19] && o[27] === primary[27];});
                    }
                
                    let static_change_color = (primary[27] == "DEFAULT" || primary[27] == "INSTANCE") ? 'bg-part-primary' : 'bg-part-dedication-primary';
                    let pulse_change_color = (primary[27] == "DEFAULT" || primary[27] == "INSTANCE") ? 'bg-part-primary-changes' : 'bg-part-dedication-primary-changes';

                    if (primary[27] == "DEDICATION") {
                        $(drop_node).find('td').removeClass("bg-part-dedication-alternate");
                    }
                    $(drop_node).find('td').addClass((is_default_primary) ? static_change_color : pulse_change_color);
    
                    //DISABLE UNPLANNABLE FLAG CHECKBOX
                    $(".bg-part-primary-changes .unplannable-flag").prop({"checked": false, "disabled": true});
    
                    //RETURN TO DISCARDED/CHANGED CURRENT PRIMARY SETUP TO ITS RESPECTIVE ALTERNATE SOURCE TABLE 
                    var draggingTable = $('.selectedRow').closest('table').DataTable();
                    draggingTable.row($('.selectedRow')).remove().draw(false);
                    if (current_primary_markers[index] != null) {
                        var source_node = source_markers[index].row.add(current_primary_markers[index]).draw(false).node();
                        let is_default_alternate = all_original_alternate.some(function(o){return o[13] === current_primary_markers[index][13] && o[19] === current_primary_markers[19] && o[27] === current_primary_markers[27];});
                        $(source_node).find('td').addClass((is_default_alternate) ? '' : 'bg-part-changes');
                        discarded_pool.push(current_primary_markers[index][13]);
                        $('.bg-part-changes .unplannable-flag[part-flag-data="'+current_primary_markers[index][26]+'"]').prop("disabled", false);
                    }
    
                    //DISABLE CHECKBOX IF MULTIPLE SETUP CHANGES
                    let split = primary[15].split("|");
                    if ($.inArray(split[2], new_primary_setup) === -1) {
                        new_primary_setup.push(split[2]);
                    }
                    if ($('.apply-check-primary:checkbox:checked').length == 0 && new_primary_setup.length <= 1) {
                        checkResourceMapping("all-steps", primary);
                    }
                    else{
                        resetElements("all-steps", "apply-check-primary");
                    }
    
                    //DISABLED CHECKBOX IF PRIMARY HARDWARE IS NOT APPLICABLE TO OTHER PRIMARY
                    primaryHardwareChecker(primary[19], primary[3]+'|'+primary[4]);
    
                    //CHECK FOR ALL CHECKED UNPLANNABLE SETUPS (UNCHECK APPLY TO ALL AND OR HIDE IT)
                    
                    if ($(".apply-check-flag").is(":not(:checked)") && ($('.unplannable-flag[flag-type=""]:checked').length == 0 || $('.unplannable-flag[flag-type=""]:checked').length > 1)) {
                        $(".apply-check-flag-container").fadeOut();
                        $(".apply-check-flag").prop("checked", false);
                    }
                    else if($('.unplannable-flag[flag-type=""]:checked').length == 1){
                        $(".apply-check-flag-container").fadeIn();
                    }
                }
            });
        }

    }

    // OEE DATATABLE
    var oee_main = $(".table-main").DataTable({
        keys: true,
        responsive: true,
        // searching: false,
        ordering: false,
        bLengthChange: false,
        bInfo: false,
        bPaginate: false,
        columnDefs: [{
            targets: '_all',
            createdCell: function (td, cellData, rowData, row, col) {
                const col_arr = [8];
                if (col_arr.includes(col)) {
                    $(td).css('display', 'none');
                }

                switch (col) {
                    case 0:
                        td_class = "MFG_PART_NUM";
                        break;

                    case 3:
                        td_class = "TESTER";
                        break;

                    case 4:
                        td_class = "HANDLER";
                        break;

                    case 5:
                        td_class = "TEMP_CLASS";
                        break;
                
                    default:
                        td_class = "";
                        break;
                }

                $(td).addClass(td_class);
            }
        }]
    });
    $(".table-main").width("100%");
                    
    var oee_default_data = $("#default-data").val();
    var oee_hidden_col = [];
    var oee_column = oee_main.column(3).data();
    var existing_primary = [];
    
    //GET ALL EXISTING PRIMARY SETUP - INITIAL LOAD ONLY
    $.each($(".table_primary").DataTable().rows().data(), function(index, item){
        existing_primary.push(item);
    });

    //-----------------------------------------------------------------------DATATABLES - DEDICATION----------------------------------------------------------------
    var table_dedication = $(".table-dedication").DataTable({
            oLanguage: {
                sEmptyTable: "No Existing Dedication"
            },
            language : {
                zeroRecords: "&nbsp;"             
            },
            responsive: true,
            searching: false,
            ordering: false,
            bLengthChange: false,
            bInfo: false,
            bPaginate: false,
            columnDefs: [{
                targets: '_all',
                createdCell: function (td, cellData, rowData, row, col) {
                    if (col == 10) {
                        $(td).css('display', 'none');
                    }
                    if (col == 9) {
                        $(td).addClass('fs-6');
                    }
                }
            }],
        });
    
    //-----------------------------------------------------------------------------EVENTS---------------------------------------------------------------------------

    //RESOURCE PICKER - REMOVE PART NUMBER FROM PART SELECTION TABLE
    $(document).delegate(".btn-pst-del", "click", function(){
        let data = $(this).attr("data-id");
        deletePartSelectionTable(data, data_set, group_header, part_selection);
    });

    //RESOURCE PICKER - CLEAR SELECTION
    $(".btn-clear").on("click", function(){
        resetResourcePicker(part_selection);
    });

    //UNPLANNABLE FLAG
    $(document).delegate(".unplannable-flag", "change", function(){
        let flag_data = JSON.parse($(this).val());
        let flag_type = $(this).attr("flag-type");
        let flag_id = flag_data['DB_ID'];

        if (flag_type == 'unplannable') {
            if ($(this).is(":checked")) {
                plannable_setups = plannable_setups.filter(function(e) { return e.DB_ID !== flag_id });
            }
            else{
                plannable_setups.push(flag_data);
            }
        }
        //APPLY TO ALL STEPS
        $(".apply-check-flag-container").prop("checked", false);
        if ($('.unplannable-flag[flag-type=""]:checked').length > 0) {
            $(".apply-check-flag-container").fadeIn();
        }
        else{
            $(".apply-check-flag-container").fadeOut();
        }
    });

    //APPLY TO ALL STEPS - PRIMARY SETUPS/CONFIGS
    var original_primary = [];
    $(".apply-check-primary").on("change", function(){
        let event = (this.checked) ? true : false;
        if (event) {
            $.each(resource_matches, function(index, item){
                //CHECK FOR EXISTING PRIMARY SETUPS AND RESET ROW
                let table_primary = $("#"+item[16]).DataTable();
                let table_source = $("#"+item[17]).DataTable();
                let existing_primary = table_primary.rows().data();
                if (existing_primary.length > 0) {
                    table_primary.rows().remove().draw();
                    $.each(existing_primary, function(idx, itm){
                        let source = table_source.row.add(itm).draw(false).node();
                        $(source).find('td').addClass('bg-part-changes');
                        discarded_pool.push(itm[13]);
                        original_primary.push(itm);
                    });
                }
    
                let table_drop = $("#"+item[(event) ? "16" : "17"]).DataTable();
                let table_remove = $("#"+item[(event) ? "17" : "16"]).DataTable();
                let drop = table_drop.row.add(item).draw(false).node();
                $(drop).find('td').addClass('bg-part-primary-changes');
                $(".bg-part-primary-changes .unplannable-flag").prop({"checked": false, "disabled": true});
                var indexes = table_remove
                .rows()
                .indexes()
                .filter( function ( value, index ) {
                    return item[13] === table_remove.row(value).data()[13] && item[18] === table_remove.row(value).data()[18];
                });
                table_remove.rows(indexes).remove().draw();
            });
        }
        else{
            let excluded_tables = [];

            $.each(resource_matches, function(index, item){
                excluded_tables.push(item[16]);
                excluded_tables.push(item[17]);
            });
            
            //CLEAR ALL TABLES WITH NO CURRENT CHANGES/EVENTS (DRAG & DROP)
            $.each(excluded_tables, function(index, item){
                $("#"+item).DataTable().rows().remove().draw();
            });

            //RESET TABLE AND PUT ORIGINAL PRIMARY SETUP (EXISTING OR NOT)
            $.each(all_original_primary, function(index, item){
                if ($.inArray(item[16], excluded_tables) !== -1) {
                    let primary = $("#"+item[16]).DataTable().row.add(item).draw(false).node();
                    $(primary).find('td').addClass('bg-part-primary');
                }
            });

            $.each(all_original_alternate, function(index, item){
                if ($.inArray(item[17], excluded_tables) !== -1) {
                    let alternate = $("#"+item[17]).DataTable().row.add(item).draw(false).node();
                    $(alternate).find('td').removeClass('bg-part-changes');
                }
            });
        }
    });

    //APPLY TO ALL STEPS - FLAGGING SETUPS (UNPLANNABLE OR PLANNABLE)
    $(".apply-check-flag").on("change", function(){
        let event = (this.checked) ? true : false;
        if (event) {
            $('.unplannable-flag[flag-type=""]:checked').each(function(){
                let atom_group = $(this).attr("atom-group");
                $('[atom-group="'+atom_group+'"]:not(:disabled)').prop("checked", true);
            });
        }
        else{
            $('.unplannable-flag[flag-type=""]:checked').each(function(){
                $(this).prop("checked", false);
            });
        }
    });

    //SAVE CONFIG - GET ALL SELECTED PRIMARY SETUP AND INSERT INTO DB
    $(".btn-save-config").on("click", function(){
        let payload;
        let setups              = "";
        let hardwares           = "";
        let other_hardwares     = "";
        let unplannables        = "";
        let plannables          = "";
        let partnum_arr         = [];
        let selected_primary    = [];
        let all_primary_setup   = [];
        let all_primary_hw      = [];
        let all_prim_changes    = [];
        let all_setups          = [];
        let alternate_tables    = [];
        let unplannable_setups  = [];
        let changed_primary     = [];
        let notif_primary       = [];
        let not_selected_hw     = [];
        let remove_primary      = [];
        let primary_exists      = [];

        //CHECK IF THERE'S AN INSTANCE LOADED
        if ($('[instance-data-id]').length > 0) {
            let instance_error = 0;
            let instance_unplannable = [];
            let instance_plannable = [];
            let instance_steps = [];
            let instance_setups = [];
            let confirmation = "";
            let steps_content = "";
            let session_instance = JSON.parse(sessionStorage.getItem('instance-loaded'));
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            const tpValue = urlParams.get('timephase-instance');
            
            $(".unplannable-flag:checked").each(function(){
                let pi_prio = JSON.parse($(this).val())['RES_PRIO_CD'];
                if (pi_prio <= 99) {
                    instance_unplannable.push(JSON.parse($(this).val()));
                }
            });

            $(".unplannable-flag:not(:checked)").each(function(){
                let pi_prio = JSON.parse($(this).val())['RES_PRIO_CD'];
                if (pi_prio >= 99) {
                    instance_plannable.push(JSON.parse($(this).val()));
                }
            });

            //GET ANY CHANGES TO TEST TIME, UTPI, INDEX, OEE, 
            $('[instance-data-id="'+tpValue+'"]').each(function(){
                let split = $(this).attr("instance-identifier").split("|");
                let step = split[0];
                let rte = split[1];
                let prio = split[2];
                let tstr = split[3];
                let hndlr = split[4];
                let field = $(this).attr("instance-field");
                let value = $(this).text();
                let def_val = $(this).attr("instance-default");
                
                if (value != def_val) {
                    let si_content = session_instance[tpValue]['DATA']['RTE_SEQ_NUM'][rte];
                    
                    //IF ANY OF THE FIELD WAS CHANGED (TEST TIME, UTPI, OEE, INDEX TIME)
                    if (si_content['STEP_NM'] == step) {
                        si_content['RES_PRIO_CD'][prio][field] = value;
                        si_content['RES_PRIO_CD'][prio][field] = value;
                        si_content['RES_PRIO_CD'][prio][field] = value;
                        si_content['RES_PRIO_CD'][prio][field] = value;
                    }
    
                    if ($.inArray(step, instance_steps) === -1) {
                        instance_steps.push(step);
                    }
                    
                    instance_setups.push([step, tstr, hndlr, field, parseFloat(value)]);
                    
                    if (Number.isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
                        instance_error++;
                    }

                    if (field == 'OEE') {
                        if (parseFloat(value) > 1) {
                            instance_error++;
                        }
                    }
                }
            });

            //GET ANY CHANGES TO DEFAULT PRIMARY SETUPS
            let primary_table_data = $(".table_primary").DataTable().rows().data().toArray();
            let primary_tpd_id = [];
            let change_details_arr = [];

            let tpi_route_id = session_instance[tpValue]['SAP_RTE_ID'];
            let tpi_rte_data = session_instance[tpValue]['DATA']['RTE_SEQ_NUM'];
            let tpi_rte_keys = Object.keys(tpi_rte_data);

            change_details_arr[tpi_route_id] = [];
            
            $.each(tpi_rte_keys, function(idx, itm){
                let tpi_tpd_id = tpi_rte_data[itm]['RES_PRIO_CD'][1]['TPD_ID'];
                let tpi_step = tpi_rte_data[itm]['STEP_NM'];
                
                $.each(primary_table_data, function(index, item){
                    let tpd_id = item[23];
                    let split = item[15].split("|");
                    let ptd_step = split[2];
                    let ptd_route = split[4];

                    if (tpi_route_id == ptd_route && tpi_step == ptd_step) {
                        if (tpd_id != tpi_tpd_id) {
                            let tpi_prio_keys = Object.keys(tpi_rte_data[itm]['RES_PRIO_CD']);
                            $.each(tpi_prio_keys, function(inner_idx, inner_item){
                                let tpi_data = tpi_rte_data[itm]['RES_PRIO_CD'][inner_item];
                                if(tpd_id == tpi_rte_data[itm]['RES_PRIO_CD'][inner_item]['TPD_ID']){
                                    tpi_data['CURRENT_PRIO_CD'] = inner_item;
                                    tpi_data['RTE_SEQ_NUM'] = itm;
                                    primary_tpd_id.push(tpi_data);
                                }
                            });
                        }
                    }
                });
            });

            //UPDATE SESSION INSTANCE DATA - REORDER SETUP'S PRIO CD
            
            if (primary_tpd_id.length > 0) {
                $.each(primary_tpd_id, function(index, item){
                    let current_prio = item['CURRENT_PRIO_CD'];
                    let current_tpd_id = item['TPD_ID'];
                    let si_data = tpi_rte_data[item['RTE_SEQ_NUM']]['RES_PRIO_CD'];
                    let si_step = tpi_rte_data[item['RTE_SEQ_NUM']]['STEP_NM'];
                    let prio_keys = Object.keys(si_data);
                    let target_arr = [];
                    let change_details = si_step+'|'+item['TESTER']+' - '+item['HANDLER'];

                    $.each(prio_keys, function(idx, itm){
                        let target_instance = si_data[itm];
                        let target_tpi_id = si_data[itm]['TPD_ID'];
                        if (target_tpi_id != current_tpd_id) {
                            if (itm < current_prio) {
                                if (itm == 1) {
                                    change_details += '|'+si_data[itm]['TESTER']+' - '+si_data[itm]['HANDLER'];
                                }
                                target_instance['NEW_PRIO_CD'] = parseInt(itm) + 1;
                            }
                            else{
                                target_instance['NEW_PRIO_CD'] = itm;
                            }
                            target_arr.push(target_instance);
                        }
                        delete si_data[itm];
                    });

                    $.each(target_arr, function(idx, itm){
                        si_data[itm['NEW_PRIO_CD']] = itm;
                    });

                    si_data[1] = item;

                    change_details_arr[tpi_route_id].push(change_details);
                });
            }
            
            //IF PLANNABLE
            if (instance_plannable.length > 0) {
                $.each(instance_plannable, function(index, item){
                    let si_new_key = item['RES_PRIO_CD'] - 99;
                    let si_content = session_instance[tpValue]['DATA']['RTE_SEQ_NUM'][item['RTE_SEQ_NUM']];
                    if (si_content['RES_PRIO_CD'][item['RES_PRIO_CD']]['TPD_ID'] == item['TPD_ID']) {
                        si_content['RES_PRIO_CD'][si_new_key] = si_content['RES_PRIO_CD'][item['RES_PRIO_CD']];
                        delete si_content['RES_PRIO_CD'][item['RES_PRIO_CD']];

                        if ($.inArray(item['STEP_NM'], instance_steps) === -1) {
                            instance_steps.push(item['STEP_NM']);
                        }
                        
                        instance_setups.push([item['STEP_NM'], item['TESTER'], item['HANDLER'], "Flag", "Plannable"]);
                    }
                });
            }
            
            //IF UNPLANNABLE
            if (instance_unplannable.length > 0) {
                $.each(instance_unplannable, function(index, item){
                    let si_content = session_instance[tpValue]['DATA']['RTE_SEQ_NUM'][item['RTE_SEQ_NUM']];
                    if (si_content['RES_PRIO_CD'][item['RES_PRIO_CD']]['TPD_ID'] == item['TPD_ID']) {
                        let uf_key = 99 + item['RES_PRIO_CD'];
                        si_content['RES_PRIO_CD'][uf_key] = si_content['RES_PRIO_CD'][item['RES_PRIO_CD']];
                        delete si_content['RES_PRIO_CD'][item['RES_PRIO_CD']];

                        if ($.inArray(item['STEP_NM'], instance_steps) === -1) {
                            instance_steps.push(item['STEP_NM']);
                        }
                        
                        instance_setups.push([item['STEP_NM'], item['TESTER'], item['HANDLER'], "Flag", "Unplannable"]);
                    }
                });
            }
            

            if(instance_error > 0){
                showGenericAlert("error", "Invalid Values Detected");
                return;
            }

            if (instance_steps.length > 0 || change_details_arr[tpi_route_id].length > 0) {
                if (instance_steps.length > 0) {
                    $.each(instance_steps, function(index, item){
                        let setups_content = "";
                        let tstr_hndlr_arr = [];
        
                        $.each(instance_setups, function(idx, itm){
                            if(item == itm[0]){
                                if ($.inArray(itm[1]+'|'+itm[2], tstr_hndlr_arr) === -1) {
                                    tstr_hndlr_arr.push(itm[1]+'|'+itm[2]);
                                }
                            }
                        });
        
                        $.each(tstr_hndlr_arr, function(idx, itm){
                            let values_content = "";
                            let split = itm.split("|");
        
                            $.each(instance_setups, function(inner_idx, inner_itm){
                                if(item == inner_itm[0] && inner_itm[1] == split[0] && inner_itm[2] == split[1]){
                                    values_content += '<small>'+inner_itm[3]+': '+inner_itm[4]+'</small><br>';
                                }
                            });
        
                            setups_content += '<tr>'+
                                                '<td><small>'+split[0]+'</small><br><small>'+split[1]+'</small></td>'+
                                                '<td>'+values_content+'</td>'+
                                              '</tr>';
                        });
        
        
                        steps_content +=  '<div class="col-lg-12">'+
                                                '<table class="table table-bordered table-striped caption-top">'+
                                                    '<caption><small>'+item+'</small></caption>'+
                                                    '<thead><tr><th>TESTER / HANDLER</th><th>VALUES</th></tr></thead>'+
                                                    '<tbody>'+setups_content+'</tbody>'+
                                                '</table>'+
                                            '</div>';
                    });
                }

                if (change_details_arr[tpi_route_id].length > 0) {
                    let setups_content = "";
                    $.each(change_details_arr[tpi_route_id], function(index, item){
                        let split = item.split("|");
                        let cd_step = split[0];
                        let cd_current_prim = split[1];
                        let cd_new_prim = split[2];
                        setups_content += '<table class="table table-bordered table-striped caption-top">'+
                                                    '<caption><small>'+cd_step+' - Primary Platform Update</small></caption>'+
                                                    '<thead><tr><th>CURRENT PRIMARY</th><th>NEW PRIMARY</th></tr></thead>'+
                                                    '<tbody>'+
                                                        '<tr><td>'+cd_current_prim+'</td><td>'+cd_new_prim+'</td></tr>'+
                                                    '</tbody>'+
                                                '</table>';
                    });

                    steps_content +=  '<div class="col-lg-12">'+setups_content+'</div>';
                }

                confirmation += '<div class="card card-change mt-3 mb-2">'+
                                        '<div class="card-header"><small class="card-title fw-semibold">[Instance #'+session_instance[tpValue]['INSTANCE']+'] - '+session_instance[tpValue]['SAP_RTE_ID']+'</small></div>'+
                                        '<div style="max-height: 400px; overflow-y: auto;" class="card-body">'+
                                            '<div class="row">'+
                                                steps_content+
                                            '</div>'+
                                        '</div>'+
                                    '</div>';

                

                if (session_instance[tpValue]['NOTES'] == null) {
                    session_instance[tpValue]['NOTES'] = '';
                }

                session_instance[tpValue]['CHANGE_USER'] = user_details['emp_id'];

                showConfirm("Save Time-Phasing Changes", confirmation, "set-timephase-instance", session_instance);
            }
            else if(instance_steps.length > 0 && change_details_arr[tpi_route_id].length > 0){
                showGenericAlert("info", "No Changes Made!");
            }

        }
        else{
            //ONLY NEW PRIMARY SETUP WILL GET PASSED TO THE API
            $.each($(".table_primary").DataTable().rows().data(), function(index, item){
                let new_hw_set_id = [];
                if (selected_hardware_alt.length > 0) {
                    new_hw_set_id = $.map(selected_hardware_alt, function(value, key) {
                        if (value.table == item[16])
                        {
                        return value.value.split("_")[0];
                        }
                });
                }
                
                let exists = all_original_primary.some(function(aop){return aop[13] === item[13] && aop[19] === item[19] && aop[27] === item[27];});
                if (!exists) {
                    let split = item[15].split("|");
                    selected_primary.push({
                        "MFG_PART_NUM": split[0],
                        "SITE_NUM": split[1],
                        "STEP_NM": split[2],
                        "TESTER": item[3],
                        "HANDLER": item[4],
                        "ENG_TESTER": item[1],
                        "ENG_HANDLER": item[2],
                        "IS_PRIMARY": 1,
                        "HASH": item[13],
                        "SAP_RTE_ID": split[4],
                        "HW_SET_ID": (new_hw_set_id.length > 0) ? new_hw_set_id[0] : item[19],
                        "ID": item[20],
                        "RES_SET_ID": item[24],
                        "ATOM_MASTER_ID": item[13],
                        "DED_ID": item[28],
                        "TYPE": item[27],
                        "RES_PRIO_CD": item[18],
                        "TEMP_CLASS": item[29],
                        "SOURCE_TABLE": item[17],
                        "ORIG_PRIO": item[30],
                        "HW_SET_LIST": item[14],
                        "APPLICABLE_HW": [...new Set(item[22].split(","))]
                    });
                }
                else{
                    primary_exists.push(item[13]);
                }     
            });

            //GET ALL EXISTING PRIMARY SETUP TO BE DELETED FROM API
            $.each(all_original_primary, function(index, item){
                if ($.inArray(item[13], discarded_pool) !== -1 && $.inArray(item[13], remove_primary) === -1) {
                    remove_primary.push(item[13]);
                }
            });

            //CHECK FOR DISCREPANCY IN SELECTED AND TO-REMOVE PRIMARY SETUPS
            if (remove_primary.length > selected_primary.length) {
                $.each(primary_exists, function(index, item){
                    if ($.inArray(item, remove_primary) !== -1) {
                        remove_primary = remove_primary.filter(function(itm) {
                            return itm !== item
                        });
                    }
                });
            }
            
            //CAPTURE CHANGES - IF CURRENT EXISTING PRIMARY WAS CHANGED (TRIGGER NOTIFICATION AND STAGING PROCESS)
            if (all_original_primary.length > 0) {
                $.each(selected_primary, function(index, item){

                    let temp_array = [];
                    let part_details = item['MFG_PART_NUM']+'|'+item['SAP_RTE_ID']+'|'+item['STEP_NM'];
                    let hw_details = item['HW_SET_ID'];
        
                    $.each(all_original_primary, function(idx, itm){
                        let split = itm[15].split("|");
                        let aop_part_details = split[0]+'|'+split[4]+'|'+split[2];
                        // let aop_hw_details = itm[19];
                        let aop_hw_details = [...new Set(itm[22].split(","))];
                        
                        if (part_details == aop_part_details) {
                            // hw_details != aop_hw_details
                            if (item['APPLICABLE_HW'].length > 1) {
                                if ($.inArray(hw_details, aop_hw_details) === -1) {
                                    changed_primary.push(item);
                                }
                                else{temp_array.push(item);}
                            }
                            else{
                                if ($.inArray(hw_details, aop_hw_details) === -1) {
                                    notif_primary.push(item);
                                }
                                temp_array.push(item);
                            }
                        }
                        else{temp_array.push(item);}
                    });

                    $.each(temp_array, function(idx, itm){
                        var exists = changed_primary.some(function(obj) { 
                            return obj.HW_SET_ID === itm['HW_SET_ID'] && obj.HASH === itm['HASH'];
                        });
                        
                        if (!exists) {
                            all_primary_setup.push(item);
                        }
                    });
                });
            }
            else{all_primary_setup = selected_primary;}
            
            let uniqueArray = all_primary_setup.filter((o, index, arr) =>
                arr.findIndex(item => JSON.stringify(item) === JSON.stringify(o)) === index
            );
            
            // if type 4 handshake process skip expedite/cancel process. send email (new) notification right away.

            //ATTACH ORIGINAL PRIMARY THAT NEEDS TO BE REPLACED/REMOVED
            attachCurrentPrimary(notif_primary, all_original_primary);
            attachCurrentPrimary(changed_primary, all_original_primary);
            attachCurrentPrimary(all_primary_setup, all_original_primary);

            //CHECK IF APPLY TO ALL PRIMARY TESTER/HANDLER IS CHECKED
            $(".apply-all-primary-hw:checked").each(function(){
                let apply_route_id = $(this).attr("route-id");
                let source_tstr_hndlr = $(this).attr("tester-handler");
                let source_primary_hw = $('.'+$(this).attr("child-hardware")+':checked').val().split("_")[0];
                all_primary_hw.push({apply_hw: source_primary_hw, apply_route_id: apply_route_id, apply_tstr_hndlr: source_tstr_hndlr});
            });

            //GET ALL ALTERNATE SETUPS
            $.each(all_primary_setup, function(index, item){
                let get_alternates = $("#"+item['SOURCE_TABLE']).DataTable().rows().data().toArray();
                $.extend(all_primary_setup[index], {"ALTERNATES": get_alternates});
            });
            $.each(changed_primary, function(index, item){
                let get_alternates = $("#"+item['SOURCE_TABLE']).DataTable().rows().data().toArray();
                $.extend(changed_primary[index], {"ALTERNATES": get_alternates});
            });
            
            //ASSIGN ALL TO PAYLOAD
            payload = {changed_primary: changed_primary, all_primary_setup: uniqueArray, current_primary: remove_primary, all_original_primary: all_original_primary, all_primary_hw: all_primary_hw, all_setups: all_setups};
            
            // console.log(payload);
            // return;
            
            //CAPTURE ALL ALTERNATE SETUPS TAGGED AS UNPLANNABLE
            $(".unplannable-flag:checked").each(function(){
                if ($(this).attr("flag-type") == "") {
                    unplannable_setups.push(JSON.parse($(this).val()));
                }
            });

            //VALIDATION AND APPLY APPROPRIATE PROCESS
            if (selected_primary.length == 0 && selected_hardware_prm.length == 0 && all_primary_hw.length == 0 && unplannable_setups.length == 0 && plannable_setups.length == 0) {
                showGenericAlert("error", "Please Set a Primary Setup or Hardware");
                return;
            }
            else{
                //FOR CHANGING ALTERNATE TO PRIMARY
                if (selected_primary.length > 0) {
                    let parent_route = "";
                    $.each(selected_primary, function(index, item){
                        partnum_arr.push(item['SAP_RTE_ID']);
                    });
            
                    $.each($.unique(partnum_arr), function(index, item){
                        parent_route += '<tr><td colspan="3"><mark>'+item+'</mark></td></tr>';
                        $.each(selected_primary, function(idx, itm){
                            if (item == itm['SAP_RTE_ID']) {
                                parent_route += '<tr style="font-size: 15px!important;"><td>'+itm['STEP_NM']+'</td><td>'+itm['TESTER']+'</td><td>'+itm['HANDLER']+'</td></tr>';
                            }
                        });
                    });

                    setups += '<div class="card mb-3">'+
                                '<div class="card-header"><small class="card-title fw-semibold">Save Primary Setups</small></div>'+
                                '<div class="card-body">'+
                                    '<table class="table table-bordered"><tbody>'+parent_route+'</tbody></table>'+
                                '</div>'+
                            '</div>';
                }

                //FOR CHANGING PRIMARY SETUP'S CURRENT PRIMARY HW
                if (selected_hardware_prm.length > 0) {
                    $.each(selected_hardware_prm, function(index, item){
                        let from = "";
                        let to = "";
                        let split = item['setup_group'].split("|");
                        let split2 = item['tstr_hndlr'].split("|");
                        let target_tester = split2[0];
                        let target_handler = split2[1];
                        let default_hw = item['default_val'];
                        let target_setup = '<tr><td>'+split[2]+'</td><td>'+target_tester+'</td><td>'+target_handler+'</td></tr>';

                        $.each(JSON.parse(item['raw_data']), function(idx, itm){
                            $.each(itm, function(inner_idx, inner_itm){
                                if (default_hw == idx) {
                                    from += '<tr><td>'+inner_idx+'</td><td>'+inner_itm[0]['HW_NM']+'</td></tr>';
                                }
                                else{
                                    to += '<tr><td>'+inner_idx+'</td><td>'+inner_itm[0]['HW_NM']+'</td></tr>';
                                }
                            });
                        });

                        //CONSTRUCT POPUP CONTENT - PRIMARY SETUP (CHANGING OF PRIMARY HW - MANUAL OPERATION)
                        hardwares += '<div class="card card-change mt-3 mb-2">'+
                                        '<div class="card-header"><small class="card-title fw-semibold">Change Primary Hardware [Manually Updated]</small></div>'+
                                        '<div class="card-body">'+
                                            '<div class="row">'+
                                                '<div class="col-lg-6">'+
                                                    '<table class="table table-bordered table-striped caption-top">'+
                                                        '<caption><small>Current HW:</small></caption>'+
                                                        '<thead><tr><th>HW_TYPE</th><th>HW_NM</th></tr></thead>'+
                                                        '<tbody>'+from+'</tbody>'+
                                                    '</table>'+
                                                '</div>'+
                                                '<div class="col-lg-6">'+
                                                    '<table class="table table-bordered table-striped caption-top">'+
                                                        '<caption><small>New HW:</small></caption>'+
                                                        '<thead><tr><th>HW_TYPE</th><th>HW_NM</th></tr></thead>'+
                                                        '<tbody>'+to+'</tbody>'+
                                                    '</table>'+
                                                '</div>'+
                                                '<div class="col-lg-12">'+
                                                    '<table class="table table-bordered table-striped caption-top pb-0">'+
                                                        '<caption><small>For Primary Setup:</small></caption>'+
                                                        '<thead><tr><th>STEP</th><th>TESTER</th><th>HANDLER</th></tr></thead>'+
                                                        '<tbody>'+target_setup+'</tbody>'+
                                                    '</table>'+
                                                '</div>'+
                                            '</div>'+
                                        '</div>'+
                                    '</div>';
                    });
                }

                //GET ALL OTHER CURRENT PRIMARY HARDWARES
                if ($(".apply-all-primary-hw:checked").length > 0) {
                    let tstr_hndlr = $(".apply-all-primary-hw:checked").attr("tester-handler").split("|");
                    let checked_prim_tbl = $(".apply-all-primary-hw:checked").attr("primary-table");
                    let checked_prim_hw = $('.hardware-radio[primary-table="'+checked_prim_tbl+'"]:checked').val().split("_")[0];
                    let checked_raw_data = $('.hardware-radio[primary-table="'+checked_prim_tbl+'"]:checked').attr("data-raw");
                    let tester = tstr_hndlr[0];
                    let handler = tstr_hndlr[1];
                    let to = "";
                    let other_steps = "";
                    let route_arr = [];

                    $.each($(".table_primary").DataTable().rows().data(), function(index, item){
                        let route = item[15].split("|")[4];
                        if ($.inArray(route, route_arr) === -1) {
                            route_arr.push(route);
                        }
                    });

                    $.each(route_arr, function(outer_index, outer_item){
                        let parent_route = outer_item;
                        let group_cell = '<tr><td colspan="3">'+parent_route+'</td></tr>';
                        $.each($(".table_primary").DataTable().rows().data(), function(index, item){
                            if (item[16] != checked_prim_tbl) {
                                let split = item[15].split("|");
                                let steps = split[2];
                                let other_prim_hw = item[19];
                                if (checked_prim_hw != other_prim_hw && parent_route == split[4]) {
                                    all_prim_changes.push(checked_prim_hw+'-'+other_prim_hw);
                                    group_cell += '<tr><td>'+steps+'</td><td>'+tester+'</td><td>'+handler+'</td></tr>';
                                }
                            }
                        });

                        other_steps += group_cell;
                    });
                    
                    $.each(JSON.parse(checked_raw_data), function(idx, itm){
                        $.each(itm, function(inner_idx, inner_itm){
                            if (checked_prim_hw == idx) {
                                to += '<tr><td>'+inner_idx+'</td><td>'+inner_itm[0]['HW_NM']+'</td></tr>';
                            }
                        });
                    });

                    //CONSTRUCT POPUP CONTENT - OTHER STEPS (CHANGING OF PRIMARY HW - APPLY ALL, AUTO-UPDATE)
                    other_hardwares += '<div class="card card-apply mt-3 mb-2">'+
                                            '<div class="card-header"><small class="card-title fw-semibold">Apply to Other Steps [Auto-Updated]</small></div>'+
                                            '<div class="card-body">'+
                                                '<div class="row">'+
                                                    '<div class="col-lg-12">'+
                                                        '<table class="table table-bordered table-striped caption-top">'+
                                                            '<caption><small>To Be Applied:</small></caption>'+
                                                            '<thead><tr><th>HW_TYPE</th><th>HW_NM</th></tr><thead/>'+
                                                            '<tbody>'+to+'<tbody/>'+
                                                        '</table>'+
                                                    '</div>'+
                                                    '<div class="col-lg-12">'+
                                                        '<table class="table table-bordered table-striped caption-top">'+
                                                            '<caption><small>Affected Step(s):</small></caption>'+
                                                            '<thead><tr><th>STEP</th><th>TESTER</th><th>HANDLER</th></tr><thead/>'+
                                                            '<tbody>'+other_steps+'<tbody/>'+
                                                        '</table>'+
                                                    '</div>'+
                                                '</div>'+
                                            '</div>'+
                                        '</div>';
                }
                
                //CONSTRUCT POPUP CONTENT - UNPLANNABLE / PLANNABLE SETUPS
                let is_multiple_flag;
                if (unplannable_setups.length > 0 && plannable_setups.length > 0) {
                    is_multiple_flag = true;
                }
                if (unplannable_setups.length > 0) {
                    unplannables += popupContentGenerator("unplannable", unplannable_setups, is_multiple_flag);
                }
                if (plannable_setups.length > 0) {
                    plannables += popupContentGenerator("plannable", plannable_setups, is_multiple_flag);
                }

                //APPLY APPROPRIATE POPUP NOTIFICATION TYPE AND MESSAGE

                //ALL PROCESS - FINISH REWORKING GENERALIZED CRUD PROCESS AND NOTIFICATIONS
                // if (selected_primary.length > 0 && selected_hardware_prm.length && all_primary_hw.length && (unplannable_setups.length > 0 || plannable_setups.length > 0)) {
                    
                // }

                if (selected_primary.length > 0 && (selected_hardware_prm.length > 0 || all_primary_hw.length > 0)) {
                    let process = setups;
                    if (selected_hardware_prm.length > 0) {
                        process += hardwares;
                    }
                    if (all_primary_hw.length > 0) {
                        process += other_hardwares;
                    }
                    showConfirm("Save All Records?", process, "set", {payload: payload, selected_hardware_prm: selected_hardware_prm, all_primary_hw: all_primary_hw});
                }
                else if(selected_primary.length > 0 && (all_prim_changes.length > 0 || all_prim_changes.length == 0)){

                    if (all_prim_changes.length == 0 && (unplannable_setups.length == 0 && plannable_setups.length == 0)) {
                        title = "Save Primary Setups?";
                    }
                    else if(all_prim_changes.length > 0 && (unplannable_setups.length == 0 && plannable_setups.length == 0)) {
                        title = "Save Primary Setups and then Apply HW to Other Steps?";
                        setups += other_hardwares;
                    }
                    else if(all_prim_changes.length > 0 && (unplannable_setups.length > 0 || plannable_setups.length > 0)){
                        title = "Save Primary Setups then Apply HW to Other Steps and Flag Setups?";
                        setups += other_hardwares + unplannables + plannables;
                    }
                    else if(all_prim_changes.length == 0 && (unplannable_setups.length > 0 || plannable_setups.length > 0)){
                        title = "Save Primary Setups and Flag Setups?";
                        setups += unplannables + plannables;
                    }
                    
                    showConfirm(title, setups, "set", {payload: payload, all_primary_hw: all_primary_hw, selected_hardware_prm: selected_hardware_prm, all_primary_hw: all_primary_hw, unplannable_setups: unplannable_setups, plannable_setups: plannable_setups});
                }
                else if(selected_hardware_prm.length > 0 || all_primary_hw.length > 0){
                    let title = "";
                    if (selected_hardware_prm.length > 0 && (all_prim_changes.length > 0 || all_prim_changes.length == 0)) {
                        if (all_prim_changes.length == 0) {
                            title = "Change Primary Hardware?";
                        }
                        else{
                            title = "Change Primary HW and then Apply to Other Steps?";
                            hardwares += other_hardwares;
                        }
                    }
                    else if(selected_hardware_prm.length == 0 && (all_prim_changes.length > 0 || all_prim_changes.length == 0)){
                        if (all_prim_changes.length > 0) {
                            title = "Apply Primary HW Changes to Other Steps?";
                            hardwares = other_hardwares;
                        }
                        else{
                            showGenericAlert("warning", "No HW Changes Detected to Primary Tester/Handler of Other Steps");
                            return;
                        }
                    }

                    showConfirm(title, hardwares, "change-primary-hardware", {selected_hardware_prm: selected_hardware_prm, all_primary_hw: all_primary_hw}, null);
                }
                else if(unplannable_setups.length > 0 || plannable_setups.length > 0){
                    let flag_payload = {
                        unplannable: unplannable_setups,
                        plannable: plannable_setups
                    }
                    if(unplannable_setups.length > 0 && plannable_setups.length > 0){
                        showConfirm("Flag Selected Setups?", unplannables+plannables, "all", flag_payload, null);
                    }
                    else{
                        if (unplannable_setups.length > 0) {
                            showConfirm("Flag Selected Setups as Unplannable?", unplannables, "unplannable", flag_payload, null);
                        }
                        else if(plannable_setups.length > 0){
                            showConfirm("Flag Selected Setups as Plannable?", plannables, "plannable", flag_payload, null);
                        }
                    }
                }
                
                //SEND EMAIL NOTIFICATION IF THERE'S A CHANGES IN TESTER OR HANDLER
                if (changed_primary.length > 0 || notif_primary.length > 0) {
                    if (notif_primary.length > 0) {
                        changeTesterHandler(notif_primary, user_details, server);
                    }
                    if (changed_primary.length > 0) {
                        changeTesterHandler(changed_primary, user_details, server); //MOVE THIS TO AJAX COMPLETE REQUEST
    
                        //CHECK FOR HARDWARE CHANGES - (TO BE SET AS PRIMARY ONCE UPDATE HAS BEEN EXECUTED)
                        $.each(changed_primary, function(index, item){
                            let hw_set_id = item['HW_SET_ID'];
                            let step_nm = item['STEP_NM'];
                            let tester = item['ENG_TESTER'];
                            if ($(".hardware_radio_"+step_nm+"_"+tester+"").length > 0) {
                                let selected_hw = $(".hardware_radio_"+step_nm+"_"+tester+":checked").val().split("_")[0];
                                if (hw_set_id != selected_hw) {
                                    changed_primary[index]['HW_SET_ID'] = selected_hw;
                                }
                            }
                        });
                    }
                }

            }
        }
    });

    //RESET CONFIG - RESET ALL SELECTED PRIMARY SETUP (ALL ACROSS TABLES)
    $(".btn-reset-config").on("click", function (){
        let existing_data = {op: all_original_primary, oa: all_original_alternate};
        let checked_plannable = $('.unplannable-flag[flag-type=""]:checked');
        let unchecked_unplannable = $('.unplannable-flag[flag-type="unplannable"]:not(:checked)');
        let edited_cells = 0;

        if ($('[instance-field]').length > 0) {
            $(".instance-input").each(function(){
                let default_val = parseFloat($(this).attr("instance-default"));
                let cell_val = parseFloat($(this).text());

                if (default_val != cell_val) {
                    edited_cells++;
                }
            });
        }
        
        if (all_primary_setup.length == 0 && checked_plannable.length == 0 && unchecked_unplannable.length == 0 && edited_cells == 0) {
            showGenericAlert("info", "No Changes Were Made!");
            return;
        }
        else{
            if (all_primary_setup.length > 0 && (checked_plannable.length == 0 && unchecked_unplannable.length == 0) && edited_cells == 0) {
                showConfirm("Reset Primary Setup Config?", "", "reset", all_primary_setup, existing_data);
            }
            else if(all_primary_setup.length == 0 && (checked_plannable.length > 0 || unchecked_unplannable.length > 0) && edited_cells == 0){
                showConfirm("Reset Flag Status?", "", "reset-flag", []);
            }
            else if(all_primary_setup.length > 0 && (checked_plannable.length > 0 || unchecked_unplannable.length > 0) && edited_cells > 0){
                showConfirm("Reset All?", "", "reset-all", all_primary_setup, existing_data);
            }
            else if(all_primary_setup.length == 0 && (checked_plannable.length == 0 || unchecked_unplannable.length == 0) && edited_cells > 0){
                showConfirm("Reset Cell Input Fields?", "", "reset-cell", []);
            }

            $(".apply-check-flag-container").fadeOut();
        }

    });

    //EXPEDITE & CANCEL CHANGE - HARDWARE CHANGE (MAIN DISPLAY)
    $(".btn-hw-process").on("click", function(){
        let data = $(this).attr("change-data-id");
        let flag_data = $(this).attr("flag-id");
        let hw_change_data;
        switch ($(this).attr("process-type")) {
            case "expedite":
                title = "Expedite Process?";
                msg = "Please ensure you have received approval from the Hardware Team before proceeding with this process.";
                process = "expedite-change";
                hw_change_data = {data: data, flag_data: []};
                break;
        
            default:
                title = "Cancel Hardware Change?";
                msg = "This action will permanently delete the pending hardware change associated with this part number.";
                process = "cancel-change";
                hw_change_data = {data: data, flag_data: flag_data};
                break;
        }
        showConfirm(title, msg, process, hw_change_data);
    });

    //CHANGE PRIMARY HARDWARE - APPLICABLE ONLY FOR ALL CURRENT PRIMARY SETUP
    $(document).delegate(".hardware-radio", "change", function(){
        let setup_group = $(this).attr("setup-group");
        let status = $(this).attr("data-status");
        let table = $(this).attr("primary-table");
        let tstr_hndlr = $(this).attr("tester-handler");
        let value = $(this).val();
        let default_val = $(this).attr("default-primary-hw");
        let raw_data = $(this).attr("data-raw");
        if (status == "IS_PRIMARY") {
            selected_hardware_prm = selected_hardware_prm.filter(function(item) {  
                return item.table !== table; 
            }); 
            if (value.split("_")[0] != default_val) {
                selected_hardware_prm.push({table: table, value: value, raw_data: raw_data, default_val: default_val, setup_group: setup_group, tstr_hndlr: tstr_hndlr});
            }
        }
        else{
            selected_hardware_alt = selected_hardware_alt.filter(function(item) {  
                return item.table !== table; 
            });
            if (value.split("_")[0] != default_val) {
                selected_hardware_alt.push({table: table, value: value, raw_data: raw_data, default_val: default_val, setup_group: setup_group, tstr_hndlr: tstr_hndlr});
            }
        }
        primaryHardwareChecker(value.split("_")[0], tstr_hndlr);

        //UNCHECK ALL CHECKED APPLY TO ALL PRIMARY TESTER / HANDLER RADIO BUTTON
        $(".apply-all-primary-hw").removeClass("is_checked").prop("checked", false);
    });

    //REVERT TO DEFAULT PRIMARY HARDWARE IF CHANGED WHEN CHECKING APPLY TO ALL PRIMARY TESTER / HANDLER
    $(document).delegate(".apply-all-primary-hw", "click", function(){
        if ($(this).hasClass("is_checked")) {
            $(this).removeClass("is_checked").prop("checked", false);
        }
        else{
            $(this).addClass("is_checked");
        }
        let child_hw = $(this).attr("child-hardware");
        $(".hardware-radio:not(."+child_hw+")").each(function(){
            let data_id = $(this).attr("data-id");
            let primary_tbl = $(this).attr("primary-table");
            $('.hardware-radio[value="'+data_id+'"][primary-table="'+primary_tbl+'"]').prop("checked", true);
            selected_hardware_prm = selected_hardware_prm.filter(function(item) {  
                return item.table !== primary_tbl; 
            }); 
        });
    });

    //---------------------------------------------------------------------------------------- DEDICATIONS-----------------------------------------------------------------------------------------------
    $('.table_source tbody, .table_primary tbody').on('click', 'tr', function(event){
        $(".btn-message").hide();
        if (typeof($(event.target).attr('class')) != 'undefined') {
            if ($(event.target).attr('class').indexOf('dedication-config') !== -1) {
                let module_type = null;
                let ded_type = $(event.target).attr("dedication-type");
                let table_id = $(this).attr('table-id');
                let datatable = $('#'+table_id+'').DataTable();
                let table_row = datatable.row(this).data();
                let table_data = [[table_row[1]], [table_row[2]], [table_row[33]]];

                let elem_arr = ["td-partnum","td-rte","td-site","td-step","td-res","td-etester","td-ehandler","td-atester","td-ahandler","td-ttime","td-utpi","td-itime","td-oee","td-qc","td-suph","td-uph"];

                $.each(elem_arr, function(index, item){
                    $("."+item+"").empty();
                });

                $(".dedication-apply-all").attr("dedication-type", ded_type);
                $("#dedicationsModal").modal("show");

                let url = new URL(window.location.href);
                let params = url.searchParams;
                let urlParams = new URLSearchParams(window.location.search);
                let parameterExistsWithValue = urlParams.has('timephase-instance');
                
                if (parameterExistsWithValue) {
                    module_type = "DEDICATION";
                }

                $(".btn-loader").show();

                getTesterHandler(table_data, table_row, table_dedication, module_type);
            }
        }
    });

    //------------------------------------------------------------------------------------------- OEE ---------------------------------------------------------------------------------------------

    //PREVENT NEGATIVE OEE VAL

    $(document).delegate('.override', 'keypress', function(event) {
        var key = String.fromCharCode(event.which);
        var regex = /[^a-zA-Z0-9.\s]/;
        if (regex.test(key)) {
            event.preventDefault();
        }
    });

    $(document).delegate('.override', 'keyup', function(){
        let invalid_val_count = 0;
        let invalid_bool = false;
        $(".override").each(function(){
            if (($(this).val() == 0 || $(this).val() == 1) && $(this).val() != '') {
                invalid_val_count++;
            }
        });

        if (invalid_val_count > 0) {
            invalid_bool = true;
        }
        else{
            invalid_bool = false;
        }

        $(".btn-save-oee").prop("disabled", invalid_bool);
    });

    //SAVE - OEE RECORD
    $(".btn-save-oee").on("click", function(){
        let common_data = [];
        let main_data   = [];
        let data        = oee_main.rows().data();

        $.each(data, function(index, item){
            let proceed = 0;
            let input = $('.override[hash="'+item[8]+'"]');
            let oee_input = (input.val() && (input.val() != 0 || input.val() != '' || !Number.isNaN(input.val()) || input.val() != null)) ? parseFloat(input.val()).toFixed(3) : '';
            let override = input.attr("default-override");

            if (override) {
                if (oee_input != override || oee_input == '') {
                    proceed++;
                }
            }
            else{
                if (oee_input != '' && oee_input != item[6]) {
                    proceed++;
                }
            }
            
            if (proceed > 0) {
                let temp = [];
                let excluded_col = [6];
                data[index][7] = (oee_input == 0 || oee_input == null || oee_input == '') ? '' : oee_input;
                $.each(item, function(idx, itm){
                    if ($.inArray(idx, excluded_col) === -1) {
                        temp.push(itm);
                    }
                });
                main_data.push(temp);
            }
        });

        $(".alert-success").each(function(){
            let parent_field = $(this).attr("field-data");
            common_data[parent_field] = [];
            $('[parent-field="'+parent_field+'"]').each(function(){
                common_data[parent_field].push($(this).text());
            });
        });
        
        if (main_data.length > 0) {
            let more_than_1 = 0;
            let tester_common = $('.alert-success[field-data="TESTER"]').length;
            let tester_ignored = $('.alert-danger[field-data="TESTER"]').length;
            let handler_common = $('.alert-success[field-data="HANDLER"]').length;
            let handler_ignored = $('.alert-danger[field-data="HANDLER"]').length;

            $.each(main_data, function(index, item){
                if (item[6] > 1) {
                    more_than_1++;
                }
            });

            if ((tester_common == 0 || handler_common == 0) && (tester_ignored == 0 || handler_ignored == 0)) {
                if (more_than_1 == 0) {
                    common_data['OEE_FIELD'] = main_data;
                    setOEE(common_data);
                }
                else{
                    showGenericAlert("error", 'Invalid Override Value!  \n (Max: 1)');
                }
            }
            else{
                let card_text = (tester_common > 0 && handler_common > 0) ? "Common" : "Ignored";
                showGenericAlert("error", 'Both Tester & Handler are tagged as '+card_text+'!');
            }
        }
        else{
            showGenericAlert("error", "No Changes Detected!");
        }
    });

    //REMOVE - OEE COMMON / IGNORE
    $(document).delegate(".oee-remove", "click", function(){
        let removed_col     = $(this).attr("field-data");
        let card_type       = $(this).attr("card-type");
        let default_col     = ['MFG_PART_NUM', 'X', 'X', 'TESTER', 'HANDLER', 'TEMP_CLASS', 'X', 'X'];
        let common_fields   = [];
        let common_temp     = [];
        let main_fields     = ['SITE_NUM', 'RES_AREA', 'MFG_PART_NUM', 'TESTER', 'HANDLER', 'TEMP_CLASS'];
        let ignore_fields   = [];
        let hide_col        = [];
        let last_col        = $(".last-common-column").val();

        $(".oee-field").each(function(){
            let field_data = $(this).attr("field-data");
            if (field_data != removed_col) {
                if ($(this).hasClass("alert-success")) {
                    common_fields[field_data] = [];
                    $('[parent-field="'+field_data+'"]').each(function(){
                        common_fields[field_data].push($(this).text());
                    });
                }
                else if($(this).hasClass("alert-danger")){
                    ignore_fields.push(field_data);
                }
                hide_col.push(default_col.indexOf(field_data));
                main_fields.splice(main_fields.indexOf(field_data), 1);
            }
        });

        //FOR LAST COLUMNS REMOVED
        if ($(".alert-success oee-field").length == 0) {
            if (last_col == '') {
                if (card_type == "common-card") {
                    common_temp[removed_col] = [];
                    $('[parent-field="'+removed_col+'"]').each(function(){
                        common_temp[removed_col].push($(this).text());
                    });
                    $(".last-common-column").val(removed_col);   
                }
            }
            else{
                if (card_type == "common-card") {
                    if (last_col == removed_col) {
                        common_temp[removed_col] = [];
                        $('[parent-field="'+removed_col+'"]').each(function(){
                            common_temp[removed_col].push($(this).text());
                        });
                    }
                    else{
                        if($('[parent-field="'+last_col+'"]').length > 0){
                            common_temp[last_col] = [];
                            $('[parent-field="'+last_col+'"]').each(function(){
                                common_temp[last_col].push($(this).text());
                            });
                        }
                        else{                            
                            if ($('[parent-ignore="'+last_col+'"]').length > 0) {
                                common_temp[last_col] = [];
                                $('[parent-ignore="'+last_col+'"]').each(function(){
                                    if ($(this).val() != 'undefined') {
                                        $.each(JSON.parse($(this).val()), function(index, item){
                                            common_temp[last_col].push(item);
                                        });
                                    }
                                });
                            }
                            else{
                                common_temp[last_col] = [];
                                let oee_cell = oee_main.cells('.'+last_col+'').nodes();
                                let cell_data = [];
                                oee_cell.each(function(index, item){
                                    cell_data.push($(this).text());
                                });
                                common_temp[last_col] = cell_data;
                            }
                        }
                    }
                }
                else{
                    if (last_col == removed_col) {
                        common_temp[removed_col] = [];
                        $('[parent-ignore="'+removed_col+'"]').each(function(){
                            if ($(this).val() != 'undefined') {
                                $.each(JSON.parse($(this).val()), function(index, item){
                                    common_temp[removed_col].push(item);
                                });
                            }
                        });
                    }
                    else{
                        if($('[parent-ignore="'+last_col+'"]').length > 0){
                            common_temp[last_col] = [];
                            $('[parent-ignore="'+last_col+'"]').each(function(){
                                if ($(this).val() != 'undefined') {
                                    $.each(JSON.parse($(this).val()), function(index, item){
                                        common_temp[last_col].push(item);
                                    });
                                }
                            });
                        }
                        else{
                            common_temp[last_col] = [];
                            let oee_cell = oee_main.cells('.'+last_col+'').nodes();
                            let cell_data = [];
                            oee_cell.each(function(index, item){
                                cell_data.push($(this).text());
                            });
                            common_temp[last_col] = cell_data;
                            console.log(common_temp);
                        }
                    }
                }
            }
            
        }

        switch (removed_col) {
            case "MFG_PART_NUM":
                oee_partnum_arr = [];
                break;

            case "TESTER":
                oee_tester_arr = [];
                break;

            case "HANDLER":
                oee_handler_arr = [];
                break;
        
            default:
                oee_temp_arr = [];
                break;
        }
        oeeGet(common_fields, main_fields, ignore_fields, hide_col, oee_main, common_temp);
        oee_onchange++;
    });

    //RESET - OEE DISPLAY
    $(".btn-reset-oee").on("click", function(){
        if (oee_onchange > 0) {
            oee_partnum_arr = [];
            oee_tester_arr  = [];
            oee_handler_arr = [];
            oee_temp_arr    = [];
            let default_data = JSON.parse(sessionStorage.getItem('oee_session'));
            renderOEE(default_data['result'], default_data['common_fields'], default_data['ignore_fields'], default_data['hide_col'], oee_main, [], []);
        }
    });

    //DROPDOWNS - TESTER/HANDLER OEE
    var oee_partnum_arr = [];
    var oee_tester_arr  = [];
    var oee_handler_arr = [];
    var oee_temp_arr    = [];

    $(".dropdown-item").on("click", function(){

        let row_count = oee_main.rows().count();
        let col_name = $(this).attr("col-name");
        let col_index = $(this).attr("col-index");
        let process = $(this).attr("process-type");
        let color = (process == "common") ? "#a5ff8b" : "#ff9191";
        
        if (col_name == "MFG_PART_NUM") {
            oee_partnum_arr = [];
            oee_partnum_arr.unshift(process);
        }
        else if(col_name == "TESTER"){
            oee_tester_arr = [];
            oee_tester_arr.unshift(process);
        }
        else if(col_name == "HANDLER"){
            oee_handler_arr = [];
            oee_handler_arr.unshift(process);
        }
        else{
            oee_temp_arr = [];
            oee_temp_arr.unshift(process);
        }

        for (let index = 0; index < row_count; index++) {
            let cell_val = oee_main.cell(index, col_index).data();
            if (cell_val != undefined) {
                switch (col_name) {
                    case "MFG_PART_NUM":
                        if ($.inArray(cell_val, oee_partnum_arr) === -1) {
                            oee_partnum_arr.push(cell_val);
                        }
                        break;
                    case "TESTER":
                        if ($.inArray(cell_val, oee_tester_arr) === -1) {
                            oee_tester_arr.push(cell_val);
                        }
                        break;
                    case "HANDLER":
                        if ($.inArray(cell_val, oee_handler_arr) === -1) {
                            oee_handler_arr.push(cell_val);
                        }
                        break;
                    default:
                        if ($.inArray(cell_val, oee_temp_arr) === -1) {
                            oee_temp_arr.push(cell_val);
                        }
                        break;
                }
                oee_main.cell(index, col_index).node().style.backgroundColor = color;
            }            
        }

        oee_onchange++;
    });
    
    //SEARCH OEE
    $(".btn-apply-oee").on("click", function(){
        let existing        = [];
        let hide_col        = [];
        let common_fields   = [];
        let common_temp     = [];
        let ignore_fields   = [];
        let main_fields     = ['SITE_NUM', 'RES_AREA'];
        let cont0           = [];
        let cont1           = [];
        let cont2           = [];
        let cont3           = [];
        let arr_container   = [oee_partnum_arr, oee_tester_arr, oee_handler_arr, oee_temp_arr];
        let temp_cont       = [cont0, cont1, cont2, cont3];
        let last_col        = $(".last-common-column").val();
        
        $.each(arr_container, function(index, item){
            if (item.length > 0) {
                switch (index) {
                    case 0:
                        $.each(item, function(idx, itm){
                            cont0.push(itm);
                        });
                        break;
                    case 1:
                        $.each(item, function(idx, itm){
                            cont1.push(itm);
                        });
                        break;
                    case 2:
                        $.each(item, function(idx, itm){
                            cont2.push(itm);
                        });
                        break;
                    default:
                        $.each(item, function(idx, itm){
                            cont3.push(itm);
                        });
                        break;
                }
            }
        });
        
        $(".oee-field").each(function(){
            let attr = $(this).attr("field-data");
            existing.push(attr);

            if ($(this).hasClass("alert-danger")) {
                if ($.inArray(attr, ignore_fields) === -1) {
                    ignore_fields.push(attr);
                }
            }
            else{
                let child_field = [];
                $('[parent-field="'+attr+'"]').each(function(){
                    child_field.push($(this).text());
                });
                common_fields[attr] = child_field;
            }
        });

        $.each(temp_cont, function(index, item){
            let arr_name;
            let col_index;
            switch (index) {
                case 0:
                    arr_name = "MFG_PART_NUM";
                    col_index = 0;
                    break;
                case 1:
                    arr_name = "TESTER";
                    col_index = 3;
                    break;
                case 2:
                    arr_name = "HANDLER";
                    col_index = 4;
                    break;
                default:
                    arr_name = "TEMP_CLASS";
                    col_index = 5;
                    break;
            }
            $.unique(item);
            if (item.length == 0) {
                if ($.inArray(arr_name, existing) === -1) {
                    main_fields.push(arr_name);
                }
                else{
                    hide_col.push(col_index);
                }
            }
            else{
                if (item[0] == "common") {
                    item.splice(item.indexOf("common"), 1);
                    common_fields[arr_name] = item;
                }
                else{
                    if ($.inArray(arr_name, ignore_fields) === -1) {
                        ignore_fields.push(arr_name);
                    }
                }

                hide_col.push(col_index);
            }
        });

        if (last_col != '') {
            
            var col_data = [];
            let get_rows = oee_main.rows().every(function() {
                var $row = $(this.node());
                $row.find('td').each(function() {
                    if ($(this).hasClass(last_col)) {
                        col_data.push($(this).text());
                    }
                });
            });

            if ($.inArray(last_col, main_fields) !== -1) {
                common_temp[last_col] = [];
                let partnum = col_data;
                common_temp[last_col] = $.unique(partnum);
            }
            else{
                if ($.inArray(last_col, ignore_fields) !== -1 && common_fields.length == 0) {
                    common_temp[last_col] = [];
                    let partnum = ($('[parent-ignore="'+last_col+'"]').length > 0) ? JSON.parse($('[parent-ignore="'+last_col+'"]').val()): col_data;
                    common_temp[last_col] = $.unique(partnum);
                }
            }
        }

        oeeGet(common_fields, main_fields, ignore_fields, hide_col, oee_main, common_temp);
    });


    //INITIAL LOAD OF PAGE
    oeeModalDisplay();

    //BTN OEE MODAL - CHECKER FOR EXISTING OEE OVERRIDE SETUP (SINGLE OR MULTIPLE PART NUMS)
    $(".btn-oee-modal").on("click", function(){

        $(".last-common-column").val("");

        //RESET TEMPORARY ARRAYS FIRST
        oee_partnum_arr = [];
        oee_tester_arr  = [];
        oee_handler_arr = [];
        oee_temp_arr    = [];

        let all_category    = [];
        let common_fields   = [];
        let main_fields     = ['SITE_NUM', 'RES_AREA', 'TEMP_CLASS'];
        let ignore_fields   = [];
        let hide_col        = [];

        common_fields['MFG_PART_NUM']   = [];
        common_fields['TESTER']         = [];
        common_fields['HANDLER']        = [];

        $(".resource-check:checked").each(function(){
            let split_val = $(this).val().split("|");
            let cat_val = split_val[0];
            let category = split_val[1];
            
            if (category != "GENERIC") {
                switch (category) {
                    case 'ENGINEERING_HANDLER':
                    case 'ATOM_HANDLER':
                        common_fields['HANDLER'].push(cat_val);
                        ignore_fields.push("TESTER");
                        hide_col.push(3,4);
                        break;

                    case 'ENGINEERING_TESTER':
                    case 'ATOM_TESTER':
                        common_fields['TESTER'].push(cat_val);
                        ignore_fields.push("HANDLER");
                        hide_col.push(3,4);
                        break;
                
                    default:
                        common_fields['MFG_PART_NUM'].push(cat_val);
                        hide_col.push(0);
                        break;
                }
                all_category.push(category);
            }
        });

        if ($.inArray("MFG_PART_NUM", $.unique(all_category)) === -1) {
            ignore_fields.push("MFG_PART_NUM");
            hide_col.push(0);
        }

        (common_fields['MFG_PART_NUM'].length == 0  && $.inArray("MFG_PART_NUM", ignore_fields) === -1) ? main_fields.splice(0,0, 'MFG_PART_NUM')  : "";
        (common_fields['TESTER'].length == 0        && $.inArray("TESTER", ignore_fields) === -1)       ? main_fields.splice(2, 0, 'TESTER')        : "";
        (common_fields['HANDLER'].length == 0       && $.inArray("HANDLER", ignore_fields) === -1)      ? main_fields.splice(3, 0, 'HANDLER')       : "";
        
        (common_fields['MFG_PART_NUM'].length == 0) ? delete common_fields.MFG_PART_NUM : "";
        (common_fields['TESTER'].length == 0)       ? delete common_fields.TESTER       : "";
        (common_fields['HANDLER'].length == 0)      ? delete common_fields.HANDLER      : "";
        main_fields.join();

        if ('MFG_PART_NUM' in common_fields) {
            main_fields.push('MFG_PART_NUM');
        }
        
        oeeGet(common_fields, main_fields, $.unique(ignore_fields), [...new Set(hide_col)], oee_main, [], true);
    });

    //------------------------------------------------------------------------------------------- END OEE ---------------------------------------------------------------------------------------------

    //----------------------------------------------------------------------------------------- DEDICATIONS ---------------------------------------------------------------------------------------------

    //SAVE DEDICATION
    $(".btn-save-dedication").on("click", function(){
        let setup = JSON.parse($(".selected-setup").val());
        let ded_table = $(".table-dedication").DataTable().rows().data();
        let split = setup[15].split("|");
        let input_tester = setup[3];
        let input_handler = setup[4];
        let ded_tester = $(".select2-tester").val();
        let ded_handler = $(".select2-handler").val();
        let parent_tester = $(".select2-tester option:selected").attr("parent-data");
        let parent_handler = $(".select2-handler option:selected").attr("parent-data");
        let exceptions = 0;
        let payload = [];
        let all_combo = [];
        let is_exclusive = 0;
        let type = 'ALTERNATE';
        
        if ((ded_tester == '' || ded_tester == null) || (ded_handler == '' || ded_handler == null)) {
            exceptions++;
            showGenericAlert("error", "Please Select Tester/Handler Dedication!");
        }
        else if (input_tester == ded_tester && input_handler == ded_handler) {
            exceptions++;
            showGenericAlert("error", "No Changes Detected!");
        }
        else if(ded_table.length > 0){
            let input_data = split[2]+'|'+setup[1]+'|'+setup[2];
            $.each(ded_table, function(index, item){
                let ded_data = item[2]+'|'+item[3]+'|'+item[4];
                if (input_data == ded_data) {
                    exceptions++;
                }
            });
            
            if (exceptions > 0) {
                showGenericAlert("error", "Dedication Already Existing!");
            }
        }

        if (exceptions == 0) {
            //CHECK IF APPLY TO ALL IS CHECKED - RUN THROUGH ALL REMAINING SETUPS MATCHING THE DEDICATION
            if ($(".dedication-apply-all").is(":checked")) {
                let ded_type = $(".dedication-apply-all").attr("dedication-type");
                let input_table = setup[17];
                let input_partnum = split[0];
                let input_tester_handler = setup[1]+'|'+setup[2];
                let table_primary_data = $(".table_primary").DataTable().rows().data().toArray();
                let table_source_data = $(".table_source").DataTable().rows().data().toArray();
                let all_datatable = $.merge(table_primary_data, table_source_data);

                $.each(all_datatable, function(index, item){
                    let a_split    = item[15].split("|");
                    let table    = item[17];
                    let partnum  = a_split[0];
                    let tester_handler   = item[1]+'|'+item[2];
                    let existing_count = 0;
                    if (input_partnum == partnum) {
                        if (input_table != table) {
                            if (input_tester_handler == tester_handler) {
                                $.each(ded_table, function(idx, itm){
                                    let ext_rte = itm[1];
                                    let ext_step = itm[2];
                                    let ext_tester_handler = itm[3]+'|'+itm[4];
                                    if (ext_rte == a_split[4]) {
                                        if (ext_step == a_split[2]) {
                                            if (ext_tester_handler == tester_handler) {
                                                existing_count++;
                                            }
                                        }
                                    }
                                });

                                if (existing_count == 0) {
                                    all_combo.push(item);
                                }
                            }
                        }
                    }
                });
            }
            
            all_combo.push(setup);
            
            $.each(all_combo, function(index, item){
                let alternates = [];
                let primay_table = $("#"+item[16]).DataTable().rows().data().toArray();
                let primary_setup  = (primay_table.length > 0) ? primay_table[0][20] : '';
                let split = item[15].split("|");
                let partnum = split[0];
                let site    = split[1];
                let step    = split[2];
                let flag_setups   = [];

                //CHECK IF ALLOW OTHER SETUPS IS CHECKED - TAG ALL OTHER SETUPS AS UNPLANNABLE
                if (!$(".dedication-allow-setups").is(":checked")) {
                    is_exclusive = 1;
                    $('[part-flag-data="'+item[26]+'"]').each(function(){
                        if ($(this).attr("flag-type") == "") {
                            flag_setups.push(JSON.parse($(this).val()));
                        }
                    });
                }

                //CHECK IF DEDICATION IS PRIMARY, DEFAULT TYPE IS ALTERNATE
                if ($(".dedication-is-primary").is(":checked")) {
                    type = "PRIMARY";
                }
                
                //ADD ALTERNATES AND PRIMARY (IF DEDICATION IS PRIMARY) TO UPDATE PRIO_CD
                let primary_setups = $("#"+item[16]).DataTable().rows().data().toArray();
                let alternate_setups = $("#"+item[17]).DataTable().rows().data().toArray();
                alternates = $.merge([], primary_setups.concat(alternate_setups));
                

                payload.push({
                    "ATOM_MASTER_ID":item[13],
                    "MFG_PART_NUM": partnum,
                    "SITE_NUM":     site,
                    "STEP_NM":      step,
                    "TESTER":       ded_tester,
                    "HANDLER":      ded_handler,
                    // "ENGR_TESTER":  item[1],
                    // "ENGR_HANDLER": item[2],
                    "ENGR_TESTER":  parent_tester,
                    "ENGR_HANDLER": parent_handler,
                    "HASH":         item[13],
                    "HW_SET_ID":    item[19],
                    "ID":           "",
                    "IS_PRIMARY":   1,
                    "RES_SET_ID":   item[24],
                    "SAP_RTE_ID":   split[4],
                    "TO_REMOVE":    (type == 'PRIMARY') ? primary_setup : '',
                    "TO_REMOVE_RAW":"",
                    "DED_ID":       "",
                    "PRIO_CD":      item[18],
                    "EXCLUSIVE":    is_exclusive,
                    "FLAG_SETUPS":  flag_setups,
                    "TYPE":         type,
                    "DETAILS":      item,
                    "PARENT_TABLE": item[17],
                    "TEMP_CLASS":   item[29],
                    "ORIG_PRIO":    item[30],
                    "ALTERNATES":   alternates
                });
            });

            if ($(".instance-loaded-alert").length == 0) {
                setDedication(payload, setup, user_details);
            }
            else{
                let session_instance = sessionStorage.getItem('instance-loaded');
                let ded_payload = formatTimephaseDedication(payload, session_instance);
                setTimephaseInstance(ded_payload);
            }

        }
    });

    //CHECK ALL - REMOVE DEDICATION
    $(".dedication-check-all").on("click", function(){
        let status = $(this).is(":checked");
        $(".dedication-check").each(function(){
            $(this).prop("checked", status);
        });
    });

    //RESET CHECK ALL CHECKBOX STATUS
    $(document).delegate(".dedication-check", "click", function(){
        if (!$(this).is(":checked")) {
            $(".dedication-check-all").prop("checked", false);
        }
    });

    //REMOVE SELECTED DEDICATIONS
    $(".btn-remove-all-dedication").on("click", function(){
        let ded_id = [];
        if ($(".instance-loaded-alert").length == 0) {
            let source_table = $(".table_source").DataTable().rows().data().toArray();
            let default_primary = [];
    
            $(".dedication-check:checked").each(function(){
                if ($(this).is(":visible")) {
                    ded_id.push($(this).val());
                    
                    if($(this).attr("dedication-type") == "PRIMARY"){
                        let split = $(this).attr("group-data").split("|");
                        let route = split[0]; let site = split[1]; let step = split[2];
    
                        $.each(source_table, function(index, item){
                            let split_src = item[15].split("|");
                            if (route == split_src[4] && site == split_src[1] && step == split_src[2]) {
                                if (item[18] <= 2) {
                                    default_primary.push(item);
                                    return false;
                                }
                            }
                        });
                    }
                }
            });
            
            if (ded_id.length > 0) {
                showConfirm('Remove Dedications', 'Are you sure you want to remove selected dedications?', 'remove-all-dedication', {ded_id: ded_id, default_primary: default_primary});
            }
            else{
                showGenericAlert('warning', 'Please select items to delete.');
            }
        }
        else{
            $(".dedication-check:checked").each(function(){
                if ($(this).is(":visible")) {
                    let instance_idtf = $(this).attr("instance-identifier");
                    ded_id.push(instance_idtf+'|'+$(this).val());
                }
            });
            if (ded_id.length > 0) {
                showConfirm('Remove Dedications', 'Are you sure you want to remove selected dedications?', 'remove-all-dedication-tp', ded_id);
            }
            else{
                showGenericAlert('warning', 'Please select items to delete.');
            }
        }
    });

    //RESET DEDICATION (DROPDOWNS, TABLE, CHECKBOXES, ETC.)
    $(".btn-close-dedication").on("click", function(){
        table_dedication.clear().draw();
        $(".select2-tester, .select2-handler").children().remove();
        $(".dedication-apply-all, .dedication-allow-setups").prop("checked", false);
    });

    //SEARCH ATOM NAME FROM ATOM-NAME DROPDOWN - TIMEPHASING DEDICATION
    $("#floating-tester").on("keyup", function(){
        let string = $(this).val().toUpperCase();
        if (string.length > 0) {
            $(".atom-tester-option").each(function(){
                let parent_opt = $(this).attr("parent-data");
                if ($(this).val().indexOf(string) === -1 && parent_opt.indexOf(string) === -1) {
                    $(this).addClass("d-none");
                    if ($('[parent-tester-opt="'+parent_opt+'"]').children(':visible').length == 0) {
                        $('[parent-tester-opt="'+parent_opt+'"]').addClass("d-none");
                    }
                }
                else{
                    $(this).removeClass("d-none");
                    $('[parent-tester-opt="'+parent_opt+'"]').removeClass("d-none");
                }
            });
        }
        else{
            $(".atom-tester-option").removeClass("d-none");
            $('.atom-tester-opt').removeClass("d-none");
        }
    });

    $("#floating-handler").on("keyup", function(){
        let string = $(this).val().toUpperCase();
        if (string.length > 0) {
            $(".atom-handler-option").each(function(){
                let parent_opt = $(this).attr("parent-data");
                if ($(this).val().indexOf(string) === -1 && parent_opt.indexOf(string) === -1) {
                    $(this).addClass("d-none");
                    if ($('[parent-handler-opt="'+parent_opt+'"]').children(':visible').length == 0) {
                        $('[parent-handler-opt="'+parent_opt+'"]').addClass("d-none");
                    }
                }
                else{
                    $(this).removeClass("d-none");
                    $('[parent-handler-opt="'+parent_opt+'"]').removeClass("d-none");
                }
            });
        }
        else{
            $(".atom-handler-option").removeClass("d-none");
            $('.atom-handler-opt').removeClass("d-none");
        }
    });

    //----------------------------------------------------------------------------------------END DEDICATIONS ---------------------------------------------------------------------------------------------

    //-----------------------------------------------------------------------------------------TIMEPHASING---------------------------------------------------------------------------------------------

    //CHECK IF INSTANCE IS LOADED CORRECTLY
    loadedInstanceChecker();

    //FLOW REMOVAL - DELETE STEPS
    $(".btn-flow-removal").on("click", function(){
        let instance = JSON.parse(sessionStorage.getItem('instance-loaded'));
        let tp_id = $(this).attr("instance-id");
        let rte_seq = $(this).attr("data-id");
        let step = $(this).attr("step-id");
        
        if (instance[tp_id]['NOTES'] == null) {
            instance[tp_id]['NOTES'] = '';
        }
        
        instance[tp_id]['CHANGE_USER'] = user_details['emp_id'];

        delete instance[tp_id]['DATA']['RTE_SEQ_NUM'][rte_seq];
        showConfirm("Flow Removal", "Are You Sure You Want To Delete Step:<br><b>"+step+"</b>?", "set-timephase-instance", instance);
    });

    //SELECT & LOAD INSTANCE
    $(".instance-card").on("click", function(){
        let tp_id = $(this).attr("card-id");
        if ($(this.parentNode).hasClass("instance-selected")) {
            $(this.parentNode).removeClass("instance-selected");
        }
        else{
            $(".tp-card").each(function(){
                $(this).removeClass("instance-selected");
            });
            $(this.parentNode).addClass("instance-selected");
        }
    });

    $(".btn-load-instance").on("click", function(){
        let tp_id = $(this).attr("instance-id");
        let url = new URL(window.location.href);
        let params = url.searchParams;
        let urlParams = new URLSearchParams(window.location.search);
        let parameterExistsWithValue = urlParams.has('timephase-instance', tp_id);
        
        if (!parameterExistsWithValue) {
            getInstance(tp_id);
            params.set('timephase-instance', tp_id); 
            window.history.pushState({}, '', url);   
        }
        else{
            showGenericAlert("warning", "Instance already loaded.");
        }
    });

    //UNLOAD INSTANCE / RELOAD PAGE
    $(document).delegate(".unload-instance", "click", function(){
        const url = new URL(window.location.href);
        const params = url.searchParams; 
        params.delete('timephase-instance');
        window.history.replaceState({}, document.title, url.toString()); 
        location.reload();
    })

    //NEW & EDIT INSTANCE
    $(".btn-instance, .btn-edit-instance").on("click", function(){
        let process = $(this).attr("process");
        let iprocess = $(this).attr("instance-process");
        let route = $(this).attr("instance-route");
        let type = $(this).attr("instance-type");
        let date = $(this).attr("instance-date");
        let week = $(this).attr("instance-week");
        let note = $(this).attr("instance-note");
        let num = $(this).attr("instance-num");
        let id = $(this).attr("instance-id");

        if (process == "new") {
            $(this).addClass("visually-hidden");
            $(".footer-"+id).append(showLoaderButton());
            getCalendar(route, date, week, num, id, type, "new");
        }
        else{
            getCalendar(route, date, week, num, id, type, "edit");
            $('.tp-process').each(function(){
                let split_process = iprocess.split("<br>");
                if ($.inArray($(this).val(), split_process) !== -1) {
                    $(this).prop("checked", true);
                }
            });
            $(".tp-notes").val((note != 'null' && note != '') ? note : '');
        }

        $(".ext-tp-id").val(id);
        $(".ext-tp-date").val(date);
        $(".ext-tp-week").val(week);
        $(".ext-tp-num").val(num);
    });

    //PAGINATE WEEKS
    $(".page-link").on("click", function(){
        let page_type = $(this).attr("page-type");
        let default_data = JSON.parse($(".tp-default-data").val());
        let temp_container = [];
        let target_date = "";
        let current_date = $(".ext-tp-date").val();

        $.each(default_data['data'], function(index, item){
            $.each(item, function(idx, itm){
                $.each(itm, function(inner_idx, inner_itm){
                    if (inner_itm['DAY_NAME'] == "Sunday") {
                        temp_container.push(inner_itm['MFG_DATE']);
                    }
                });
            });
        });

        if (page_type == "paginate-previous") {
            target_date = temp_container[0];
            if ($.inArray(current_date, temp_container) !== -1) {
                return false;
            }
        }
        else{
            target_date = temp_container[temp_container.length - 1];
        }
        
        getCalendar(default_data['route'], target_date, default_data['week'], default_data['num'], default_data['id'], "paginate", page_type);
    });

    //SELECT WEEK NUMBER
    $(document).delegate(".tp-day", "click", function(){
        //RESET SELECTED WEEK ROW
        $(".bg-selected").each(function(){
            if ($(this).length > 0) {
                $(this).removeClass("bg-selected").addClass($(this).attr("orig-color"));
            }
        });

        let fyw = $(this).attr("data");
        let date = $('[data="'+fyw+'"][day="Sunday"]').attr("eff-date");
        $(".tp-date").val(date);
        $(".tp-week").val(fyw);
        
        $("."+fyw).each(function(){
            if ($(this).attr("orig-color") != "bg-grey") {
                $(this).removeClass($(this).attr("orig-color")).addClass("bg-selected");
            }
        });
    });

    //SAVE INSTANCE
    $(".btn-save-instance").on("click", function(){
        let count = 0;
        let date = $(".tp-date").val();
        let route = $(".tp-route").val();
        let week = $(".tp-week").val();
        let process = $('.tp-process:checked');
        let notes = $(".tp-notes").val();
        let num = $(".tp-num").val();
        let id = $(".tp-id").val();
        let crud = $(".tp-crud").val();
        // let overlap = 0;
        // let new_fyw = parseInt(week.substring(2, 4)+''+week.slice(-2));
        // let existing_instance = JSON.parse($(".tp-existing-"+route.replace(/\./g, "_").replace(/\#/g, "_").replace(/\//g, "_").replace(/\-/g, "_").replace(/\^/g, "_")).val());
        
        if($(".in-container").text() == "New"){
            if (date == '' || date == null || date == 'undefined' || $(".bg-selected").length == 0) {
                count++;
            }
        }
        else{
            if (date == '' || date == null || date == 'undefined') {
                count++;
            }
        }

        if (week == '' || process.length == 0) {
            count++;
        }

        if (count == 0) {
            let process_arr = [];
            $.each(process, function(){
                process_arr.push($(this).val());
            });
            setTimephase({date: date, route: route, week: week, process: process_arr, notes: notes, num: num, id: id}, user_details, crud);
        }
        else{
            showGenericAlert("error", "FYWW & Process Type fields are required!");
        }
    });

    //DELETE INSTANCE
    $(".btn-delete-instance").on("click", function(){
        let id = $(this).attr("data-id");
        let num = $(this).attr("data-num");
        let week = $(this).attr("data-week");
        let route = $(this).attr("data-route");
        let details = "<strong>"+route+"</strong><br><strong>Instance #"+num+" - "+week+"</strong>";
        showConfirm('Remove Instance', 'Are you sure you want to remove this instance:<br>'+details, 'remove-timephase', {id: id, num: num, route: route, user_details: user_details});
    });

    //----------------------------------------------------------------------------------------END TIMEPHASING---------------------------------------------------------------------------------------------
    //RETRIEVE HARDWARE
    function retrieveHardware(row){
        if (row.child.isShown()) {
            row.child.hide();
        }
        else {
            row.child(renderHardwareSetup(row.data())).show();
        }
    }

    //ADD DEDICATION
    // $(".btn-add-dedication").on("click", function(){
    //     let source_data = $("#"+$(this).attr("table-source")).DataTable().rows().data();
    //     $("#"+$(this).attr("table-source")).rows.add(source_data);
    // });

    //ADD CLASS TO DATATABLES - DRAG N DROP
    $(document).on(".tablegrid tr", "click", function () {
        $(this).toggleClass("selectedRow");
    });

    getSearchBoxText();

    //API CALL TO PRODUCT_DATA_ADI
    $(".btn-combination").on("click", function(){
        let payload = [];
        let checked_len = $(".resource-check:checked").length;
        if (checked_len > 0) {
            $(".resource-check:checked").each(function(){
                payload.push($(this).val());
            });
            searchProductData(payload, part_selection, data_set, group_header);
        }
        else{
            showGenericAlert("error", "No Selected Items!");
        }
    });

    //SKIP SEARCH COMBINATION PROCESS (FOR SPECIFIC PART NUMBERS ONLY)
    $(document).delegate(".resource-check", "click", function(){
        oeeModalDisplay();
        //CHECK IF PARTNUM
        if ($(this).val().split("|")[1] == "MFG_PART_NUM" && this.checked == true) {
            renderCategoryFilter($(this), part_selection);
        }
    });

    //SELECT ALL CATEGORY ITEMS/RECORDS
    $(document).delegate(".select-all", "change", function () {
        let category_id = $(this).attr("id");
        $("."+category_id).prop('checked', $(this).prop("checked"));

        if($(this).attr("id") == "MFG_PART_NUM_CHECK"){
            $("."+category_id).each(function(){
                renderCategoryFilter($(this), part_selection);
            });
        }

        oeeModalDisplay();
    });
});

$(document).delegate('.btn-modify', 'click', function () {
    let selected_parts = $(".part-selection-table").DataTable().rows('.selected').data();
    getMainDisplayData(selected_parts);
});

// INPUT SEARCH FIELD - RESOURCE PICKER (ENTER KEYUP)
$(document).delegate("#search-record", "input keyup", function(e){
    let value = $.trim($(this).val());
    let length = value.length;
    let trigger_count = 0;
    if(e.which == 13){
        searchPart(value);
        sessionStorage.setItem('session_search', value);
    }
});

$(document).delegate(".btn-search-input", "click", function(){
    let value = $.trim($("#search-record").val());
    if (value == '' || value == null) {
        showGenericAlert("error", "Please Input a Part, Generic or a Resource.");
        return;
    }
    searchPart(value);
    sessionStorage.setItem('session_search', value);
});

//INPUT SEARCH - TESTER / HANDLER/ MFG_PART_NUM
function getSearchBoxText() {
    $(".select2-search__field").on("input", function(){
        // let current_data = $(".input-search > optgroup > option").length;
        let get_text = $(this).val();
        let get_text_length = $(this).val().length;
        let selected_data = $(".input-search").val();
        
        if (selected_data == 0 && get_text_length == 6) {
            searchPart(get_text);
        }
    });
}

//-----------------------------------------------------------------------------API CALLS------------------------------------------------------------------------

//-----------------------------------------------------------------------------RESOURCE PICKER API-----------------------------------------------------------------------------

function searchPart(value) {
    // +'&NO_JSON=1'
    $.ajax({
        type: 'post',
        url: 'http://mxhtafot01l.maxim-ic.com/TEST/MAPPER_ADI.PHP?INPUT_TYPE=SEARCH_V3&OUTPUT_TYPE=SEARCH_V3_ADI&INPUT[0]='+encodeURIComponent(value.toUpperCase()),
        beforeSend: function(){
            showLoader('Processing... \n Please Wait!');
        },
        success: function(data){
            setTimeout(function(){
                let data_result = JSON.parse(data)['DATA'];
                let result_count = 0;
                if(data_result[1]['value'].length == 1){
                    let data_set = formatData("specific", data_result[1]['value'], "part-selection");
                    getMainDisplayData(data_result[1]['value'][0], true);
                    // resetSessions(['session_search', 'session_filters', 'session_part_selections']);
                }
                else{
                    $(".alert-result").hide();
                    $(".result-accordion").html("");

                    for (let index = 0; index < data_result.length; index++) {
                        result_count += data_result[index]['value'].length;
                    }

                    if (result_count != 0) {
                        if (result_count > 10) {
                            $(".alert-large-result").fadeIn();
                        }
                        sessionStorage.setItem('session_filters', JSON.stringify(data_result));
                        populateDropdown(data_result);
                    }
                    else{
                        if(result_count == 0){
                            $(".alert-no-result").fadeIn();
                        }
                    }
                }
            }, 1500);
        },
        complete: function(){
            Swal.close();
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function searchProductData(payload, part_selection, data_set, group_header) {
    let data = "";
    for (let index = 0; index < payload.length; index++) {
        data += "&INPUT["+index+"]='"+encodeURIComponent(payload[index])+"'";
    }
    $.ajax({
        type: 'post',
        url: 'http://mxhtafot01l.maxim-ic.com/TEST/MAPPER_ADI.PHP?INPUT_TYPE=GET_DETAILS&OUTPUT_TYPE=GET_DETAILS'+data,
        beforeSend: function(){
            showLoader('Processing... \n Please Wait!');
        },
        success: function(data){
            setTimeout(function(){

                // $(".part-selection-table").DataTable().destroy();
                // let record_count = Object.keys(JSON.parse(data)['DATA']).length;
                let data_result = JSON.parse(data)['DATA'];
                // let data_set = [];
                // let group_header = [];
                let current_count = 0;
                let sps = sessionStorage.getItem('session_part_selections');
                console.log(JSON.parse(sps));
                console.log(data_set, group_header);
                $.each(data_result, function(index, item){
                    let session_cntr = 0;
                    let temp_arr_cntr = 0;
                    let res_pn = item['MFG_PART_NUM'];
                    let res_gn = (item['GENERIC'] != null) ? item['GENERIC'] : 'UNKNOWN';;
                    let res_gh = res_gn+' ('+item['RES_AREA']+' - L-ADI)';
                    current_count++;
                    
                    if (sps != null) {
                        if (data_set.length == 0 && group_header.length == 0) {
                            let parse_sps = JSON.parse(sps);
                            data_set = parse_sps['data_set'];
                            group_header = parse_sps['group_header'];
                        }
                    }

                    if (current_count <= 20) {
                        if (sps != null) {
                            $.each(JSON.parse(sps)['data_set'], function(idx, itm){
                                if ($.inArray(res_pn, itm) !== -1) {
                                    session_cntr++;
                                }
                            });
                            
                            if (session_cntr == 0) {
                                data_set.push([res_pn, res_gn, '<button class="btn btn-sm btn-danger btn-pst-del" data-id="'+res_pn+'|'+res_gn+'|'+res_gh+'"><i class="fa-solid fa-trash"></i></button>', res_gh]);
                            }
    
                            if ($.inArray(res_gh, JSON.parse(sps)['group_header']) === -1) {
                                group_header.push(res_gh);
                            }   
                        }

                        $.each(data_set, function(idx, itm){
                            if ($.inArray(res_pn, itm) !== -1) {
                                temp_arr_cntr++;
                            }
                        });

                        if (temp_arr_cntr == 0) {
                            data_set.push([res_pn, res_gn, '<button class="btn btn-sm btn-danger btn-pst-del" data-id="'+res_pn+'|'+res_gn+'|'+res_gh+'"><i class="fa-solid fa-trash"></i></button>', res_gh]);
                        }

                        if ($.inArray(res_gh, group_header) === -1) {
                            group_header.push(res_gh);
                        }
                    }

                });
                
                sessionStorage.setItem('session_part_selections', JSON.stringify({data_set: data_set, record_count: null, group_header: group_header}));
                renderPartSelectionTable(data_set, null, group_header, part_selection);
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    }).done(function(){
        Swal.close();
    });
}

function getMainDisplayData(part_num, skip = false){

    let data = "";
    if (skip) {
        data += "?partnum[0]="+encodeURIComponent(part_num)+"";
    }
    else{
        for (let index = 0; index < part_num.length; index++) {
            let prefix = (index == 0) ? "?" : "&";
            data += prefix+"partnum["+index+"]="+encodeURIComponent(part_num[index][0])+"";
        }
    }
    window.location.href = env+data+'';
}

//-----------------------------------------------------------------------------END RESOURCE PICKER API-----------------------------------------------------------------------------



//-----------------------------------------------------------------------------PLANNING ASSUMPTIONS API-----------------------------------------------------------------------------

//SET DATA AS PRIMARY
function setPrimarySetup(payload){
    $.ajax({
        type: 'post',
        url: 'http://mxhtafot01l.maxim-ic.com/TEST/PRIMARY_SETUP.php?INPUT_TYPE=MFG_PART_NUM&OUTPUT_TYPE=BODS_JDA_ADI',
        data: {payload: payload, user_details: user_details},
        beforeSend: function(){
            showLoader('Processing... \n Please Wait!');
        },
        success: function(data){
            setTimeout(function(){
                if (data) {
                    showSuccess("Record Saved Succesfully!");
                    resetDataContainers("set-primary");
                    location.reload();
                    // $.each($(".table_primary").DataTable().data(), function(index, item){
                    //     $("td").removeClass("bg-part-primary-changes bg-part-changes");
                    //     $("#"+item[16]+" tbody td").addClass("bg-part-primary");
                    //     all_original_primary.push(item);
                    // });
                    // $.each($(".table_source").DataTable().data(), function(index, item){
                    //     all_original_alternate.push(item);
                    // });
                    resetElements("all-steps", "apply-check-primary");
                }
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function changeTesterHandler(payload, user_details, server){
    let url = 'http://afotcosj004.maxim-ic.com/API/HW-HANDSHAKE-PROCESS.PHP';
    $.ajax({
        type: 'post',
        dataType: "json",
        url: url,
        data: {payload: payload, user_details: user_details, url: $(location).attr('href')},
        success: function(data){
            console.log(data);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function processHardwareChange(process, data){
    $.ajax({
        type: 'post',
        url: 'http://mxhtafot01l.maxim-ic.com/TEST/PRIMARY_SETUP.php?INPUT_TYPE=MFG_PART_NUM&OUTPUT_TYPE=BODS_JDA_ADI&PROCESS_TYPE=HARDWARE_CHANGE',
        data: {process: process, payload: data, user_details: user_details},
        beforeSend: function(){
            showLoader('Processing... \n Please Wait!');
        },
        success: function(data){
            setTimeout(function(){
                if (data) {
                    showSuccess("Record Saved Succesfully!");
                    closeHandshakeLoop(JSON.parse(data), process);
                    location.reload();
                }
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function closeHandshakeLoop(payload, process){

    let identifier = payload[0][9].split("|");
    let target_setup = [];
    let hw_list = [];

    $.each(all_original_primary, function(index, item){
        if (item[13] == identifier[0] && item[19] == identifier[1]) {
            target_setup = item;
            hw_list = JSON.parse(item[14]);
        }
    });

    $.each(all_original_alternate, function(index, item){
        let split = item[15].split("|");

        if (split[0] == payload[0][0] && split[2] == payload[0][2] && split[4] == payload[0][4] && 
            item[13] == payload[0][3] && item[19] == payload[0][5]) {
                
            payload[0][15] = item[1];
            payload[0][16] = item[2];
        }
    });

    let url = 'http://afotcosj004.maxim-ic.com/API/HW-HANDSHAKE-CLOSE.PHP';
    $.ajax({
        type: 'post',
        dataType: "json",
        url: url,
        data: {payload: payload, target_setup: target_setup, hw_list: hw_list, process: process, user_details: user_details},
        success: function(data){
            console.log(data);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

//CHNAGE IN PRIMARY HARDWARE WHILE CHANGING PRIMARY SETUP (TRIGGERS EMAIL NOTIFICATION - "HANDSHAKE PROCESS")
function changePrimaryHardware(data){
    $.ajax({
        type: 'post',
        url: 'http://mxhtafot01l.maxim-ic.com/TEST/PRIMARY_SETUP.php?INPUT_TYPE=MFG_PART_NUM&OUTPUT_TYPE=BODS_JDA_ADI&PROCESS_TYPE=PRIMARY_HARDWARE_CHANGE',
        data: {payload: data, user_details: user_details},
        beforeSend: function(){
            showLoader('Processing... \n Please Wait!');
        },
        success: function(data){
            setTimeout(function(){
                if (data) {
                    showSuccess("Record Updated Succesfully!");
                    location.reload();
                }
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function flagSetups(unplannable_data, plannable_data){
    $.ajax({
        type: 'post',
        url: 'http://mxhtafot01l.maxim-ic.com/TEST/PRIMARY_SETUP.php?INPUT_TYPE=MFG_PART_NUM&OUTPUT_TYPE=BODS_JDA_ADI&PROCESS_TYPE=FLAG_SETUPS',
        data: {unplannable_data: unplannable_data, plannable_data: plannable_data},
        beforeSend: function(){
            showLoader('Processing... \n Please Wait!');
        },
        success: function(data){
            setTimeout(function(){
                if (data) {
                    showSuccess("Record Updated Succesfully!");
                    location.reload();
                }
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

//--------------------------------------------------------------------------END PLANNING ASSUMPTIONS API-----------------------------------------------------------------------------


//-----------------------------------------------------------------------------OEE API-----------------------------------------------------------------------------

function oeeGet(common_fields, main_fields, ignore_fields, hide_col, oee_main, common_temp, is_initial = false){

    //GET PRIMARY SETUPS FIRST 
    //PARKED FOR THE MEANTIME - OEE PRIMARY SETUP
    // $.ajax({
    //     type: 'post',
    //     url: 'http://MXHTAFOT01L.maxim-ic.com/TEST/OEE_OVERRIDE.PHP?PROCESS_TYPE=GET_PRIMARY_SETUP',
    //     data: {payload: (common_fields['MFG_PART_NUM']) ? common_fields['MFG_PART_NUM'] : common_temp['MFG_PART_NUM']},
    //     success: function(data){
    //         var primary_setup = JSON.parse(data);

            //GET OEE
            $.ajax({
                type: 'post',
                url: 'http://MXHTAFOT01L.maxim-ic.com/TEST/TEST_RM_001_TEST_ONLY_JON.PHP',
                data: {
                    common_fields: {
                        MFG_PART_NUM: (common_fields['MFG_PART_NUM']) ? common_fields['MFG_PART_NUM'] : common_temp['MFG_PART_NUM'],
                        TESTER: (common_fields['TESTER']) ? common_fields['TESTER'] : common_temp['TESTER'],
                        HANDLER: (common_fields['HANDLER']) ? common_fields['HANDLER'] : common_temp['HANDLER'],
                        TEMP_CLASS: (common_fields['TEMP_CLASS']) ? common_fields['TEMP_CLASS'] : common_temp['TEMP_CLASS'],
                    }, 
                    main_fields: main_fields},
                beforeSend: function(){
                    showLoader('Rendering OEE... \n Please Wait!');
                },
                success: function(data){
                    setTimeout(function(){
                        if (data) {
                            let sha1 = [];
                            swal.close();
                            if (JSON.parse(data)['DATA'].length == 0) {
                                showGenericAlert("warning", "Record Not Found!");
                                return;
                            }
                            console.log(JSON.parse(data));
                            
                            if (is_initial) {
                                let oee_values = [];
                                let oee_rows = 0;
                                $.each(JSON.parse(data)['DATA'], function(index, item){
                                    if ($.inArray(item['OEE']['MIN'], oee_values) === -1) {
                                        oee_values.push(item['OEE']['MIN']);
                                    }
                                    oee_rows += 1;
                                });
                                let oee_session = {
                                    result: JSON.parse(data),
                                    common_fields: {
                                        MFG_PART_NUM: common_fields['MFG_PART_NUM'],
                                        TESTER: common_fields['TESTER'],
                                        HANDLER: common_fields['HANDLER'],
                                        TEMP_CLASS: common_fields['TEMP_CLASS'],
                                    },
                                    ignore_fields: ignore_fields,
                                    hide_col: hide_col,
                                    oee_values: oee_values,
                                    oee_rows: oee_rows
                                };
                                sessionStorage.setItem('oee_session', JSON.stringify(oee_session));
                            }

                            $.each(JSON.parse(data)['DATA'], function(index, item){
                                sha1.push(index);
                            });
                
                            renderOEE(JSON.parse(data), common_fields, ignore_fields, hide_col, oee_main, common_temp, /**primary_setup*/);
                            getOEE(oee_main);
                        }
                    }, 1500);  
                },
                error: function(xhr, status, error) {
                    console.log(xhr);
                }
            });

    //     },
    //     error: function(xhr, status, error) {
    //         console.log(xhr);
    //     }
    // });
}

function setOEE(common_data){
    $.ajax({
        type: 'post',
        url: 'http://MXHTAFOT01L.maxim-ic.com/TEST/OEE_OVERRIDE.PHP?PROCESS_TYPE=SET_OVERRIDE',
        data: {
            common_data: {
                MFG_PART_NUM:   common_data['MFG_PART_NUM'],
                TESTER:         common_data['TESTER'],
                HANDLER:        common_data['HANDLER'],
                TEMP_CLASS:     common_data['TEMP_CLASS'],
                OEE_FIELD:      common_data['OEE_FIELD']
            }
        },
        beforeSend: function(){
            showLoader('Modifying OEE Override... \n Please Wait!');
        },
        success: function(data){
            setTimeout(function(){
                if (data) {
                    showSuccess("OEE Override Modified Successfully!");
                    let oee_session = JSON.parse(sessionStorage.getItem('oee_session'));    
                    $.each(common_data['OEE_FIELD'], function(index, item){
                        if (typeof(oee_session['result']['DATA'][item[7]]) != 'undefined') {
                            oee_session['result']['DATA'][item[7]]['OEE']['OVERRIDE'] = item[6];
                        }
                        $('[hash="'+item[7]+'"]').attr("default-override", item[6]);
                    });
                    sessionStorage.setItem('oee_session', JSON.stringify(oee_session));
                }
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function getOEE(oee_main){

    let common_data = [];
    let main_data   = [];
    let data = oee_main.rows().data();
    $.each(data, function(index, item){
        // let oee_input = $('.override[hash="'+item[8]+'"]').val();
        // if (oee_input != '') {
            // if (oee_input != item[6]) {
                let temp = [];
                let excluded_col = [6,7];
                // data[index][7] = oee_input;

                $.each(item, function(idx, itm){
                    if ($.inArray(idx, excluded_col) === -1) {
                        temp.push(itm);
                    }
                });
                main_data.push(temp);
            // }
        // }
    });
    $(".alert-success").each(function(){
        let parent_field = $(this).attr("field-data");
        common_data[parent_field] = [];
        $('[parent-field="'+parent_field+'"]').each(function(){
            common_data[parent_field].push($(this).text());
        });
    });
    common_data['OEE_FIELD'] = main_data;
    
    $.ajax({
        type: 'post',
        url: 'http://MXHTAFOT01L.maxim-ic.com/TEST/OEE_OVERRIDE.PHP?PROCESS_TYPE=GET_OVERRIDE',
        data: {
            common_data: {
                MFG_PART_NUM:   common_data['MFG_PART_NUM'],
                TESTER:         common_data['TESTER'],
                HANDLER:        common_data['HANDLER'],
                TEMP_CLASS:     common_data['TEMP_CLASS'],
                OEE_FIELD:      common_data['OEE_FIELD']
            }
        },
        success: function(data){
            let oee_session = JSON.parse(sessionStorage.getItem('oee_session'));
            let oee_data = JSON.parse(data);
            
            var indexes = oee_main
            .rows(function (index, data, node){
                let row_sha = data[8];
                $.each(oee_data, function(idx, itm){
                    if (row_sha == itm['ORIG_SHA1']) {
                        $('[hash="'+row_sha+'"]').attr("default-override", itm['OEE_VAL']);
                        $('[hash="'+row_sha+'"]').val(itm['OEE_VAL']);

                        if (typeof(oee_session['result']['DATA'][itm['ORIG_SHA1']]) != 'undefined') {
                            oee_session['result']['DATA'][itm['ORIG_SHA1']]['OEE']['OVERRIDE'] = itm['OEE_VAL'];
                        }
                    }
                });
            }).indexes();

            sessionStorage.setItem('oee_session', JSON.stringify(oee_session));
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

//-----------------------------------------------------------------------------END OEE API-----------------------------------------------------------------------------

//---------------------------------------------------------------------------DEDICATIONS API-----------------------------------------------------------------------------
function getTesterHandler(table_data, table_row, table_dedication, module_type = null){
    $.ajax({
        type: 'post',
        url: 'http://MXHDAFOT01L.maxim-ic.com/API/DEDICATIONS.PHP?PROCESS_TYPE=GET_TESTER_HANDLER',
        data: {data: table_data, module_type: module_type, site: table_row[15].split("|")[1]},
        success: function(data){
            setTimeout(function(){
                $(".btn-message").hide();
                function isValidJson(data){
                    try {
                        JSON.parse(data);
                        return true;
                    } catch (e) {
                        return false;
                    }
                }

                if (isValidJson(data)) {
                    renderDedications(JSON.parse(data), table_row, table_dedication);
                }
                else{
                    $(".btn-no-result").fadeIn();
                }

            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}
// FINISH SET DEDICATION, REMOVE DEDICATION - (DELETE DEDICATION FROM PRIO LIST, REMOVE UPDATE PRIO_CD), FINISH DEDICATION AS PRIMARY AND THEN IF IT'S DELETED (UPDATE PRIO_CD LIST)
function setDedication(payload, details, user_details){
    let is_done = 0;
    showLoader('Processing... \n Please Wait!');
    $.each(payload, function(index, item){
        $.ajax({
            type: 'post',
            url: 'http://mxhtafot01l.maxim-ic.com/TEST/PRIMARY_SETUP.php?PROCESS_TYPE=SET_DEDICATION',
            data: {payload: [item], user_details: user_details},
            success: function(data){
                console.log(data);
            },
            error: function(xhr, status, error) {
                console.log(xhr);
            }
        });
        if (index == payload.length - 1) {
            is_done++;
        }
    });

    if (is_done > 0) {
        setTimeout(function(){
            showSuccess("Record Saved Succesfully!");
            location.reload();
        }, 1500);
    }
}

function removeDedication(payload, type = null){
    if (type == null) {
        $.ajax({
            type: 'post',
            url: 'http://mxhtafot01l.maxim-ic.com/TEST/PRIMARY_SETUP.php?PROCESS_TYPE=REMOVE_DEDICATION',
            data: {payload: payload['ded_id'], primary: payload['default_primary'], user_details: user_details},
            beforeSend: function(){
                showLoader('Processing... \n Please Wait!');
            },
            success: function(data){
                setTimeout(function(){
                    if (data) {                    
                        showSuccess("Dedication Removed Succesfully!");
                        location.reload();
                    }
                }, 1500);
            },
            error: function(xhr, status, error) {
                console.log(xhr);
            }
        });
    }
    else{
        let ded_payload = formatTimephaseDedication(payload, sessionStorage.getItem("instance-loaded"), "remove-tp-ded");
        setTimephaseInstance(ded_payload, "remove-tp-ded");      
    }
}

//------------------------------------------------------------------------END DEDICATIONS API-----------------------------------------------------------------------------


//--------------------------------------------------------------------------TIMEPHASING API--------------------------------------------------------------------------------
function getCalendar(route, date, week, num, id, type, crud) {
    $.ajax({
        type: 'post',
        url: 'http://MXHTAFOT01L.maxim-ic.com/TEST/TIMEPHASING.PHP?PROCESS_TYPE=GET_CALENDAR',
        data: {date: date, week: week, type: type, crud: crud},
        success: function(data){
            renderTimephasingCalendar(route, date, week, JSON.parse(data), num, id, crud);
        },
        complete: function(){
            $(".btn-instance").removeClass("visually-hidden");
            $(".btn-loader").remove();
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function getInstance(tp_id){
    $.ajax({
        type: 'get',
        url: 'http://mxhdafot01l.maxim-ic.com/API/MAPPER_BRAIN_006.PHP?INPUT_TYPE=TPI_ID&OUTPUT_TYPE=TPI_DATA_GET_ONE&INPUT[0]='+tp_id+'',
        beforeSend: function(){
            showLoader('Loading Instance... \n Please Wait!');
        },
        success: function(data){
            if (JSON.parse(data)['STATUS'] == "SUCCESS") {
                setTimeout(function(){
                    let result = JSON.parse(data);
                    result['DATA'][tp_id]['TPI_ID'] = tp_id;
                    sessionStorage.setItem('instance-loaded', JSON.stringify(result['DATA']));
                    location.reload();
                }, 1500);
            }
            else{
                showGenericAlert("error", JSON.parse(data)['MESSAGE']);
            }
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function setTimephaseInstance(data, type = null){
    let loader_txt = 'Updating Instance';
    let success_txt = 'Instance Updated Succesfully!';

    if (type != null) {
        loader_txt = 'Processing';
        success_txt = 'Dedication Removed Succesfully!';
    }
    
    let payload = {
        "INPUT_TYPE":"JSON",
        "OUTPUT_TYPE":"TPI_PUT_ONE",
        "INPUT": data
    };
    
    let new_session_data = data;
    // console.log(payload);
    // return;
    $.ajax({
        type: 'post',
        url: 'http://MXHDAFOT01L.maxim-ic.com/API/MAPPER_BRAIN_006.PHP',
        data: JSON.stringify(payload),
        beforeSend: function(){
            showLoader(''+loader_txt+'... \n Please Wait!');
        },
        success: function(data){
            setTimeout(function(){
                if (JSON.parse(data)['STATUS'] == "SUCCESS") {
                    sessionStorage.setItem("instance-loaded", JSON.stringify(new_session_data));
                    showSuccess(success_txt);
                    location.reload();
                }
                else{
                    showGenericAlert("error", JSON.parse(data)['MESSAGE']);
                }
            }, 1500);            
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function setTimephase(data, user_details, crud){
    let endpoint = "";
    let param;
    let payload = {
        "SAP_RTE_ID":     data['route'],
        "EFF_START_DT":   data['date'],
        "FYWW":           data['week'].replace("FY","20").replace("_W", ""),
        "PROCESS_TYPE":   data['process'],
        "NOTES":          data['notes'],
        "CHANGE_USER":    user_details['emp_id']
    }

    switch (crud) {
        case "new":
            if (data['id'] != "current") {
                payload.TPI_ID = data['id'];
            }
            payload['PROCESS_TYPE'] = payload['PROCESS_TYPE'].join("|");
            endpoint = 'http://mxhdafot01l.maxim-ic.com/API/MAPPER_BRAIN_006.PHP?INPUT_TYPE=JSON&OUTPUT_TYPE=TPI_CLONE&INPUT[0]='+encodeURIComponent(JSON.stringify(payload))+'';
            break;
        
        default: // FOR CURRENT DATA / INSTANCE
            let edit_payload = {}
            payload['DATA'] = {};
            payload['SUMMARY'] = [];
            payload['COMPARE'] = [];
            payload['INSTANCE'] = data['num'];
            edit_payload[data['id']] = payload;
            endpoint = 'http://MXHDAFOT01L.maxim-ic.com/API/MAPPER_BRAIN_006.PHP?INPUT_TYPE=JSON&OUTPUT_TYPE=TPI_PUT_ONE&INPUT='+encodeURIComponent(JSON.stringify(edit_payload))+'';
            break;
    }

    $.ajax({
        type: 'post',
        url: endpoint,
        data: param,
        beforeSend: function(){
            showLoader('Processing... \n Please Wait!');
        },
        success: function(data){
            setTimeout(function(){
                if (crud == "new") {
                    if (JSON.parse(data)['STATUS'] == "SUCCESS") {
                        showSuccess("Instance Created Succesfully!");

                        //2025-10-15 RM additionally, load the newly created instance directly rather than require another click, and potentially a horizontal scroll if many instances
                        const aryTPIIDNew = JSON.parse(data)['DATA'];
                        intTPIIDNew = null;
                        for(i in aryTPIIDNew) {
                            intTPIIDNew = aryTPIIDNew;
                        }

                        if(intTPIIDNew !== null) {
                            const url = new URL(window.location.href);
                            url.searchParams.set('timephase-instance',intTPIIDNew);
                            window.location.href = url.toString();
                        }else{
                            location.reload();
                        }
                    }
                    else{
                        showGenericAlert("error", JSON.parse(data)['MESSAGE']);
                    }
                }
                else{
                    if (JSON.parse(data)) {
                        showSuccess("Instance Edited Succesfully!");
                        location.reload();
                    }
                }
            }, 1500);            
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function removeTimephase(data){
    let instance_id = data['id'];
    let delete_payload = [{
        "TPI_ID": instance_id,
        "CHANGE_USER": user_details['emp_id'],
    }];
    
    $.ajax({
        type: 'post',
        // url: 'http://MXHDAFOT01L.maxim-ic.com/API/TIMEPHASING.PHP?PROCESS_TYPE=DELETE_TIMEPHASE',
        url: 'http://MXHDAFOT01L.maxim-ic.com/API/MAPPER_BRAIN_006.PHP?INPUT_TYPE=JSON&OUTPUT_TYPE=TPI_DELETE_ONE&INPUT='+encodeURIComponent(JSON.stringify(delete_payload))+'',
        // data: {data: data, user_details: data['user_details']},
        beforeSend: function(){
            showLoader('Processing... \n Please Wait!');
        },
        success: function(data){
            setTimeout(function(){
                if (data) {

                    const queryString = window.location.search;
                    const urlParams = new URLSearchParams(queryString);
                    const instanceID = urlParams.get('timephase-instance');

                    if (instance_id == instanceID) {
                        const url = new URL(window.location.href);
                        const params = url.searchParams; 
                        params.delete('timephase-instance');
                        window.history.replaceState({}, document.title, url.toString());
                    }

                    showSuccess("Instance Removed Succesfully!");
                    location.reload();
                }
            }, 1500);            
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}


//----------------------------------------------------------------------------END API CALLS----------------------------------------------------------------------


// ----------------------------------------------------------------------DYNAMIC DATA RENDERING---------------------------------------------------------------------------------
function populateDropdown(items){

    let parent_elem = "";
    let result_counter = 0;
    
    $.each(items, function(index, value){

        let inner_val_counter = 0;
        let inner_elem = "";
        let value_len = value['value'].length;
        let collapsed = (result_counter <= 10) ? "" : "collapsed";
        let show = (result_counter <= 10) ? "show" : "";

        if (value_len != 0) {
            let type = value['type'];
            $.each(value['value'], function(inner_index, inner_val){
                let group_details = value['details'][inner_index];
                result_counter++;
                inner_val_counter++;                
                if (inner_val_counter <= 10) {
                    inner_elem += '<li class="list-group-item">'+
                    "<input id='checkbox-"+inner_val+"' class='form-check-input me-1 resource-check "+type+"_CHECK' type='checkbox' value='"+inner_val+'|'+type+"' group-data='"+JSON.stringify(group_details, null, 2)+"'>"+
                    '<label class="form-check-label" for="checkbox-'+inner_val+'">'+inner_val+'</label>'+
                   '</li>';   
                }
            });

            if (value_len > 10) {
                inner_elem += '<li class="list-group-item"><small class="text-body-secondary">Displaying first 10 records only. </br> Please edit search criteria to be more specific.</small></li>';
            }

            parent_elem += '<div class="accordion-item">'+
                                '<h2 class="accordion-header">'+
                                    '<button class="accordion-button '+collapsed+'" type="button" data-bs-toggle="collapse" data-bs-target="#'+type+'-collapse" aria-expanded="true" aria-controls="'+type+'-collapse">'+
                                        '<strong>'+type+'</strong>'+
                                    '</button>'+
                                '</h2>'+
                                '<div id="'+type+'-collapse" class="accordion-collapse collapse '+show+'">'+
                                    '<div class="accordion-body">'+
                                        '<ul class="list-group">'+
                                            '<li class="list-group-item">'+
                                                '<div class="form-check form-check-reverse">'+
                                                    '<label class="form-check-label" for="'+type+'_CHECK"><small><strong>Select All</strong></small></label>'+
                                                    '<input class="form-check-input select-all" type="checkbox" value="" id="'+type+'_CHECK">'+
                                                '</div>'+
                                            '</li>'+
                                        inner_elem+'</ul>'+
                                    '</div>'+
                                '</div>'+
                            '</div>'
        }
    });

    $(".result-accordion").append(parent_elem).fadeIn();
}

function renderCategoryFilter(elem, part_selection){
    let is_partnum = elem.hasClass("MFG_PART_NUM_CHECK");
    if (is_partnum) {
        let all_part_num = elem.val().split("|")[0];
        let has_group_data = elem.attr("group-data");
        let parse_group = JSON.parse(has_group_data);
        let group_generic = (parse_group.GENERIC != null) ? parse_group.GENERIC : 'UNKNOWN';
        let group_details = group_generic +' ('+parse_group.RES_AREA+' - L-ADI)';
        
        if ($.inArray(group_details, group_header) === -1) {
            group_header.push(group_details);
        }
        
        //CHECK SESSION VALUE
        let sps = sessionStorage.getItem('session_part_selections');
        if (sps != null) {
            $.each(JSON.parse(sps)['data_set'], function(index, item){
                let counter = 0;
                let smfg = item[0];
                $.each(data_set, function(idx, itm){
                    if ($.inArray(smfg, itm) !== -1) {
                        counter++;
                    }
                });
                if (counter == 0) {
                    data_set.push(item);
                }
            });

            $.each(JSON.parse(sps)['group_header'], function(idx, itm){
                if ($.inArray(itm, group_header) === -1) {
                    group_header.push(itm);
                }
            });
        }

        if (data_set.length > 0) {
            let counter = 0;
            $.each(data_set, function(index, item){
                if ($.inArray(all_part_num, item) !== -1) {
                    counter++;
                }
            });
            if (counter == 0) {
                data_set.push([all_part_num, group_generic, '<button class="btn btn-sm btn-danger btn-pst-del" data-id="'+all_part_num+'|'+group_generic+'|'+group_details+'"><i class="fa-solid fa-trash"></i></button>', group_details]);
            }
        }
        else{
            data_set.push([all_part_num, group_generic, '<button class="btn btn-sm btn-danger btn-pst-del" data-id="'+all_part_num+'|'+group_generic+'|'+group_details+'"><i class="fa-solid fa-trash"></i></button>', group_details]);
        }

    }
    sessionStorage.setItem('session_part_selections', JSON.stringify({data_set: data_set, record_count: null, group_header: group_header}));
    renderPartSelectionTable(data_set, null, group_header, part_selection);
}

function renderPartSelectionTable(data = null, record_count = null, group = null, part_selection) {
    part_selection.rows().remove().draw();
    let regroup_array = [];
    $.each([...new Set(group)], function(index, item){
        regroup_array.push([item, '&nbsp;', '&nbsp;']);
        $.each(data, function(inner_index, inner_item){
            if (item == inner_item[3]) {
                regroup_array.push(inner_item);
            }
        });
    });
    
    part_selection.rows.add(regroup_array);
    part_selection.draw(false);
}

function deletePartSelectionTable(data, data_set, group_header, part_selection){
    let sps = sessionStorage.getItem("session_part_selections");
    let session_ds = (sps != null) ? JSON.parse(sps)['data_set'] : [];
    let session_gh = (sps != null) ? JSON.parse(sps)['group_header'] : [];
    let split = data.split("|");
    let partnum = split[0];
    let generic = split[1];
    let details = split[2];
    let gh_count = 0;
    
    //REMOVE FROM TEMP ARRAYS (DATA_SET)
    if (data_set.length > 0) {
        let ds_index;
        $.each(data_set, function(index, item){
            if ($.inArray(partnum, item) !== -1) {
                ds_index = index;
            }
        });
        data_set.splice(ds_index, 1);
    }    

    //REMOVE FROM SESSION VARIABLE (DATA_SET)
    if (session_ds.length > 0) {
        let session_ds_index;
        $.each(session_ds, function(index, item){
            if ($.inArray(partnum, item) !== -1) {
                session_ds_index = index;
                console.log(item);
                
            }
        });
        session_ds.splice(session_ds_index, 1);
    }    

    //REMOVE FROM TABLE - PARTNUM ROW
    var partnums = part_selection
        .rows()
        .indexes()
        .filter(function(value, index){
        return partnum === part_selection.row(value).data()[0];
    });
      
    part_selection.rows(partnums).remove().draw();

    //REMOVE FROM TABLE - GENERIC ROW (GROUP HEADER)
    let table_data = part_selection.rows().data();
    $.each(table_data, function(index, item){
        if (item[1] != '&nbsp;') {
            if (item[3] == details) {
                gh_count++;
            }
        }
    });

    if (gh_count == 0) {
        var headers = part_selection
            .rows()
            .indexes()
            .filter(function(value, index){
            return details === part_selection.row(value).data()[0];
        });
        
        //REMOVE FROM TEMP ARRAYS (GROUP_HEADER)
        if (group_header.length > 0) {
            group_header.splice(group_header.indexOf(details), 1);
        }

        //REMOVE FROM SESSION VARIABLE (GROUP_HEADER)
        if (session_gh.length > 0) {
            session_gh.splice(session_gh.indexOf(details), 1);
        }

        part_selection.rows(headers).remove().draw();
    }
    
    sessionStorage.setItem('session_part_selections', JSON.stringify({data_set: session_ds, record_count: null, group_header: session_gh}));
}

var resource_matches = [];
function checkResourceMapping(type, new_primary){
    if (type == "all-steps") {
        let table_source_rows = $(".table_source").DataTable().rows().data();
        let filtered = [];

        $.each(table_source_rows, function(index, item){
            if (item[17] != new_primary[17]) {
                source_rte = item[15].split("|")[4];
                primary_rte = new_primary[15].split("|")[4];
                source_criteria = item[1]+"|"+item[2]+"|"+item[3]+"|"+item[4]+'|'+item[6]+'|'+source_rte;
                primary_criteria = new_primary[1]+"|"+new_primary[2]+"|"+new_primary[3]+"|"+new_primary[4]+'|'+new_primary[6]+'|'+primary_rte;
                if (source_criteria == primary_criteria) {
                    let hardware_change_exists = $("#"+item['16'].replace("table_primary", "HWCH")).length;
                    if (hardware_change_exists == 0) {
                        resource_matches.push(item);
                    }
                }
            }
        });

        var duplicates = [];
        $.each(resource_matches, function(index, item){
            let step = item[15].split("|")[2];
            let rte = item[15].split("|")[2];
            let combination = item[1]+"|"+item[2]+"|"+item[3]+"|"+item[4]+'|'+item[6]+'|'+rte+'|'+step;
            if ($.inArray(combination, duplicates) === -1) {
                filtered.push(item)
            }
            duplicates.push(combination);
        });
        
        resource_matches = filtered;
        
        $(".apply-check-primary-container").css('visibility','visible').hide().fadeIn('slow');
        let color = (resource_matches.length == 0) ? 'red' : 'black';
        let status = (resource_matches.length == 0) ? true : false;
        $(".apply-check-primary-container").css('color', color);
        $(".apply-check-primary").prop("disabled", status);
    }
}

//HARDWARE SETUPS UI - DATATABLE CARET ONCLICK
function renderHardwareSetup(d) {
    let container = "";
    let sets = "";
    let count = 1;
    let primary_tbl = d[16];
    let primary_hw = d[19];
    let primary_id = d[20];
    let primary_route = d[15].split("|")[4];
    let primary_tstr_hndlr = d[3]+'|'+d[4];
    let status = d[21];
    let hw_sets = d[22].split(",");
    let check_status = '';
    let check_color = '';
    let radio_class = 'hardware_radio_'+d[15].split("|")[2]+'_'+d[1]+d[15].split("|")[3]+'';
    let group_idtf = d[15].split("|")[2];
    let radio_status = "";

    if ($("#"+primary_tbl.replace("table_primary", "HWCH")).length > 0) {
        radio_status = "disabled";
    }

    $.each(JSON.parse(d[14]), function(index, item){
        let is_opc = /OPC/i.test(d[15].split("|")[4]);
        let contents = "";
        let hw_set_id = index;
        let selected = (primary_hw == hw_set_id) ? "checked" : "";
        let identifier = hw_set_id+'_'+d[15].split("|")[2]+'_'+d[1];
        
        $.each(item, function(inner_index, inner_item){
            let hw_name = "";
            let hw_cap = 0;

            $.each(inner_item, function(idx, itm){
                let separator = (idx == (inner_item.length -1)) ? "" : (is_opc) ? " OR " : ", ";
                hw_name += itm['HW_NM']+separator;
                hw_cap = itm['REQUIRED_QTY'];
            });

            contents += '<tr>'+
                            '<td>'+inner_index+'</td>'+
                            '<td>'+hw_name+'</td>'+
                            '<td>'+hw_cap+'</td>'+
                        '</tr>'
        });

        if ($.inArray(hw_set_id, hw_sets) !== -1) {
            sets += '<div class="col-lg-4">'+
                '<div class="card">'+
                    '<div class="card-header d-flex justify-content-between"><span class="badge text-bg-info">SET '+count+'</span> <span class="badge text-bg-secondary">'+hw_set_id+'</span></div>'+
                    '<div class="card-body">'+
                        '<table class="table table-bordered table-hover"><thead><tr><th>HW_TYPE</th><th>HW_NAME</th><th>HMS_COUNT</th></tr></thead>'+
                            '<tbody>'+contents+'</tbody>'+
                        '</table>'+
                    '</div>'+
                    '<div class="card-footer d-flex justify-content-center pr-2">'+
                        '<div class="form-check">'+
                            '<input class="form-check-input hardware-radio '+radio_class+' '+hw_set_id+'_'+primary_id+'" value="'+hw_set_id+'_'+primary_id+'" '+
                            'data-id="'+primary_hw+'_'+primary_id+'" data-status="'+status+'" type="radio" name="'+radio_class+'" '+
                            'primary-table="'+primary_tbl+'" data-raw=\''+d[14]+'\''+
                            'default-primary-hw="'+d[19]+'" tester-handler="'+primary_tstr_hndlr+'"'+
                            'setup-group="'+d[15]+'"'+
                            'id="hardware_radio_'+identifier+'" '+selected+' '+radio_status+'>'+
                            '<label class="form-check-label" for="hardware_radio_'+identifier+'">Select</label>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>'
            count++;
        }

    });

    let invalid = primaryHardwareChecker(primary_hw, primary_tstr_hndlr);

    if (invalid > 0) {
        check_status = 'disabled';
        check_color = 'text-danger';
    }

    container += '<div class="row">'+
                    sets+
                    '<div class="col-lg-12 pr-2">'+
                        '<div class="form-check form-check-reverse">'+
                            '<input id="'+group_idtf+'" primary-table="'+primary_tbl+'" primary-hw-data="'+primary_hw+'_'+primary_id+'"'+ 
                            'name="apply-all-radio" class="form-check-input apply-all-primary-hw" type="radio" route-id="'+primary_route+'"'+
                            'tester-handler="'+primary_tstr_hndlr+'" child-hardware="'+radio_class+'" '+check_status+'>'+
                            '<label class="form-check-label apply-all-primary-hw-label fw-semibold '+check_color+'" for="'+group_idtf+'">'+
                                'Apply to primary tester/handler of all steps'+
                            '</label>'+
                        '</div>'+
                    '<div/>'+
                '</div>';

    return container; 
}

function renderOEE(result, common_fields, ignore_fields, hide_col, oee_main, common_temp, primary_setup){

    //RESET ELEMENTS
    oee_main.rows().remove().draw();
    oee_main.columns().visible(true);
    $(".common-list, .ignore-list").empty();
    $(".override").each(function(){$(this).val("")});

    let get_session = JSON.parse(sessionStorage.getItem("oee_session"));
    let oee_rows    = get_session['oee_rows'];
    let oee_value   = get_session['oee_values'];
    let new_oee_row = Object.keys(result['DATA']).length;
    let common_list = "";
    let ignore_list = "";
    let range_arr   = [];
    let rows        = [];
    let main_part   = 0;
    let last_col    = $(".last-common-column").val();
    let chk_status  = "";

    //CONSTRUCT MAIN TABLE
    oee_main.columns(hide_col).visible(false);

    $.each(result['DATA'], function(index, item){

        let cols            = item['COMBO'];
        let col_val         = [];
        let oee_range_arr   = [];
        let oee_range;
        let check_status    = "";
        
        $.each(Object.keys(cols), function(idx, itm){
            col_val.push(item['COMBO'][itm]);
        });

        let col_join = col_val.join("|");

        $.each(get_session['result']['DATA'], function(idx, itm){
            let test = [];
            $.each(Object.keys(cols), function(iidx, iitm){
                test.push(itm['COMBO'][iitm]);
            });
            
            if (col_join == test.join("|")) {
                if ($.inArray(itm['OEE']['MIN'], oee_range_arr) === -1) {
                    oee_range_arr.push(itm['OEE']['MIN']);
                }
            }
        });

        // CREATE OEE VALUE (RANGE OR SINGLE VALUE)
        if (oee_range_arr.length > 0) {
            if (oee_range_arr.length > 1) {
                oee_range = Math.min(...oee_range_arr).toFixed(3)+' - '+Math.max(...oee_range_arr).toFixed(3);
                range_arr = oee_range_arr;
            }
            else{
                oee_range = oee_range_arr[0];
            }
        }
        else{
            oee_range = item['OEE']['MIN'];
        }

        //PARKED FOR THE MEANTIME - OEE PRIMARY SETUP
        // if (typeof(common_fields['MFG_PART_NUM']) != 'undefined' && (typeof(common_fields['TESTER']) == 'undefined' && typeof(common_fields['HANDLER']) == 'undefined')) {
        //     if (primary_setup.length > 0) {
        //         $.each(primary_setup, function(idx, itm){
        //             if (item['COMBO']['SITE_NUM']       == itm['SITE_NUM'] &&
        //                 item['COMBO']['MFG_PART_NUM']   == itm['MFG_PART_NUM'] &&
        //                 item['COMBO']['TESTER']         == itm['TESTER'] &&
        //                 item['COMBO']['HANDLER']        == itm['HANDLER']
        //             ) {
        //                 check_status = "checked";
        //             }
        //         });
        //     }
        // }

        let part_num    = (item['COMBO']['MFG_PART_NUM'])  ? item['COMBO']['MFG_PART_NUM'] : '';
        let site_num    = (item['COMBO']['SITE_NUM'])      ? item['COMBO']['SITE_NUM']     : '';
        let res_area    = (item['COMBO']['RES_AREA'])      ? item['COMBO']['RES_AREA']     : '';
        let tester      = (item['COMBO']['TESTER'])        ? item['COMBO']['TESTER']       : '';
        let handler     = (item['COMBO']['HANDLER'])       ? item['COMBO']['HANDLER']      : '';
        let temp_class  = (item['COMBO']['TEMP_CLASS'])    ? item['COMBO']['TEMP_CLASS']   : '';
        let oee         = oee_range;
        let override    = '<input type="number" class="form-control border border-dark w-50 override" hash="'+index+'" value="'+item['OEE']['OVERRIDE']+'">';
        let hash        = index;
        // let check       = '<input class="form-check-input oee-checkbox" type="checkbox" '+check_status+'>'; //PARKED FOR THE MEANTIME - OEE PRIMARY SETUP

        rows.push([part_num, site_num, res_area, tester.replace("_ZEROCAP", ""), handler.replace("_ZEROCAP", ""), temp_class, oee, override, hash, /**check */]);
    });

    oee_main.rows.add(rows);
    oee_main.draw(false);

    if (range_arr.length > 1) {
        $(".oee-checkbox").prop("indeterminate", true);
    }

    //CONSTRUCT COMMON CARD
    $.each(Object.keys(common_fields), function(index, item){
        let child_elem = "";
        let child_val = "";
        let item_count = (common_fields[item].length > 10) ? '<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">'+common_fields[item].length+'</span>' : '';
        $.each(common_fields[item], function(idx, itm){
            if (idx <= 9) {
                child_elem += '<span style="--bs-bg-opacity: .7;" class="badge text-bg-success">'+itm+'</span><br>';
            }
            else if(idx == 10){
                child_elem += '<span style="--bs-bg-opacity: .7;" class="badge text-bg-success"><i class="fa-solid fa-ellipsis"></i></span><br>';
            }

            child_val += '<span style="display: none!important;" parent-field="'+item+'">'+itm+'</span>';
        });
        common_list += '<div class="alert alert-success alert-dismissible fade show oee-field" field-data="'+item+'" role="alert">'+
                            '<strong>'+item+'</strong><br>'+child_elem+child_val+
                            '<button type="button" class="btn-close oee-remove" data-bs-dismiss="alert" aria-label="Close" card-type="common-card" field-data="'+item+'"></button>'+
                            item_count+
                        '</div>';
    });

    //CONSTRUCT IGNORE CARD
    $.each(ignore_fields, function(index, item){
        let ignored_parts = "";
        if (last_col != '' && last_col == item) {
            ignored_parts += '<input type="hidden" parent-ignore="'+item+'" value='+JSON.stringify(common_temp[item])+'>';
        }
        ignore_list += '<div class="alert alert-danger alert-dismissible fade show oee-field" field-data="'+item+'" role="alert">'+
                            '<strong>'+item+'</strong>'+ignored_parts+
                            '<button type="button" class="btn-close oee-remove" data-bs-dismiss="alert" aria-label="Close" card-type="ignore-card" field-data="'+item+'"></button>'+
                        '</div>';
    });

    $(".ignore-list").append(ignore_list);
    $(".common-list").append(common_list);

    $("#oeeModal").modal("show");    
}

function renderDedications(result, table_row, table_dedication){

    let tester_opt = "";
    let handler_opt = "";
    let split = table_row[15].split("|");

    //GET EXISTING DEDICATIONS IF AVAILABLE - BY PARTNUMBER
    let existing_ded = JSON.parse($(".existing-dedications").val());
    existing_ded = existing_ded.filter(function(item) {  
        return item.MFG_PART_NUM === split[0]; 
    });

    //RENDER TABLE DEDICATION
    if ($(".instance-loaded-alert").length == 0) {
        if (existing_ded.length > 0) {
            $.each(existing_ded, function(index, item){
                let group_data = item['SAP_RTE_ID']+'|'+item['SITE_NUM']+'|'+item['STEP_NM'];
                let row_node = table_dedication.row.add([
                    item['SITE_NUM'],
                    item['SAP_RTE_ID'],
                    item['STEP_NM'],
                    item['ENGR_TESTER'],
                    item['ENGR_HANDLER'],
                    item['TESTER'],
                    item['HANDLER'],
                    (item['EXCLUSIVE'] == 1) ? 'YES' : 'NO',
                    item['TYPE'],
                    '<div class="form-check d-flex justify-content-center">'+
                        '<input class="form-check-input dedication-check" type="checkbox" value="'+item['ID']+'" dedication-type="'+item['TYPE']+'" group-data="'+group_data+'">'+
                    '</div>',
                    item['ID']
                ]).node();
                $(row_node).attr("row-id", item['ID']);
            });
            table_dedication.draw(false);
        }
    }
    else{
        const parameterValue = new URLSearchParams(window.location.search).get('timephase-instance');
        let si_data = JSON.parse(sessionStorage.getItem('instance-loaded'))[parameterValue];
        let rte_keys = Object.keys(si_data['DATA']['RTE_SEQ_NUM']);

        $.each(rte_keys, function(index, item){
            let prio_keys = Object.keys(si_data['DATA']['RTE_SEQ_NUM'][item]['RES_PRIO_CD']);
            let si_rte = si_data['SAP_RTE_ID'];
            let si_site = split[1];
            let si_step = si_data['DATA']['RTE_SEQ_NUM'][item]['STEP_NM'];
            let group_data = si_rte+'|'+si_site+'|'+si_step;
            
            $.each(prio_keys, function(idx, itm){
                let si_setup = si_data['DATA']['RTE_SEQ_NUM'][item]['RES_PRIO_CD'][itm];
                let si_exclusive = (si_setup['DED_IS_EXCLUSIVE'] != null) ? si_setup['DED_IS_EXCLUSIVE'] : 0;
                let si_data_id = parameterValue+'|'+si_rte+'|'+item+'|'+si_step+'|'+itm+'|'+si_exclusive;
                if (si_setup['IS_DED'] == 1) {
                    let ded_type = (si_setup['DED_IS_PRIMARY'] == 1 && si_setup['DED_IS_PRIMARY'] != null) ? 'PRIMARY' : 'ALTERNATE';
                    let row_node = table_dedication.row.add([
                        si_site,
                        si_rte,
                        si_step,
                        si_setup['TESTER_ENG'],
                        si_setup['HANDLER_ENG'],
                        si_setup['TESTER'],
                        si_setup['HANDLER'],
                        (si_setup['DED_IS_EXCLUSIVE'] == 1 && si_setup['DED_IS_EXCLUSIVE'] != null) ? 'YES' : 'NO',
                        ded_type,
                        '<div class="form-check d-flex justify-content-center">'+
                            '<input class="form-check-input dedication-check" type="checkbox" value="'+si_setup['TPD_ID']+'" dedication-type="'+ded_type+'" group-data="'+group_data+'" instance-identifier="'+si_data_id+'">'+
                        '</div>',
                        si_setup['TPD_ID']
                    ]).node();
                    $(row_node).attr("row-id", si_setup['TPD_ID']);
                }
            });
        });
        table_dedication.draw(false);
    }

    //RESET TESTER & HANDLER DROPDOWN
    $('.select2-tester, .select2-handler').empty().trigger('change');

    // RENDER TESTER DROPDOWN
    $.each(result['TESTER_HEADER'], function(index, item){
        let options = "";
        let filter_tester = result['TESTER'].filter(it => it['ENG_NAME'] === item);

        $.each(filter_tester, function(idx, itm){
            options += '<option class="atom-tester-option" value="'+itm['ATOM_NAME']+'" parent-data="'+itm['ENG_NAME']+'">'+itm['ATOM_NAME']+'</option>';
        });

        tester_opt += '<optgroup class="atom-tester-opt" parent-tester-opt="'+item+'" label="'+item+'">'+options+'</optgroup>';
    });

    // RENDER HANDLER DROPDOWN
    $.each(result['HANDLER_HEADER'], function(index, item){
        let options = "";
        let filter_handler = result['HANDLER'].filter(it => it['ENG_NAME'] === item);

        $.each(filter_handler, function(idx, itm){
            options += '<option class="atom-handler-option" value="'+itm['ATOM_NAME']+'" parent-data="'+itm['ENG_NAME']+'">'+itm['ATOM_NAME']+'</option>';
        });

        handler_opt += '<optgroup class="atom-handler-opt" parent-handler-opt="'+item+'" label="'+item+'">'+options+'</optgroup>';
    });

    $(".select2-tester").append(tester_opt);
    $(".select2-handler").append(handler_opt);

    $(".td-partnum").text(split[0]);
    $(".td-rte").text(split[4]);
    $(".td-site").text(split[1]);
    $(".td-step").text(split[2]);
    $(".td-res").text(table_row[33]);
    $(".td-etester").text(table_row[1]);
    $(".td-ehandler").text(table_row[2]);
    $(".td-atester").text(table_row[3]);
    $(".td-ahandler").text(table_row[4]);
    $(".td-ttime").text(table_row[5]);
    $(".td-utpi").text(table_row[6]);
    $(".td-itime").text(table_row[7]);
    $(".td-oee").text(table_row[8]);
    $(".td-qc").text(table_row[9]);
    $(".td-suph").text(table_row[10]);
    $(".td-uph").text(table_row[11]);

    $(".selected-setup").val(JSON.stringify(table_row));
}

function renderTimephasingCalendar(route, date, week, data, num, id, crud){
    //CLEAR MODAL CONTENTS FIRST
    $(".table-calendar tbody").empty();
    if (crud != "edit") {
        $('.tp-process:checked').prop("checked", false);
        $(".tp-notes").val('');
    }
    
    //COLOR CODING
    let criteria_arr = [];
    $.each(data, function(index, item){
        let key_index = Object.keys(data).indexOf(index);
        let month_name = "";
        let color_month = "";

        switch (key_index) {
            case 0:
                month_name = index;
                color_month = "bg-pink";
                break;

            case 1:
                month_name = index;
                color_month = "bg-blue";
                break;

            case 2:
                month_name = index;
                color_month = "bg-green";
                break;
        
            default:
                month_name = index;
                color_month = "bg-yellow";
                break;
        }

        criteria_arr.push(key_index+'|'+month_name+'|'+color_month);
    });

    //RENDER CALENDAR
    $.each(data, function(index, item){
        
        let header_count = Object.keys(data).indexOf(index) + 1;
        let month_color = "";
        $.each(criteria_arr, function(idx2, itm2){
            let split = itm2.split("|");
            if (index == split[1]) {
                month_color = split[2];
            }
        });

        let col_arr = ['FY_WW','S','M','T','W','TH','F','S'];
        let columns = "";
        let weeks = "";
        
        //CONSTRUCT HEADERS
        if (header_count == 1) {
            if (Object.keys(item).length > 0) {
                $.each(col_arr, function(idx, itm){
                    columns += '<th class="'+month_color+'">'+itm+'</th>';
                });
            }
        }

        $.each(item, function(idx, itm){
            let days = "";
            let existing_instance = JSON.parse($(".tp-existing-"+route.replace(/\./g, "_").replace(/\#/g, "_").replace(/\//g, "_").replace(/\-/g, "_").replace(/\^/g, "_")).val());
            $.each(itm, function(inner_idx, inner_itm){
                let color = "";
                let clickable = "";
                let date = new Date(inner_itm['MFG_DATE']);
                let current_date = new Date();

                if (date < current_date) {
                    color = "bg-grey";
                }
                else{
                    $.each(criteria_arr, function(idx2, itm2){
                        let split = itm2.split("|");
                        if (inner_itm['MONTH_NAME'] == split[1]) {
                            color = split[2];
                        }
                    });

                    $.each(existing_instance, function(iindex, iitm){
                        let existing_fyww = iitm.split("|")[0];
                        if (idx == existing_fyww) {
                            color = "bg-existing";
                        }
                    });
                }
                clickable = (color != "bg-grey" && color != 'bg-existing') ? "tp-day" : "";
                days += '<td orig-color="'+color+'" data="'+idx+'" day="'+inner_itm['DAY_NAME']+'" eff-date="'+inner_itm['MFG_DATE']+'" class="'+clickable+' '+color+' '+idx+'">'+inner_itm['MFG_DATE'].split('-')[2]+'</td>';
            });

            let week_color = month_color;
            let instance_week = "";
            $.each(existing_instance, function(iindex, iitm){
                let existing_fyww = iitm.split("|")[0];
                let existing_num = iitm.split("|")[1];
                if (idx == existing_fyww) {
                    week_color = "bg-existing";
                    instance_week = '<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">'+existing_num+'</span>';
                }
            });

            weeks += '<tr>'+
                        '<td orig-color="'+week_color+'" class="'+week_color+' '+idx+' position-relative">'+idx+' '+instance_week+'</td>'+days+
                     '</tr>';
        });

        $(".table-calendar .tbody").append(
            '<tr>'+
                '<td class="'+month_color+'"><strong class="d-flex justify-content-center align-items-center">'+index+'</strong></td>'+
                '<td class="p-0 '+month_color+'">'+
                    '<table class="table table-bordered table-hover pb-0 mb-0"><thead><tr>'+columns+'</tr></thead><tbody>'+weeks+'</tbody></table>'+
                '</td>'+
            '</tr>'
        );
    });

    //ADD DATA TO INPUT HIDDEN
    $(".tp-default-data").val(JSON.stringify({route, date, week, data, num, id, crud}));
    $(".tp-id").val(id);
    $(".tp-date").val(date);
    $(".tp-week").val(week);
    $(".in-container").text((crud == "edit") ? parseInt(num) : "New");
    $(".cw-container").text(week);
    $(".tp-num").val(parseInt(num));
    $(".tp-crud").val(crud);
    $("#timephasingModalLabel").text((crud == "edit") ? "Edit Instance" : "New Instance");
    $("#timephasingModal").modal('show');
}


// ----------------------------------------------------------------------END DYNAMIC DATA RENDERING---------------------------------------------------------------------------------


// ----------------------------------------------------------------------DATA MANIPULATION----------------------------------------------------------------------------------------------
function formatData(type = null, data, process){
    let data_result = [];
    if (process == "part-selection") {
        let partnum = (type == "general") ? data.index : data[0][0];
        let generic = package = bodysize = leadcount = details = "";
        let partnum_details = (type == "general") ? data.item : data[0][1];

        generic     = (partnum_details['GENERIC'] != null) ? partnum_details['GENERIC'] : "";
        package     = (partnum_details['PACKAGETYPE'] != null) ? partnum_details['PACKAGETYPE'] : "";
        bodysize    = (partnum_details['BODYSIZE'] != null) ? partnum_details['BODYSIZE'] : "";
        leadcount   = (partnum_details['LEADCOUNT'] != null) ? partnum_details['LEADCOUNT'] : "";
        details     = package+' '+bodysize+' '+leadcount;
        group       = generic +' ('+partnum_details['TEST_TYPE']+' - L-ADI)';

        data_result.push([partnum, generic, details, group]);
    }
    else if(process == "resource-dropdown"){

        let details_arr = [];
        let value_arr = [];

        $.each(data, function(index, item){
            let string2 = item[2].split(" ");
            let string3 = item[3].replace(/\(|\)/g, '').split(" - ");
            let split = string3[0].split(" ");
            let res_area = split[1]+" "+split[2];
            let generic = split[0];
            let package = string2[0];
            let bodysize = string2[1];
            let leadcount = string2[2];
            
            details_arr.push({
                MFG_PART_NUM: item[0],
                RES_AREA: res_area,
                GENERIC: generic,
            });

            value_arr.push(item[0]);
             
        });

        data_result.push({type: 'MFG_PART_NUM', details: details_arr, value: value_arr});

    }
    
    return data_result;
}

function formatTimephaseDedication(data, session_instance, type = null){
    if (type == null) {
        const parameterValue = new URLSearchParams(window.location.search).get('timephase-instance');
        let si_data = JSON.parse(session_instance);
        let rte_keys = Object.keys(si_data[parameterValue]['DATA']['RTE_SEQ_NUM']);
        
        $.each(data, function(index, item){
            let details = JSON.parse(item['DETAILS'][32]);
            let ded_step = item['STEP_NM'];
            let ded_route = item['SAP_RTE_ID'];
            let is_primary = (item['TYPE'] == "PRIMARY") ? 1 : 0;
            
            let ded_obj = details;
            ded_obj['TESTER'] = item['TESTER'];
            ded_obj['HANDLER'] = item['HANDLER'];
            ded_obj['TESTER_ENG'] = item['ENGR_TESTER'];
            ded_obj['HANDLER_ENG'] = item['ENGR_HANDLER'];
            ded_obj['RES_PRIO_CD'] = (is_primary != 1) ? parseInt(item['PRIO_CD']) + 1 : 1;
            ded_obj['TPD_ID_DONOR'] = details['TPD_ID'];
            ded_obj['IS_DED'] = 1;
            ded_obj['DED_IS_PRIMARY'] = (is_primary != 1) ? null : 1;
            ded_obj['DED_IS_EXCLUSIVE'] = (item['FLAG_SETUPS'].length > 0) ? 1 : null;
            ded_obj['TPD_ID'] = "";

            let target_rte_key;

            $.each(rte_keys, function(idx, itm){
                let si_step = si_data[parameterValue]['DATA']['RTE_SEQ_NUM'][itm]['STEP_NM'];
                let si_route = si_data[parameterValue]['SAP_RTE_ID'];
                let prio_keys = Object.keys(si_data[parameterValue]['DATA']['RTE_SEQ_NUM'][itm]['RES_PRIO_CD']);
                
                if (ded_step == si_step && ded_route == si_route) {
                    $.each(prio_keys, function(inner_index, inner_item){
                        let si_setup = si_data[parameterValue]['DATA']['RTE_SEQ_NUM'][itm]['RES_PRIO_CD'][inner_item];
                        if (inner_item >= ded_obj['RES_PRIO_CD']) {
                            let new_prio = parseInt(inner_item) + 101;
                            delete si_data[parameterValue]['DATA']['RTE_SEQ_NUM'][itm]['RES_PRIO_CD'][inner_item];
                            si_data[parameterValue]['DATA']['RTE_SEQ_NUM'][itm]['RES_PRIO_CD'][new_prio] = si_setup;
                        }
                    });

                    target_rte_key = itm;
                }
            });

            $.each(rte_keys, function(idx, itm){
                let si_step = si_data[parameterValue]['DATA']['RTE_SEQ_NUM'][itm]['STEP_NM'];
                let si_route = si_data[parameterValue]['SAP_RTE_ID'];
                let prio_keys = Object.keys(si_data[parameterValue]['DATA']['RTE_SEQ_NUM'][itm]['RES_PRIO_CD']);
                
                if (ded_step == si_step && ded_route == si_route) {
                    $.each(prio_keys, function(inner_index, inner_item){
                        let si_setup = si_data[parameterValue]['DATA']['RTE_SEQ_NUM'][itm]['RES_PRIO_CD'][inner_item];
                        if (inner_item >= ded_obj['RES_PRIO_CD']) {
                            let new_prio = parseInt(inner_item) - 100;
                            if ((item['FLAG_SETUPS'].length > 0)) {
                                new_prio += 99;
                            }
                            delete si_data[parameterValue]['DATA']['RTE_SEQ_NUM'][itm]['RES_PRIO_CD'][inner_item];
                            si_data[parameterValue]['DATA']['RTE_SEQ_NUM'][itm]['RES_PRIO_CD'][new_prio] = si_setup;
                        }
                    });
                }
            });

            si_data[parameterValue]['DATA']['RTE_SEQ_NUM'][target_rte_key]['RES_PRIO_CD'][ded_obj['RES_PRIO_CD']] = $.makeArray(ded_obj)[0];

            if (si_data[parameterValue]['NOTES'] == null) {
                si_data[parameterValue]['NOTES'] = '';
            }
        });
        
        return si_data;
    }
    else{
        let si_data = JSON.parse(session_instance);
        $.each(data, function(idx, itm){
            let split = itm.split("|");
            let instance_id = split[0];
            let sap_rte_id = split[1];
            let rte_seq = split[2];
            let step_nm = split[3];
            let prio_cd = split[4];
            let is_excl = split[5];
            let tpd_id = split[6];
    
            if (sap_rte_id == si_data[instance_id]['SAP_RTE_ID']) {
                if (step_nm == si_data[instance_id]['DATA']['RTE_SEQ_NUM'][rte_seq]['STEP_NM']) {
                    let prio_keys = Object.keys(si_data[instance_id]['DATA']['RTE_SEQ_NUM'][rte_seq]['RES_PRIO_CD']);
                    $.each(prio_keys, function(index, item){
                        let si_setup = si_data[instance_id]['DATA']['RTE_SEQ_NUM'][rte_seq]['RES_PRIO_CD'][item];

                        if (tpd_id == si_data[instance_id]['DATA']['RTE_SEQ_NUM'][rte_seq]['RES_PRIO_CD'][item]['TPD_ID']) {
                            delete si_data[instance_id]['DATA']['RTE_SEQ_NUM'][rte_seq]['RES_PRIO_CD'][item];
                        }

                        if (prio_cd < item && prio_cd != item) {
                            let new_prio = parseInt(item) - 1;
                            // if (is_excl != 0) { // ALREADY WORKING, FIX RES_PRIO_CD REORDERING IF A PRIMARY DEDICATION IS DELETED AND ITS NOT A DED_IS_EXCLUSIVE (FOR NOW, CONDITION IS DISABLED)
                                if (new_prio >= 99) {
                                    new_prio = new_prio - 99;
                                }
                            // }
                            delete si_data[instance_id]['DATA']['RTE_SEQ_NUM'][rte_seq]['RES_PRIO_CD'][item];
                            si_data[instance_id]['DATA']['RTE_SEQ_NUM'][rte_seq]['RES_PRIO_CD'][new_prio] = si_setup;
                        }
                    });
                }
            }

            if (si_data[instance_id]['NOTES'] == null) {
                si_data[instance_id]['NOTES'] = '';
            }
        });
        return si_data;
    }
}

function resetDataContainers(type = null){
    //GLOBAL RESET
    all_primary_setup = [];
    resource_matches = [];
    new_primary_setup = [];
    
    if (type != null && type == "set-primary") {
        all_original_primary = [];
        all_original_alternate = [];
    }
}

function attachCurrentPrimary(array, all_original_primary){
    $.each(array, function(index, item){
        let to_remove;
        let to_remove_raw;
        $.each(all_original_primary, function(idx, itm){
            let split = itm[15].split("|");
            if (item['MFG_PART_NUM'] == split[0] && item['SAP_RTE_ID'] == split[4] && item['STEP_NM'] == split[2]) {
                to_remove = itm[13];
                to_remove_raw = itm;
            }
        });
        array[index]['TO_REMOVE'] = to_remove;
        array[index]['TO_REMOVE_RAW'] = to_remove_raw;
    });
}

function resetSessions(keys){
    $.each(keys, function(index, item){
        sessionStorage.removeItem(item);
    });
}

function resetResourcePicker(part_selection){

    //CLEAR ALL SESSION
    sessionStorage.clear();
    data_set = [];
    group_header = [];
    //SEARCH RECORD
    $("#search-record").val("");

    //CATEGORIES & FILTERS
    $(".result-accordion").html("");

    //PART SELECTION
    part_selection.rows().remove().draw();
    // $(".part-selection-container").fadeOut();
}

function resetPrimarySetup(all_original_primary, all_original_alternate){
    $(".table_primary").DataTable().rows().remove().draw();
    $(".table_source").DataTable().rows().remove().draw();

    if (all_original_primary.length > 0) {
        $.each(all_original_primary, function(index, item){
            let primary_color = (item[27] == "DEFAULT" || item[27] == "INSTANCE") ? "bg-part-primary" : "bg-part-dedication-primary";
            let primary = $("#"+item[16]).DataTable().row.add(item).draw(false).node();
            $(primary).find('td').addClass(primary_color);
        });
    }
    $.each(all_original_alternate, function(index, item){
        let alternate = $("#"+item[17]).DataTable().row.add(item).draw(false).node();
        if (item[27] == "DEFAULT" || item[27] == "INSTANCE") {
            $(alternate).find('td').removeClass('bg-part-changes');
        }
        else{
            $(alternate).find('td').removeClass('bg-part-dedication-primary-changes').addClass('bg-part-dedication-primary');
        }
    });
    resetDataContainers();
    resetElements("all-steps", "apply-check-primary");
}

function resetFlagStatus(){
    $('.unplannable-flag').each(function(){
        if ($(this).attr("flag-type") == "") {
            if ($(this).is(":checked")) {
                $(this).prop("checked", false);
            }
        }
        else if($(this).attr("flag-type") == "unplannable"){
            $(this).prop("checked", true);
            plannable_setups = [];
        }
    });
}

function resetTimephaseCell(){
    $(".instance-input").each(function(){
        let default_val = $(this).attr("instance-default");
        $(this).text(default_val);
    });
}

// ----------------------------------------------------------------------END DATA MANIPULATION----------------------------------------------------------------------------------------------

//---------------------------------------------------------------------ALERTS & NOTIFICATIONS-----------------------------------------------------------------------------------------
function showConfirm(title, text, process, data, existing_data = null){

    Swal.fire({
        title: title,
        html: text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Proceed",
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            switch (process) {
                case "set":
                    setPrimarySetup(data);
                    break;
            
                case "cancel-change":
                case "expedite-change":
                    processHardwareChange(process, data);
                    break;

                case "change-primary-hardware":
                    changePrimaryHardware(data);
                    break;

                case "unplannable":
                case "plannable":
                case "all":
                    flagSetups(data['unplannable'], data['plannable']);
                    break;
                case "reset":
                    resetPrimarySetup(existing_data['op'], existing_data['oa']);
                    break;

                case "reset-flag":
                    resetFlagStatus();
                    break;
                
                case "reset-cell":
                    resetTimephaseCell();
                    break;

                case "remove-all-dedication":
                    removeDedication(data);
                    break;

                case "remove-all-dedication-tp":
                    removeDedication(data, "timephasing");
                    break;

                case "set-timephase-instance":
                    setTimephaseInstance(data);
                    break;

                case "remove-timephase":
                    removeTimephase(data);
                    break;

                default:
                    resetPrimarySetup(existing_data['op'], existing_data['oa']);
                    resetFlagStatus();
                    break;
            }
        }
        else{
            if (process == "change-primary-hardware") {
                $("."+existing_data).prop("checked", true);
            }
        }
    });
}

function showLoader(title){
    Swal.fire({
        title: title,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading()
        },
    });
}

function showLoaderButton(){
    return '<button class="btn btn-outline-success btn-sm btn-loader" type="button" disabled>'+
                '<span class="spinner-grow spinner-grow-sm" aria-hidden="true"></span>&nbsp;'+
                '<span role="status">Loading...</span>'+
            '</button>';
}

function showSuccess(title){
    Swal.fire({
        title: title,
        icon: "success"
    }).then(function(){ 
        // location.reload();
        }
    );
}

function showGenericAlert(icon, title){
    Swal.fire({
        title: title,
        icon: icon
    });
}

function showAlert(parent_elem, child_elem, alert_type, alert_icon, alert_msg){
    
    $("."+parent_elem+"").before(
        $(
            '<div class="'+child_elem+' alert alert-'+alert_type+' d-flex align-items-center text-center" role="alert">'+
                '<i class="'+alert_icon+' bi-exclamation-triangle-fill flex-shrink-0 me-2"></i>'+
                '<div>'+alert_msg+'</div>'+
            '</div>'
        ).fadeIn()
    );

}

//-------------------------------------------------------------------------MISC/OTHERS---------------------------------------------------------------------------------------------------
function resetElements(type, identifier){
    if(type == "all-steps"){
        $("."+identifier+"-container").fadeOut();
        $("."+identifier).prop("checked", false);
    }
}

function oeeColumnIndexChecker(colname){
    switch (colname) {
        case "item-part_num":
            column_index = 0;
            display_data = "no-partnum";
            break;

        case "item-site":
            column_index = 1;
            display_data = "no-site";
            break;

        case "item-res_area":
            column_index = 2;
            display_data = "no-res";
            break;

        case "item-tester":
            column_index = 3;
            display_data = "no-tester";
            break;
    
        case "item-handler":
            column_index = 4;
            display_data = "no-handler";
            break;

        case "item-temp":
            column_index = 5;
            display_data = "no-temp";
            break;
    }

    return {
        column_index: column_index,
        display_data: display_data
    }
}

function oeeModalDisplay(){
    let resource_check = $(".resource-check:checked");
    let check_len = resource_check.length;
    
    if (check_len == 1) {
        let check_val = resource_check.val().split("|")[1];
        if (check_val == "GENERIC") {
            return;
        }
    }
    
    if ($(".btn-oee-modal").hasClass("not-allowed")) {
        $(".btn-oee-modal").prop("disabled", true);
       return; 
    }

    $(".btn-oee-modal").prop("disabled", (check_len > 0) ? false : true);
}

function primaryHardwareChecker(source_primary_hw, source_tstr_hndlr){
    let invalid = 0;
    let primary_table = $(".table_primary").DataTable().rows().data();
    $.each(primary_table, function(index, item){
        let tstr_hndlr = item[3]+'|'+item[4];
        if ($.inArray(source_primary_hw, item[22].split(',')) === -1 || source_tstr_hndlr != tstr_hndlr) {
            invalid++;
        }
    });

    $(".apply-all-primary-hw").removeClass("is_checked").prop({"checked": false, "disabled": (invalid > 0) ? true : false});
    $(".apply-all-primary-hw-label").addClass((invalid > 0) ? "text-danger" : "");
    $(".apply-all-primary-hw-label").removeClass((invalid == 0) ? "text-danger" : "");

    return invalid;
}

function popupContentGenerator(type, data, multiple = false){
    let content = "";
    if (type == "unplannable" || type == "plannable") {
        let parent_route = $.unique(data.map(r => r.RTE_ID));
        let tables = "";
        $.each(parent_route, function(index, item){
            let setup_text = "";
            $.each(data, function(idx, itm){
                if (itm['RTE_ID'] == item) {
                    setup_text += '<tr style="font-size: 15px!important;"><td>'+itm['STEP']+'</td><td>'+itm['ATOM_TESTER']+'</td><td>'+itm['ATOM_HANDLER']+'</td></tr>';
                }
            });
    
            tables += '<table class="table table-bordered caption-top">'+
                        '<caption><small>'+item+'</small></caption>'+
                        '<thead><tr><th>STEP</th><th>TESTER</th><th>HANDLER</th></tr></thead>'+
                        '<tbody>'+setup_text+'</tbody>'+
                      '</table>';
        });

        content += '<div class="card mb-3">'+
                        '<div class="card-header">Set as '+type.toUpperCase()+'</div>'+
                        '<div class="card-body">'+tables+'</div>'+
                    '</div>';
    }
    return content;
}

function loadedInstanceChecker(){
    let session = sessionStorage.getItem('instance-loaded');
    let urlParams = new URLSearchParams(window.location.search);
    let parameterExists = urlParams.has('timephase-instance');
    let parameterValue = urlParams.get('timephase-instance');
    $(".tp-alert-container").empty();
    
    if (parameterExists) {
        let alert_content = '';
        if (session != null && session != '') {
            
            let get_instance = JSON.parse(session);
            if (get_instance[parameterValue] != undefined) {
                let instance_id = get_instance[parameterValue]['TPI_ID'];
                let instance_num = get_instance[parameterValue]['INSTANCE'];
                if (instance_id == parameterValue) {
                    //2025-10-15 RM added TPI_ID for reference. we can remove if users dont care, but for testing purposes it makes it easier
                    alert_content = '<div class="alert alert-success d-flex justify-content-between instance-loaded-alert" role="alert">'+
                                        '<span>Time-Phasing: <strong>Instance #'+instance_num+'</strong> (TPI_ID:' + instance_id + ') is now loaded; any changes made will be applied to this instance.</span>'+
                                        '<a href="#" class="alert-link unload-instance">Unload Instance</a>'+
                                    '</div>';
                }
            }
            else{
                alert_content = '<div class="alert alert-danger d-flex justify-content-between" role="alert"><span><strong>Instance Not Found!</strong> Please Load a Valid Instance.</span> <a href="#" class="alert-link unload-instance">Reload</a></div>';
            }
        }
        else{
            let instance_session_data = $(".instance-session-data").val();
            if (instance_session_data != null && instance_session_data != '') {
                sessionStorage.setItem('instance-loaded', instance_session_data);
                
                let get_instance = JSON.parse(sessionStorage.getItem('instance-loaded'));
                let instance_id = get_instance[parameterValue]['TPI_ID'];
                let instance_num = get_instance[parameterValue]['INSTANCE'];

                if (instance_id == parameterValue) {
                    //2025-10-15 RM added TPI_ID for reference. we can remove if users dont care, but for testing purposes it makes it easier
                    alert_content = '<div class="alert alert-success d-flex justify-content-between instance-loaded-alert" role="alert">'+
                                        '<span>Time-Phasing: <strong>Instance #'+instance_num+'</strong> (TPI_IDkey: "value", ' + instance_id + ') is now loaded; any changes made will be applied to this instance.</span>'+
                                        '<a href="#" class="alert-link unload-instance">Unload Instance</a>'+
                                    '</div>';
                }
            }
            else{
                alert_content = '<div class="alert alert-danger d-flex justify-content-between" role="alert"><span><strong>Instance Not Found!</strong> Please Load a Valid Instance.</span> <a href="#" class="alert-link unload-instance">Reload</a></div>';
            }
        }
        $(".tp-alert-container").append(alert_content);
    }
    else{
        sessionStorage.removeItem('instance-loaded');
    }
}
//themes - will reuse later
// let current_theme = sessionStorage.getItem('theme');
// let theme_status = (current_theme == "light") ? false : true;

// $(".html-container").attr("data-bs-theme", sessionStorage.getItem('theme'));
// $(".toggle-theme").prop("checked", theme_status);

// $(".toggle-theme").on("click", function(){
    
//     if ($(this).is(":checked")) {
//         sessionStorage.setItem('theme', 'dark');
//     }
//     else{
//         sessionStorage.setItem('theme', 'light');
//     }

//     $(".html-container").attr("data-bs-theme", sessionStorage.getItem('theme'));
// });