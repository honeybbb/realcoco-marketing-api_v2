'use strict';
const facebookAdsService = require('../service/facebook/facebook.service');
module.exports = function (app) {
    app.get('/api/v1/:shopId/facebook/campaigns', async (req, res) => {
        let shopId = req.params.shopId;

        let result = facebookAdsService.viewCampaigns(shopId);

        res.json({'result': true, 'data': result})
    })
}
