<?php

function RENDER_ASSETS($pages){
    $path = ($pages != "main") ? '../../' : '';
    $asset_arr = [
        '<link rel="stylesheet" href="https://cdn.lineicons.com/4.0/lineicons.css"/>',
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"/>',
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.2/font/bootstrap-icons.css"/>',
        '<link rel="stylesheet" href="'.$path.'css/plugins/bootstrap.min.css">',
        '<link rel="stylesheet" href="'.$path.'css/plugins/dataTables.dataTables.css">',
        '<link rel="stylesheet" href="'.$path.'css/plugins/select2.min.css">',
        '<link rel="stylesheet" href="'.$path.'css/custom.css">',
        '<script type="text/javascript" src="'.$path.'js/plugins/popper.min.js"></script>',
        '<script type="text/javascript" src="'.$path.'js/plugins/bootstrap.bundle.min.js"></script>',
        '<script type="text/javascript" src="'.$path.'js/plugins/jquery.min.js"></script>',
        '<script type="text/javascript" src="'.$path.'js/plugins/jquery-ui.min.js"></script>',
        '<script type="text/javascript" src="'.$path.'js/plugins/datatables.min.js"></script> ',
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/datatables.net-keytable/2.12.1/dataTables.keyTable.min.js"></script>',
        '<script type="text/javascript" src="'.$path.'js/plugins/sweetalert2@11.js"></script>', 
        '<script type="text/javascript" src="'.$path.'js/plugins/select2.min.js"></script>',
        '<script type="text/javascript" src="'.$path.'js/plugins/jquery.redirect.js"></script>',
        '<script type="text/javascript" src="'.$path.'js/custom.js"></script>',
        '<script type="text/javascript" src="'.$path.'js/plugins/crypto-js.min.js"></script>'
    ];

    return $asset_arr;
}

?>