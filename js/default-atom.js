$(document).ready(function(){
    var table_default_atom = $(".table-default-atom").DataTable({
        scrollY: 'calc(100vh - 400px)',
        lengthMenu: [[100, -1], [100, "All"]],
        pageLength: 100,
        columnDefs: [{
            targets: '_all',
            createdCell: function (td, cellData, rowData, row, col) {
                const col_arr = [6,7,8];
                if (col_arr.includes(col)) {
                    $(td).css('display', 'none');
                }
            }
        }],
        createdRow: function(row, data, dataIndex) {
           $(row).attr('row-id', data[8]);
        }
    });

    //GET DEFAULT ATOM DATA
    getDefaultAtom(table_default_atom);

    //OPEN DEFAULT ATOM MODAL
    $(document).delegate(".btn-default-atom-modal", "click", function(){
        let row_data = table_default_atom.row('[row-id="'+$(this).attr("row-id")+'"]').data();
        
        $(".input-res-area").val("");
        $(".input-atom").val(row_data[8]);
        $(".input-atom-name").val(row_data[4]);
        $(".atom-option").remove();
        $(".li-type").text(row_data[0]);
        $(".li-site").text(row_data[1]);
        $(".li-res").text(row_data[2]);
        $(".li-eth").text(row_data[3]);
        $(".li-ath").text(row_data[4]);
        $(".li-date").text(row_data[6]);
        $(".li-by").text(row_data[7]);
        
        //API CALL FOR RETRIEVING ATOMS (POPULATE DROPDOWN ATOM)
        getAtom(row_data[0], row_data[1], row_data[4]);
        
        $(".atom-search").val("");
        $("#defaultAtomModal").modal('show');
    });

    //SAVE DEFAULT ATOM
    $(".btn-save-atom").on("click", function(){
        let atom_data = $(".input-atom").val();
        let atom_name = $(".dropdown-atom-name").val();
        let res_area = ($(".input-res-area").val() != '') ? $(".input-res-area").val() : '--';
        let default_atom_name = $(".input-atom-name").val();
        let default_res_area = $(".li-res").text();

        if (atom_name != '' && atom_name != null && res_area != '--') {
            if (default_atom_name != atom_name || res_area != default_res_area) {
                let change_log_payload = {
                    data: {
                        atom_id: atom_data,
                        atom_name: (atom_name != '--') ? atom_name : null,
                        res_area: (res_area != '--') ? res_area : null,
                        type: ($(".li-type").text() != '--') ? $(".li-type").text() : null, 
                        site: ($(".li-site").text() != '--') ? $(".li-site").text() : null, 
                        eng_name: ($(".li-eth").text() != '--') ? $(".li-eth").text() : null
                    },
                    old_data: {
                        old_atom_name: (default_atom_name != '--') ? default_atom_name : null,
                        old_res_area: (default_res_area != '--') ? default_res_area : null
                    }
                }
                assignAtom(atom_data, atom_name, res_area, user_details, table_default_atom, change_log_payload);
            }
            else{
                showGenericAlert("info", "No Changes Detected!");
            }
        }
        else{
            showGenericAlert("error", "Please Select an Atom / RES_AREA!");
        }
    });


    //SEARCH ATOM NAME FROM ATOM-NAME DROPDOWN
    $(".atom-search").on("keyup", function(){
        let string = $(this).val().toUpperCase();
        if (string.length > 0) {
            $(".atom-option").each(function(){
                if ($(this).val().indexOf(string) === -1) {
                    $(this).addClass("d-none");
                }
                else{
                    $(this).removeClass("d-none");
                }
            });
        }
        else{
            $(".atom-option").removeClass("d-none");
        }
    });
});

//-----------------------------------------------------------------------API---------------------------------------------------------------------

