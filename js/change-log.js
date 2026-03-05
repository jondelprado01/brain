
$(document).ready(function(){
    $('input[name="daterange"]').daterangepicker({
        opens: 'left'
    }, function(start, end, label) {
        $("#start-date").val(start.format('YYYY-MM-DD'));
        $("#end-date").val(end.format('YYYY-MM-DD'));
    });

    $("#btn-search").on("click", function(){
        $(".alert").fadeOut();
        let emp_id = user_details['emp_id'];
        let module = $("#select-module").val();
        let search = $("#search-value").val().toUpperCase();
        let start_date = $("#start-date").val();
        let end_date = $("#end-date").val();
        
        if (module != "" && search != "" && start_date != "" && end_date != "") {
            getChangeLog(emp_id, module, search, start_date, end_date);
        }
        else{
            $(".alert-danger").fadeIn();
        }
    });
    
    $(".btn-close").on("click", function(){
        $(".alert-danger").fadeOut();
    });
});


function getChangeLog(emp_id, module, data, start_date, end_date){
    $.ajax({
        type: 'post',
        url: 'http://mxhtafot01l.maxim-ic.com/TEST/BRAIN_CHANGE_LOG.PHP?PROCESS_TYPE=GET_CHANGE_LOG',
        data: {emp_id: emp_id, module: module, data: data, start_date: start_date, end_date: end_date},
        success: function(data){
            
            if (typeof JSON.parse(data)[module] != "undefined") {
                renderHistoryList(module, JSON.parse(data));
            }
            else{
                $(".alert-warning").fadeIn();
            }
        },
        error: function(xhr, status, error) {
            console.log(xhr);
        }
    });
}

function renderHistoryList(module, data){
    let range_keys = Object.keys(data[module][0]);
    let change_logs = "";

    $.each(range_keys, function(index, item){
        let inner_logs = "";
        
        $.each(Object.keys(data[module][0][item]), function(idx, itm){
            let changes = "";
            console.log(data[module][0][item][itm]);
            
            $.each(data[module][0][item][itm], function(idx_i, itm_i){
                let info_rows = itm_i['INFO_ROWS'].split(";");
                let tr = "";

                $.each(info_rows, function(idx_inf, itm_inf){
                    let split_inf = itm_inf.split("|");
                    let field = split_inf[2];
                    let old_data = (split_inf[3] == "") ? "--" : split_inf[3];
                    let new_data = split_inf[4];
                    let has_change = (old_data != "--" && old_data != new_data) ? "text-bg-success" : "";

                    tr += '<tr><td>'+field+'</td><td>'+old_data+'</td><td class="'+has_change+'">'+new_data+'</td></tr>';
                });

                let thead = '<thead><tr><th>FIELD</th><th>OLD</th><th>NEW</th></tr></thead>';
                let tbody = '<tbody>'+tr+'</tbody>';

                changes += '<li><table class="table table-bordered"><caption>'+itm_i['MODULE']+' - '+itm_i['DATE']+'</caption>'+thead+''+tbody+'</table></li>';
            });
            
            inner_logs += '<li>'+itm+' <ul>'+changes+'</ul></li>';
        });

        change_logs += '<li><b>&nbsp;</b><p class="float-end fw-bold">'+item+'</p><ul>'+inner_logs+'</ul></li>';
    });

    $(".change-log-container").append(change_logs);

    // console.log(module, data);
    
    // console.log(range_keys);
    // console.log(data_keys);
    
    $(".selected-module").text(module);
}


{/* <li>
                                        <b>&nbsp;</b>
                                        <p class="float-end fw-bold">03/03/2026 06:00:00 - 03/04/2026 05:59:00</p>
                                        <ul>
                                            <li>
                                                AD11/1043-0QCU-T0
                                                <ul>
                                                    <li>
                                                        ADD
                                                        <table class="table table-bordered">
                                                            <caption>hw-override add mapping - 2026-03-03 17:39:12</caption>
                                                            <thead>
                                                                <tr>
                                                                    <th>FIELD</th>
                                                                    <th>OLD</th>
                                                                    <th>NEW</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>EFF_START</td>
                                                                    <td>--</td>
                                                                    <td>test2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>EFF_END</td>
                                                                    <td>--</td>
                                                                    <td>test2</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>OVERRIDE_CAP</td>
                                                                    <td>--</td>
                                                                    <td>test2</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </li>
                                                    
                                                </ul>
                                            </li>
                                        </ul>
                                    </li> */}