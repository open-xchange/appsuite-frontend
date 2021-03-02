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

Before(async ({ users }) => {
    var user = users.getRandom();
    user.aliases = [`${user.name}@${user.domain}`, 'foo@ox.io'];
    await users.create(user);
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7781] Default sender address', async ({ I, users, mail }) => {
    const user = users[0];

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    await I.haveAnAlias('urbi@orbi.it', { user });
    I.login('app=io.ox/mail');
    mail.newMail();
    I.click(`<${user.get('primaryEmail')}>`, '.mail-input');
    I.retry(5).click('Show names');
    I.see('foo@ox.io');
    I.clickDropdown('urbi@orbi.it');
    I.waitForVisible('.token-input.tt-input');
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Richtig gutes Zeug');
    mail.send();
    I.triggerRefresh();
    mail.selectMail('Richtig gutes Zeug');
    I.waitForText('urbi@orbi.it', 30);
});
