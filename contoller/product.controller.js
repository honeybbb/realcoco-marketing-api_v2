'use strict';
const productService = require('../service/product/product.service')
const multiparty = require('multiparty');
const xlsx = require('xlsx');

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

    app.post('/api/v1/:shopId/products/:productId', async (req, res) => {
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
        console.log(recommendProducts, 'recommendProducts')
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

    app.post('/api/v1/:shopId/products/zigzag/excel', async function (req, res) {
        const shopId = req.params.shopId;
        let type, date;

        let resData = [];
        let heardesList = [];
        let firstRowColLen = 0;

        const form = new multiparty.Form({
            autoFiles: true,
        });

        form.on('field', (name, value) => {
            if (name == 'type') type = value;
            if (name == 'date') date = value;
        });

        form.on('file', (name, file) => {
            const workbook = xlsx.readFile(file.path);

            const sheetnames = workbook.SheetNames;
            sheetnames.map((content ,i) => {
                let worksheet = workbook.Sheets[content];
                let headers = {};

                // worksheet.map((xls_data) => {

                // })

                for(let xls_data in worksheet) {
                    if(xls_data[0] === '!') continue;

                    let tt = 0;
                    for (let i = 0; i < xls_data.length; i++) {
                        if (!isNaN(xls_data[i])) {
                            tt = i;
                            break;
                        }
                    };


                    let col = xls_data.substring(0,tt);
                    let row = parseInt(xls_data.substring(tt));
                    let value = '';
                    if(typeof worksheet[xls_data].v === "string"){
                        value = worksheet[xls_data].v.replace(/ /gi, "");
                    }else{
                        value = worksheet[xls_data].v
                    }



                    if(row == 1 && value) {
                        headers[col] = value
                        heardesList.push(value)
                        firstRowColLen++;
                        continue;
                    }

                    if(!resData[row]) resData[row]={};
                    resData[row][headers[col]] = value;
                }

                resData.shift();
                resData.shift();

            });


        });

        form.on('close', async () => {
            let cData = [];

            if(!heardesList.includes('상품주문번호')) {
                res.json({'result':false, 'data': {'errcode':'-8000', 'msg': '상품주문번호 없음'}})
                return
            }

            if(!heardesList.includes('상품번호')) {
                res.json({'result':false, 'data': {'errcode':'-8000', 'msg': '상품번호 없음'}})
                return
            }

            console.log(firstRowColLen)
            /*
            if(firstRowColLen < 0 || firstRowColLen > 4){
                res.json({'result':false, 'data': {'errcode':'-8000', 'msg': '컬럼수 옳바르지 않음'}})
                return
            }
             */

            cData = await productService.getZigzagSellData(resData, type, date);
            //cData.sort(custonSort)

            res.json({'result':true, 'data': cData})
            /*
            fs.writeFileSync('xlsx_text.json', JSON.stringify(resData));

            for(let i=0; i<resData.length; i++){
                console.log(res.data[i])
            }

            res.send(resData);

             */
        });

        form.parse(req);

        function custonSort(a, b) {
            if(a.order_no == b.order_no){ return 0} return  a.order_no > b.order_no ? 1 : -1;
        }
    })

    app.get('/api/v1/:shopId/products/zigzag/excel', async function (req, res) {
        const shopId = req.params.shopId;
        const date = req.query.date;

        let result = await productService.getZigzagData(shopId);

        res.json({ 'result': true, 'data': result });
    })

    app.get('/api/v1/:shopId/products/zigzag/increase', async function (req, res) {
        const shopId = req.params.shopId;
        const date = req.query.date;

        let result = await productService.getZigzagIncrease(shopId, date);

        res.json({ 'result': true, 'data': result });
    })

    app.get('/api/v1/:shopId/products/zigzag/gragh', async function (req, res) {
        const shopId = req.params.shopId;
        const productNos = req.query.productNos;

        let result = await productService.getZigzagGragh(shopId, productNos);

        res.json({ 'result': true, 'data': result });
    })

    app.delete('/api/v1/:shopId/products/zigzag/excel', async function (req, res) {
        const shopId = req.params.shopId;
        const orderNos = req.query.orderNos;

        let result = await productService.deleteZigzagData(shopId, orderNos);
        res.json({ 'result': true, 'data': result });
    })
}
