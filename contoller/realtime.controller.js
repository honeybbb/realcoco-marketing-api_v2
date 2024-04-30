'use strict';
const memberService = require('../service/member/member.service');
const pageRequest = {
    page: 1,
    size: 50,
    sort: '',
    query: '',
    filter: '',
    order: 'DESC'
};

module.exports = function (app) {
    app.get('/api/v1/:shopId/realtime/inflow/cafe24-members', async function (req, res) {
        const { shopId } = req.params;
        const page = req.query.page || pageRequest.page; // 페이지 파라미터를 가져오며, 없으면 1로 기본값 설정
        const size = req.query.size || pageRequest.size; // 페이지 크기 파라미터를 가져오며, 없으면 50으로 기본값 설정

        try {
            // 페이징 처리를 위해 시작 인덱스와 끝 인덱스 계산
            const startIndex = (page - 1) * size;
            const endIndex = page * size;

            let realtimeInflowCafe24Members = await memberService.getRealtimeInflowCafe24Member(pageRequest);
            // 페이징 처리
            realtimeInflowCafe24Members = realtimeInflowCafe24Members.slice(startIndex, endIndex);
            res.json({'result': true, 'list':realtimeInflowCafe24Members});
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }

    })
}
