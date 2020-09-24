const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "172.25.33.141",
    user: "mme",
    password:"mme",
    database:"mme2_KPI"
});

module.exports = connection;
