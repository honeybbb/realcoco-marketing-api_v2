'use strict';

const invitationService = require('../service/invitation/invitation.service')

module.exports = function (app) {
    app.post('/api/v1/:shopId/invitation/send-mail', async function (req, res) {
        const shopId = req.params.shopId,
            mailAddresses = req.body.mailAddresses;

        let result = await invitationService.sendInvitationMail(mailAddresses);

        res.json({ 'result':true, 'data': result });
    })
}
