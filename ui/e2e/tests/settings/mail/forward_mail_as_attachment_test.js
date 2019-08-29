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
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Mail');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C7778] Forwarding mail inline/attachment @shaky', async (I, users) => {
    const user = users[0];

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'e2e/tests/settings/mail/test.eml'
    }, { user });

    I.login('app=io.ox/mail', { user });
    I.waitForText('Richtig gutes Zeug');
    I.click('.list-item.selectable');
    I.waitForVisible('h1.subject');
    I.click('Forward');
    I.waitForText('Fwd: Richtig gutes Zeug');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        I.waitForText('---------- Original Message ----------');
    });

    I.click('Discard');
    I.logout();

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail/settings/compose', { user });
    I.waitForText('Mail Compose');
    I.click('Attachment');

    I.click('Mail');
    I.waitForText('Richtig gutes Zeug');
    I.click('.list-item.selectable');
    I.waitForVisible('h1.subject');
    I.click('Forward');
    I.waitToHide('.io-ox-mail-compose-window');
    I.waitForText('Fwd: Richtig gutes Zeug');
    I.see('1 attachment');
    I.waitForFocus('[placeholder="To"]');
    I.fillField('To', user.get('primaryEmail'));
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');
    I.wait(1);
    I.waitForText('Fwd: Richtig gutes Zeug');
    I.click('Fwd: Richtig gutes Zeug', '.list-item.selectable');
    I.waitForVisible('h1.subject');
    I.waitForText('1 attachment');
    I.click('1 attachment');
    I.see('Richtig_gutes_Zeug.eml');
});