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

Feature('Settings');

Before(async (users) => {
    var user = users.getRandom();
    user.aliases = user.name + '@ox-e2e-backend.novalocal,foo@ox.io';
    await users.create(user);
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[7781] Default sender address', async (I, users) => {
    const user = users[0];

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    await I.haveAnAlias('urbi@orbi.it');
    I.login('app=io.ox/mail');
    I.waitForText('Compose');
    I.click('Compose');
    // Wait for the compose dialog
    I.waitForVisible('.io-ox-mail-compose .row.sender');
    I.click(user.get('primaryEmail'));
    I.waitForText('urbi@orbi.it');
    I.click('urbi@orbi.it');
    I.waitForVisible('.token-input.tt-input');
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Richtig gutes Zeug');
    I.click('Send');
    I.waitForText('urbi@orbi.it');
});
