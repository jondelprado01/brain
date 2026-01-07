<?php
  header('Access-Control-Allow-Origin: *');
  ini_set("error_reporting",E_ALL);
  ini_set("display_errors",1);

  //WILL REVAMP THIS IN THE FUTURE TO ACCEPT MULTIPLE PART NUMBERS
  date_default_timezone_set('Asia/Manila');
  $curdate = date("M d, Y - h:i:s A");
  $step = $_POST['payload'][0][2];
  $sap_rte = $_POST['payload'][0][4];
  $part_number = $_POST['payload'][0][0];

  //CURRENT PRIMARY SETUP DETAILS
  $curr_tester = $_POST['target_setup'][1];
  $curr_handler = $_POST['target_setup'][2];
  $curr_hw = "";

  //NEW PRIMARY SETUP DETAILS
  $new_tester = $_POST['payload'][0][15];
  $new_handler = $_POST['payload'][0][16];
  $new_hw = "";

  switch ($_POST['process']) {
    case 'expedite-change':
      $message1 = "Information Update: Completion of Change in Primary Engineer Tester/Handler";
      $message2 = "Please be advised that the pending change in the Primary Engineer Tester/Handler has been successfully completed. The updated assignment is now in effect.";
      break;
    
    default:
      $message1 = "Information Update: Pending Change in Primary Engineer Tester/Handler Cancelled";
      $message2 = "Please be informed that the pending change has been cancelled. No further action is required on your part.";
      break;
  }

  foreach ($_POST['hw_list'] as $hw_key => $hw) {
    if ($_POST['target_setup'][19] == $hw_key) {
      foreach ($hw as $inner_key => $inner) {
        foreach ($inner as $inkey => $in) {
          $to_arr = (array)$in;
          $curr_hw .= $inner_key.' - '.$to_arr['HW_NM'].' - [Invty. '.$to_arr['REQUIRED_QTY'].']<br>';
        }
      }
    }

    if ($_POST['payload'][0][5] == $hw_key) {
      foreach ($hw as $inner_key => $inner) {
        foreach ($inner as $inkey => $in) {
          $to_arr = (array)$in;
          $new_hw .= $inner_key.' - '.$to_arr['HW_NM'].' - [Invty. '.$to_arr['REQUIRED_QTY'].']<br>';
        }
      }
    }
  }

  $parts .= '
      <table style="background-color: #ffffff; text-align: center; font-family: Arial, sans-serif; width: 100%!important;">
        <tr>
          <td>
            <h3 style="color: #333333;">Current Primary Setup:</h3>
            <table border="1" cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 0 auto;">
              <tr>
                <td><strong>DETAILS:</strong><br>
                  '.$sap_rte.' / '.$step.' <br>
                  '.$curr_tester.' / '.$curr_handler.' <br>
                </td>
              </tr>
              <tr>&nbsp;</tr>
              <tr>
                <td><strong>HARDWARE:</strong><br>'.$curr_hw.'</td>
              </tr>
            </table>
          </td>
        </tr>
      </table><br><br>
      <hr><br><br>
      <table style="background-color: #ffffff; text-align: center; font-family: Arial, sans-serif; width: 100%!important;">
        <tr>
          <td>
            <h3 style="color: #333333;">New Primary Setup:</h3>
            <table border="1" cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 0 auto;">
              <tr>
                <td><strong>DETAILS:</strong><br>
                  '.$sap_rte.' / '.$step.' <br>
                  '.$new_tester.' / '.$new_handler.' <br>
                </td>
              </tr>
              <tr>&nbsp;</tr>
              <tr>
                <td><strong>HARDWARE:</strong><br>'.$new_hw.'</td>
              </tr>
            </table>
          </td>
        </tr>
      </table><br><br>';

  $body = '<html>
            <head>
              <meta charset="UTF-8">
            </head>
            <body style="background-color: #f8f8f8;">
              <table style="background-color: #f8f8f8; width: 100%!important;">
                <tr>
                  <td align="center">
                    <!-- Centered container -->

                    <table style="background-color: #ffffff; text-align: center; font-family: Arial, sans-serif; width: 100%!important;">
                      <tr>
                        <td>
                          <h4 style="color: #333333;">'.$message1.'</h4>
                          <table border="1" cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 0 auto;">
                            <tr><td style="border: 1px solid #ccc;">Part Number <br>'.$part_number.'</td></tr>
                            <tr>&nbsp;</tr>
                            <tr><td style="border: 1px solid #ccc;">Date Created <br>'.$curdate.'</td></tr>
                            <tr>&nbsp;</tr>
                            <tr><td style="border: 1px solid #ccc;">Initiated By <br>'.$_POST['user_details']['emp_name'].'</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table><br><br>

                    '.$parts.'

                    <hr><br><br>

                    <p>'.$message2.'</p><br><br>

                  </td>
                </tr>
              </table>
            </body>
          </html>';

  // outlook does not render anchor tags properly - fix this soon
  // <a style="margin:auto; display:block; width: 23%; color: #ffffff; font-size: 16px; font-family: Helvetica, Arial, sans-serif; text-decoration: none; border-radius: 6px; line-height: 20px; white-space: nowrap; font-weight: 700 !important; background-color: #0d6efd; padding: 12px; border: 1px solid #0d6efd;"
  //   href="'.$_POST['url'].'&modal='.$trim_rte."_".$step.'" target="_blank">
  //     See Full Details
  // </a>

  ini_set("SMTP", "testwebsvr.maxim-ic.internal");
  ini_set("smtp_port", 25);

  $header = [];
  $header[] = "MIME-Version: 1.0";
  $header[] = "Content-type:text/html;charset=UTF-8";
  $header[] = "Content-Transfer-Encoding: quoted-printable";
  $header[] = "From: do_not_reply@brain.analog.com";

  $test_recipients = ["vishnu.padmakumar@analog.com", "ricci.bejarin@analog.com", "lorraine.digma@analog.com"];
  // $test_recipients = ["jonathan.delprado@analog.com"];

  $result = mail(implode(",", $test_recipients), "BRAIN - Change in Primary Engr. Tester/Handler", $body, implode("\n",$header));

  if ($result) {
      echo "Mail sent successfully.";
  } else {
      echo "Mail failed to send.";
  }

  // require '../../requests/EMAIL.PHP';
  
  // $phpmailer->setFrom('brain.tool@analog.com');
  // $phpmailer->addAddress('jonathan.delprado@analog.com');
  // $phpmailer->isHTML(true);
  // $phpmailer->Subject = 'BRAIN - Change in Primary Engr. Tester/Handler';
  // $phpmailer->Body = $body;

  // if(!$phpmailer->send()){
  //     echo 'Message could not be sent.';
  //     echo 'Mailer Error: ' . $phpmailer->ErrorInfo;
  // } else {
  //     echo 'Message has been sent';
  // }

?>