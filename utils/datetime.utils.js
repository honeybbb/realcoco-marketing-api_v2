exports.toStartTimeOfDay = function (date) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    return startOfDay;
};

exports.toEndTimeOfDay = function (date) {
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    return endOfDay;
};
