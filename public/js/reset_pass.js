const newpass1 = document.getElementById("newpass1");
const newpass2 = document.getElementById("newpass2");

const reset_submit_btn = document.getElementById("reset-submit-pass-btn");
const reset_cancel_btn = document.getElementById("reset-cancel-pass-btn");

const success_box = document.getElementById("reset-pass-group-1");
const default_box = document.getElementById("reset-pass-group-2");



const error_message_box = document.getElementById("message_error_passwd");

const resetPass_form= document.getElementById("resetPasswd-form");

resetPass_form.addEventListener("submit", function (event) {
    event.preventDefault();
    const error_message = document.getElementById("error_messsge_passwd");
    if (newpass1.value !== newpass2.value) {
        error_message_box.style.display = "block";
        error_message.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;New passwords do not match';

    }

    let uuid= reset_submit_btn.dataset.id;


    $.post("/reset", {uuid:uuid,newpass2:newpass2.value})
        .done(function (data) {
            const {error}=data;
            if (error){
                error_message_box.style.display = "block";
                error_message.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;Passport update failed.Please try again';
            }else {
                default_box.style.display="none";
                success_box.style.display="block";

            }

        }).fail(function (err) {
        throw err;

    })


});

reset_cancel_btn.addEventListener("click", function (event) {
    window.location.href="/login";

})
