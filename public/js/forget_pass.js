$(function () {

    const forgetPassForm = document.getElementById("submit-forget-pass-form");
    const emailforgetPasswd = document.getElementById("email-forget-passwd");
    const message_box = document.getElementById("message_error_email");
    const message_error = document.getElementById("error_messsge_email");
    const forgetPassForm_container = document.getElementById("forget-pass-container");

    const cancel_ForgetPass_btn = document.getElementById("cancel-forget-pass-btn");
    const submit_ForgetPass_btn = document.getElementById("submit-forget-pass-btn");
    cancel_ForgetPass_btn.addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = "/login";
    })


    submit_ForgetPass_btn.addEventListener("click", function (event) {
        submit_ForgetPass_btn.style.opacity="0.1";
        cancel_ForgetPass_btn.style.opacity="0.1";
         event.preventDefault();

         $.post("/forget_passwd", {email: emailforgetPasswd.value})
             .done(function (data) {
                 if (data) {
                     console.log(data);
                     const {error, success} = data;
                     if (error) {
                         message_box.style.display = "block";
                         message_error.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;Email address is not registered';
                         submit_ForgetPass_btn.style.opacity="1";
                         cancel_ForgetPass_btn.style.opacity="1";

                     } else {
                         console.log(success);
                         forgetPassForm_container.style.display = "none";
                         message_error.innerHTML = '<i class="fas fa-check-circle"></i>&nbsp;Password reset link sent to your inbox';
                         message_error.style.color = "#ec0b72";
                         message_error.style.fontSize = "20px";
                         message_error.style.fontWeight = "bold";

                     }

                 }else {
                     message_box.style.display = "block";
                     message_error.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;Email address is not registered';
                     submit_ForgetPass_btn.style.opacity="1";
                     cancel_ForgetPass_btn.style.opacity="1";
                 }


             }).fail(function (err) {
             console.log("this from the fail", err);
             submit_ForgetPass_btn.style.opacity="1";
             cancel_ForgetPass_btn.style.opacity="1";

         });

     })

})



