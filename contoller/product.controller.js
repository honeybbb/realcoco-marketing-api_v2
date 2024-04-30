'use strict';
const productService = require('../service/product/product.service')
const {json} = require("express");

module.exports = function (app) {
    app.get('/api/v1/:shopId/products', async function (req, res) {
        const shopId = req.params.shopId;
        const productName = req.query.productName;
        const page = req.query.page;
        const size = req.query.size;

        let products = await productService.searchByProductName(productName);

        res.json({'result': true, 'data': products})

    })

    app.get('/api/v1/:shopId/products/best', async function (req, res) {
        const shopId = req.params.shopId;
        const date = req.query.date;

        const productBestSize = 100;

        // excludeBestProducts와 getProductsBest는 비동기 함수라고 가정합니다.
        const excludeBestProducts = await productService.getExcludeBestProducts(shopId, date);
        const excludeBestProductIdSet = new Set(excludeBestProducts.map(product => product.product_no));

        const size = productBestSize + excludeBestProductIdSet.size;
        let productsBest = await productService.getProductsBest(date, size, null);

        productsBest = productsBest.filter(product => !excludeBestProductIdSet.has(product.id)).slice(0, productBestSize);

        res.json({ 'result': true, 'data': productsBest });
    })

    app.get('/api/v1/:shopId/products/best/exclude', async function (req, res) {
        const shopId = req.params.shopId;
        const date = req.query.date;

        const excludeBestProducts = await productService.getExcludeBestProducts(shopId, date);
        let productNos = excludeBestProducts.map(product => product.product_no);

        if (productNos.length === 0) {
            return res.json({ 'result': true, 'data': [] });
        } else {
            productNos = productNos.join(',')
        }

        const productsBest = await productService.getProductsBest(date, 100, productNos);
        console.log(productsBest, 'exclude')

        res.json({ 'result': true, 'data': productsBest });
    })

    app.post('/api/v1/:shopId/products/best/exclude', async (req, res) => {
        const shopId = req.params.shopId;
        const date = req.body.date;
        const productNos = req.body.productNos;

        let result = await productService.addExcludeBestProducts(shopId, date, productNos);

        res.json({ 'result': true, 'data': result });
    });

    app.delete('/api/v1/:shopId/products/best/exclude', async (req, res) => {
        const shopId = req.params.shopId;
        const date = req.query.date
        const productNos = req.query.productNos;

        let result = await productService.deleteExcludeProducts(shopId, date, productNos)

        res.json({'result': true, 'data': result})
    })

    app.get('/api/v1/:shopId/products/:productId', async (req, res) => {
        const shopId = req.params.shopId;
        const productId = req.params.productId;

        let result = await productService.getProductStat(productId);

        //console.log(result, 'result')

        res.json({'result': true, 'data': result})
    })

    app.get('/api/v1/:shopId/products/recommend', async (req, res) => {
        const shopId = req.params.shopId;
        const startDate = req.query.startDate,
                endDate = req.query.endDate,
                category = req.query.category;

        let recommendProducts = await productService.getRecommendProducts(startDate, endDate, category);
        if(recommendProducts) {
            recommendProducts = recommendProducts.slice(0, 100);
        }

        res.json({ 'result': true, 'data': recommendProducts });

    })

    app.delete('/api/v1/:shopId/products/best/exclude/all', async (req, res) => {
        const shopId = req.params.shopId;
        const date = req.query.date;

        let result = await productService.deleteProductsBestExcludeAll(shopId, date);

        res.json({'result': true, 'data': result})
    })
}
