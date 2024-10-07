const DateTimeUtils = require('../../utils/datetime.utils')
const productModel = require('../../model/product/product.model')
const Cafe24Oauth2Service = require('../auth/cafe24/cafe24.auth.service');
const dashboardModel = require('../../model/dashboards/dashboard.model')
const base64 = require("base-64");
const categoryService = require('../../service/category/category.service')
const fashionTrendService = require('../../service/fashiontrends/fashiontrend.service')
const elasticsearchProductService = require('../../service/elasticsearch/elasticsearch.service')
const crypto = require("crypto");
function addDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

const formatter = async function (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 특정 기간 동안 가장 많이 주문된 상품을 가져오기(Best 상품)
exports.getCustomerBest = async function (date, days, size) {
    const startDateTime = DateTimeUtils.toStartTimeOfDay(new Date(date.getTime() - days * 24 * 60 * 60 * 1000));
    const endDateTime = DateTimeUtils.toEndTimeOfDay(new Date(date.getTime() - 24 * 60 * 60 * 1000));
    //console.log(startDateTime, endDateTime)

    const products = await productModel.getProductByTopOrderCount(startDateTime, endDateTime, size, null);
    let result = {};
    result.totalCount = products.length
    result.contents = products

    return result;
}

exports.getDashboardStats = async function (date, days) {
    // 데이터베이스에서 통계를 가져오는 쿼리를 실행합니다.
    const views = await dashboardModel.getDashboardViews(date, days);
    const sales = await dashboardModel.getDashboardSales(date, days);

    let result = {}
    result.contents = [
        {
            statType: "VIEWS",
            stats: views
        },
        {
            statType: "SALES",
            stats: sales
        }
    ]
    result.totalCount = result.contents.length

    //{statType: "VIEWS", stats: [{'date':'2024-02-13', values:'14647400'}]
    return result
}

// 가장 오래된 업데이트 시간을 가진 상품을 찾아 카페24에 동기화
exports.syncTop1 = async function (shopId) {
    // 가장 오래된 업데이트 시간을 가진 상품을 반환
    const product = await productModel.findFirstByOrderByUpdatedAtAsc();
    // 카페24 API에 접근하기 위한 액세스 토큰 가져오기
    const accessToken = await Cafe24Oauth2Service.getCafe24AccessToken();
    //console.log(accessToken, 1, product)

    // 액세스 토큰을 사용하여 카페24에서 해당 상품의 정보를 가져오기
    let getAdminProduct = await Cafe24Oauth2Service.getAdminProduct(accessToken, product.product_no);

    function delay(interval) {
        return new Promise((resolve) => {
            setTimeout(resolve, interval);
        });
    }

    // 카페24에서 가져온 상품 정보가 비어 있으면,
    // 해당 상품을 데이터베이스에서 삭제하고 빈 상품 정보를 반환
    if (getAdminProduct.length === 0) {
        //await deleteProduct(product.id);
        return getAdminProduct;
    }

    // 카페24에서 가져온 상품 정보를 데이터베이스에 동기화 (임시주석)
    //await syncProduct(getAdminProduct);

    // 상품의 카테고리도 동기화 (임시주석)
    // if(getAdminProduct.category) {
    //     const categories = await categoryService.syncCategories(getAdminProduct.category);
    //     // 상품과 카테고리의 연관 관계를 업데이트
    //     for (const category of categories) {
    //         await updateCategoryProduct(getAdminProduct.product_no, category, shopId);
    //     }
    // }

    let categories = await productModel.getCategoriesByProductNo(getAdminProduct.product.product_no);
    // 상품 정보를 Elasticsearch에 인덱싱
    await elasticsearchProductService.indexProduct(getAdminProduct.product, categories);

    // 동기화된 상품 정보를 반환
    return getAdminProduct

}

exports.getRecommendProducts = async function (startDate, endDate, category) {
    let recommendProduct = [];
    // 시작날짜가 종료 날짜 이후엔 빈 배열 반환
    if (startDate > endDate) {
        return recommendProduct;
    }

    // 시작 날짜를 현재 날짜로 설정합니다.
    let currDate = new Date(startDate);
    let result = {};

    while (true) {
        // 현재 날짜의 추천 상품 리스트를 가져옵니다.
        let dailyRecommendProducts = await getDailyRecommendProducts(currDate);

        dailyRecommendProducts.forEach(drp => {
            // 만약 결과 객체가 이미 해당 상품 ID를 가지고 있다면, 해당 상품의 정보를 병합(merge)합니다.
            if (result[drp.product.productNo]) {
                result[drp.product.productNo] = merge(result[drp.product.productNo], drp);
                // 만약 결과 객체가 해당 상품 ID를 가지고 있지 않다면, 상품을 객체에 추가합니다.
            } else {
                result[drp.id] = drp;
            }
        });

        // 현재 날짜가 종료 날짜와 같다면 루프를 종료합니다.
        if (currDate >= new Date(endDate)) {
            break;
        }

        // 현재 날짜를 다음 날로 이동시킵니다.
        currDate = plusDays(currDate);
    }

    // 결과 객체의 모든 값을 가져와서, 각 상품의 점수에 따라 내림차순으로 정렬하고, 그 결과를 배열로 변환하여 반환합니다.
    return Object.values(result).sort((a, b) => b.score - a.score);
}

// 날짜에 하루를 더하는 함수
function plusDays(date) {
    const result = new Date(date);
    result.setDate(result.getDate() + 1);
    return result;
}

function merge(obj1, obj2) {
    return {
        ...obj1,
        ...obj2,
        score: obj1.score + obj2.score
    };
}

let getDailyRecommendProducts = async function (date) {
    // 특정 날짜에 대한 패션 트렌드 키워드 가져오기
    let fashionTrend = await fashionTrendService.getFashionTrend(date);

    // 각 제품을 순위 별로 정리
    let productsSortByRank = await getProductsSortByRank(fashionTrend);

    // 순위별로 정렬된 상품들에 추천 가중치 맵 가져오기
    let recommendWeightMap = await getRecommendWeightMap(productsSortByRank);
    // 순위별로 정렬된 상품들의 ID를 리스트로 만들기
    let productNos = productsSortByRank.map(product => product.productNo).join(',');


    date = await formatter(date);
    // 상품 ID 리스트와 특정 날짜를 기반으로 각 상품의 일일 상품 통계를 맵 형태
    // 일일 제품 통계 가져와서 맵으로 변환
    let dailyProductStatMap = {};
    let dailyProductStats = await productModel.findDailyProductStats(productNos, date);

    dailyProductStats.forEach(stat => {
        //console.log(stat, 's')
        dailyProductStatMap[stat.product_no] = stat;
    });

    console.log(productsSortByRank)

    return productsSortByRank.map(product => {
        //console.log(dailyProductStatMap, 'dailyProductStatMap')
        let dailyProductStat = dailyProductStatMap[product.productNo] ? dailyProductStatMap[product.productNo] : dailyProductStatMap;
        //console.log(dailyProductStat, 'dailyProductStat')
        let recommendWeight = recommendWeightMap[product.productNo];

        return {
            product : product,
            dailyProductStat : dailyProductStat[product.productNo],
            recommendWeight : recommendWeight
        }
    });

}

exports.makeFashionTrendProducts = async function (date, keywords) {
    let productIdSet = {};
    for (let k of keywords) {
        if(k.keyword) {
            let products = await getProductByKeyword(date, k.keyword.name, productIdSet);

            products.forEach(product => {
                //console.log(product)

                productIdSet[product.id] = true;  // id를 키로 사용하여 객체에 추가
            });

            k.products = products;
        }
    }

/*
    keywords.forEach(async k => {
        console.log(k, 'k')

        /*
        //  특정 날짜, 키워드 이름, 그리고 상품 ID Set를 기반으로 상품 목록을 가져오기
        let products = await getProductByKeyword(date, k.keyword[0].name, productIdSet);
        // console.log(products, 'products')

        products.forEach(product => {
           productIdSet.add(product.id);
        });
        // 각 키워드 객체에 해당 키워드로 가져온 상품 목록을 설정
        k.products = products;


    });
 */
}

// 주어진 날짜와 키워드로 제품을 검색 하고 반환
let getProductByKeyword = async function (date, keyword, productIdSet) {
    //  특정 카테고리에 대한 상품 검색 결과를 가져오기. 검색 결과는 최대 20개.
    const elasticsearchProducts = await elasticsearchProductService.searchProductByCategory(keyword, 20);

    console.log(elasticsearchProducts, 'elasticsearchProducts')

    // 검색된 제품 중에서 productIdSet에 포함되지 않은 제품만 선택 (중복제거)
    let products = elasticsearchProducts.filter(ep => !(ep.product_no in productIdSet));

    // for (let i = 0; i < products.length; i++) {
    //     products[i] = await getProductOptional(products[i].productNo);
    // }

    console.log(products, 'products')

    products = products.filter(product => product !== null).flatMap(p=>p);

    console.log(products, 'products2')

    const productIds = products.map(product => product.product_no);

    // 제품의 주문 수
/*
    let productOrderCountMap = this.getProductOrderCountMap(productIds, date, 3);

    console.log(productOrderCountMap, 'productOrderCountMap')

    // 정렬된 제품 중에서, 상위 3개의 제품만 선택
    products.sort((p1, p2) => {
        const count1 = productOrderCountMap[p1.product_no] || 0;
        const count2 = productOrderCountMap[p2.product_no] || 0;
        return count2 - count1;
    });

 */


    products = products.slice(0, 3);

    return products;

}

let getProductOptional = async function (productNo) {
    let result = await productModel.findById(productNo)
    return result
}

exports.getProductOrderCountMap = async function (productIds, date, days) {
    if(days <= 0) {
        throw new Error("invalid days");
    }

    let startDate = new Date(date);
    startDate.setDate(startDate.getDate() - days + 1);
    let endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    let productOrderCountStats = await productModel.findProductStats(productIds, startDate, endDate);

    return productOrderCountStats.reduce((map, stat) => {
        if (map[stat.product_no]) {
            map[stat.product_no] += stat.total_order_count;
        } else {
            map[stat.product_no] = stat.total_order_count;
        }
        return map[stat.product_no];
    }, {});
}

exports.getProductOrderCount = async (productNo, date) => {
    // 여기에 실제 데이터를 조회하고 계산하는 로직을 구현합니다.
    // 예시로, 무작위로 생성된 주문 수를 반환합니다.
    return Math.floor(Math.random() * 100); // Promise.resolve() 없이 바로 반환
};

exports.getProductViewCountMap = async function (productNo, date, days) {
    if(days <= 0) {
        throw new Error("invalid days");
    }

    let startDate = new Date(date);
    startDate.setDate(startDate.getDate() - days + 1);
    let endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    let productOrderCountStats = await productModel.findProductStats(productNo, startDate, endDate);

    return productOrderCountStats.reduce((map, stat) => {
        if (map[stat.product_no]) {
            map[stat.product_no] += stat.total_view_count;
        } else {
            map[stat.product_no] = stat.total_view_count;
        }
        return map[stat.product_no];
    }, {});
}
let getRecommendWeightMap = async function (products) {
    let result = [];

    for (let i = 0; i < products.length; i++) {
        let rank = i + 1;
        let weight = Math.sqrt(1 / rank);
        result.push({weight: weight, product: products[i]});
    }

    return result.reduce((map, pair) => {
        map[pair.product.productNo] = pair.weight;
        return map;
    }, {});
}

let getProductsSortByRank = async function (keywords) {
    let result = []; // 결과를 저장하는 배열

    let products = keywords
        .filter(keyword => Array.isArray(keyword.products))
        .map(keyword => [...keyword.products])
        // .flatMap(k=>k);

    while (true) {
        let pollFirsts = products
            .filter(l => l && l.length > 0)
            .map(l => l.shift());

        if (pollFirsts.length === 0) {
            break;
        }

        result = result.concat(pollFirsts);
    }

    // 중복 제거

    let uniqueResult = [...new Set(result.map(product => JSON.stringify(product)))]
        .map(productStr => JSON.parse(productStr));

    return uniqueResult;
}

let create = async function (product, dailyProductStat, weight) {
    let result = {...product}; // Assuming a shallow copy is sufficient
    result.totalViewCount = dailyProductStat.totalViewCount;
    result.totalOrderCount = dailyProductStat.totalOrderCount;
    result.score = weight * result.totalOrderCount;
    return result;
}

let updateCategoryProduct = async function (productNo, category, shopId) {
    let result = productModel.updateCategoryProduct(productNo, category, shopId);
    return result
}

let syncProduct = async function (product, shopId) {
    if (product && product.product_tag) {
        product.product_tag = product.product_tag.join(',');
    }

    let productNo = product.product_no,
        //shopId = product.shop_no,
        updatedAt = new Date(),
        clearanceCategoryEng = product.clearance_category_eng,
        clearanceCategoryKor = product.clearance_category_kor,
        createdDate = product.created_date,
        updatedDate = product.updated_date,
        customProductCode = product.custom_product_code,
        detailImg = product.detail_image,
        listImg = product.list_image,
        tinyImg =  product.tiny_image,
        smallImg =  product.small_image,
        display = product.display,
        engProductName = product.eng_product_name,
        modelName = product.model_name,
        price = product.price,
        priceContent = product.price_content,
        priceExcludingTax = product.price_excluding_tax,
        productCode = product.product_code,
        productCondition = product.product_condition,
        productName = product.product_name,
        productTag = product.product_tag,
        retailPrice = product.retail_price,
        selling = product.selling,
        shopNo = product.shop_no,
        soldOut = product.sold_out,
        summaryDescription = product.summary_description,
        supplyPrice = product.supply_price,
        supplyProductName = product.supply_product_name;

    let result = await productModel.update(
        productNo, shopId, updatedAt,
        clearanceCategoryEng, clearanceCategoryKor, createdDate,
        customProductCode, detailImg, listImg, display,
        engProductName, modelName, price, priceContent, priceExcludingTax, productCode,
        productCondition, productName, productTag, retailPrice, selling, shopNo,
        smallImg, soldOut, summaryDescription, supplyPrice, supplyProductName,
        tinyImg, updatedDate
    )

    return result
}


exports.getExcludeBestProducts = async function (shopId, date) {
    let result = await productModel.findByShopIdAndDate(shopId, date)

    return result
}

exports.getProductsBest = async function (date, size, productNos) {
    const startDateTime = DateTimeUtils.toStartTimeOfDay(date).toISOString();
    const endDateTime = DateTimeUtils.toEndTimeOfDay(date).toISOString();

    // const startDateTime = '2023-10-17 00:00:00';
    // const endDateTime = '2023-10-19 00:00:00';

    let result = await productModel.getProductByTopOrderCount(startDateTime, endDateTime, size, productNos)

    return result;
}

exports.addExcludeBestProducts = async function (shopId, date, productNos) {
    productNos = productNos.split(',')
    let results = [];

    for(const productNo of productNos) {
        const productOptional = await getProductOptional(productNo);

        if(productOptional) {
            const productNo = productOptional.product_no
            const exists = await productModel.findByShopIdAndDateAndProductNo(shopId, date, productNo);
            const excludeBestProductId = Date.now();

            if(exists.length == 0) {
                await productModel.addExcludeBestProducts(excludeBestProductId, shopId, date, productNo);
                results.push(productNo);
            }
        }
    }

    return results;
}

exports.getProductStat = async function (productId) {
    let product = await productModel.findById(productId);
    let productStat = this.fromProduct(product)
    let productStats = await productModel.findByProductNo(productId);

    // productStats.totalOrderCount = 0;
    // productStats.totalViewCount = 0;

    productStats.forEach((ps) => {
        productStat.totalOrderCount += ps.total_order_count
        productStat.totalViewCount += ps.total_view_count
    })

    return productStat
}

exports.fromProduct = function (product) {
    let productStat = {
        ...product,
        totalViewCount: 0,
        totalOrderCount: 0,
        clickValue: 123,
        orderRate: 32.3
    };

    return productStat;
}

exports.searchByProductName = async function (productName) {
    let productEntities = productModel.searchByProductName(productName);

    return productEntities;
}

exports.getApplyProducts = async function () {
    let applyProductEntity = await productModel.findTop1ByOrderByCreatedAtDesc();
    let productNos = JSON.parse(applyProductEntity.product_nos_json);

    let results = [];

    for(const productNo of productNos) {
        const productOptional = await getProductOptional(productNo);

        if(productOptional) {
            const product = productOptional
            results.push(product);
        }
    }

    return results;
}

exports.saveApplyProduct = async function (productNosJson, shopId, createdAt, updatedAt) {
    let result = await productModel.saveApplyProduct(productNosJson, shopId, createdAt, updatedAt)
    return result;
}

exports.deleteExcludeProducts = async function (shopId, date, productNos) {
    let result = await productModel.deleteByShopIdAndDateAndProductNo(shopId, date, productNos);

    return result
}

exports.deleteProductsBestExcludeAll =  async function (shopId, date) {
    let result = await productModel.deleteByShopIdAndDate(shopId, date);

    return result
}

exports.getZigzagSellData = async function (jsonData, type, date) {
    let result = await productModel.getZigzagSellData(jsonData, type, date);

    return result;
}
exports.getZigzagTotalCnt = async function () {
    let result = await productModel.getZigzagTotalCnt();
    return result;
}

exports.getZigzagData = async function (shopId, page, size) {
    let result = await productModel.getZigzagData(shopId, page, size);
    return result;
}

exports.getZigzagIncrease = async function (shopId, date) {
    let result = await productModel.getZigzagIncrease(shopId, date);
    result = result.map((a) => a.product_no)

    return result;
}

exports.getZigzagSalesTrend = async function (shopId, date) {
    let result = await productModel.getZigzagSalesTrend(shopId, date);
    result = result.map((a) => a.product_no)

    return result;
}

exports.getZigzagGragh = async function (shopId, productNos) {
    let result = await productModel.getZigzagGragh(shopId, productNos);

    return result;
}

exports.deleteZigzagData = async function (orderNo) {
    let result = await productModel.deleteZigzagData(orderNo);

    return result;
}
