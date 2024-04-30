const jwt = require('jsonwebtoken');
const SECURITY_KEY = '28XttuCMEpRnVSFvsovQ';
const EXPIRED_TIME = 1000 * 60 * 60 * 3;
/*
const createHeader = () => {
    return { typ: 'JWT', alg: 'HS256' };
};

const createClaims = (member) => {
    // `toMemberJwtClaims` 함수가 JavaScript 객체의 메소드로 존재해야 합니다.
    const memberJwtClaims = member.toMemberJwtClaims();
    return Object.entries(memberJwtClaims).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
    }, {});
};

const generateJwtToken = (member) => {
    const now = Date.now();
    const payload = {
        sub: 'auth token',
        ...createHeader(),
        ...createClaims(member),
        exp: Math.floor((now + EXPIRED_TIME) / 1000), // 초 단위로 변환
    };

    return jwt.sign(payload, SECURITY_KEY);
};

const parseJwtToken = (jwtToken) => {
    return jwt.verify(jwtToken, SECURITY_KEY);
};
*/


function generateJwtToken(member) {
    const payload = {
        id: member.id, // 예시 payload
        username: member.username
        // 필요한 추가적인 멤버 정보를 여기에 포함시킬 수 있습니다.
    };

    return jwt.sign(payload, SECURITY_KEY, { expiresIn: '1h' }); // 토큰 만료 시간은 예시입니다. 필요에 따라 조정하세요.
}

exports.createAuthCookie = function (res, member) {
    const token = generateJwtToken(member);
    // 쿠키 옵션. 필요에 따라 secure, httpOnly 등의 옵션을 추가할 수 있습니다.
    const cookieOptions = {
        maxAge: 3600000, // 1시간 후 만료, -1 대신 실제 만료 시간을 밀리초 단위로 설정
        httpOnly: true // 클라이언트 측 자바스크립트가 쿠키에 접근하지 못하도록 합니다.
    };
    res.cookie('rmapi_auth_token', token, cookieOptions);
}
