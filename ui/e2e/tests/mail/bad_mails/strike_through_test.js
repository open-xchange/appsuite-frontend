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

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C101617] Mail with <strike> element </strike>', async (I, users) => {
    const user = users[0];

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'e2e/media/mails/c101617.eml'
    }, { user });

    I.login('app=io.ox/mail');
    I.waitForText('mail with <strike> element </strike>');
    I.click('mail with <strike> element </strike>', '.list-item.selectable');
    within({ frame: '.mail-detail-frame' }, () => {
        I.seeCssPropertiesOnElements('.mail-detail-content .e2e', { 'text-decoration-line': 'line-through' });
    });
});
