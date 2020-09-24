const express = require("express"),
    session = require('express-session'),
    path = require("path"),
    dbcon = require("./mysql"),
    exphbs = require("express-handlebars");


const Report = {
    NbrSuccessAttachRequests: "Number Of Success Attach Requests",
    AttAttachRequests: "VS_UE_attach_req",
    NbrAttachReqAbortBefore: "VS_UE_attach_abort_BeforeAttachCmp",
    NbrAttachReqAbortAfter: "VS_UE_attach_abort_AfterAttachCmp",
    NbrFailedAttachRequests_PLMNnotAllowed: "VS_UE_attach_fail_rej_PLMNnotAllowed",
    NbrFailedAttachRequests_EPSandNonEPSnotAllowed: "VS_UE_attach_fail_rej_EPSandNonEPSnotAllowed",
    NbrFailedAttachRequests_CannotDeriveUEid: "VS_UE_attach_fail_rej_UEidCannotBeDerived",
    NbrFailedAttachRequests_NetworkFailure: "VS_UE_attach_fail_rej_NetworkFailure",
}


require("dotenv").config({
    path: path.join(__dirname, "config", "config.env")
});

let PORT = process.env.PORT || 5000;


const app = express();

app.use(express.json());
app.use(express.urlencoded({
        extended: false
    })
)

let HOST = process.env.PROD_HOST;


if (process.env.NODE_ENV === "development") {
    app.use(require("morgan")("tiny"));

    HOST = process.env.TEST_HOST;
}

const handlebars = exphbs.create({
    extname: "hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials"),
    helpers: {
        formatDate: function (date) {
            let newstr = date.substring(0, 4) + "/" + date.substring(4, 6) + "/" + date.substring(6, 8) + ":" + date.substring(8);
            return newstr.replace(/[:\\/]*$/i, "");

        }
    }
});

app.engine("hbs", handlebars.engine);
app.set("view engine", "hbs");

app.use(express.static("public"));


app.get("/", (req, res) => {
    res.render("login");
});

app.get("/home", (req, res) => {
    res.render("home")
})

app.post("/login", (req, res) => {
    res.redirect("/home");
})

app.post("/report", (req, res) => {
    const {beginDate, endDate, pm_counter, period} = req.body;
    let tableName = "mme2_KPI." + pm_counter;
    let start_date = beginDate.replace("T", " ") + ":00";
    let end_date = endDate.replace("T", " ") + ":00";

    let query = "";
    switch (period) {
        case "hourly":
            query = `select date_format( timeInserted, '%Y%m%d%H' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
            break;
        case "daily":
            query = `select date_format( timeInserted, '%Y%m%d' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
            break;
        case "weekly":
            query = `select date_format( timeInserted, '%x%v' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
            break;
        case "monthly":
            query = `select date_format( timeInserted, '%Y%m' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
            break;
        case "yearly":
            query = `select date_format( timeInserted, '%Y' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
            break;
        default:
            query = `select date_format( timeInserted, '%Y' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;

    }
    dbcon.execute(query, [start_date, end_date], function (error, rows, fields) {
        if (error) throw error;
        let dataSet = rows;
        let counter = Report[pm_counter];
        let reportname = counter;
        let periodicity =period.charAt(0).toUpperCase()+period.substring(1);
        res.render("report", {
            dataSet,
            counter,
            layout: "report_layout",
            start_date,
            end_date,
            tableName,
            period,
            reportname,
            periodicity
        })

    })
});

app.post("/charts", (req, res) => {
    let tableName = req.body.tablename
    let start_date = req.body.start_date
    let end_date = req.body.end_date
    let period = req.body.period;
    let query = "";
    switch (period) {
        case "hourly":
            query = `select date_format( timeInserted, '%Y%m%d%H' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
            break;
        case "daily":
            query = `select date_format( timeInserted, '%Y%m%d' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
            break;
        case "weekly":
            query = `select date_format( timeInserted, '%x%v' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
            break;
        case "monthly":
            query = `select date_format( timeInserted, '%Y%m' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
            break;
        case "yearly":
            query = `select date_format( timeInserted, '%Y' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
            break;
        default:
            query = `select date_format( timeInserted, '%Y' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;

    }
    dbcon.execute(query, [start_date, end_date], function (error, rows, fields) {
        if (error) throw error;
        res.json(rows);
    })

})

console.log(process.env.PROD_HOST)

app.listen(PORT, HOST, () => {
    console.log(`Server running in ${process.env.NODE_ENV} at endpoint http://${HOST}:${PORT}`);
})







