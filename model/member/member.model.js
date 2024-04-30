const mysql = require("mysql2");
const pool = require("../../config/mysqlConfig");

exports.getRealtimeMember = async function (sort, order, searchClause) {
    let sql = "call usp_get_realtime_member(?, ?, ?, @RESULT)"
    let aParameter = [sort, order, searchClause];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.findByUsername = async function (username) {
    let sql = "select * from Members where username=?";
    let aParameter = [username];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res[0];
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.findByShopId = async function (shopId) {
    let sql = "select * from Members where shop_id = ?"
    let aParameter = [shopId];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res[0];
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.findByPhoneNumber = async function (phoneNumber) {
    let sql = "select * Members where phone_number = ?"
    let aParameter = [phoneNumber];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res[0];
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}
