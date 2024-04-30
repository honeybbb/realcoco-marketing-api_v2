'use strict';

const productService = require('../../service/product/product.service');

module.exports = function(app) {
    app.post('/batch/v1/:shopId/products/sync', async (req, res) => {
        let shopId = req.params.shopId;

        const result = await productService.syncTop1(shopId)
        res.json({'result': true, 'data': result})
    })
}
