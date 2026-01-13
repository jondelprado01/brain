 //2026-01-12 RM
labelVG = [];
dataVG = [];

$(document).on('keyup', function(e) {
    if (e.key == "Escape") $("#variableIndexModal").modal("hide");
});

$(document).ready(function(){
    $(".index-link").on("click", function(){
        let url = new URL($(location).attr('href'));
        let tab = $(this).attr("tab-name");
        url.searchParams.set("tab", tab);
        window.history.pushState('state', 'title', url.href);
    });

    //const minIV = document.querySelector('#minIV');
    //const maxIV = document.querySelector('#maxIV');
    //const minUTPI = document.querySelector('#minUTPI');
    //const maxUTPI = document.querySelector('#maxUTPI');

    // const table = new DataTable('#mainTable, #variableTable',
    //     {
    //         scrollY: 'calc(100vh - 570px)',
    //         columns: [
    //             { data: 'HANDLER' },
    //             { data: 'PKG_TYPE' },
    //             { data: 'BODY_SIZE' },
    //             { data: 'LEAD_COUNT_MIN' },
    //             { data: 'LEAD_COUNT_MAX' },
    //             { data: 'TEMP_CLASS' },
    //             { data: 'UTPI' },
    //             { data: 'FIXED_ITPU' },
    //             { data: 'TTPU_THRESHOLD' },
    //             { data: 'THRESHOLD_FORMULA' }
    //         ],
    //         colReorder: {
    //             columns: ':not(:first-child)'
    //         },
    //         columnControl: [
    //             {
    //                 target: 0,
    //                 content: ['order']
    //             },
    //             {
    //                 target: 1,
    //                 content: ['search']
    //             }
    //         ],
    //         ordering: {
    //             indicators: false,
    //             handler: false
    //         },
    //         fixedHeader: true,
    //         autoFill: true,
    //         keys: true,
    //         lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, 'All'] ],
    //         layout: {
    //             topStart: {
    //                 buttons: ['copy', 'csv', 'excel']
    //             },
    //             topEnd: 'pageLength'
    //         }
    //     }
    // );

    function initTable(table_id){
        return new DataTable(table_id, {
            scrollY: 'calc(100vh - 570px)',
            columns: getColumnConfig(table_id),
            colReorder: {
                columns: ':not(:first-child)'
            },
            columnControl: [
                {
                    target: 0,
                    content: ['order']
                },
                {
                    target: 1,
                    content: ['search']
                }
            ],
            ordering: {
                indicators: false,
                handler: false
            },
            fixedHeader: true,
            autoFill: true,
            keys: true,
            lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, 'All'] ],
            layout: {
                topStart: {
                    buttons: ['copy', 'csv', 'excel']
                },
                topEnd: 'pageLength'
            }
        });
        // return $(table_id).DataTable({
        //     scrollY: 'calc(100vh - 570px)',
        //     columns: getColumnConfig(selector),
        //     colReorder: {
        //         columns: ':not(:first-child)'
        //     },
        //     columnControl: [
        //         {
        //             target: 0,
        //             content: ['order']
        //         },
        //         {
        //             target: 1,
        //             content: ['search']
        //         }
        //     ],
        //     ordering: {
        //         indicators: false,
        //         handler: false
        //     },
        //     fixedHeader: true,
        //     autoFill: true,
        //     keys: true,
        //     lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, 'All'] ],
        //     layout: {
        //         topStart: {
        //             buttons: ['copy', 'csv', 'excel']
        //         },
        //         topEnd: 'pageLength'
        //     }
        // });
    }

    function getColumnConfig(selector){
        var columns = [
            { data: 'HANDLER' },
                { data: 'PKG_TYPE' },
                { data: 'BODY_SIZE' },
                { data: 'LEAD_COUNT_MIN' },
                { data: 'LEAD_COUNT_MAX' },
                { data: 'TEMP_CLASS' },
                { data: 'UTPI' },
                { data: 'FIXED_ITPU' }
        ];
        if (selector == "#variableTable") {
            columns.push(
                { data: 'TTPU_THRESHOLD' },
                { data: 'THRESHOLD_FORMULA' },
                { data: 'ACTION' },
            );
        }

        return columns;
    }

    const fixed_table = initTable("#mainTable");
    const variable_table = initTable("#variableTable");

    fixed_table.search.fixed('range', function (searchStr, data, index) {return true;});
    variable_table.search.fixed('range', function (searchStr, data, index) {return true;});

    // table.search.fixed('range', function (searchStr, data, index) {
        //var srcMinUTPI = parseInt(minUTPI.value, 10);
        //var srcMaxUTPI = parseInt(maxUTPI.value, 10);
        //var srcUTPI = parseInt(data['UTPI']) || 0; // use data for the LC column

        //var srcMinIV = parseFloat(minIV.value, 10);
        //var srcMaxIV = parseFloat(maxIV.value, 10);
        //var srcIV = parseFloat(data['INDEX_VALUE'], 10); // use data for the LC column
        //var LC = parseFloat(data[0]) || 0; // use data for the LC column

        /*
        if (
            (
                (isNaN(srcMinIV) && isNaN(srcMaxIV)) ||
                (isNaN(srcMinIV) && srcIV <= srcMaxIV) ||
                (srcMinIV <= srcIV && isNaN(srcMaxIV)) ||
                (srcMinIV <= srcIV && srcIV <= srcMaxIV)
            )
            &&
            (
                (isNaN(srcMinUTPI) && isNaN(srcMaxUTPI)) ||
                (isNaN(srcMinUTPI) && srcUTPI <= srcMaxUTPI) ||
                (srcMinUTPI <= srcUTPI && isNaN(srcMaxUTPI)) ||
                (srcMinUTPI <= srcUTPI && srcUTPI <= srcMaxUTPI)
            )
        ) {
            return true;
        }
        */

        // return true;
    // });
    
    /*
    minUTPI.addEventListener('input', function () {
        table.draw();
    });
    maxUTPI.addEventListener('input', function () {
        table.draw();
    });
    minIV.addEventListener('input', function () {
        table.draw();
    });
    maxIV.addEventListener('input', function () {
        table.draw();
    });
    */
    
    //VARIABLE INDEX CALCULATION - JON 01/09/2026
    $(document).delegate(".btn-calculation", "click", function(){

        let data = JSON.parse($(this).attr("btn-data"));
        
        $(".vit-handler").text(data['HANDLER']);
        $(".vit-ptype").text((data['PKG_TYPE'] != null && data['PKG_TYPE'] != "") ? data['PKG_TYPE'] : "--");
        $(".vit-bsize").text((data['BODY_SIZE'] != null && data['BODY_SIZE'] != "") ? data['BODY_SIZE'] : "--");
        $(".vit-lmin").text((data['LEAD_COUNT_MIN'] != null && data['LEAD_COUNT_MIN'] != "") ? data['LEAD_COUNT_MIN'] : "--");
        $(".vit-lmax").text((data['LEAD_COUNT_MAX'] != null && data['LEAD_COUNT_MAX'] != "") ? data['LEAD_COUNT_MAX'] : "--");
        $(".vit-temp").text((data['TEMP_CLASS'] != null && data['TEMP_CLASS'] != "") ? data['TEMP_CLASS'] : "--");
        $(".vit-utpi").text(data['UTPI']);
        $(".vit-fitpu").text(parseFloat(data['FIXED_ITPU']).toFixed(2));
        $(".vit-ttpith").text(parseFloat(data['TTPI_THRESHOLD']).toFixed(2));
        $(".vit-thform").text(data['THRESHOLD_FORMULA']);

        let td_color = "";

        //2026-01-12 RM
        aryLabel = [];
        aryLabel.push(data['HANDLER']);
        
        aryPkg = [];

        if(data['PKG_TYPE'] != null) {
            aryPkg.push(data['PKG_TYPE'])
        }
        if(data['BODY_SIZE'] != null) {
            aryPkg.push(data['BODY_SIZE'])
        }
        switch (true) {
            case data['LEAD_COUNT_MIN'] != null && data['LEAD_COUNT_MAX'] != null:
                aryPkg.push(data['LEAD_COUNT_MIN'] + ' to ' + data['LEAD_COUNT_MAX'] + ' pins');
                break;
            case data['LEAD_COUNT_MIN'] != null:
                aryPkg.push(data['LEAD_COUNT_MIN'] + '+ pins');
                break;
            case data['LEAD_COUNT_MAX'] != null:
                aryPkg.push('0 to ' + data['LEAD_COUNT_MAX'] + ' pins');
                break;
        }

        if(aryPkg.length > 0) {
            aryLabel.push('(' + aryPkg.join(' ') + ')');
        }

        if(data['TEMP_CLASS'] != null) {
            aryLabel.push(data['TEMP_CLASS']);
        }
        if(data['UTPI'] != null) {
            aryLabel.push('x' + data['UTPI']);
        }

        strHeader = aryLabel.join(' ');
        labelVG = [];
        dataVG = [];

        $(".td-calc").each(function(){
            let utpi = parseFloat(data['UTPI']);
            let ttpi_inc = parseFloat($(this).attr("data-id"));
            let ttpi_thr = parseFloat(data['TTPI_THRESHOLD']);
            let ttpu_coeff = parseFloat(data['COEFFICIENT']);
            let adder_const = parseFloat(data['CONSTANT']);
            let fixed_itpu = parseFloat(data['FIXED_ITPU']);
            let calc_res = 0;
            
            //2026-01-12 RM
            labelVG.push(ttpi_inc);

            if (ttpi_inc < ttpi_thr) {
                calc_res = utpi*((ttpu_coeff*(ttpi_inc/utpi))+adder_const);
                td_color = $(this).attr("data-color");

            }
            else{
                calc_res = fixed_itpu;

            }

            //2026-01-12 RM
            dataVG.push(calc_res);

            $(this).text(calc_res.toFixed(2));
            $(this).css("background-color", td_color);

        });

        VarGraph_show();
        //x = document.getElementById('VarIndex');
        //x.update();
        $("#variableIndexModal").modal("show");
    });
});


function VarGraph_show() {
    try {
        Chart.getChart('VarIndex').destroy();
    } catch { 

    }

    const myChart = new Chart("VarIndex", {
        type: "line",
        data: {
            labels: labelVG,
            datasets: [{
                label: strHeader,
                data: dataVG,
                fill: false,
                borderColor: 'rgb(75, 192, 192)'
            }]
        },
        options: {
            aspectRatio: 4
        }
    });
}