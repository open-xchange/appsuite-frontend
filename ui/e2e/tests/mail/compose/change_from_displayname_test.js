/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2019 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Francisco Laguna <francisco.laguna@open-xchange.com>
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose');

Before(async (users) => {
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[OXUIB-142] personal field of primary account should be respected', async (I, users, mail) => {
    let [user] = users;
    const customDisplayNames = {};
    customDisplayNames[`${user.get('primaryEmail')}`] = {
        name: `${user.get('given_name')} ${user.get('sur_name')}`,
        overwrite: false,
        defaultName: `${user.get('given_name')} ${user.get('sur_name')}`
    };
    await I.haveSetting({
        'io.ox/mail': {
            features: { registerProtocolHandler: false },
            customDisplayNames,
            sendDisplayName: true
        }
    });
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/settings/accounts');
    I.waitForVisible('.settings-list-item a.action');
    I.waitForText('Edit', 5, '.settings-list-item');
    I.retry(5).click('Edit');
    I.fillField('Your name', 'Entropy McDuck');
    I.click('Save');

    I.openApp('Mail');
    mail.newMail();

    // Verify the dislay name has changed
    I.see('Entropy McDuck');
});

Scenario('update account with mail compose app open', async (I, users, mail) => {
    let [user] = users;
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail');
    mail.newMail();

    // verify default display name
    I.see(`${user.get('given_name')} ${user.get('sur_name')}`);
    I.click(mail.locators.compose.close);

    I.openApp('Settings', { folder: 'virtual/settings/io.ox/settings/accounts' });
    I.waitForVisible('.settings-list-item a.action');
    I.waitForText('Edit', 5, '.settings-list-item');
    I.retry(5).click('Edit');
    I.fillField('Your name', 'Entropy McDuck');
    I.click('Save');

    I.openApp('Mail');
    mail.waitForApp();
    mail.newMail();

    // Verify the dislay name has changed
    I.see('Entropy McDuck');
});
