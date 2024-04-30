const mysql = require("mysql2");
const pool = require("../../config/mysqlConfig");

exports.findRefererStats = async function () {
    let sql = "select * from Cafe24RefererStats"
    let aParameter = [];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res[0];
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}
