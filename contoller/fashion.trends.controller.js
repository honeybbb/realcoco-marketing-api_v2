'use strict';

const fashionTrendService = require("../service/fashiontrends/fashiontrend.service");
const productService = require('../service/product/product.service');

const KeywordType = {
    NAVER_DATALAB_AGE_20: { name: "데이터랩 20대", defaultWeight: 50 },
    NAVER_DATALAB_AGE_30: { name: "데이터랩 30대", defaultWeight: 50 },
    ZIGZAG: { name: "지그재그", defaultWeight: 50 },
    ABLY_AGE_20_LATE: { name: "에이블리 20대 후반", defaultWeight: 50 },
    ABLY_AGE_30_PLUS: { name: "에이블리 30대 이상", defaultWeight: 50 },
    BRANDY: { name: "브랜디", defaultWeight: 50 },
};

module.exports = function (app) {
    app.get('/api/v1/:shopId/fashion-trends', async (req, res) => {
        const shopId = req.params.shopId;
        const date = req.query.date,
            size = req.query.size || 20;

        //console.log(shopId, date)
        let keywords = await fashionTrendService.getFashionTrend(date)
        keywords.slice(0, size)

        res.json({ 'result':true, 'data': keywords });
    });

    app.get('/api/v1/:shopId/fashion-trends/keywords', async function (req, res) {
        const shopId = req.params.shopId;
        const date = req.query.date;

        const keywordTypes = Object.values(KeywordType);

        try {
            // 모든 키워드 타입에 대한 요청을 동시에 시작합니다.
            const promises = keywordTypes.map(kt =>
                fashionTrendService.getFashionTrendKeywordsByKeywordType(date, kt)
            );

            // Promise.all을 사용하여 모든 요청이 완료될 때까지 기다립니다.
            const responses = await Promise.all(promises);

            // 결과 처리
            const result = responses.map((keywords, index) => ({
                keywordType: keywordTypes[index],
                keywords: keywords.map(k => ({ name: k.keyword.name, rank: k.rank })).slice(0, 10)
            }));

            // 응답 보내기
            res.json(result);
        } catch (error) {
            // 에러 처리
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
/*
        let result = [];

        for(const kt of keywordTypes) {
            let keywords = await fashionTrendService.getFashionTrendKeywordsByKeywordType(date, kt)
            keywords = keywords.map(k => {return {name:k.keyword.name, rank:k.rank}}).slice(0, 10);

            result.push({
                keywordType: kt,
                keywords: keywords
            })

        }

 */
/*
        const keywords = keywordTypes.map(async kt => {
            await fashionTrendService.getFashionTrendKeywordsByKeywordType(date, kt)
                //.map(k => k.keyword.name)
                //.slice(0, 10);

            return {
                keywordType: kt,
                keywords: keywords
            };
        })

 */

        //const fashionTrendKeywords = await fashionTrendService.getFashionTrendKeywordsByKeywordType(date);

        //const keywords = fashionTrendKeywords.map(k => k.keyword.map(word => word.name)).slice(0, 10);
        //const keywords = fashionTrendKeywords.map(k => /*k.keyword.map(word => word.name)*/ k.keyword.name).slice(0, 10);

        //res.json({'result':true, 'data': result});

    });

    app.get('/api/v1/:shopId/fashion-trends/keywords/score/daily', async (req, res) => {
        const shopId = req.params.shopId;
        let keywordIds = req.query.keywordIds,
            endDate = req.query.endDate;

        keywordIds = keywordIds.split(',');

        let result = await Promise.all(
            keywordIds.map(kid => fashionTrendService.getDailyKeywordScore(kid, endDate))
        );

        res.json({ 'result':true, 'contents': result });
    });

    app.put('/api/v1/:shopId/custom-fashion-trends', async function (req, res) {
        const shopId = req.params.shopId;
        const request = req.body;

        //const keywords = ["하객룩", "원피스", "투피스", "가디건", "자켓", "가방", "트레이닝세트", "오프숄더", "맨투맨", "롱치마"]

        /*
        crawlerType: "BRANDY",
        date: "2024-02-27",
        keywords: ["하객룩", "원피스", "투피스", "가디건", "자켓", "가방", "트레이닝세트", "오프숄더", "맨투맨", "롱치마"]
        const date = req.body.date,
            crawlType = req.body.crawlType,
            keywords = req.body.keywords;

         */

        // 이 메서드는 요청에서 지정된 키워드들과 크롤러 타입을 가지고 패션 트렌드를 저장하고,
        // 이 패션 트렌드에 연결된 크롤 로그를 업데이트 하는 역할
        let result = await fashionTrendService.putCustomFashionTrend(shopId, request);
        res.json({'result': true, 'data': result})

        //let result = fashionTrendService.applyFashionFrendsCategoryProducts()

        //res.json({'result': true, 'data': result})
        /*
        "result": {
            "content": {
                "keywordType": "BRANDY",
                "keywords": [
                    {
                        "rank": 1,
                        "name": "하객룩"
                    },
                    {
                        "rank": 2,
                        "name": "원피스"
                    },
                    {
                        "rank": 3,
                        "name": "투피스"
                    },
                    {
                        "rank": 4,
                        "name": "가디건"
                    },
                    {
                        "rank": 5,
                        "name": "자켓"
                    },
                    {
                        "rank": 6,
                        "name": "가방"
                    },
                    {
                        "rank": 7,
                        "name": "트레이닝세트"
                    },
                    {
                        "rank": 8,
                        "name": "오프숄더"
                    },
                    {
                        "rank": 9,
                        "name": "맨투맨"
                    },
                    {
                        "rank": 10,
                        "name": "롱치마"
                    }
                ],
                "title": "브랜디"
            }
        }*/
    })

    app.get('/api/v1/:shopId/fashion-trends/products/apply', async function (req, res) {
        const shopId = req.params.shopId;
        let products = await productService.getApplyProducts(shopId);

        res.json({'result': true, 'contents': products})
    })

    app.put('/api/v1/:shopId/fashion-trends/products/apply', async function (req, res) {
        const shopId = req.params.shopId,
            productNosJson =  req.body.productNosJson,
            createdAt = new Date(),
            updatedAt = new Date();

        let result = await productService.saveApplyProduct(productNosJson, shopId, createdAt, updatedAt)
        res.json({'result': true, 'contents': result})

    })

    app.get('/api/v1/:shopId/fashion-trends/products/score/daily', async function (req, res) {
        const shopId = req.params.shopId;
        const { productNos, endDate } = req.query;

        if(!productNos || !endDate) {
            return res.status(400).send({ error: 'productNos and endDate are required.' });
        }

        // productNos를 콤마(,)로 분리하여 배열로 변환합니다.
        const productIds = productNos.split(',').map(id => parseInt(id.trim(), 10));

        try {
            const results = await Promise.all(
                productIds.map(productId => fashionTrendService.getDailyProductScore(productId, endDate))
            );

            res.json({ 'result': true, data:results });
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    })

    app.get('/api/v1/:shopId/fashion-trends/products/:productNo/score/daily', async function (req, res) {
        const shopId = req.params.shopId;
        const { productNo, endDate } = req.query;

        const result = fashionTrendService.getDailyProductScoreDetail(productNo, endDate);

        res.json({'result': true, 'data': result})
    })
}
