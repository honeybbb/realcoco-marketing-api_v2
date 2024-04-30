const mysql = require("mysql");
const pool = require("../../config/mysqlConfig");

exports.getFashionTrends = async function (startedAt, endedAt) {
    let sql = "select * from FashionTrends where created_at between (?) and (?)"
    let aParameter = [startedAt, endedAt];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.getFashionTrendWeights = async function () {
    let sql = "select weights from FashionTrendWeights order by fashion_trend_weight_id desc";
    let aParameter = [];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.findByCreatedAt = async function (startedAt, endedAt){
    let sql = "select ft.*, c.* from FashionTrends ft"
    sql += " inner join CrawlLogs c on c.fashion_trend_id = ft.fashion_trend_id"
    sql += " where ft.created_at between (?) and (?)";
    let aParameter = [startedAt, endedAt];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.findByName = async function (shopId, keyword) {
    let sql = "select * from KeywordPool where keyword_name = ?"
    let aParameter = [keyword];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res[0];
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.save = async function (keywordPoolId, shopId, name){
    let sql = "INSERT INTO keywordPool (keyword_pool_id, shop_id, name) VALUES (?, ?, ?)";
    let aParameter = [keywordPoolId, shopId, name];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }

}

exports.getRequiredKeywordPool = async function (keywordId) {
    let sql = "select keyword_pool_id as `id`, keyword_name as `name` from KeywordPool where keyword_pool_id = ?"
    let aParameter = [keywordId];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res[0];
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}
