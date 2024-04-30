'use strict';
const bcrypt = require('bcryptjs');

const shopService = require('../service/shop/shop.service');
const memberService = require('../service/member/member.service');
const jwtUtils = require('../utils/jwt.utils');

module.exports = function (app) {
    app.post('/api/v1/members/register', async (req, res) => {
        const { email, username, password } = req.body;
        let shop = await shopService.findByShopName(username);
        if(shop !== null) {
            return res.status(-240).json({'result': false, 'err': "이미 사용 중인 이메일입니다."});
        }

        shop = shopService.saveShop(username);
        const hashedPassword = await bcrypt.hash(password, 10);
        //users.push({ username, password: hashedPassword });
        // const smsVerificationPhoneNumberUse = await

        let result = await memberService.register(email, username, password)
        res.json({'result': true, 'content': result});
    });

    app.post('/api/v1/login', async (req, res) => {
        try {
            const { username, password } = req.body;

            // 사용자 이름으로 멤버 검색
            const member = await memberService.getMemberByUsername(username);

            if (!member) {
                // 인증 실패 예외 처리
                return res.status(401).json({ message: 'Authentication failed' });
            }

            // 비밀번호 확인
            const match = await bcrypt.compare(password, member.password);

            if (!match) {
                // 비밀번호 불일치
                return res.status(401).json({ message: 'Authentication failed' });
            }

            // 쿠키 생성
            jwtUtils.createAuthCookie(res, member);

            // 성공 응답
            res.status(200).json({ message: 'Success' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    app.get('/api/v1/auth', async (req, res) => {
        const { email, password } = req.params

        try {
            if (!email) {
                throw new Error('회원 정보 없음');
            }

            const member = await memberService.getMemberByEmail(email); // 이메일에 해당하는 회원을 가져옴

            let comparePasswords = await memberService.comparePasswords(password, member.password)

            if (!comparePasswords) { // 비밀번호를 비교
                throw new Error('비밀번호 불일치');
            }
        } catch (e) {
            res.status(401).json({ error: 'Authentication failed' }); // 인증 실패 시 401 에러 반환
        }
        const profile = memberService.makeProfileFromMember(member);
        res.json({'result': true, 'content': profile});
        // });
    });

    app.get('/api/v1/members', async (req, res) => {
        const member = req.member;
        const shopId = member.shop_id;

        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        let result = await memberService.getMembers(shopId, page);
        res.json({'result': true, 'content': result})
    })

    app.post('/api/v1/members/sms/:type/send-verification-code', async function (req, res) {
        const type = req.params.type
        const phoneNumber = req.query.phoneNumber;

        let result = await memberService.sendMemberSmsVerificationCode(phoneNumber, type);
        res.json({'result': true, 'content': result})
    })
}
