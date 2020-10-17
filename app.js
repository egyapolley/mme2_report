const express = require("express"),
    session = require('express-session'),
    MongoStore = require("connect-mongo")(session),
    path = require("path"),
    dbcon = require("./mysql"),
    fs = require("fs"),
    moment = require("moment"),
    Parser = require("json2csv").Parser,
    mongoose = require("mongoose"),
    bcrypt = require("bcrypt"),
    passport = require("passport"),
    initializePassport = require("./passport-config"),
    exphbs = require("express-handlebars"),
    flash = require("connect-flash"),
    sendMail = require("./send_mail"),
    uuid = require("uuid"),
    UserUUID = require("./models/userUUID"),
    User = require("./models/user");


const Report = {
    NbrSuccessAttachRequests: "Number Of Success Attach Requests",
    AttAttachRequests: "VS_UE_attach_req",
    NbrAttachReqAbortBefore: "VS_UE_attach_abort_BeforeAttachCmp",
    NbrAttachReqAbortAfter: "VS_UE_attach_abort_AfterAttachCmp",
    NbrFailedAttachRequests_PLMNnotAllowed: "VS_UE_attach_fail_rej_PLMNnotAllowed",
    NbrFailedAttachRequests_EPSandNonEPSnotAllowed: "VS_UE_attach_fail_rej_EPSandNonEPSnotAllowed",
    NbrFailedAttachRequests_CannotDeriveUEid: "VS_UE_attach_fail_rej_UEidCannotBeDerived",
    NbrFailedAttachRequests_NetworkFailure: "VS_UE_attach_fail_rej_NetworkFailure",
    NbrPageRespInLastSeenTA: "VS_paging_all_rsp_ENBinLastTA",
    NbrPageRespNotInLastSeenTA: "VS_paging_all_rsp_ENBNotinLastTA",
    NbrPagingFailures_Timeout: "VS_paging_all_fail_OnMaxRetry",
    AttPaging_FirstAttempt: "VS_paging_all_req_1stTry",
    NbrSuccessTAU: "VS_UE_TAU_all_succ",
    TauInterMmeSucc: "VS_UE_TAU_IrMME_all_succ",
    AttTAU: "VS_UE_TAU_all_req",
    TauInterMmeAtt: "VS_UE_TAU_IrMME_all_req",
    VS_UE_attach_succ_rate_SFL: "VS_UE_attach_succ_rate_SFL",
    VS_paging_all_rsp_rate_copy_1: "VS_paging_all_rsp_rate_copy_1",
    VS_paging_all_rsp: "VS_paging_all_rsp",
    VS_UE_TAU_IaMME_all_succ_rate: "VS_UE_TAU_IaMME_all_succ_rate",
    VS_UE_TAU_IaMME_all_succ: "VS_UE_TAU_IaMME_all_succ",
    VS_UE_TAU_IaMME_all_req: "VS_UE_TAU_IaMME_all_req",
    UECapacityUsage:"MAF Capacity",
    AveNumOfDefaultBearers:"Avg Number_Default_Bearers",
    MaxNumOfDefaultBearers:"Max Number_Default_Bearers",
    AveNumOfDedicatedBearers:"Avg Number_Dedicated_Bearers",
    MaxNumOfDedicatedBearers:"Max Number_Dedicated_Bearers",
    AveNbrOfRegisteredUE:"Avg Number_Registered_UEs",
    MaxNbrOfRegisteredUE:"Max Number_Registered_UEs",
    AveNbrOfIdleUE:"Max Number_Idle_UEs",
    MaxNbrOfIdleUE:"Avg Number_Idle_UEs",
    AveConnectedUE:"Max Number_Connected_UEs",
    MaxConnectedUE:"Avg Number_Connected_UEs"
};

const FormulaReport =
    ["VS_UE_attach_succ_rate_SFL", "VS_paging_all_rsp_rate_copy_1", "VS_paging_all_rsp",
        "VS_UE_TAU_IaMME_all_succ_rate", "VS_UE_TAU_IaMME_all_succ", "VS_UE_TAU_IaMME_all_req"];




require("dotenv").config({
    path: path.join(__dirname, "config", "config.env")
});

