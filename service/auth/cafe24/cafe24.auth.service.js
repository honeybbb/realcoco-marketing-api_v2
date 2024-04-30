const axios = require("axios");
const base64 = require('base-64');
const querystring = require('querystring');
const cafe24OauthModel = require('../../../model/auth/cafe24/auth.cafe24.model')

const CLIENT_ID = '7e7eGtyCAkIfs3oVWAgEBa';
const CLIENT_SECRET = 'hi9uaGeKC6TM3VzwrIqPbF';
const REDIRECT_URL = 'https://www.backtopbr.com/api/v1/cafe24/auth/code';
const CAFE24_OAUTH2_URL = 'https://realcoco1.cafe24api.com/api/v2/oauth/authorize';
const SCOPES = [
    "mall.read_category",
    "mall.write_category",
    "mall.read_product",
    "mall.write_product",
    "mall.read_collection",
    "mall.write_collection",
    "mall.read_supply",
    "mall.read_personal",
    "mall.read_order",
    "mall.read_community",
    "mall.read_customer",
    "mall.read_notification",
    "mall.read_store",
    "mall.read_promotion",
    "mall.read_design",
    "mall.read_salesreport",
    "mall.read_privacy",
//            "mall.read_mileage",
    "mall.read_shipping",
    "mall.read_translation",
    "mall.read_analytics",
    "mall.write_application",
    "mall.read_application"
];

exports.getCafe24Oauth2AccessToken = async function (code) {
    let authorization = 'Basic ' + base64.encode(`${CLIENT_ID}:${CLIENT_SECRET}`);

    let params = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URL
    };
    let response = await axios.post(CAFE24_OAUTH2_URL, params, {
        headers: { Authorization: authorization }
    });

    console.log(response.data)
    return response.data;
}

let saveOrUpdate = async function (data) {
    let cafe24TokenEntity = await cafe24OauthModel.findByMallIdAndUserId(data.mall_id, data.user_id);
    let accessToken = cafe24TokenEntity.access_token,
        expiresAt = cafe24TokenEntity.expires_at,
        refreshToken = cafe24TokenEntity.refresh_token,
        refreshTokenExpiresAt = cafe24TokenEntity.refresh_token_expires_at,
        mallId = cafe24TokenEntity.mall_id,
        userId = cafe24TokenEntity.user_id,
        issuedAt = cafe24TokenEntity.issued_at;

    let result = await cafe24OauthModel.updateToken(accessToken, expiresAt, refreshToken, refreshTokenExpiresAt, issuedAt, mallId, userId);

    return accessToken;
}

let getCafe24Oauth2AccessTokenUsingRefreshToken = async function (refreshToken) {
    let authorization = 'Basic ' + base64.encode(`${CLIENT_ID}:${CLIENT_SECRET}`);
    let params = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    };
    let response = await axios.post('https://realcoco1.cafe24api.com/api/v2/oauth/token', params, {
        headers: { Authorization: authorization, "Content-Type": 'application/x-www-form-urlencoded' }
    });
    console.log(response.data.data);
    return response.data;
}

exports.getAdminProduct = async function (accessToken, productNo) {
    let response = await axios.get(`https://realcoco1.cafe24api.com/api/v2/admin/products/${productNo}`, {
        headers: { Authorization: accessToken, "Content-type": 'application/json' }
    });
    //console.log(response.data.products, '1');
    return response.data;
}

exports.getAdminProducts = async function (accessToken, productNo) {
    let response = await axios.post(`https://realcoco1.cafe24api.com/api/v2/admin/products/${productNo}`, {
        headers: { Authorization: accessToken, "Content-type": 'application/json' }
    });
    console.log(response.data.data);
    return response.data;
}

exports.getLoginUrl = () => {
    let scope = SCOPES.join(',');
    let url = `${CAFE24_OAUTH2_URL}?response_type=code&client_id=${CLIENT_ID}&state=state&`+
        `redirect_uri=${querystring.escape(REDIRECT_URL)}&scope=${querystring.escape(scope)}`;
    return url;
};

exports.getCafe24AccessToken = async function () {
    const tokenPrefix = "Bearer ";
    const mallId = "realcoco1";
    const userId = "realcoco1";

    // db에서 토큰 정보 가져오기
    let cafe24TokenEntity = await cafe24OauthModel.findByMallIdAndUserId(mallId, userId)
    //let token = cafe24TokenEntity.access_token

    // 토큰이 아직 유효하다면  'Bearer ' 접두사와 함께 반환
    console.log(cafe24TokenEntity)
    // return;
    if(needRefreshAccessToken(cafe24TokenEntity.expires_at)) {
        console.log(1)
        return tokenPrefix + cafe24TokenEntity.access_token;
    } else {
        // 토큰이 만료되었다면 새로운 액세스 토큰을 발급
        let cafe24Oauth2AccessToken = await getCafe24Oauth2AccessTokenUsingRefreshToken(cafe24TokenEntity.refresh_token);
        //console.log(cafe24Oauth2AccessToken, 'cafe24Oauth2AccessToken');

        let cafe24Oauth2Token = await saveOrUpdate(cafe24Oauth2AccessToken);
        console.log(cafe24Oauth2Token, 'cafe24Oauth2Token')
        return tokenPrefix + cafe24Oauth2Token;
    }

}

// expiresAt(만료 시간)이 현재 시간보다 10분 이전인지를 확인
let needRefreshAccessToken = async function (expiresAt) {
    let currentTime = new Date();
    let expiresTime = new Date(expiresAt);
    // 토큰이 만료되기 10분 전에 새로고침하도록 하기 위함
    expiresTime.setMinutes(expiresTime.getMinutes() - 10);
    console.log(currentTime, expiresTime)
    return currentTime >= expiresTime;
}
