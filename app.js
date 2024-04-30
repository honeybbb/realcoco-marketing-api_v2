// index.js
const express = require('express');
const path = require('path');
const cors = require('cors'); // cors 미들웨어 추가
const app = express();

app.use(cors() );
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var AuthRoutes = require('./contoller/auth.controller');
AuthRoutes(app);

var BatchProductRoutes = require('./contoller/batch/batch.product.controller');
BatchProductRoutes(app);

var BatchFashionRoutes = require('./contoller/fashion.trends.controller');
BatchFashionRoutes(app);

var DashboardRoutes = require('./contoller/dashboard.controller');
DashboardRoutes(app);

var ProductRoutes = require('./contoller/product.controller');
ProductRoutes(app);

var RealtimeRoutes = require('./contoller/realtime.controller');
RealtimeRoutes(app);

/*
app.get('/', function (req, res) {
    return res.send('hello world');
})
 */

module.exports = app;