mongoose.connect("mongodb://localhost/mme2_report", {

    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
}).then(() => {
    console.log("Mongo DB connected")
}).catch(err => {
    console.log("Cannot connect to MongoDB");
    throw err;
});

const app = express();


app.use(express.json());
app.use(express.urlencoded({
        extended: false
    })
);
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
     cookie: { sameSite: 'strict' },
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));

app.use(flash())

initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

let HOST = process.env.PROD_HOST;

let PORT = process.env.PORT || 5000;

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

app.get("/logout", checkAuthenticated, (req, res) => {
    delete req.session.reportdata;
    req.logout();
    res.redirect("/login");

});


app.get("/login", (req, res) => {
    res.render("login", {error: req.flash("error")});
});

app.post("/changepasswd", checkAuthenticated, async (req, res) => {
    const {oldpass, newpass1, newpass2} = req.body;
    if (oldpass && newpass1 && newpass2) {
        try {
            let user = await User.findOne({email: req.user.email});
            let isValid = await bcrypt.compare(oldpass, user.password);
            if (isValid) {
                user.password = await bcrypt.hash(newpass2, (await bcrypt.genSalt(10)));
                await user.save();
                req.logOut();
                return res.redirect("/login")
            }
            return res.render("home", {error: "Incorrect Password"})

        } catch (e) {
            return res.redirect("/home")
        }

    }
    res.redirect("/home");

});

app.get("/forget_passwd", (req, res) => {
    res.render("forget_pass", {layout: "forget_passwd"});
})


app.post("/forget_passwd", async (req, res) => {
    const {email} = req.body;
    console.log(email);
    if (email) {
        const user = await User.findOne({email});
        if (user) {
            let first_name = user.first_name;
            let to_email = user.email;
            let id = uuid.v4();
            let useruuid = new UserUUID({
                email: to_email,
                uuid: id,
            });
            useruuid = await useruuid.save();
            if (useruuid) {
                let url_link = `http://${HOST}:${PORT}/reset/${id}`;
                return sendMail(first_name, to_email, url_link, res);
            }
        }
        return res.json({error: "error"});
    }

    res.json({error: "error"});

});

app.get("/reset/:uuid", async (req, res) => {
    let uuid = req.params.uuid;
    if (uuid) {
        let useruid = await UserUUID.findOne({uuid: uuid});
        if (useruid) {
            return res.render("reset_passwd", {id: uuid, layout: "reset_passwd_layout"});
        }
    }
    res.render("404_error");

});

app.post("/reset", async (req, res) => {
    let {uuid, newpass2} = req.body;
    if (uuid) {
        let userUuid = await UserUUID.findOne({uuid: uuid});
        if (userUuid) {
            let user = await User.findOne({email: userUuid.email});
            if (user) {
                let hashpasswd = await bcrypt.hash(newpass2, await bcrypt.genSalt(10));
                user.password = hashpasswd;
                user = await user.save();
                if (user) {
                    await UserUUID.deleteOne({uuid: uuid});
                    return res.json({success: "success"});
                }

            }
        }
        return res.json({error: "error"});
    } else {
        return res.json({error: "error"});


    }

})
app.get("/home", checkAuthenticated, (req, res) => {
    res.render("home")
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: true
}));

app.post("/report", checkAuthenticated, checkformulaeReport,(req, res) => {
    const {beginDate, endDate, pm_counter, period} = req.body;
    let tableName = "mme2_KPI." + pm_counter;
    let start_date = beginDate.replace("T", " ") + ":00";
    let end_date = endDate.replace("T", " ") + ":00";
    console.log(start_date, end_date);

    let query = "";
    switch (period) {
        case "15mins":
            query = `select   date_format(timeInserted,'%Y%m%d%H%i%s') as my_date, counterValue_1 as value from ${tableName} where timeInserted between ? and ? order by  my_date desc`;
            break;
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
        let periodicity = period.charAt(0).toUpperCase() + period.substring(1);
        req.session.reportdata = {
            dataSet,
            counter,
            start_date,
            end_date,
            tableName,
            period,
            reportname,
            periodicity

        }


        /*        res.render("report", {
                    dataSet,
                    counter,
                    layout: "report_layout",
                    start_date,
                    end_date,
                    tableName,
                    period,
                    reportname,
                    periodicity
                })*/

        res.redirect(303, "/report")

    })
});

