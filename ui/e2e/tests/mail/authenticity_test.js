/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
 */
///  <reference path="../../steps.d.ts" />

const assert = require('assert');

Scenario('[C244757] SPF, DKIM, DMARC, DMARC Policy matrix', async function (I, users, mail) {
    let [user] = users;
    user.hasConfig('com.openexchange.mail.authenticity.enabled', true);
    user.hasConfig('com.openexchange.mail.authenticity.authServId', 'mx.recipient.ox');
    await Promise.all([
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/1-A-SPFpass-DKIMpass-DMARCpass-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/1-A-SPFpass-DKIMpass-DMARCpass-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/1-A-SPFpass-DKIMpass-DMARCpass-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/10-B-SPFpass-DKIMmissing-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/11-C-SPFpass-DKIMfail-DMARCpass-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/11-C-SPFpass-DKIMfail-DMARCpass-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/11-C-SPFpass-DKIMfail-DMARCpass-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/12-C-SPFpass-DKIMfail-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/13-C-SPFpass-DKIMfail-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/14-C-SPFpass-DKIMfail-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/15-C-SPFpass-DKIMfail-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/16-D1-SPFmissing-DKIMpass-DMARCpass-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/16-D1-SPFmissing-DKIMpass-DMARCpass-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/16-D1-SPFmissing-DKIMpass-DMARCpass-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/16-D1-SPFneutral-DKIMpass-DMARCpass-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/16-D1-SPFneutral-DKIMpass-DMARCpass-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/16-D1-SPFneutral-DKIMpass-DMARCpass-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/17-D1-SPFmissing-DKIMpass-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/17-D1-SPFneutral-DKIMpass-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/18-D1-SPFmissing-DKIMpass-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/18-D1-SPFneutral-DKIMpass-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/19-D1-SPFmissing-DKIMpass-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/19-D1-SPFneutral-DKIMpass-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/2-A-SPFpass-DKIMpass-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/20-D1-SPFmissing-DKIMpass-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/20-D1-SPFneutral-DKIMpass-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/21-D2-SPFmissing-DKIMmissing-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/21-D2-SPFneutral-DKIMmissing-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/22-D2-SPFmissing-DKIMmissing-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/22-D2-SPFneutral-DKIMmissing-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/23-D2-SPFmissing-DKIMmissing-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/23-D2-SPFneutral-DKIMmissing-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/24-D2-SPFmissing-DKIMmissing-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/24-D2-SPFneutral-DKIMmissing-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/25-D3-SPFmissing-DKIMfail-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/25-D3-SPFneutral-DKIMfail-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/26-D3-SPFmissing-DKIMfail-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/26-D3-SPFneutral-DKIMfail-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/27-D3-SPFmissing-DKIMfail-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/27-D3-SPFneutral-DKIMfail-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/28-D3-SPFmissing-DKIMfail-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/28-D3-SPFneutral-DKIMfail-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/29-E1-SPFsoftfail-DKIMpass-DMARCpass-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/29-E1-SPFsoftfail-DKIMpass-DMARCpass-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/29-E1-SPFsoftfail-DKIMpass-DMARCpass-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/3-A-SPFpass-DKIMpass-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/30-E1-SPFsoftfail-DKIMpass-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/31-E1-SPFsoftfail-DKIMpass-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/32-E1-SPFsoftfail-DKIMpass-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/33-E1-SPFsoftfail-DKIMpass-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/34-E2-SPFsoftfail-DKIMmissing-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/35-E2-SPFsoftfail-DKIMmissing-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/36-E2-SPFsoftfail-DKIMmissing-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/37-E2-SPFsoftfail-DKIMmissing-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/38-E3-SPFsoftfail-DKIMfail-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/39-E3-SPFsoftfail-DKIMfail-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/4-A-SPFpass-DKIMpass-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/40-E3-SPFsoftfail-DKIMfail-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/41-E3-SPFsoftfail-DKIMfail-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/42-F1-SPFfail-DKIMpass-DMARCpass-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/42-F1-SPFfail-DKIMpass-DMARCpass-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/42-F1-SPFfail-DKIMpass-DMARCpass-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/43-F1-SPFfail-DKIMpass-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/44-F1-SPFfail-DKIMpass-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/45-F1-SPFfail-DKIMpass-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/46-F1-SPFfail-DKIMpass-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/47-F2-SPFfail-DKIMmissing-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/48-F2-SPFfail-DKIMmissing-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/49-F2-SPFfail-DKIMmissing-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/5-A-SPFpass-DKIMpass-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/50-F2-SPFfail-DKIMmissing-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/51-F3-SPFfail-DKIMfail-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/52-F3-SPFfail-DKIMfail-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/53-F3-SPFfail-DKIMfail-DMARCfail-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/54-F3-SPFfail-DKIMfail-DMARCmissing.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/6-B-SPFpass-DKIMmissing-DMARCpass-none.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/6-B-SPFpass-DKIMmissing-DMARCpass-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/6-B-SPFpass-DKIMmissing-DMARCpass-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/7-B-SPFpass-DKIMmissing-DMARCfail-reject.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/8-B-SPFpass-DKIMmissing-DMARCfail-quarantine.eml' }, { user }),
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/9-B-SPFpass-DKIMmissing-DMARCfail-none.eml' }, { user })
    ]);
    I.login('app=io.ox/mail');
    mail.waitForApp();
    const numOfMails = await I.grabNumberOfVisibleElements('.list-view li.list-item');
    for (let i = 0; i < numOfMails; i++) {
        mail.selectMailByIndex(i);
        I.waitForElement('.mail-detail-frame');
        I.switchTo('.mail-detail-frame');
        let mailContent = await I.grabTextFrom('.mail-detail-content');
        let result = mailContent.replace(/Result: /, '');
        var notifications, addressColor, backgroundColor;
        switch (result) {
            case 'pass':
            case 'neutral':
                I.switchTo();
                I.waitForElement('.address');
                addressColor = await I.grabCssPropertyFrom('.address', 'color');
                assert.equal(addressColor, 'rgb(118, 118, 118)');
                notifications = await I.grabHTMLFrom('.mail-detail .notifications');
                assert.equal(notifications, '<div></div>');
                I.dontSee('Warning: Be careful with this message. It might be spam or a phishing mail.');
                I.dontSee('Warning: This is a dangerous email containing spam or malware.');
                break;
            case 'suspicious':
                I.switchTo();
                I.waitForElement('.address.authenticity-sender.suspicious');
                addressColor = await I.grabCssPropertyFrom('.address.authenticity-sender.suspicious', 'color');
                assert.equal(addressColor, 'rgb(197, 0, 0)');
                I.waitForElement('.authenticity .suspicious');
                backgroundColor = await I.grabCssPropertyFrom('.notifications .authenticity .suspicious', 'background-color');
                assert.equal(backgroundColor, 'rgb(197, 0, 0)');
                I.waitForElement('.mail-detail .authenticity-icon-suspicious');
                I.see('Warning: Be careful with this message. It might be spam or a phishing mail.');
                break;
            case 'fail':
                I.switchTo();
                I.waitForElement('.address.authenticity-sender.fail');
                addressColor = await I.grabCssPropertyFrom('.address.authenticity-sender.fail', 'color');
                assert.equal(addressColor, 'rgb(197, 0, 0)');
                I.waitForElement('.authenticity .fail');
                backgroundColor = await I.grabCssPropertyFrom('.authenticity .fail', 'background-color');
                assert.equal(backgroundColor, 'rgb(197, 0, 0)');
                I.waitForElement('.authenticity-icon-fail');
                I.see('Warning: This is a dangerous email containing spam or malware.');
                break;
            default:
                throw new Error(`Unknown result: ${result}`);
        }
    }
});
