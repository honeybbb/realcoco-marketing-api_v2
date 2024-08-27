const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const shopService = require('../../service/shop/shop.service');
const memberModel = require('../../model/member/member.model');
const algorithm = 'aes-128-ecb'; // AES-128-ECB 사용
const encryptKey = 'realcocorealcoco'; // 키

// 사용자 정보를 바탕으로 JWT를 발급하는 함수
exports.generateToken =  async function (user) {
    // 사용자 정보를 기반으로 토큰을 생성합니다. 여기서는 사용자 ID를 페이로드로 사용합니다.
    return jwt.sign(
        { userId: user.id },
        'secret',
        { expiresIn: '1h' }
    );
}

exports. verifyToken = async function (token) {
    try {
        const decoded = jwt.verify(token, 'secret');
        return decoded.userId;
    } catch (error) {
        // 토큰이 유효하지 않은 경우 또는 만료된 경우
        return null;
    }
}

exports.getMemberByEmail = async function (email) {
    let result = await memberModel.findByEmail(email);

    return result
}

exports.authV2 = async function (req, res) {
    let member = req.body.member;

    let profile = makeProfileFromMember(member);

    res.json({'result': true, 'content': profile})
}
function makeProfileFromMember(member) {
    const shop = shopService.getShopById(member.shopId);

    let profile = {};
    Object.assign(profile, member);
    profile.shop = shop;

    return profile;
}

exports.getMemberByUsername = async function (username) {
    const member = await memberModel.findByUsername(username);
    return member;
}

exports.register = async function (shopName) {
    let shop = await shopService.findByShopName(shopName);

    if(!shop) {

    }

    shop = shopService.saveShop(shop);

    return shop;
}

exports.comparePasswords = async function (inputPassword, storedPassword) {
    return inputPassword === storedPassword;
}

exports.getRealtimeInflowCafe24Member = async function (pageRequest) {
    const sort = pageRequest.sort || 'lastAccessTime';
    const order = pageRequest.order || 'ASC';
    const searchClause = getSearchClause(pageRequest);

    try {
        // 데이터베이스에서 데이터 가져오기 sort: "lastAccessTime", order: "DESC", where: "AND  LIKE '%%'"
        const realtimeInflowCafe24Member = await memberModel.getRealtimeMember(sort, order.toUpperCase(), searchClause);

        //console.log(realtimeInflowCafe24Member, 'realtime/inflow/cafe24-members')
        // 복호화 임시로 주석
        realtimeInflowCafe24Member.forEach(member => {
            toDecrypt(member);
        });

        return realtimeInflowCafe24Member;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }

}

const getSearchClause = function (pageRequest) {
    if (!pageRequest.query || !pageRequest.filter) {
        return "";
    } else {
        if (pageRequest.filter === "name" || pageRequest.filter === "cellPhone") {
            const encryptedQuery = encrypt(pageRequest.query);
            pageRequest.query = encryptedQuery;
        }
        return `AND ${pageRequest.filter} LIKE '%${pageRequest.query}%'`;
    }
}

exports.decrypt = function (dbData) {
    if (!dbData) {
        return null;
    }

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptKey, 'utf-8'), null);
    let decrypted = decipher.update(dbData, 'base64', 'utf-8');
    decrypted += decipher.final('utf-8');

    console.log(decrypted, 'decrypted')
    return decrypted;
}

function toDecrypt(data) {
    //console.log(data, '멤버 데이터')

    data.name = this.decrypt(data.name);
    data.cellPhone = this.decrypt(data.cellPhone);

    //console.log(data)

    //data.name = (data.name);
    //data.cellPhone = (data.cellPhone);

    return data;
}
function encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', 'secret'); // 'secret'은 암호화 키입니다. 보안상 적절한 키를 사용해야 합니다.
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

exports.getMembers = async function (shopId, page) {
    let result = memberModel.findByShopId(shopId)
    return result;
}

exports.sendMemberSmsVerificationCode = async function (phoneNumber, type) {
    try {
        let memberOptional = memberModel.findByPhoneNumber(phoneNumber);

        if (type) {
            if (!memberOptional) throw new Error('UserNotFoundException');
        } else {
            if (memberOptional) throw new Error('SameExistsPhoneNumberException');
        }

        // const verificationCode = generateVerificationCode(); // 가정: 검증 코드 생성 함수
        // const memberSmsVerificationCode = createMemberSmsVerificationCode(1, request, verificationCode, type);
        // await memberSmsVerificationCodeRepository.save(memberSmsVerificationCode);
        // await smsClient.sendVerificationCode(request.phoneNumber, verificationCode);
    } catch (error) {
        console.error(error);
        // 에러 처리 (에러 로깅 또는 클라이언트로 에러 응답 등)
    }

}