app.get("/report", checkAuthenticated, (req, res) => {
    if (req.session.reportdata) {
        let {
            dataSet,
            counter,
            start_date,
            end_date,
            tableName,
            period,
            reportname,
            periodicity

        } = req.session.reportdata;
        return res.render("report", {
            dataSet,
            counter,
            start_date,
            end_date,
            tableName,
            period,
            reportname,
            periodicity,
            layout: "report_layout",
        })

    }

    res.redirect("/home")


})

app.post("/charts", checkAuthenticated, (req, res) => {
    // let tableName = req.body.tablename
    // let start_date = req.body.start_date
    // let end_date = req.body.end_date
    // let period = req.body.period;
    // let query = "";
    //
    // switch (period) {
    //     case "15mins":
    //         query = `select   date_format(timeInserted,'%Y%m%d%H%i%s') as my_date, counterValue_1 as value from ${tableName} where timeInserted between ? and ? order by  my_date desc`;
    //         break;
    //     case "hourly":
    //         query = `select date_format( timeInserted, '%Y%m%d%H' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
    //         break;
    //     case "daily":
    //         query = `select date_format( timeInserted, '%Y%m%d' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
    //         break;
    //     case "weekly":
    //         query = `select date_format( timeInserted, '%x%v' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
    //         break;
    //     case "monthly":
    //         query = `select date_format( timeInserted, '%Y%m' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
    //         break;
    //     case "yearly":
    //         query = `select date_format( timeInserted, '%Y' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
    //         break;
    //     default:
    //         query = `select date_format( timeInserted, '%Y' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
    //
    // }
    // dbcon.execute(query, [start_date, end_date], function (error, rows, fields) {
    //     if (error) throw error;
    //     res.json(rows);
    // })

    res.json(req.session.reportdata.dataSet)


});

app.post("/csv", checkAuthenticated, (req, res) => {
    //
    // let {tablename, start_date, end_date, period, reportname} = req.body;
    // let tableName = tablename;
    // let query = "";
    // switch (period) {
    //     case "15mins":
    //         query = `select   date_format(timeInserted,'%Y%m%d%H%i%s') as my_date, counterValue_1 as value from ${tableName} where timeInserted between ? and ? order by  my_date desc`;
    //         break;
    //     case "hourly":
    //         query = `select date_format( timeInserted, '%Y%m%d%H' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
    //         break;
    //     case "daily":
    //         query = `select date_format( timeInserted, '%Y%m%d' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
    //         break;
    //     case "weekly":
    //         query = `select date_format( timeInserted, '%x%v' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
    //         break;
    //     case "monthly":
    //         query = `select date_format( timeInserted, '%Y%m' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
    //         break;
    //     case "yearly":
    //         query = `select date_format( timeInserted, '%Y' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
    //         break;
    //     default:
    //         query = `select date_format( timeInserted, '%Y' ) as my_date, sum(counterValue_1)as value from ${tableName} where timeInserted between ? and ? group by my_date order by my_date desc`;
    //
    // }
    // dbcon.execute(query, [start_date, end_date], function (error, rows) {
    //     if (error) throw error;
    //     const fields = ["my_date", "value"];
    //     const parser = new Parser({fields});
    //     let csv = parser.parse(rows);
    //     reportname = reportname.replace(/\s/g, "_");
    //     let fileName = moment().format("YYYYMMDDHHmmss-SSS") + "_" + reportname + ".csv"
    //     let filepath = path.join(__dirname, "tmp", fileName);
    //     fs.writeFile(filepath, csv, err => {
    //         if (err) throw err;
    //         res.json({fileName});
    //     })
    //
    //
    // })

    const fields = ["my_date", "value"];
    const parser = new Parser({fields});
    let csv = parser.parse(req.session.reportdata.dataSet);
    let reportname = req.body.reportname.replace(/\s/g, "_");
    let fileName = moment().format("YYYYMMDDHHmmss-SSS") + "_" + reportname + ".csv"
    let filepath = path.join(__dirname, "tmp", fileName);
    fs.writeFile(filepath, csv, err => {
        if (err) throw err;
        res.json({fileName});
    })


});

