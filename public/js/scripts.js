$(function (){
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



})
