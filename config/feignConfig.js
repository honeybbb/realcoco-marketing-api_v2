const axios = require('axios');

exports.DatalabApiClient = async function(params) {
    // API 호출 구현
    const response = await axios.get('https://openapi.naver.com', { params });
    return response.data;
};

exports.Cafe24OAuth2Client = async function(params) {
    // API 호출 구현
    const response = await axios.get('https://realcoco1.cafe24api.com', { params });
    return response.data;
};


exports.cafe24Oauth2Api = async function(params) {
    // API 호출 구현
    const response = await axios.get('https://realcoco1.cafe24api.com', { params });
    return response.data;
};
