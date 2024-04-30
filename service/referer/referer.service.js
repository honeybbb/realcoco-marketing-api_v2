const refererModel = require('../../model/referer/referer.model')
exports.saveRefererStats = async function () {
    // DB에서 참조자 통계를 가져옵니다.
    const cafe24RefererStats = await refererModel.findRefererStats();
    console.log(cafe24RefererStats)

    // 가져온 참조자 통계를 순회하면서 적절한 형식으로 변환하여 데이터베이스에 저장합니다.
    for (const referStat of cafe24RefererStats) {
        // const refererStatEntity = refererModel.create(referStat);
        // await refererModel.save(refererStatEntity);
    }


    return cafe24RefererStats;
}
