const mysql = require("mysql2");
const pool = require("../../config/mysqlConfig");

exports.getCategoriesByProductNo = async function (productNo) {
    let sql = "select * from Categories where product_no = ?"
    let aParameter = [productNo];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res[0];
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}
