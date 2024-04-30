const mysql = require("mysql2");
const pool = require("../../../config/mysqlConfig");

exports.findByMallIdAndUserId = async function (mallId, userId) {
    let sql = "select * from Cafe24Tokens where mall_id =? and user_id = ?"
    let aParameter = [mallId, userId];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res[0];
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.updateToken = async function (accessToken, expiresAt, refreshToken, refreshTokenExpiresAt, issuedAt, mallId, userId) {
    let sql = "update Cafe24Tokens set access_token = ?, expires_at=?, refresh_token=?, refresh_token_expires_at=?, issued_at=? where mall_id =? and user_id=?"
    let aParameter = [accessToken, expiresAt, refreshToken, refreshTokenExpiresAt, issuedAt, mallId, userId];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res[0];
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}
