$(document).ready(function(){

    //-------------------------------------------------------------------------LOGIN & SIGNUP PAGE----------------------------------------------------------------------------
    $(".btn-login").on("click", function(){

        let username = $(".login-username").val();
        let password = $(".login-password").val();

        if (username != '' && password != '') {
            $.ajax({
                type: 'post',
                url: 'http://MXHDAFOT01L.maxim-ic.com/API/USER_ACCOUNT.PHP?PROCESS_TYPE=CHECK_LOGIN_INFO',
                data: {username: username, password: password},
                beforeSend: function(){
                    showLoader('Logging in... \n Please Wait!');
                },
                success: function(data){
                    let result = JSON.parse(data);
                    console.log(result.length);
                    
                    if (result.length > 0) {
                        console.log(result);
                    }
                    else{
                        $(".not-found-error").fadeIn();
                        swal.close();
                    }
                    
                    return;
                    setTimeout(function(){
                        if (data) {
                        }
                    }, 1500);
                },
                error: function(xhr, status, error) {
                    console.log(xhr);
                }
            });
        }
        else{
            showGenericAlert('error', 'Username & Password <br> are Required!');
        }
        
        // location.href = 'SESSION-CONTROLLER.PHP?process=login';
    });

});

function showLoader(title){
    Swal.fire({
        title: title,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading()
        },
    });
}

function showGenericAlert(icon, title){
    Swal.fire({
        title: title,
        icon: icon
    });
}