const DateTimeUtils = require('../../utils/datetime.utils');
const fashionTrendModel = require('../../model/fashiontrends/fashiontrends.model')
const { v4: uuidv4 } = require('uuid');
const KeywordType = {
    NAVER_DATALAB_AGE_20: { name: "데이터랩 20대", defaultWeight: 50 },
    NAVER_DATALAB_AGE_30: { name: "데이터랩 30대", defaultWeight: 50 },
    ZIGZAG: { name: "지그재그", defaultWeight: 50 },
    ABLY_AGE_20_LATE: { name: "에이블리 20대 후반", defaultWeight: 50 },
    ABLY_AGE_30_PLUS: { name: "에이블리 30대 이상", defaultWeight: 50 },
    BRANDY: { name: "브랜디", defaultWeight: 50 },
};

exports.createFashionTrend = async function (shopId) {
    return {
        id: uuidv4(),
        shopId: shopId,
        createdAt: new Date(),
        crawlLogs: []
    };
}

