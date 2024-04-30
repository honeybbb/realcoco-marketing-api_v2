'use strict';

const productService = require('../service/product/product.service');
const fashionTrendService = require('../service/fashiontrends/fashiontrend.service');
const fashionTrendStatService = require('../service/fashiontrends/fashiontrend.stat.service');

module.exports = function (app) {
    app.get('/api/v1/:shopId/dashboards/customer/best', async (req, res) => {
        let shopId = req.params.shopId;

        const products = await productService.getCustomerBest(new Date(), 3, 3);

        res.json({'result':true, 'data': products});
    });

    app.get('/api/v1/:shopId/dashboards/keywords/rank', async (req, res) => {
        let shopId = req.params.shopId;
        let date = new Date();  // 현재
        date.setDate(date.getDate() - 1);  // 어제 날짜로 설정

        let yyyy = date.getFullYear();
        let mm = String(date.getMonth() + 1).padStart(2, '0');  // 월은 0부터 시작하므로 1을 더해줍니다.
        let dd = String(date.getDate()).padStart(2, '0');

        let yesterday = `${yyyy}-${mm}-${dd}`;

        let fashionTrendKeywords = await fashionTrendService.getFashionTrend(yesterday);
        fashionTrendKeywords = fashionTrendKeywords.slice(0, 20);

        const result = [];
        for (let ftk of fashionTrendKeywords) {
            const rank = await fashionTrendService.getKeywordDailyRank(ftk.keyword, yesterday);
            result.push(rank);
        }

        console.log(result, 'getKeywordDailyRank')

        res.json({ contents: result });
    });

    app.get('/api/v1/:shopId/dashboards/products/rank', async (req, res) => {
        let shopId = req.params.shopId;
        let date = new Date();  // 현재
        date.setDate(date.getDate() - 1);  // 어제 날짜로 설정

        date.setDate(date.getDate() - 1);  // 어제 날짜로 설정

        let yyyy = date.getFullYear();
        let mm = String(date.getMonth() + 1).padStart(2, '0');  // 월은 0부터 시작하므로 1을 더해줍니다.
        let dd = String(date.getDate()).padStart(2, '0');

        let yesterday = `${yyyy}-${mm}-${dd}`;

        const fashionTrend = await fashionTrendService.getFashionTrend(yesterday);

        const productsSortByRank = await fashionTrendService.getProductsSortByRank(fashionTrend);
        productsSortByRank.slice(0, 20)

        let result = await fashionTrendService.getProductDailyRank(productsSortByRank, yesterday)

        /*
        let result = await Promise.all(
            productsSortByRank.slice(0, 20).map(async p => {
                return await fashionTrendStatService.getProductDailyRank(p, yesterday);
            })
        );

         */

        res.json({ 'result':true, 'data': result });
    });

    app.get('/api/v1/:shopId/dashboards/products/stat', async (req, res) => {
        const shopId = req.params.shopId;

        const today = new Date();
        const days = 8;

        const stats = await productService.getDashboardStats(today, days);

        res.json({ 'result':true, 'data': stats });
    });
}
