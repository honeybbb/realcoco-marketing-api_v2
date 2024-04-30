const mysql = require("mysql");
const pool = require("../../config/mysqlConfig");
const crypto = require("crypto");
function generateId() {
    const buffer = crypto.randomBytes(8);
    const id = buffer.readBigUInt64BE() % BigInt(9223372036854775807);
    return id.toString();
}

exports.findById = async function (shopId) {
    let sql = "select * from Shops where shop_id=?"
    let aParameter = [shopId];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.findByShopName = async function (shopName) {
    let sql = "select `name` from Shops where name=?"
    let aParameter = [shopName];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.saveShop = async function (shopName) {
    let id = generateId();
    let sql = "insert into (shop_id, created_at, updated_at, name) values (?, NOW(), NOW(), ?)"
    let aParameter = [shopName];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}
