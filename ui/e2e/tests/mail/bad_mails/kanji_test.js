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

Scenario('[C101621] Kanji', async function ({ I, users, mail }) {
    const [user] = users;
    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/C101621.eml' }, { user });
    I.login('app=io.ox/mail');
    I.waitForText('Kanji');
    mail.selectMail('Kanji');
    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, () => {
        I.see('我给你的');
        I.seeElement({ css: 'a[href="mailto:test@gmail.com"]' });
        I.see('发了一封邮');
    });
});

