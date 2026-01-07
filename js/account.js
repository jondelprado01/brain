$(document).ready(function(){

    var table_users = $(".table-users").DataTable({
        pageLength: 25,
        columnDefs: [{
            width: '150px',
            targets: 0,
            className: 'dt-head-left'
        }]
    });

    $.ajax({
        type: 'get',
        url: 'http://MXHDAFOT01L.maxim-ic.com/API/USER_ACCOUNT.PHP?PROCESS_TYPE=GET_USERS',
        success: function(data){
            $.each(JSON.parse(data), function(index, item){
                let roles = '';
                let user_groups = [];
                let session_var = [];
                $.each(item['ROLES'], function(idx, itm){
                    if (itm['role'] != 'admin') {
                        let color = (itm['role'] == 'inheritable') ? 'text-success' : 'text-info';
                        roles += '<strong class="'+color+'">'+itm['user_group']+'</strong><br>';
                        user_groups.push(itm['user_group']);
                    }
                    else{
                        roles = '<strong>Admin</strong>';
                    }
                });
                
                session_var.push({
                    EMP_NO: item['emp_id'],
                    EMP_NAME: item['emp_name'],
                    EMP_EMAIL: item['emp_email'],
                    EMP_USER_GROUP: user_groups
                });

                let row_node = table_users.row.add([
                    item['emp_id'],
                    item['emp_name'],
                    item['emp_email'],
                    roles,
                    '<div class="form-check d-flex justify-content-start">'+
                        '<button data-id="'+item['emp_id']+'" type="button" class="btn btn-warning btn-sm">View</button>&nbsp;'+
                        '<button data-id="'+item['emp_id']+'" type="button" class="btn btn-primary btn-sm">Edit</button>'+
                        // '<button data-id="'+JSON.stringify(session_var)+'" type="button" class="btn btn-info btn-sm btn-impersonate">Impersonate</button>'+
                    '</div>',
                ]).node();
                $(row_node).attr("row-id", item['emp_id']);
            });
            table_users.draw(false);
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });

});