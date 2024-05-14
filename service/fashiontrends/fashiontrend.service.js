const fashionTrendsModel = require('../../model/fashiontrends/fashiontrends.model')
const DateTimeUtils = require("../../utils/datetime.utils");
const productService = require('../../service/product/product.service')
const {getCafe24AccessToken} = require("../auth/cafe24/cafe24.auth.service");
const productModel = require('../../model/product/product.model');
const crypto = require("crypto");
const KeywordType = {
    NAVER_DATALAB_AGE_20: { name: "데이터랩 20대", defaultWeight: 50 },
    NAVER_DATALAB_AGE_30: { name: "데이터랩 30대", defaultWeight: 50 },
    ZIGZAG: { name: "지그재그", defaultWeight: 50 },
    ABLY_AGE_20_LATE: { name: "에이블리 20대 후반", defaultWeight: 50 },
    ABLY_AGE_30_PLUS: { name: "에이블리 30대 이상", defaultWeight: 50 },
    BRANDY: { name: "브랜디", defaultWeight: 50 },
};

function generateId() {
    const buffer = crypto.randomBytes(8);
    const id = buffer.readBigUInt64BE() % BigInt(9223372036854775807);
    return id.toString();
}

const formatter = function (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const yesterday = function (date) {
    //date.setDate(date.getDate() - 14); // 14일 전의 날짜를 계산
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate() - 1).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const twoWeeksAgo = function (date) {
    date.setDate(date.getDate() - 14); // 14일 전의 날짜를 계산
    //const year = date.getFullYear();
    //const month = String(date.getMonth() + 1).padStart(2, '0');
    //const day = String(date.getDate() - 13).padStart(2, '0');
    //return `${year}-${month}-${day}`;
    return date
};

function KeywordTypeAll() {
    return Object.values(KeywordType);
}

exports.applyFashionFrendsCategoryProducts = async function () {
    let accessToken = getCafe24AccessToken();
    const categoryNo = '1125L'; // TODO : shop 설정에서 설정한 값을 불러와야 함.
    let queryMap = {};
    queryMap.put('display_group', '1L');

    // 기존 목록 얻기
    const getCategoryProducts = getCategoryProducts(accessToken)
    const categoryProducts = getCategoryProducts();
}

const getCategoryProducts = function (token) {
    let result;
    return result
}
const CrawlerType = {
    NAVERDATALAB: {
        parse: function(crawlLog) {
            console.log('NAVERDATALAB');
            const age20Key = "age20Key";
            const age30Key = "age30Key";

            if (!crawlLog.status) {
                return [];
            }

            //const result = JSON.parse(crawlLog.result_json);
            let result_json = crawlLog.result_json.replace(/(\b\d{10,}\b)/g, '"$1"');
            let result = JSON.parse(result_json);
            //console.log(result, 'age20Keywords')
            const age20Keywords = result[age20Key] ? result[age20Key].map(x => BigInt(x)) : [];
            const age30Keywords = result[age30Key] ? result[age30Key].map(x => BigInt(x)) : [];


            return [
                { type: KeywordType.NAVER_DATALAB_AGE_20, keywords: age20Keywords },
                { type: KeywordType.NAVER_DATALAB_AGE_30, keywords: age30Keywords }
            ];
        }
    },
    ZIGZAG: {
        parse: function(crawlLog) {
            console.log('ZIGZAG');
            // key = "ids";
            const key = "ids";

            if (!crawlLog.status) {
                return [];
            }

            //const result = JSON.parse(crawlLog.result_json);
            let result_json = crawlLog.result_json.replace(/(\b\d{10,}\b)/g, '"$1"');
            let result = JSON.parse(result_json);
            const keywordIds = result[key] ? result[key].map(x => BigInt(x)) : [];

            return [{ type: KeywordType.ZIGZAG, keywords: keywordIds }];
        }
    },
    ABLY_AGE_20_LATE: {
        parse: function(crawlLog) {
            return parseDefault(crawlLog, KeywordType.ABLY_AGE_20_LATE);
        }
    },
    ABLY_AGE_30_PLUS: {
        parse: function(crawlLog) {
            return parseDefault(crawlLog, KeywordType.ABLY_AGE_30_PLUS);
        }
    },
    BRANDY: {
        parse: function(crawlLog) {
            return parseDefault(crawlLog, KeywordType.BRANDY);
        }
    }
};

function parseDefault(crawlLog, keywordType) {
    if (!crawlLog.status) {
        return [];
    }

    let result_json = crawlLog.result_json.replace(/(\b\d{10,}\b)/g, '"$1"');
    let keywordIds = JSON.parse(result_json).map(x => BigInt(x));
    //const keywordIds = JSON.parse(crawlLog.result_json).map(x => BigInt(x));

    return [{ type: keywordType, keywords: keywordIds }];
}

// 특정 제품(Product)의 최근 14일 동안의 일일 순위(ProductDailyRank)를 계산
exports.getProductDailyRank = async function (product, endDate) {
    let result = [];
    let date = endDate;

    while (true) {
        const fashionTrends = await this.getFashionTrend(date);

        const productsSortByRank = getProductsSortByRank(fashionTrends).slice(0, 20);

        let rank = -1;

        for (let i = 0; i < productsSortByRank.length; i++) {
            const p = productsSortByRank[i];

            if (p.id === product.id) {
                rank = i + 1;
                break;
            }
        }

        const dailyRank = { date: date, rank: rank };

        result.push(dailyRank);

        if (date.equals(endDate)) {
            break;
        }

        date = date.add(1, 'day');
    }

    return { product: product, result: result };
}

let getProductsSortByRank = async function (keywords) {
    let result = [];
    let products = keywords.map(k => /*console.log(k)*/k)

    while (true) {
        const pollFirsts = products
            .filter(list => list.length > 0)
            .map(list => list.shift())
            .filter(Boolean);

        if (pollFirsts.length === 0) {
            break;
        }

        result.push(...pollFirsts);
    }

    return result
}

exports.getKeywordDailyRank1 = async function (keywordPool, endDate) {
    let date = twoWeeksAgo(new Date(endDate));
    let promises = [];

    while (true) {
        let currentDate = formatter(new Date(date));
        promises.push(getFashionTrendKeywords(currentDate).then(fashionTrendKeywords => {
            const rank = fashionTrendKeywords.find(k => k.keyword.id === keywordPool.id)?.rank ?? -1;
            return { date: currentDate, rank };
        }));

        if (date == endDate) break;
        date = new Date(date).setDate(new Date(date).getDate() + 1); // 다음 날짜로 이동
    }

    const allRanks = await Promise.all(promises);
    return { keyword: keywordPool, ranks: allRanks };
}
exports.getKeywordDailyRank1 = async function (keywordPool, endDate) {
    let result = [];
    let date = twoWeeksAgo(new Date(endDate));

    while (true) {
        const fashionTrendKeywords = await getFashionTrendKeywords(date)
        const rank = fashionTrendKeywords.find(k => k.keyword.id === keywordPool.id)?.rank ?? -1;

        const dailyScore = {};
        dailyScore.date = formatter(new Date(date));
        dailyScore.rank = rank
        result.push(dailyScore);

        console.log(date, endDate)

        if (date == endDate) {
            break;
        }

        date = formatter(new Date(new Date(date).setDate(new Date(date).getDate() + 1))) // 다음 날짜로 이동합니다.
    }

    return { keyword: keywordPool, ranks: result };
}

exports.getFashionTrend = async function (date) {
    const prevDate = yesterday(new Date(date))  //이전날짜

    const [keywords, keywordsSub1] = await Promise.all([
        getFashionTrendKeywords(date),
        getFashionTrendKeywords(prevDate)
    ]);

/*
    // 주어진 날짜에 대한 패션 키워드 가져오기
    const keywords = await getFashionTrendKeywords(date);
    // 이전 날짜(주어진 날짜 - 1일)에 대한 패션 트렌드 키워드 가져오기
    const keywordsSub1 = await getFashionTrendKeywords(prevDate);

 */
    // 두 날짜에 대한 패션 트렌드 키워드 간의 차이를 계산합니다.
    await calcDiff(keywords, keywordsSub1)

    // 패션 트렌드에 따른 상품을 생성합니다.
    await productService.makeFashionTrendProducts(date, keywords);
    return keywords
}

function plusDays(date) {
    const result = new Date(date);
    result.setDate(result.getDate() + 1);
    return result;
}


exports.getDailyProductScore = async function (productNo, endDate) {
    let result = [];
    let endDateObj = new Date(endDate);
    let date = new Date(endDateObj);
    date.setDate(date.getDate() - 13);

    while (true) {
        const score = await productService.getProductOrderCountMap(productNo, formatter(date), 1);

        const dailyScore = {
            date: formatter(date),
            score: score
        };

        result.push(dailyScore);

        if (date >= endDateObj) {
            break;
        }

        date.setDate(date.getDate() + 1);
    }

    return {
        productNo: productNo,
        scores: result
    };
}

const calcDiff = function (changed, origin){
    let originRankMap = {};
    origin.forEach(ftk => {
        originRankMap[ftk.keyword.id] = ftk.rank;
    });

    changed.forEach(ftk => {
        let originRank = originRankMap[ftk.keyword.id];

        if (originRank === undefined) {
            return;
        }

        ftk.diff = originRank - ftk.rank;
    });

    //return originRankMap;

    /*
    origin.forEach(f => originRankMap[f.keywordId] = f.score);

    for (let ftk of changed) {
        const originRank = originRankMap[ftk.keywordId];

        if (originRank !== undefined) {
            ftk.diff = originRank - ftk.score;
        }
    }

     */
}
let getFashionTrendKeywords = async function (date) {
    const crawlLogByDate = await getCrawlLogByDate(date)
    const keywords = await getKeywords(crawlLogByDate, KeywordTypeAll());

    return calcFashionTrendKeyword(keywords)
}


let getByDate = async function (date) {
    const startedAt = DateTimeUtils.toStartTimeOfDay(date);
    const endedAt = DateTimeUtils.toEndTimeOfDay(date);

    const fashionTrends = await fashionTrendsModel.findByCreatedAt(startedAt, endedAt);

    return fashionTrends;
}

// 키워드 목록을 받아서 각 키워드에 대한 패션 트렌드를 계산하는 기능
let calcFashionTrendKeyword1 = async function (keywords) {
    // 패션 트렌드 가중치 서비스를 통해 패션 트렌드 가중치 정보를 가져와서, 그것을 키워드 타입과 가중치를 가지는 맵으로 변환
    const MAX_LENGTH = 60

    // 가중치 맵을 초기화합니다.
    let weightMap = {};
    const fashionTrendWeights = await fashionTrendsModel.getFashionTrendWeights();
    // 최근 저장된 가중치값이 없을 때, 기본 가중치 맵 사용
    if(fashionTrendWeights.length == 0) {
        weightMap = KeywordTypeAll()
    } else {
        fashionTrendWeights.forEach(weight => {
            weightMap[weight.type] = weight.weight;
        });
    }

    //console.log(weightMap, '가중치')
    function cutLength(list, maxLength) {
        console.log(list, 'list')
        return;
        if (list.length <= maxLength) {
            return list;
        } else {
            return list.slice(0, maxLength);
        }
    }

    // 키워드별로 점수를 계산합니다.
    const keywordScores = {};
    keywords.forEach(keyword => {
        //console.log(keyword, 'kk')
        const keywordIds = cutLength(keyword.keywordIds, MAX_LENGTH);
        keywordIds.forEach((kid, index) => {
            const rankScore = keywordIds.length - index;
            const score = getScore(rankScore, weightMap[keyword.type]);
            if (keywordScores[kid]) {
                keywordScores[kid] += score;
            } else {
                keywordScores[kid] = score;
            }
        });

    });

    //console.log(keywordScores)

    const fashionTrendKeywords = [];
    for (const keywordId in keywordScores) {
        const keywordPool = await fashionTrendsModel.getRequiredKeywordPool(keywordId);
        const score = keywordScores[keywordId];
        // console.log(keywordPool, 'keywordPool')
        // console.log(score, 'score')
        // 키워드 풀과 키워드의 점수를 인자로 받아 패션 트렌드 키워드 객체를 생성
        fashionTrendKeywords.push({keywordPool, score});
    }

    //console.log(fashionTrendKeywords, 'fashionTrendKeywords')

    fashionTrendKeywords.sort((a, b) => b.score - a.score);
    //FashionTrendKeyword.calcRank(fashionTrendKeywords);

    return fashionTrendKeywords;

    // 각 키워드에 대해 키워드와 점수의 쌍을 가져오기
    // 같은 키워드 ID에 대해 여러 점수가 있다면 점수를 합산
    // KeywordPool을 가져와서 FashionTrendKeyword 객체를 생성
        /*[
            {
                "diff": 18,
                "keyword": {
                    "id": "3737686347494816465",
                    "name": "블라우스"
                },
                "score": 800,
                "rank": 1,
                "products": [
                    {
                        "id": "15193",
                        "productName": "[재진행] 아이즈 피치 기모 블라우스 - 2 Color (겨울/베이직)",
                        "internalProductName": "아이즈피치기모블라우스",
                        "price": 37000.00,
                        "display": "F",
                        "selling": "F",
                        "detailImage": "https://realcoco.com/web/product/big/202012/1ff8188774f64c7b7bb03f66635a53db.jpg",
                        "listImage": "https://realcoco.com/web/product/medium/202012/5df5c920c884c87c7714001b2c1f8080.gif",
                        "tinyImage": "https://realcoco.com/web/product/tiny/202012/6bf028dfcc5033e34b92ecfc49c04cc6.gif",
                        "smallImage": "https://realcoco.com/web/product/small/202012/4335e418d770ca59ad7e6a4bce2e3421.gif",
                        "createdDate": "2020-12-21 08:19:18",
                        "updatedDate": "2023-07-27 08:26:11",
                        "soldOut": "T",
                        "link": "https://realcoco.com/front/php/product.php?product_no=15193",
                        "displayProductName": "아이즈피치기모블라우스"
                    }
                ]
            }
        ]*/
}

let calcFashionTrendKeyword = async function (keywords) {
    const weightMap = await getFashionTrendWeights();

    // Promise.all을 사용하여 모든 키워드 점수 계산을 병렬로 실행
    const keywordScoresPromises = keywords.map(k => getKeywordAndScores(k, weightMap));
    const keywordScoresArrays = await Promise.all(keywordScoresPromises);
    const keywordScores = keywordScoresArrays.flat(); // 배열을 평탄화

    const keywordScoreMap = {};
    keywordScores.forEach(score => {
        const keywordId = score.keywordId;
        const currentScore = keywordScoreMap[keywordId] || 0;
        keywordScoreMap[keywordId] = currentScore + score.score;
    });

    const fashionTrendKeywords = [];

    // Promise.all을 사용하여 모든 키워드 풀 조회를 병렬로 실행
    const keywordIds = Object.keys(keywordScoreMap);
    const keywordPoolsPromises = keywordIds.map(async (keywordId) => {
        const keywordPool = await fashionTrendsModel.getRequiredKeywordPool(keywordId);
        return { keywordId, keywordPool };
    });
    const keywordPools = await Promise.all(keywordPoolsPromises);

    keywordPools.forEach(({ keywordId, keywordPool }) => {
        if (keywordPool) {
            const fashionTrendKeyword = {
                keyword: keywordPool,
                score: keywordScoreMap[keywordId]
            };
            fashionTrendKeywords.push(fashionTrendKeyword);
        }
    });

    fashionTrendKeywords.sort((a, b) => b.score - a.score);

    await calcRank(fashionTrendKeywords);

    return fashionTrendKeywords;
}

let calcFashionTrendKeyword2 = async function (keywords) {
    const weightMap = await getFashionTrendWeights();
    //console.log(keywords)
    const keywordScores = [];
    for (const k of keywords) {
        const score = await getKeywordAndScores(k, weightMap)
        keywordScores.push(...score);
    }

    const keywordScoreMap = {};
    keywordScores.forEach(score => {
        const keywordId = score.keywordId;
        const currentScore = keywordScoreMap[keywordId] || 0;
        keywordScoreMap[keywordId] = currentScore + score.score;
    });


    const fashionTrendKeywords = [];
    for (const keywordId in keywordScoreMap) {
        const score = keywordScoreMap[keywordId];

        if (keywordScoreMap.hasOwnProperty(keywordId)) {    //객체가 특정 프로퍼티에 대한 소유 여부
            const keywordPool = await fashionTrendsModel.getRequiredKeywordPool(keywordId);
            if(keywordPool) {
                const fashionTrendKeyword = {
                    keyword:keywordPool,
                    score
                };

                fashionTrendKeywords.push(fashionTrendKeyword);
            }

        }
    }

    fashionTrendKeywords.sort((a, b) => {return b.score - a.score});

    await calcRank(fashionTrendKeywords);

    return fashionTrendKeywords;
}

let getFashionTrendWeights = async function () {
    let weightMap = await fashionTrendsModel.getFashionTrendWeights();
    if(weightMap.length == 0) {
        weightMap = KeywordTypeAll()
    } else {
        weightMap.forEach(weight => {
            weightMap[weight.type] = weightMap[weight.weight]
        })
    }

    return weightMap
}

const calcRank = async function (fashionTrends) {
    for (let i = 0; i < fashionTrends.length; i++) {
        let rank = i + 1;
        fashionTrends[i].rank = rank;
    }

    return fashionTrends
}
// 크롤링 로그들(crawlLogs)에서 특정 키워드 타입(keywordTypes)을 가진 키워드들을 추출하는 기능
const getKeywords = async function (crawlLogs, keywordTypes) {
    let keywords = [];

    // 모든 로그에 대한 작업을 병렬로 처리하기 위해 map과 Promise.all을 사용
    const promises = crawlLogs.map(async (log) => {
        let keywordType = log.type === 0 ? 'NAVERDATALAB' : Object.keys(KeywordType)[log.type + 1];
        const parsedKeywords = await CrawlerType[keywordType].parse(log).flat();

        // Array.isArray로 keywordTypes가 배열인지 확인 후 조건에 맞는 키워드만 필터링
        if (!Array.isArray(keywordTypes)) {
            return parsedKeywords.filter(k => k.type.name == keywordTypes.name);
        } else {
            return parsedKeywords.filter(k => keywordTypes.includes(k.type));
        }
    });

    // 모든 프로미스가 완료될 때까지 기다린 후 결과를 합침
    const results = await Promise.all(promises);
    keywords = results.flat(); // 결과가 배열의 배열로 되어있으므로 flat을 사용하여 단일 배열로 만듦

    return keywords;
}
const getKeywords1 = async function (crawlLogs, keywordTypes) {
    // crawlLogs.map(log => console.log(Object.keys(KeywordType)[log.type]));
    let keywords = [];

    for (const log of crawlLogs) {
        // console.log(log.type, Object.keys(KeywordType)[log.type])
        let keywordType = log.type === 0 ? 'NAVERDATALAB' : Object.keys(KeywordType)[log.type + 1];

        /*
            NAVER_DATALAB_AGE_20: { name: "데이터랩 20대", defaultWeight: 50 },
            NAVER_DATALAB_AGE_30: { name: "데이터랩 30대", defaultWeight: 50 },
            ZIGZAG: { name: "지그재그", defaultWeight: 50 },
            ABLY_AGE_20_LATE: { name: "에이블리 20대 후반", defaultWeight: 50 },
            ABLY_AGE_30_PLUS: { name: "에이블리 30대 이상", defaultWeight: 50 },
            BRANDY: { name: "브랜디", defaultWeight: 50 },
         */

        const parsedKeywords = await CrawlerType[keywordType].parse(log).flat();

        /*
        parsedKeywords = [
           {
             type: { name: '에이블리 30대 이상', defaultWeight: 50 },
             keywords: [
               3737011286236497400,
               3737011286322633000,
               3737686829090330600,
               3737011286355225000,
               3737011286374971400,
               3742037943917904000,
               3737012032851430400,
               3737011286479222000,
               3737012033017555500,
               3747095794574320000
             ]
           }
         ]
         */
        //keywords = keywords.concat(parsedKeywords.filter(k => keywordTypes.includes(k.type)));

        if (!Array.isArray(keywordTypes)) {
            keywords.push(...parsedKeywords.filter(k => {
                return k.type.name == keywordTypes.name
            }));
        } else {
            keywords.push(...parsedKeywords.filter(k => /*console.log(k.type)*/keywordTypes.includes(k.type)));
        }


    }

    return keywords;
}

const getKeywordAndScores = async function (keyword, weightMap) {
    //console.log(keyword, weightMap)

    let result = [];
    const keywordIds = keyword.keywords
    //console.log(keywordIds.length)

    for(let i=0; i<keywordIds.length; i++) {
        //console.log(keywordIds[i])
        const kid = keywordIds[i];
        const rankScore = keywordIds.length - i;
        const score = getScore(rankScore, weightMap[weightMap.indexOf(keyword.type)].defaultWeight);
        result.push({ keywordId: kid, type:keyword.type, score:score });
    }

    return result;

}

let getKeywordAndScores1 = function (type, keyword, weightMap) {
    //console.log(keywordIds)
    let keywordIds = keyword.keywordIds
    // console.log(type, keywordIds, weightMap, 1)
    let result = [];

    if(Array.isArray(keywordIds)) {
        keywordIds = keywordIds.slice(0, 60)
        for (let i = 0; i < keywordIds.length; i++) {
            const kid = keywordIds[i];
            const rankScore = keywordIds.length - i;
            const score = getScore(rankScore, weightMap[type].defaultWeight);
            result.push({ keywordId: kid, type:type, score:score });
        }
    }

    return result;
    //[{keywordId:'',type:'',scroe:''}]
}

let getScore = function (rankScore, weight) {
    return weight * rankScore;
}
let getCrawlLogByDate = async function (date) {
    // 특정 날짜의 패션 트렌드 정보 가져오기
    const fashionTrends = await getByDate(date);
    const crawlLogs = fashionTrends;

    return crawlLogs;
}

// 최근 14일간의 매일 키워드 점수를 반환하는 함수
exports.getDailyKeywordScore = async function (kid, endDate) {
    let result = [];
    let endDateObj = new Date(endDate);
    let date = new Date(endDateObj);
    date.setDate(date.getDate() - 13);

    while (true) {
        const fashionTrendKeywords = await getFashionTrendKeywords(date)

        let score = -1;
        for (let keyword of fashionTrendKeywords) {

            if (keyword.keyword.id === kid) {
                score = keyword.score;
                break;
            }
        }

        const dailyScore = {
            date: formatter(date),
            score: score
        };

        result.push(dailyScore);

        console.log(date, endDate, 'getDailyKeywordScore');

        if (date >= endDateObj) {
            break;
        }

        date.setDate(date.getDate() + 1);
    }

    return { kid, scores: result };
}

exports.getFashionTrendKeywordsByKeywordType = async function (date, keywordType) {
    const crawlLogByDate = await getCrawlLogByDate(date)
    const keywords = await getKeywords(crawlLogByDate, keywordType);

    return calcFashionTrendKeyword(keywords)
}

exports.putCustomFashionTrend = async function (shopId, request) {
/*
    crawlerType: "BRANDY",
    date: "2024-02-27",
    keywords: ["하객룩", "원피스", "투피스", "가디건", "자켓", "가방", "트레이닝세트", "오프숄더", "맨투맨", "롱치마"]
 */
    const keywords = JSON.parse(request.keywords);
    const keywordIds = [];

    for (const k of keywords) {
        if (k.trim() !== '') {  // 키워드 공백제거
            // 키워드 풀에서 해당 키워드를 찾고 만약 키워드가 풀에 없으면 새로 생성
            const keywordId = await getIfEmptyCreate(shopId, k);
            keywordIds.push(keywordId);
        }
    }

    let fashionTrends = await getByDate(request.date) // 특정날짜의 트렌드 데이터 가져오기
    let crawlLogEntity = null;

    // 요청 크롤러와 일치하는 크롤 로그 찾기 (없으면 null 반환)
    for (let crawlLog of fashionTrends) {
        const keywordType = Object.keys(KeywordType)[crawlLog.type]
        //console.log(keywordType, request.crawlerType, crawlLog.type)
        if (keywordType === request.crawlerType) {
            crawlLogEntity = fashionTrend;
            break; // 조건이 충족되면 루프 종료
        }
    }
    // return crawlLogEntity; // 찾은 크롤 로그 반환, 없으면 null


    // 4. 새로운 패션 트렌드 엔티티 생성
    let fashionTrend = {};

    // 만약 찾은 크롤 로그가 null이 아니라면 그 크롤 로그의 패션 트렌드를 가져와 사용
    if (crawlLogEntity !== null) {
        fashionTrend = this.getFashionTrend(crawlLogEntity);
    }

    // 패션 트렌드를 저장하고, 반환된 저장된 패션 트렌드를 사용
    // keywordPoolEntity.id, keywordPoolEntity.shopId, keywordPoolEntity.keyword
    // let savedFashionTrend = await fashionTrendsModel.save(generateId(), shopId, keyword);

    //  이전에 찾은 크롤 로그가 null이 아니라면, 그 크롤 로그의 키워드 ID들을 업데이트
    // if (crawlLogEntity !== null) {
    //     crawlLogEntity.updateKeywordIds(keywordIds);
    // } else {
    //     // 만약 null이라면, 새로운 크롤 로그를 생성하고, 저장된 패션 트렌드와 요청의 크롤러 타입, 그리고 키워드 ID들을 사용
    //     crawlLogEntity = CrawlLogEntity.create(savedFashionTrend, request.getCrawlerType(), keywordIds);
    // }

    // 7. 크롤 로그를 저장
    let savedCrawlLog = await fashionTrendsModel.save(crawlLogEntity);

}

let getIfEmptyCreate = async function (shopId, keyword) {
    let keywordPoolEntity = await fashionTrendsModel.findByName(shopId, keyword);

    if(!keywordPoolEntity) {
        keywordPoolEntity = {
            shopId: shopId,
            id: generateId(),
            keyword: keyword
        }

        keywordPoolEntity = await fashionTrendsModel.save(keywordPoolEntity.id, keywordPoolEntity.shopId, keywordPoolEntity.keyword);
    }

    return keywordPoolEntity

}

let updateKeywordIds = function (keywordIds) {
    let resultJson = [];

    try {
        resultJson = JSON.parse(keywordIds)
    } catch (err) {
        console.log('update keywordIds failed.', err)
    }

    return resultJson
}
