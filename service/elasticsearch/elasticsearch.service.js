const { Client } = require('@elastic/elasticsearch')
const {response} = require("express");
const elasticsearchClient = new Client({ node: 'http://localhost:9200' })

// 특정 카테고리로 제품 검색 (검색어, 검색결과크기)
exports.searchProductByCategory = async function (query, size) {
    const response = await elasticsearchClient.search({
        index: 'products', // "products" 인덱스에서 검색
        size: size, // 검색 결과의 크기 설정
        body: {
            query: {
                match_all: {}, // 모든 문서를 검색하기 위한 쿼리
                bool: {
                    should: this.makeCategoryBoolQueryBuilder(query), // 카테고리에 대한 불리언 쿼리 생성
                }
            }
        }
    });

    // Elasticsearch의 검색 결과를 리스트로 변환하여 반환
    return response.body.hits.hits.map(hit => hit._source);
}

// 검색된 문서를 삭제합니다.
const deleteResponse = async function  (query, size) {
    const response = await elasticsearchClient.deleteByQuery({
    index: 'products',
    body: {
        query: {
            // 검색 조건과 동일한 쿼리를 사용하여 삭제 대상을 지정합니다.
            bool: {
                should: this.makeCategoryBoolQueryBuilder(query),
            }
        }
    }
});
    // 삭제 결과를 확인합니다. 실제 사용 시에는 필요에 따라 이 부분을 조정하세요.
    console.log(deleteResponse);

    // Elasticsearch의 검색 결과를 리스트로 변환하여 반환합니다.
    // 삭제 작업 후에는 삭제된 문서는 반환되지 않습니다.
    return response.hits.hits.map(hit => hit._source);
}

// 카테고리를 위한 불리언 쿼리 생성
/*
{ match: { "category_name": { query: query, boost: 40 } } },
{ match: { "clearance_category_eng": { query: query, boost: 20 } } },
{ match: { "clearance_category_kor": { query: query, boost: 20 } } },
{ match: { "internal_product_name": { query: query, boost: 5 } } },
{ match: { "product_name": { query: query, boost: 1 } } }
 */

// 여러 개의 쿼리를 조합하여 복잡한 검색 조건을 만들 수 있게 해줌
exports.makeCategoryBoolQueryBuilder = function (query) {
    // 필드별로 부스트 맵 구성
    const boostMap = {
        "category_name": 40,
        "clearance_category_eng": 20,
        "clearance_category_kor": 20,
        "internal_product_name": 5,
        "product_name": 1
    };

    let shouldQueries = [];

    for (let key in boostMap) {
        //console.log(key, query, boostMap[key])
        shouldQueries.push(this.getBoostMatchQueryBuilder(key, query, boostMap[key]));
    }

    // return shouldQueries;

    return {
        "bool": {
            "should": shouldQueries
        }
    };

}

// 필드 이름, 쿼리 문자열, 그리고 부스트 값을 입력으로 받아, 해당 정보를 사용하여 match 쿼리를 생성
// 생성된 쿼리는 특정 필드가 쿼리 문자열과 일치하는 문서를 찾으며, 부스트 값은 해당 필드의 중요도를 나타냄
exports.getBoostMatchQueryBuilder = function (key, query, value) {
    console.log({"match": {[key]: {"query": query, "boost": value}}});
    return {
        "match": {
            [key]: {
                "query": query,
                "boost": value
            }
        }
    };
}

exports.indexProduct = async function (product, categories) {
    const elasticsearchProduct = {
        productNo: product.product_no,
        clearanceCategoryEng: product.clearance_category_eng,
        clearanceCategoryKor: product.clearance_category_kor,
        customProductCode: product.custom_product_code,
        internalProductName: product.internal_product_name,
        productName: product.product_name,
        categoryName: getCategoriesForSearch(categories)
    };

    const response = await elasticsearchClient.index({
        index: 'products',
        id: String(elasticsearchProduct.productNo),
        body: elasticsearchProduct
    });

    this.searchIndex('products');

    return response;
}


let getCategoriesForSearch = function (categories) {
    let categoryNames = new Set();

    for(let c of categories) {
        let m = {};

        try {
            m = JSON.parse(c.full_category_name_json);
        } catch (e) {
            console.error('json parse failed.', e);
        }

        for(let value of Object.values(m)) {
            if(value !== null) {
                categoryNames.add(value);
            }
        }
    }

    //console.log(categoryNames, 'categoryNames')
    return categoryNames
}

exports.searchIndex = async function  (indexName) {
    //console.log(indexName, '색인 이름')
    // indexName에 해당하는 색인에서 모든 문서를 검색
    const body = await elasticsearchClient.search({
        index: indexName,
        size: 100,
        body: {
            query: {
                match_all: {} // 모든 문서를 검색하기 위한 쿼리
            },

        }
    });

    // 검색 결과 출력
    //console.log(body.hits.hits.map(hit => hit._source));

    return body.hits.hits.map(hit => hit._source)
}

exports.deleteIndex = async function () {

}
