$(document).ready(function(){

    var direction_arr = [
        [1, "asc"],
        [4, "asc"]
    ];

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
        autoWidth: false, //fix tester column null still sorted
        order: [
            [1, 'asc'],
            [4, 'asc'],
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
                width: "60px",
                createdCell: function (td, cellData, rowData, row, col) {
                    if (col == 0) {
                        $(td).attr("history-log", rowData[8]);
                    }
                }
            },
            {
                targets: [3, 4, 5, 6],
                render: function (data, type, row, meta) {
                    let result = direction_arr.find(row => row.includes(meta.col));
                    let cast_val = "";
                    if (result) {
                        if (type === 'sort') {
                            if (meta.col == result[0]) {
                                console.log(meta.col);
                                if (data === '' || data === null || data === 'null') {
                                    return result[1] === 'asc'
                                        ? '\uffff'
                                        : '';
                                }
                            }
                        }
                    }
                    return data;
                }
            },
            {
                targets: '_all',
                orderable: false
            }
        ],
    });

    // $('button.nav-link[data-bs-toggle="tab"]').on('show.bs.tab', function (e) {
    //     let tab = $(this).attr("tab-name");
    //     const url = new URL(window.location.href);
    //     url.searchParams.set("tab", tab);
    //     window.history.pushState('state', 'title', url.href);
    // });

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
        direction_arr = [
            [parseInt(first_col), first_dir],
            [parseInt(second_col), second_dir]
        ];
        oee_report_table.rows().invalidate().draw();
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

    //search fields - filters
    $('#table-oee-report thead tr:eq(1) th').each(function (i) {
        $('input', this).on('keyup change', function () {
            if (oee_report_table.column(i).search() !== this.value) {
                console.log(i);
                
                oee_report_table
                    .column(i)
                    .search(this.value)
                    .draw();
            }
        });
    });

    //clear button - input type search
    $('#table-oee-report thead').on('search', 'input[type="search"]', function () {
        let columnIndex = $(this).closest('th').index();

        oee_report_table
            .column(columnIndex)
            .search(this.value)
            .draw();
    });

    oee_report_table.column(8).search($(".change-user-filter").val()).draw();

});

function renderOEERows(table){
    let row_arr = [];
    $.each(oee_data['DATA'], function(index, item){
        let history_logs = item['LOGS'];
        let created_by = history_logs[history_logs.length - 1].split(">")[2];
        if (item["SITE_NUM"] != "" && item["RES_AREA"]) {
            row_arr.push([
                JSON.stringify(history_logs),
                item["SITE_NUM"],
                item["RES_AREA"],
                item["TESTER"],
                item["HANDLER"],
                item["TEMP_CLASS"],
                item["MFG_PART_NUM"],
                parseFloat(item["OEE_VAL"]).toFixed(2),
                created_by
            ]);
        }
    });
    
    table.rows.add(row_arr).draw();
}

function format(data) {

    let history_data = JSON.parse(data[0]);
    let tree_log_item = ""; 

    $.each(history_data, function(index, item){
        let split = item.split(">");
        let convert_date = new Date(split[1].replace(' ', 'T'));
        let badge_color = (split[3] == "NEW_OVERRIDE") ? "success" : "info";

        let oee = parseFloat(split[0]).toFixed(2);
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
    

    // var first_log = parseFloat(history_data[0].split(">")[0]).toFixed(2);
    // var has_diff = false;

    // $.each(history_data, function(index, item) {
    //     var value = parseFloat(item.split(">")[0]).toFixed(2);

    //     if (value !== first_log) {
    //         has_diff = true;
    //         return false;
    //     }
    // });

    // $.each(history_data, function(index, item){
    //     let split = item.split(">");
    //     let convert_date = new Date(split[1].replace(' ', 'T'));
    //     let badge_color = (split[3] == "NEW_OVERRIDE") ? "success" : "info";

    //     let oee = parseFloat(split[0]).toFixed(2);
    //     let date = convert_date.toLocaleString();
    //     let user = split[2];
    //     let change = split[3];

    //     tree_log_item += '<div class="tree-item">'+
    //                         '<div style="width: 40%;" class="card">'+
    //                             '<div class="card-body d-flex justify-content-between">'+
    //                                 '<span><small>OEE</small><br><h4>'+oee+'</h4></span>'+
    //                                 '<span><small>User:</small><br><b>'+user+'</b></span>'+
    //                             '</div>'+
    //                             '<div class="card-footer d-flex justify-content-between">'+
    //                                 '<small class="text-body-secondary">Date: '+date+'</small>'+
    //                                 '<span class="badge text-bg-'+badge_color+'">'+change+'</span>'+
    //                             '</div>'+
    //                         '</div>'+
    //                     '</div>';

    //     if (has_diff === false) {
    //         return false;
    //     }
    // });

    return (
        '<div class="tree-timeline pt-4">'+tree_log_item+'</div>'
    );
}