//GET DEFAULT ATOM LIST FROM BRAIN.DEFAULT_ATOM TABLE
function getDefaultAtom(table_default_atom) {    
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/DEFAULT_ATOM.PHP?PROCESS_TYPE=GET_LIST',
        success: function(data){
            $.each(JSON.parse(data), function(index, item){
                if(item['ZERO_CAP'] == 1) {
                    strButton = '<button type="button" class="btn btn-primary btn-sm btn-default-atom-modal" row-id='+item['DA_ID']+'>Zero Cap! <i class="fa-solid fa-pen-to-square" style="color:red"></i></button>';
                }else{
                    strButton = '<button type="button" class="btn btn-primary btn-sm btn-default-atom-modal" row-id='+item['DA_ID']+'>Edit <i class="fa-solid fa-pen-to-square"></i></button>';
                }
                let row_node = table_default_atom.row.add([
                    (item['RESOURCE_TYPE'] != '' && item['RESOURCE_TYPE'] != null) ? item['RESOURCE_TYPE'] : "--",
                    (item['SITE_NUM']      != '' && item['SITE_NUM'] != null)      ? item['SITE_NUM']      : "--",
                    (item['RES_AREA']      != '' && item['RES_AREA'] != null)      ? item['RES_AREA']      : "--",
                    (item['ENG_NAME']      != '' && item['ENG_NAME'] != null)      ? item['ENG_NAME']      : "--",
                    (item['ATOM_NAME']     != '' && item['ATOM_NAME'] != null)     ? item['ATOM_NAME']     : "--",
                    //'<button type="button" class="btn btn-primary btn-sm btn-default-atom-modal" row-id='+item['DA_ID']+'>Edit <i class="fa-solid fa-pen-to-square"></i></button>',
                    strButton,
                    (item['ATOM_NAME']     != '' && item['CHANGED_DT'] != null)    ? item['CHANGED_DT']    : "--",
                    (item['ATOM_NAME']     != '' && item['CHANGED_BY'] != null)    ? item['CHANGED_BY']    : "--",
                    item['DA_ID']
                ]);
            });
            table_default_atom.draw(false);
        },
        complete: function(){
            $('.modal').modal('hide');
            swal.close();
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function getAtom(type, site, atom){
    $.ajax({
        type: 'get',
        url: 'http://afotcosj004.maxim-ic.com/API/MAPPER_EQUIP_TEST_ONLY_RM.PHP?INPUT_TYPE=JSON&OUTPUT_TYPE=RES_NM&INPUT=[{"SITE_NUM":["'+site+'"],"RESOURCE_TYPE":["'+type+'"]}]',
        beforeSend: function(){
            $(".dropdown-atom-name").empty();
            $(".atom-loader").fadeIn();
        },
        success: function(data){
            setTimeout(function(){
                $(".atom-loader").fadeOut();
                if (Object.keys(JSON.parse(data)['DATA'][0]).length > 0) {
                    let options = "";
                    let raw_atoms = JSON.parse(data)['DATA'][0];
                    let atom_names = Object.keys(raw_atoms);
                    if (atom != null && atom != '--') {
                        let index = atom_names.indexOf(atom);
                        if (index > -1) {
                            atom_names.splice(index, 1);
                            atom_names.unshift(atom);
                        }
                    }
                    $.each(atom_names, function(idx, itm){
                        let selected = "";
                        if (atom != null && atom != '--') {
                            selected = (atom == itm) ? "selected" : "";
                        }
    
                        if (raw_atoms[itm]['CONFIG_PCNT'] > 0) {
                            options += '<option class="fw-bold atom-option" value="'+itm+'" '+selected+'>'+itm+'</option>';
                        }
                        
                    });
                    $(".dropdown-atom-name").append(options);
                }
                else{
                    $(".dropdown-atom-name").append('<option class="fw-bold atom-option-no-data" disabled>No Data Found!</option>');
                }
            }, 1500);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function assignAtom(id, atom, res_area, user_details, table_default_atom, change_log_payload){
    $.ajax({
        type: 'post',
        url: 'http://mxhdafot01l.maxim-ic.com/API/DEFAULT_ATOM.PHP?PROCESS_TYPE=ASSIGN_ATOM',
        data: {id: id, atom: atom, res_area: res_area, user_details: user_details},
        beforeSend: function(){
            showLoader('Processing... \n Please Wait!');
        },
        success: function(data){
            setTimeout(function(){
                if (data) {
                    showSuccess("Record Saved Succesfully!");
                    table_default_atom.clear();
                    getDefaultAtom(table_default_atom);
                    addChangeLog(change_log_payload, user_details, "assign default atom");
                }
            }, 1500);
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
//---------------------------------------------------------------------END API---------------------------------------------------------------------



//----------------------------------------------------------------------ALERTS----------------------------------------------------------------------
function showGenericAlert(icon, title){
    Swal.fire({
        title: title,
        icon: icon
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

function showSuccess(title){
    Swal.fire({
        title: title,
        icon: "success"
    });
}