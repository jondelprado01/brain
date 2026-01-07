<?php
    header('Access-Control-Allow-Origin: *');
    ini_set("error_reporting",E_ALL);
    ini_set("display_errors",1);
    // ini_set("SMTP", "sandbox.smtp.mailtrap.io");
// ini_set("smtp_port", 2525);

    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\Exception;

    require '../../phpmailer/src/PHPMailer.php';
    require '../../phpmailer/src/Exception.php';
    require '../../phpmailer/src/SMTP.php';

    $phpmailer = new PHPMailer();
    $phpmailer->SMTPDebug = 2;
    $phpmailer->isSMTP();
    $phpmailer->Host = 'sandbox.smtp.mailtrap.io';
    $phpmailer->SMTPAuth = true;
    $phpmailer->Port = 2525;
    $phpmailer->Username = 'f8efd5fc0ce98a';
    $phpmailer->Password = '0bc3e755c4cbae';
    $phpmailer->SMTPSecure = 'tls';

    // $phpmailer->Host = 'testwebsvr.maxim-ic.internal';
    // $phpmailer->SMTPSecure = 'tls';
    // $phpmailer->Port = 487;
?>