app.get("/csv", checkAuthenticated, (req, res) => {
    let fileName = req.query.fileName
    let filepath = path.join(__dirname, "tmp", fileName);
    res.download(filepath, fileName, err => {
        if (err) throw err;
        fs.unlink(filepath, err => {
            if (err) throw err;
            console.log("File " + fileName + " removed");
        })

    })
});

app.post("/admin/create", async (req, res) => {
    const {username, email, password, first_name, last_name} = req.body;
    if (username && email && password) {
        let user = await User.findOne({email: email});
        if (!user) {
            let salt = await bcrypt.genSalt(10);
            let hashpassword = await bcrypt.hash(password, salt);
            user = new User({
                username,
                email,
                first_name,
                last_name,
                password: hashpassword
            });

            await user.save();
            console.log(user);
            res.send("Acct created");

        }
    }

});

app.get("/admin/create", (req, res) => {
    res.render("createAcct");
});


app.use(function (req, res) {
    res.status(400).render("404_error");
});


app.listen(PORT, HOST, () => {
    console.log(`Server running in ${process.env.NODE_ENV} at endpoint http://${HOST}:${PORT}`);
});


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect("/login");
    }
}

function checkformulaeReport(req, res, next) {
    const {beginDate, endDate, pm_counter, period} = req.body;
    let tableName = "mme2_KPI." + pm_counter;
    let start_date = beginDate.replace("T", " ") + ":00";
    let end_date = endDate.replace("T", " ") + ":00";
    let query ="";
    if (FormulaReport.includes(pm_counter)){
        switch (period){
            case "15mins":
                query = `select   date_format(timeInserted,'%Y%m%d%H%i%s') as my_date, ifnull(counterValue_1,0) as value from ${tableName} where timeInserted between ? and ? order by  my_date desc`;
                break;

            case "hourly":
                start_date = moment(start_date).format("YYYYMMDDHH");
                end_date = moment(end_date).format("YYYYMMDDHH");
                tableName=tableName+"_Hourly_View";
                query =`select my_date, ifnull(value,0) as value from ${tableName} where my_date between ? and ? order by my_date desc`;
                break;
            case "daily":
                start_date = moment(start_date).format("YYYYMMDD");
                end_date = moment(end_date).format("YYYYMMDD");
                tableName=tableName+"_Daily_View";
                query =`select my_date, ifnull(value,0) as value from ${tableName} where my_date between ? and ? order by my_date desc`;
                break;

            case "weekly":
                start_date = moment(start_date).format("YYYYw");
                end_date = moment(end_date).format("YYYYw");
                tableName=tableName+"_Weekly_View";
                query =`select my_date, ifnull(value,0) as value from ${tableName} where my_date between ? and ? order by my_date desc`;
                break;


            case "monthly":
                start_date = moment(start_date).format("YYYYMM");
                end_date = moment(end_date).format("YYYYMM");
                tableName=tableName+"_Monthly_View";
                query =`select my_date, ifnull(value,0) as value from ${tableName} where my_date between ? and ? order by my_date desc`;
                break;

            case "yearly":
                start_date = moment(start_date).format("YYYY");
                end_date = moment(end_date).format("YYYY");
                tableName=tableName+"_Yearly_View";
                query =`select my_date, ifnull(value,0) as value from ${tableName} where my_date between ? and ? order by my_date desc`;
                break;

            default:
                start_date = moment(start_date).format("YYYYMMDDHH");
                end_date = moment(end_date).format("YYYYMMDDHH");
                tableName=tableName+"_Hourly_View";
                query =`select my_date, ifnull(value,0) as value from ${tableName} where my_date between ? and ? order by my_date desc`;

        }


        dbcon.execute(query, [start_date, end_date], function (error, rows, fields) {
            if (error) throw error;
            let dataSet = rows;
            let counter = Report[pm_counter];
            let reportname = counter;
            let periodicity = period.charAt(0).toUpperCase() + period.substring(1);
            req.session.reportdata = {
                dataSet,
                counter,
                start_date,
                end_date,
                tableName,
                period,
                reportname,
                periodicity

            }
            res.redirect(303, "/report")

        })



    }else {
        next();
    }

}







