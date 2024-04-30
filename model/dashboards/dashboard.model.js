const mysql = require("mysql");
const pool = require("../../config/mysqlConfig");
exports.getDashboardViews = async function (date, days) {
    let sql = "select DATE_FORMAT(date, '%Y-%m-%d') as `date`, sum(total_view_count) as `value` from DailyProductStats"
    sql += " where date between (? - INTERVAL ? DAY) and (?)"
    sql += " group by date";
    let aParameter = [date, days, date];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.getDashboardSales = async function (date, days) {
    let sql = "select DATE_FORMAT(dps.date, '%Y-%m-%d') as `date`, sum(dps.total_order_count * p.price) as `value`"
    sql += " from DailyProductStats dps"
    sql += " inner join Products p on p.product_no = dps.product_no"
    sql += " where dps.date between (? - INTERVAL ? DAY) and (?)"
    sql += " group by dps.date";
    let aParameter = [date, days, date];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}
