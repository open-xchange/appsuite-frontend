/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Detail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C101617] Mail with <strike> element </strike>', async ({ I, mail }) => {
    await Promise.all([
        I.haveSetting('io.ox/mail//features/registerProtocolHandler', false),
        I.haveMail({
            folder: 'default0/INBOX',
            path: 'e2e/media/mails/c101617.eml'
        })
    ]);

    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.selectMail('mail with <strike> element </strike>');
    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForElement('.mail-detail-content .e2e');
        I.seeCssPropertiesOnElements('.mail-detail-content .e2e', { 'text-decoration-line': 'line-through' });
    });
});
