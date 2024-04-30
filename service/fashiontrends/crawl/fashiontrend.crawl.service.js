const axios = require("axios");
const clientId = "3DqRh4Ht2w0vfCjFYn46";
const clientSecret = "MeZKrxYMQz";
const AGES_20 = "20";
const AGES_30 = "30";
const formatter = async function (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const TimeUnit = {
    date: 'date',
    week: 'week',
    month: 'month'
};

const Gender = {
    m: 'm',
    f: 'f'
};

const Category = (name, param) => ({ name, param });

exports.todayAge20 = async function (AGES_20) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    return {
        startDate: formatter(yesterday),
        endDate: formatter(today),
        timeUnit: TimeUnit.date,
        category: [Category("패션의류", ["50000000"])],
        gender: Gender.f,
        AGES_20
    };
}

exports.todayAge30 = async function (AGES_30) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    return {
        startDate: formatter(yesterday),
        endDate: formatter(today),
        timeUnit: TimeUnit.date,
        category: [Category("패션의류", ["50000000"])],
        gender: Gender.f,
        AGES_30
    };
}

exports.datalabShoppingCategories = async function (clientId, clientSecret, request) {
    let response =  await axios.post("/v1/datalab/shopping/categories", request, {
        headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret,
            'Content-Type': 'application/json'
        }
    });

    console.log(response);

    return response.data;
}
