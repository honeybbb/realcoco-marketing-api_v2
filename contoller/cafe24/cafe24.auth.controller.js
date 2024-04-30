'use strict';
const cafe24Oauth2Service = require('../../service/auth/cafe24/cafe24.auth.service')

module.exports = function (app) {
    // 인증 코드를 받아 액세스 토큰을 얻고 저장하는 역할
    app.get('/api/v1/cafe24/auth/code', async (req, res) => {
        let code = req.query.code;

        const token = await cafe24Oauth2Service.getCafe24Oauth2AccessToken(code);
        console.log(token);
        return;
        //let cafe24Oauth2Token = await cafe24Oauth2Service.saveOrUpdate(token);
        //res.json({'result': true, 'data': cafe24Oauth2Token})
    })

    // 로그인 URL로 리다이렉트하는 역할
    // app.get('/api/v1/cafe24/login', (req, res) => {
    //     let url = cafe24Oauth2Service.getLoginUrl();
    //     res.redirect(url);
    // });

    // 저장된 액세스 토큰을 반환
    // app.get('/api/v1/cafe24/access-token', (req, res) => {
    //     let accessToken = cafe24Oauth2Service.getCafe24AccessToken();
    //     res.json({ accessToken: accessToken });
    // });
}
