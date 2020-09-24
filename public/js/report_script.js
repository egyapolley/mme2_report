$(function () {

    function renderChar(data, labels,reportname){
        let ctx = document.getElementById("canvas").getContext("2d");
        const mycharts = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label:"",
                    data: data,
                    borderColor: 'rgb(192,85,75)',
                    backgroundColor: 'rgb(75,192,122)'
                }]
            },
            options:{
                title: {
                    display: true,
                    text: reportname,
                }
            }


        })

    }

    const generateChartBtn = document.getElementById("generateChart");
    generateChartBtn.addEventListener("click", function (event){
        let tablename =$(this).data("tablename");
        let start_date =$(this).data("start_date");
        let end_date =$(this).data("end_date");
        let period =$(this).data("reporttype");
        let reportname = $(this).data("reportname");


        $.post("/charts", {tablename, start_date, end_date, period})
            .done(function (data) {
                if (data){
                    let labels =[];
                    let dataSet =[];
                    for (let i = 0; i < data.length; i++) {
                        labels.push(data[i].my_date);
                        dataSet.push(data[i].value);
                    }

                    renderChar(dataSet,labels, reportname);

                }

            }).fail(function (err) {
            throw err;

        })
    })

})
