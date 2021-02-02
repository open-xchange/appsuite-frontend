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
///  <reference path="../../../steps.d.ts" />

Scenario('[C101616] HTML gradient', async function ({ I, users, mail }) {
    const [user] = users;
    await Promise.all([
        I.haveMail({
            folder: 'default0/INBOX',
            path: 'e2e/media/mails/C101616.eml'
        }, { user }),
        I.haveSetting('io.ox/mail//allowHtmlImages', true)
    ]);
    I.login('app=io.ox/mail');
    I.waitForText('HTML gradient');
    mail.selectMail('HTML gradient');
    I.waitForText('There should be a 300px high td around me with a CSS gradient');
    within({ frame: '.mail-detail-frame' }, () => {
        I.seeElement(locate('table').withAttr({ class: 'head-wrap', height: '300px' }));
    });
});
