const memberService = require('../member/member.service');
const jwtUtils = require('../../utils/jwt.utils');

const APP_KEY =  "Cjl7EwvxBmIQULny";
const SECRET_KEY = "cbmWgii1";

exports.sendInvitationMail = async function (mailAddresses) {
    const member = AuthUtils.getLoggedInMember();
    const shopId = member.shopId;

    mailAddresses.forEach(mailAddress => {
        const memberByEmail = memberService.getMemberByEmail(mailAddress);

        if (memberByEmail !== null) {
            return res.status(-240).json({'result': false, 'err': "이미 사용 중인 이메일입니다."});
        }

        const invitationToken = jwtUtils.generateInvitationJwtToken(
            new InvitationJwtClaims(shopId, mailAddress)
        );

        sendInvitation(mailAddress, invitationToken, url);
    });
}

function sendInvitation (mailAddress, invitationToken, url) {
    let result = sendMail()
}
