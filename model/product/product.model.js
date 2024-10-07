const mysql = require("mysql2");
const pool = require("../../config/mysqlConfig");
const crypto = require('crypto');

function generateId() {
    const buffer = crypto.randomBytes(8);
    const id = buffer.readBigUInt64BE() % BigInt(9223372036854775807);
    return id.toString();
}

exports.findProductStats = async function (productIds, startDate, endDate) {
    let sql = "select * from DailyProductStats where product_no in (?) and date between (?) and (?)";
    let aParameter = [productIds, startDate, endDate];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.findById = async function (productNo) {
    let sql = "select * from Products where product_no=?";
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

exports.searchByProductName = async function (productName) {
    let sql = "select * from Products where product_name LIKE ?";
    let aParameter = [`%${productName}%`];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.findByProductNo = async function (productId) {
    let sql = "select * from DailyProductStats where product_no=?";
    let aParameter = [productId];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.saveApplyProduct = async function (productNosJson, shopId, createdAt, updatedAt) {
    let applyProductId = generateId();
    let sql = "insert into ApplyProducts (apply_product_id, product_nos_json, shop_id, created_at, updated_at) values (?, ?, ?, ?, ?)"
    let aParameter = [applyProductId, productNosJson, shopId, createdAt, updatedAt];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.deleteByShopIdAndDateAndProductNo = async function (shopId, date, productNos) {
    let sql = "delete from ExcludeBestProducts where shop_id = ? and date = ? and product_no in (?)"
    let aParameter = [shopId, date, productNos];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.deleteByShopIdAndDate = async function (shopId, date) {
    let sql = "delete from ExcludeBestProducts where shop_id = ? and date = ?"
    let aParameter = [shopId, date];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.getProductByTopOrderCount = async function (startDateTime, endDateTime, size, productNos) {
    //console.log(startDateTime, endDateTime, productNos, size, 'productNos')
    if(productNos) productNos = productNos.split(",").map(item => parseInt(item));
    let sql = "select p.*, p.product_no as id, max(p.price) as price,"
    sql += " sum(dps.total_order_count) as totalOrderCount, sum(dps.total_view_count) as totalViewCount"
    sql += " from DailyProductStats dps"
    sql += " join Products p on dps.product_no = p.product_no"
    sql += " where dps.created_at >= ? and dps.created_at <= ?"
    let aParameter = [startDateTime, endDateTime];

    if(productNos) {
        sql += " AND p.product_no IN (?)"
        aParameter.push(productNos)
    }

    sql += " GROUP BY p.product_no"
    sql += " ORDER BY SUM(dps.total_order_count) DESC, SUM(dps.total_view_count) DESC, MAX(p.price) DESC, p.product_no DESC"
    sql += " LIMIT ?"
    aParameter.push(size);

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.findByShopIdAndDateAndProductNo = async function (shopId, date, productNo) {
    let sql = "select * from ExcludeBestProducts where shop_id = ? and date= ? and product_no = ?";
    let aParameter = [shopId, date, productNo];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.addExcludeBestProducts = async function (excludeBestProductId, shopId, date, productNo) {
    let sql = "insert into ExcludeBestProducts (exclude_best_product_id, created_at, shop_id, updated_at, date, product_no) values (?, NOW(), ?, NOW(), ?, ?) ";
    let aParameter = [excludeBestProductId, shopId, date, productNo];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.getDashboardViews = async function (date, days) {
   let sql = "select * from DailyProductStats";
   let aParameter = [date, days];

   let query = mysql.format(sql, aParameter);
   try {
        let res = await pool.query(query);
        return res;
   }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
   }
}

exports.update = async function (productNo, shopId, updatedAt,
                                  clearanceCategoryEng, clearanceCategoryKor, createdDate,
                                  customProductCode, detailImg, listImg, display,
                                  engProductName, modelName, price, priceContent, priceExcludingTax, productCode,
                                  productCondition, productName, productTag, retailPrice, selling, shopNo,
                                  smallImg, soldOut, summaryDescription, supplyPrice, supplyProductName,
                                  tinyImg, updatedDate) {
    let sql = "update Products set shop_id=?, updated_at=?, clearance_category_eng=?, clearance_category_kor=?,"
    sql += " created_date=?, custom_product_code=?, detail_image=?, list_image=?, display=?, eng_product_name=?, model_name=?, price=?,"
    sql += " price_content=?, price_excluding_tax=?, product_code=?, product_condition=?, product_name=?, product_tag=?, retail_price=?, selling=?, shop_no=?,"
    sql += " small_image=?, sold_out=?, summary_description=?, supply_price=?, supply_product_name=?, tiny_image=?, updated_date=?"
    sql += " where product_no = ?"

    let aParameter = [
        shopId, updatedAt,
        clearanceCategoryEng, clearanceCategoryKor, createdDate,
        customProductCode, detailImg, listImg, display,
        engProductName, modelName, price, priceContent, priceExcludingTax, productCode,
        productCondition, productName, productTag, retailPrice, selling, shopNo,
        smallImg, soldOut, summaryDescription, supplyPrice, supplyProductName,
        tinyImg, updatedDate, productNo
    ];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.updateCategoryProduct = async function (product_no, category_no, shop_id) {
    let id = generateId();
    let sql = "insert into ProductsCategories (category_product_id, product_no, category_no, shop_id)";
    sql += " values (?, ?, ?, ?)"
    let aParameter = [id, product_no, category_no, shop_id];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.getCategoriesByProductNo = async function (productNo) {
    let sql = "select * from Categories c"
    sql += " inner join ProductsCategories pc on pc.category_no = c.category_no"
    sql += " where pc.product_no = ?";
    let aParameter = [productNo];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.findDailyProductStats = async function (productNo, date) {
    let sql = "select * from DailyProductStats where product_no in (?)"
    // sql += " and date = ?";
    let aParameter = [productNo, date];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.setRecommendProduct = async function (product, dailyProductStat, recommendWeight) {
    let sql = ""
}

exports.findFirstByOrderByUpdatedAtAsc = async function () {
    let sql = "select * from Products order by updated_at ASC limit 1"
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

exports.findByShopIdAndDate = async function (shopId, date) {
    let sql = "select * from ExcludeBestProducts where shop_id =? and date = ?"
    let aParameter = [shopId, date];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.findTop1ByOrderByCreatedAtDesc = async function () {
    let sql = "select * from ApplyProducts order by created_at desc limit 1";
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

exports.getZigzagSellData = async function (resData, type, date) {
    let sql = "INSERT INTO ZigzagSellData (order_no, product_no, product_name, type, date) VALUES (?, ?, ?, ?, ?)";
    let results = [];

    try {
        for (let i = 0; i < resData.length; i++) {
            let aParameter = [resData[i]['상품주문번호'], resData[i]['상품번호'], resData[i]['상품명'], type, date]; // resData 요소에 따라 변경
            let query = mysql.format(sql, aParameter);
            let res = await pool.query(query);
            results.push(res[0]); // 결과를 배열에 추가
        }
        return results; // 모든 결과 반환
    } catch (e) {
        console.log('db err', e);
        return { 'data': '-9999' };
    }
}

exports.getZigzagData = async function (shopId, page, size) {
    page = parseInt(page) || 1
    size = parseInt(size)
    const offset = (page - 1) * size; // 시작 오프셋 계산
    let sql = "select *, DATE_FORMAT(date, '%Y-%m-%d') as `orderDt`"
    sql += " from ZigzagSellData"
    sql += " order by date desc"
    sql += " limit "+offset+", "+size
    let aParameter = [page, size, size];

    let query = mysql.format(sql, aParameter);
    try {
       let res = await pool.query(query);
       return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.getZigzagTotalCnt = async function () {
    let sql = "select COUNT(*) as `cnt`"
    sql += " from ZigzagSellData"
    sql += " order by date desc"

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

exports.getZigzagIncrease = async function (shopId, date) {
    let sql = "select increase.*"
    sql += " from (SELECT p3.product_no, p3.count_3_days_ago, p4.count_4_days_ago,"
    sql += " (p3.count_3_days_ago - p4.count_4_days_ago) AS increase_amount"
    sql += " FROM"
    sql += " (SELECT product_no, COUNT(*) AS count_3_days_ago"
    sql += " FROM ZigzagSellData"
    sql += " WHERE date = (?) - INTERVAL 3 DAY"
    sql += " GROUP BY product_no) p3" //해당날짜 직전 3일전의 판매 데이터
    sql += " JOIN"
    sql += " (SELECT product_no, COUNT(*) AS count_4_days_ago"
    sql += " FROM ZigzagSellData"
    sql += " WHERE date = (?) - INTERVAL 4 DAY"
    sql += " GROUP BY product_no) p4" //해당날짜 직직전 4일전의 판매 데이터
    sql += " ON p3.product_no = p4.product_no"
    sql += " WHERE p3.count_3_days_ago > p4.count_4_days_ago * 1.1) as `increase`"
    sql += " ORDER BY increase_amount DESC"
    sql += " limit 20"

    let aParameter = [date, date];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.getZigzagSalesTrend = async function (shopId, date) {
    let sql = "select product_no, COUNT(*) as `orderEa`"
    sql += " from ZigzagSellData"
    sql += " where date = (?) - INTERVAL 1 DAY"
    sql += " group by product_no"
    sql += " HAVING orderEa >= 5"
    sql += " order by orderEa desc"
    let aParameter = [date];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.getZigzagGragh = async function (shopId, productNos) {
    let sql = "select product_no,"
    sql += " product_name,"
    //sql += " (select product_name from ZigzagSellData sub where sub.product_no = product_no limit 1) as `product_name`,"
    sql += " DATE_FORMAT(`date`, '%Y-%m-%d') as `orderDt`,"
    sql += " COUNT(*) as `orderEa`";
    sql += " from ZigzagSellData"
    sql += " where product_no in (?)"
    sql += " AND `date` >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    sql += " group by product_no, orderDt, product_name";
    /*
    let sql = "select product_no,"
    sql += " DATE_FORMAT(`date`, '%Y-%m-%d') as `orderDt`,"
    sql += " COUNT(*) as `orderEa` from ZigzagSellData"
    sql += " where product_no in (?)"
    sql += " group by product_no, orderDt"
     */

    let aParameter = [productNos];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}

exports.deleteZigzagData = async function (orderNo) {
    let sql = "delete from ZigzagSellData where order_no in (?)";
    let aParameter = [orderNo];

    let query = mysql.format(sql, aParameter);
    try {
        let res = await pool.query(query);
        return res;
    }catch (e) {
        console.log('db err', e);
        return {'data': '-9999'}
    }
}
