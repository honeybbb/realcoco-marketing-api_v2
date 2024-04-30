const shopModel = require('../../model/shop/shop.model')
const crypto = require("crypto");
exports.getShopById = async function (shopId) {
    let result = await shopModel.findById(shopId);

    return result
}

exports.findByShopName = async function (shopName) {
    let result = await shopModel.findByShopName(shopName)
    return result;
}

exports.saveShop = async function (shopName) {
    let result = await shopModel.saveShop(shopName)
    return result;
}
