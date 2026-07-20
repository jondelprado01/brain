$(document).ready(function(){

    function exportButton(type) {
        let cols = [];
        let title_object = {};
        for (var i = 1; i <= 8; i++) {
            cols.push(i);
        }

        let config_object = {
            extend: type,
            exportOptions: {
                columns: cols
            },
            title: 'BRAIN - OEE REPORT'
        }

        return config_object;
    }

    var oee_report_table = $("#table-oee-report").DataTable({
        // ordering: false,
        order: [
            [1, 'asc'],
            [2, 'asc'],
        ],
        responsive: true,
        pageLength: 25,
        lengthMenu: [
            [10, 25, 50, -1],
            [10, 25, 50, 'All']
        ],
        layout: {
            topStart: {
                buttons: [exportButton('copy'), exportButton('csv'), exportButton('excel')]
            },
            topEnd: "pageLength"
        },
        columnDefs: [
            {
                targets: 7,
                className: 'text-center fw-bold'
            },
            {
                targets: 0,
                className: 'dt-control',
                orderable: false,
                data: null,
                defaultContent: '',
                createdCell: function (td, cellData, rowData, row, col) {
                    if (col == 0) {
                        $(td).attr("history-log", rowData[8]);
                    }
                }
            },
            {
                targets: '_all',   // Column to keep sorted
                orderable: false
            }
        ],
    });

    $('button.nav-link[data-bs-toggle="tab"]').on('show.bs.tab', function (e) {
        let tab = $(this).attr("tab-name");
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.pushState('state', 'title', url.href);
    });


    $('#table-oee-report thead tr:eq(1) th').each(function (i) {
        $('input', this).on('keyup change', function () {
            if (oee_report_table.column(i).search() !== this.value) {
                oee_report_table
                    .column(i)
                    .search(this.value)
                    .draw();
            }
        });
    });

    renderOEERows(oee_report_table);

    oee_report_table.on('click', 'tbody td.dt-control', function (e) {
        let tr = e.target.closest('tr');
        let row = oee_report_table.row(tr);
    
        if (row.child.isShown()) {
            row.child.hide();
            $(tr).removeClass('table-info');
        }
        else {
            row.child(format(row.data())).show();
            $(tr).addClass('table-info');
        }
    });

    $(".dropdown-sort").on("change", function(){
        let first_col = $("#oee-first-column").val();
        let first_dir = $("#oee-first-direction").val();
        let second_col = $("#oee-second-column").val();
        let second_dir = $("#oee-second-direction").val();

        oee_report_table.order([
            [parseInt(first_col), first_dir],
            [parseInt(second_col), second_dir]
        ]).draw();
    });

    $("#oee-reset-sort").on("click", function(){
        let elem_arr = ["oee-first-column|1", "oee-first-direction|asc", "oee-second-column|2", "oee-second-direction|asc"];
        $.each(elem_arr, function(index, item){
            let split = item.split("|");
            $("#"+split[0]).val(split[1]).trigger("change");
        });
    });

});

function renderOEERows(table){
    let row_arr = [];
    $.each(oee_data['DATA'], function(index, item){
        let history_level = item['DETAILS'].split("|");
        let created_by = history_level[0].split(">")[2];
        if (item["SITE_NUM"] != "" && item["RES_AREA"]) {
            row_arr.push([
                JSON.stringify(history_level),
                item["SITE_NUM"],
                item["RES_AREA"],
                item["TESTER"],
                item["HANDLER"],
                item["TEMP_CLASS"],
                item["MFG_PART_NUM"],
                item["OEE_VAL"],
                created_by
            ]);
        }
    });
    
    table.rows.add(row_arr).draw();
}

function format(data) {

    let history_data = JSON.parse(data[0]);
    let tree_log_item = "";
    console.log(history_data);
    
    $.each(history_data, function(index, item){
        let split = item.split(">");
        let convert_date = new Date(split[1].replace(' ', 'T'));
        let badge_color = (split[3] == "NEW_OVERRIDE") ? "success" : "info";

        let oee = split[0];
        let date = convert_date.toLocaleString();
        let user = split[2];
        let change = split[3];

        tree_log_item += '<div class="tree-item">'+
                            '<div style="width: 40%;" class="card">'+
                                '<div class="card-body d-flex justify-content-between">'+
                                    '<span><small>OEE</small><br><h4>'+oee+'</h4></span>'+
                                    '<span><small>User:</small><br><b>'+user+'</b></span>'+
                                '</div>'+
                                '<div class="card-footer d-flex justify-content-between">'+
                                    '<small class="text-body-secondary">Date: '+date+'</small>'+
                                    '<span class="badge text-bg-'+badge_color+'">'+change+'</span>'+
                                '</div>'+
                            '</div>'+
                        '</div>';
    });

    return (
        '<div class="tree-timeline pt-4">'+tree_log_item+'</div>'
    );
}