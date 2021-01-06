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

const fs = require('fs');
const path = require('path');

Feature('Middleware > Mail authenticity');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

const testMails = new DataTable(['testMails']);
/* global codecept_dir: true */
const files = fs.readdirSync(path.join(codecept_dir, 'e2e/media/mails/authenticity'));
/*
  files should contain 81 files which are split into chunks of 9 mails.
  this reduces the overhead of running one test per mail while keeping the
  possibility to speed up testrun using parallelisation
*/
while (files.length) {
    testMails.add([files.splice(0, 9)]);
}

Data(testMails).Scenario('[C244757] SPF, DKIM, DMARC, DMARC Policy matrix', async function (I, users, mail, current) {
    let [user] = users;
    const mails = current.testMails.map(m => {
        return I.haveMail({ folder: 'default0/INBOX', path: path.join('e2e/media/mails/authenticity', m) }, { user });
    });
    await Promise.all([
        user.hasConfig('com.openexchange.mail.authenticity.enabled', true),
        user.hasConfig('com.openexchange.mail.authenticity.authServId', 'mx.recipient.ox')
    ].concat.apply(mails, mails));
    I.login('app=io.ox/mail');
    mail.waitForApp();
    for (let index = 0; index < mails.length; index++) {
        mail.selectMailByIndex(index);
        I.waitForElement('.mail-detail-frame');
        I.switchTo('.mail-detail-frame');
        let mailContent = await I.grabTextFrom('.mail-detail-content');
        let result = mailContent.replace(/Result: /, '');
        I.switchTo();
        //I.waitForElement('.address.authenticity-sender');
        I.waitForElement('.address');
        switch (result) {
            case 'pass':
            case 'neutral':
                I.seeCssPropertiesOnElements('.address', { color: 'rgb(118, 118, 118)' });
                I.dontSee('Warning: Be careful with this message. It might be spam or a phishing mail.');
                I.dontSee('Warning: This is a dangerous email containing spam or malware.');
                break;
            case 'suspicious':
                I.seeCssPropertiesOnElements('.address', { color: 'rgb(197, 0, 0)' });
                I.waitForElement('.authenticity .suspicious');
                I.seeCssPropertiesOnElements('.notifications .authenticity .suspicious', { 'background-color': 'rgb(197, 0, 0)' });
                I.waitForElement('.mail-detail .authenticity-icon-suspicious');
                I.see('Warning: Be careful with this message. It might be spam or a phishing mail.');
                break;
            case 'fail':
                I.seeCssPropertiesOnElements('.address', { color: 'rgb(197, 0, 0)' });
                I.waitForElement('.authenticity .fail');
                I.seeCssPropertiesOnElements('.authenticity .fail', { 'background-color': 'rgb(197, 0, 0)' });
                I.waitForElement('.authenticity-icon-fail');
                I.see('Warning: This is a dangerous email containing spam or malware.');
                break;
            default:
                throw new Error(`Unknown result: ${result}`);
        }
    }
    I.seeNumberOfVisibleElements('.list-view li.list-item', mails.length);
});
