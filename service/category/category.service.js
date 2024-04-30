const categoryModel = require('../../model/category/category.model')
exports.syncCategories = async function (categories) {
    categories = categories.map((c) => c.category_no)
    return categories
}

exports.getCategoriesByProductNo = async function (products) {
    for(const p of products) {
        await categoryModel.getCategoriesByProductNo(p.product_no)
    }
}
