<?php
    require('ENV.PHP');
    session_start();
    session_unset();
    session_destroy();
?>
<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BRAIN</title>
        <link rel="stylesheet" href="css/plugins/bootstrap.min.css">
        <link rel="stylesheet" href="css/plugins/dataTables.dataTables.css">
        <script type="text/javascript" src="js/plugins/jquery.min.js"></script>
        <script type="text/javascript" src="js/plugins/jquery-ui.min.js"></script>
    </head>

    <body>
        <div class="position-absolute top-50 start-50 translate-middle">
            <div class="card">
                <div class="card-header">
                    BRAIN
                </div>
                <div class="card-body">
                    <h5 class="mb-3">We couldn’t complete your sign-in request. Please try logging in again.</h5>
                    <small>Possible Reasons:</small>
                    <ul>
                        <li>Wrong login credentials</li>
                        <li>Session expired</li>
                        <li>SSO login error</li>
                        <li>Unauthorized access</li>
                        <li>Account inactive or locked</li>
                        <li>Network connection issue</li>
                        <li>Authentication service unavailable</li>
                    </ul>

                    <a href="https://sso.maxim-ic.com/app/sso/src/login.php?callback=http://mxhtafot01l.maxim-ic.com/TEST/BRAIN_UI_JCDP/LOGIN.PHP">Return to SSO Login</a>
                </div>
                <div class="card-footer">
                    <small class="text-body-secondary">If the issue persists, please contact the admin.</small>
                </div>
            </div>
        </div>
    </body>
</html>