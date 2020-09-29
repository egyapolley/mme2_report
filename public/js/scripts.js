$(function () {
    const reportForm = document.getElementById("report-form");
    const small = document.querySelector(".error");

    reportForm.addEventListener("submit", event => {
        const beginDate = document.getElementById("beginDate");
        const endDate = document.getElementById("endDate");
        let startDate = new Date(beginDate.value);
        let completedDate = new Date(endDate.value);
        console.log(startDate, completedDate);

        if (startDate >= completedDate) {
            small.style.display = "inline";
            event.preventDefault()


        }


    });


    const changePassOverlay = document.getElementById("change-password-overlay");
    const changePassCancel = document.getElementById("cancel-change-pass-btn");
    const changePasswd_btn = document.getElementById("change-Passwd-btn");
    const changePasswdform = document.getElementById("changePasswd-form");
    const error_message_box = document.getElementById("message_error_passwd");
    const newpass1 = document.getElementById("newpass1");
    const newpass2 = document.getElementById("newpass2");
    const oldpassword = document.getElementById("oldpass");
    const togglePass = document.getElementById("togglePassword");


    togglePass.addEventListener("click", function (event) {
        // toggle the type attribute
        const type = oldpassword.getAttribute('type') === 'password' ? 'text' : 'password';
        oldpassword.setAttribute('type', type);
        // toggle the eye slash icon
        this.classList.toggle('fa-eye-slash');

    })


   changePasswdform.addEventListener("submit", function (event) {
        const error_message = document.getElementById("error_messsge_passwd");
        if (newpass1.value !== newpass2.value) {
            event.preventDefault();
            error_message_box.style.display = "block";
            error_message.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;New passwords do not match';

        }

    })

    changePasswd_btn.addEventListener("click", function (event) {
        event.preventDefault();
        changePassOverlay.style.display = "block";
        error_message_box.style.display = "none";


    });

    changePassCancel.addEventListener("click", function (event) {
        changePassOverlay.style.display = "none";
        error_message_box.style.display = "none";

    })


})
