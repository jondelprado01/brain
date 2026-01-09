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
                { data: 'THRESHOLD_FORMULA' }
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
    
});


