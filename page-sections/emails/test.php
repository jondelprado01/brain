<?php
header('Access-Control-Allow-Origin: *');
ini_set("error_reporting",E_ALL);
ini_set("display_errors",1);
ini_set("SMTP", "smtp.gmail.com");
ini_set("smtp_port", 587);


try {

    return var_dump(mail('jonathandelprado60@gmail.com', 'test', 'test'));
}
catch(Exception $e) {
    echo 'Message: ' .$e->getMessage();
}

    

?>