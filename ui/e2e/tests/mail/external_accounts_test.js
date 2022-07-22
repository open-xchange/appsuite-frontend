/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../steps.d.ts" />
Feature('Mail > External Accounts');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

function createDraft(I, mail, dialogs, title) {
    mail.newMail();
    I.fillField('Subject', title);
    I.click('~Close', '.io-ox-mail-compose-window');
    dialogs.clickButton('Save draft');
    I.waitForDetached('.io-ox-mail-compose-window');
}


Scenario('[C125352] No mail oauth service available', function ({ I, mail }) {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    I.waitForText('Add mail account', 30, '.folder-tree .links.list-unstyled');
    I.click('Add mail account');

    // Check to see whether mail account wizard is shown up
    I.waitForElement('.add-mail-account-address', 30);
    I.seeElement('.add-mail-account-password');
});

Scenario('[OXUIB-225] Password recovery for account passwords after password change', async ({ I, dialogs, users }) => {
    await I.haveMailAccount({ name: 'My External', extension: 'ext' });

    I.login();
    // Check for the external account being registered
    I.waitForText('My External');
    I.dontSeeElement('.modal-dialog');
    I.logout();

    // Change password using external system
    await I.executeSoapRequest('OXUserService', 'change', {
        ctx: { id: users[0].context.id },
        usrdata: {
            id: users[0].get('id'),
            password: 'secret2'
        },
        auth: users[0].context.admin
    });
    users[0].userdata.password = 'secret2';

    I.login();
    //I.waitForText('My External');
    I.waitForText('Inbox');
    dialogs.waitForVisible();
    dialogs.clickButton('Remind me again');
    I.waitToHide('.modal-dialog');

    I.refreshPage();
    //I.waitForText('My External');
    I.waitForText('Inbox');
    dialogs.waitForVisible();
    dialogs.clickButton('Remove passwords');
    I.waitToHide('.modal-dialog');

    I.refreshPage();
    //I.waitForText('My External');
    I.waitForText('Inbox');
    I.dontSeeElement('.modal-dialog');
});

Scenario('[OXUIB-1966] Permissions dialog is disabled for external and secondary accounts', async ({ I, mail, users }) => {
    const additionalAccount = await users.create();
    await I.haveMailAccount({ additionalAccount, name: 'My External', extension: 'ext' });
    I.login();
    mail.waitForApp();
    I.waitForText('My External');
    I.rightClick('My External');
    I.waitForElement('.dropdown.open .dropdown-menu');
    I.dontSee('Permission', '.dropdown.open .dropdown-menu');
    I.pressKey('Escape');
    I.waitForDetached('.dropdown.open .dropdown-menu');
    I.click('.folder-arrow', '~My External');
    I.waitForText('Inbox', 5, '~My External');
    I.rightClick('Inbox', '~My External');
    I.waitForElement('.dropdown.open .dropdown-menu');
    I.dontSee('Permission', '.dropdown.open .dropdown-menu');
});

Scenario('[OXUI-1026] Testing with external SMPT enabled', async ({ I, mail, users, dialogs }) => {
    const defaultAddress = users[0].get('primaryEmail');
    const externalUser = (await I.haveMailAccount({ name: 'External Mail Account', extension: 'ext' })).data;
    const externalAddress = externalUser.primary_address;

    // 'Preparing external account'
    const sender = [[users[0].get('display_name'), users[0].get('primaryEmail')]];
    const recipient = [[externalUser.name, externalAddress]];
    await Promise.all([
        I.haveMail({ from: sender, to: recipient, subject: 'Test subject mail' }),
        // Change as soon as middleware config got set to: `await users[0].hasConfig('io.ox/mail//features/allowExternalSMTP', true)`
        I.haveSetting({ 'io.ox/mail': { features: { allowExternalSMTP: true } } })
        // users[0].hasConfig('io.ox/mail//features/allowExternalSMTP', true)
    ]);

    I.login();
    mail.waitForApp();

    // Checking absence of disabled external SMTP note when adding accounts
    I.click('Add mail account', '.folder-tree');

    // Checking for `Outgoing server (SMTP)` in `Add mail account` form
    I.waitForElement('.modal #add-mail-account-address', 10, externalAddress);
    I.fillField('.modal #add-mail-account-address', externalAddress);
    dialogs.clickButton('Add');
    I.waitForText('Auto-configuration failed', 10, '.modal');
    I.click('Configure manually', '.modal');
    I.waitForText('Outgoing server (SMTP)', 10, '.modal');
    I.seeElement('.modal #mail_server');
    I.seeElement('.modal #transport_server');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal');

    // Checking for selectable external mail account in mail compose
    mail.newMail();
    I.click('~From');
    I.waitForText(externalAddress);
    I.clickDropdown('Edit names');
    I.waitForText('Edit real names');
    I.waitForText(externalAddress, 10, '.modal-dialog');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
    I.click('~Close', '.io-ox-mail-compose-window');
    I.waitForDetached('.io-ox-mail-compose-window');

    // Checking external sender when composing mail from external account folder
    I.doubleClick('External Mail Account', '.window-sidepanel');
    I.waitForText('Inbox', 10, '.window-sidepanel .virtual.remote-folders');
    mail.newMail();
    I.waitForText(externalAddress, 10, '.io-ox-mail-compose-window .sender');
    I.click('~Close', '.io-ox-mail-compose-window');
    I.waitForDetached('.io-ox-mail-compose-window');

    // Checking external sender when replying to external mail
    I.doubleClick('Inbox', '.window-sidepanel .virtual.remote-folders');
    mail.selectMail('Test subject mail');
    I.click('Reply', '.rightside .detail-view-header');
    I.waitForText(externalAddress, 10, '.io-ox-mail-compose-window .sender');
    I.waitForElement('.token-input');
    I.waitForElement('iframe[title*="Rich Text Area"]');
    I.click('.token-input');
    I.fillField('To', defaultAddress);
    mail.send();

    createDraft(I, mail, dialogs, 'Test subject draft');

    // Checking external sender when opening external draft
    I.click('div[title*="Inbox"] .fa-caret-right', '.window-sidepanel .virtual.remote-folders');
    I.retry(3).click('div[title*="Drafts"]', '.window-sidepanel .virtual.remote-folders');
    mail.selectMail('Test subject draft');
    I.click('Edit', '.rightside .detail-view-header');
    I.waitForText(externalAddress, 10, '.io-ox-mail-compose-window .sender');
    I.waitForElement('.token-input');
    I.waitForElement('iframe[title*="Rich Text Area"]');
    I.click('.token-input');
    I.fillField('To', defaultAddress);
    mail.send();

    // Checking for `Outgoing server (SMTP)` in account settings form
    I.openApp('Settings', { folder: 'virtual/settings/io.ox/settings/accounts' });
    I.waitForText('External Mail Account', 10);
    I.click('~Edit ' + 'External Mail Account');
    I.waitForText('Outgoing server (SMTP)', 10, '.modal');

    // Checking if the form can be submitted
    dialogs.clickButton('Save');
    I.waitForElement('.io-ox-alert.io-ox-alert-success', 10);
});

Scenario('[OXUI-1026] Testing with external SMPT disabled', async ({ I, mail, users, dialogs }) => {
    const externalUser = (await I.haveMailAccount({ name: 'External Mail Account', extension: 'ext' })).data;
    const externalAddress = externalUser.primary_address;

    // Preparing external account
    const sender = [[users[0].get('display_name'), users[0].get('primaryEmail')]];
    const recipient = [[externalUser.name, externalAddress]];
    await Promise.all([
        I.haveMail({ from: sender, to: recipient, subject: 'Test subject mail' }),
        // Change as soon as middleware config got set to: `await users[0].hasConfig('io.ox/mail//features/allowExternalSMTP', false)`
        I.haveSetting({ 'io.ox/mail': { features: { allowExternalSMTP: false } } })
        // users[0].hasConfig('com.openexchange.mail.smtp.allowExternal', false)
    ]);
    // await I.waitForSetting({ 'io.ox/mail': { features: { allowExternalSMTP: false } } }, 30);

    I.login();
    mail.waitForApp();

    // Checking for disabled external SMTP note when adding accounts
    I.click('Add mail account', '.folder-tree');

    // Checking absence of `Outgoing server (SMTP)` in `Add mail account` form
    I.waitForElement('.modal #add-mail-account-address', 10, externalAddress);
    I.fillField('.modal #add-mail-account-address', externalAddress);
    dialogs.clickButton('Add');
    I.waitForText('Auto-configuration failed', 10, '.modal');
    I.click('Configure manually', '.modal');
    I.waitForText('Incoming server', 10, '.modal');
    I.dontSee('Outgoing server (SMTP)', '.modal');
    I.dontSee('.modal #transport_server');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal');

    // Checking for missing external mail account mail compose
    mail.newMail();
    I.click('~From');
    I.dontSee(externalAddress);
    I.clickDropdown('Edit names');
    I.waitForText('Edit real names');
    I.dontSee(externalAddress, '.modal-dialog');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
    I.click('~Close', '.io-ox-mail-compose-window');
    I.waitForDetached('.io-ox-mail-compose-window');

    // Checking for default address when composing mail from external account folder
    I.doubleClick('External Mail Account', '.window-sidepanel');
    I.waitForText('Inbox', 10, '.window-sidepanel .virtual.remote-folders');
    mail.newMail();
    I.waitForText('From', 10, '.io-ox-mail-compose-window .sender');
    I.dontSee(externalAddress);
    I.click('~From');
    I.dontSee(externalAddress);
    I.pressKey('Escape');
    I.click('~Close', '.io-ox-mail-compose-window');
    I.waitForDetached('.io-ox-mail-compose-window');
    I.click('Inbox', '.window-sidepanel .virtual.remote-folders');
    mail.selectMail('Test subject mail');

    // Reply
    I.click('Reply', '.rightside .detail-view-header');
    I.waitForText('From', 10, '.io-ox-mail-compose-window .sender');
    I.waitForElement('iframe[title*="Rich Text Area"]');
    I.dontSee(externalAddress);
    I.click('~From');
    I.dontSee(externalAddress);
    I.pressKey('Escape');
    I.click('~Close', '.io-ox-mail-compose-window');
    I.waitForDetached('.io-ox-mail-compose-window');

    // Reply all
    I.click('Reply all', '.rightside .detail-view-header');
    I.waitForText('From', 10, '.io-ox-mail-compose-window .sender');
    I.waitForElement('iframe[title*="Rich Text Area"]');
    I.dontSee(externalAddress);
    I.click('~From');
    I.dontSee(externalAddress);
    I.pressKey('Escape');
    I.click('~Close', '.io-ox-mail-compose-window');
    I.waitForDetached('.io-ox-mail-compose-window');

    // Forward
    I.click('Forward', '.rightside .detail-view-header');
    I.waitForText('From', 10, '.io-ox-mail-compose-window .sender');
    I.waitForFocus('[placeholder="To"]');
    I.dontSee(externalAddress);
    I.click('~From');
    I.dontSee(externalAddress);
    I.pressKey('Escape');
    I.click('~Close', '.io-ox-mail-compose-window');
    I.waitForDetached('.io-ox-mail-compose-window');

    createDraft(I, mail, dialogs, 'Test subject draft');

    // Checking sender replacement for external drafts
    I.click('div[title*="Inbox"] .fa-caret-right', '.window-sidepanel .virtual.remote-folders');
    I.retry(3).click('div[title*="Drafts"]', '.window-sidepanel .virtual.remote-folders');
    mail.selectMail('Test subject draft');
    I.click('Edit', '.rightside .detail-view-header');
    I.waitForText('From', 10, '.io-ox-mail-compose-window .sender');
    I.waitForElement('iframe[title*="Rich Text Area"]');
    I.dontSee(externalAddress);
    I.click('~From');
    I.dontSee(externalAddress);
    I.pressKey('Escape');
    I.click('~Close', '.io-ox-mail-compose-window');

    // Checking absence of `Outgoing server (SMTP)` in account settings form
    I.openApp('Settings', { folder: 'virtual/settings/io.ox/settings/accounts' });
    I.waitForText('External Mail Account', 10);
    I.click('~Edit ' + 'External Mail Account');
    I.waitForText('Incoming server', 10, '.modal');
    I.dontSee('Outgoing server (SMTP)');

    // Checking if the form can be submitted
    dialogs.clickButton('Save');
    I.waitForElement('.io-ox-alert.io-ox-alert-success', 10);
});

Scenario('[OXUI-1026] Testing when SMPT gets disabled for existing external account', async ({ I, users, mail, dialogs }) => {
    const externalUser = (await I.haveMailAccount({ name: 'External Mail Account', extension: 'ext' })).data;
    const externalAddress = externalUser.primary_address;

    // Preparing external account
    const sender = [[users[0].get('display_name'), users[0].get('primaryEmail')]];
    const recipient = [[externalUser.name, externalAddress]];
    await Promise.all([
        I.haveMail({ from: sender, to: recipient, subject: 'Test subject mail' }),
        // Change as soon as middleware config got set to: `await users[0].hasConfig('io.ox/mail//features/allowExternalSMTP', true)`
        I.haveSetting({ 'io.ox/mail': { features: { allowExternalSMTP: true } } })
        // users[0].hasConfig('com.openexchange.mail.smtp.allowExternal', true)
    ]);
    // await I.waitForSetting({ 'io.ox/mail': { features: { allowExternalSMTP: true } } }, 10);

    I.login();
    mail.waitForApp();

    // Checking absence of disabled external SMTP note when adding accounts
    I.click('Add mail account', '.folder-tree');

    // Checking for `Outgoing server (SMTP)` in `Add mail account` form
    I.waitForElement('.modal #add-mail-account-address', 10, externalAddress);
    I.fillField('.modal #add-mail-account-address', externalAddress);
    dialogs.clickButton('Add');
    I.waitForText('Auto-configuration failed', 10, '.modal');
    I.click('Configure manually', '.modal');
    I.waitForText('Outgoing server (SMTP)', 10, '.modal');
    I.seeElement('.modal #mail_server');
    I.seeElement('.modal #transport_server');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal');

    // Checking for selectable external mail account in mail compose and creating a new draft
    mail.newMail();
    I.click('~From');
    I.waitForText(externalAddress);
    I.pressKey('Escape');
    I.fillField('Subject', 'Test subject draft');
    I.click('~Close', '.io-ox-mail-compose-window');
    dialogs.clickButton('Save draft');
    I.waitForDetached('.io-ox-mail-compose-window');

    I.logout();

    // Use something async to break up promise chain
    await I.executeScript('');
    // Change as soon as middleware config got set to: `await users[0].hasConfig('io.ox/mail//features/allowExternalSMTP', false)`
    await I.haveSetting({ 'io.ox/mail': { features: { allowExternalSMTP: false } } });
    // await users[0].hasConfig('com.openexchange.mail.smtp.allowExternal', false);
    // await I.waitForSetting({ 'io.ox/mail': { features: { allowExternalSMTP: false } } }, 30);

    I.login();
    mail.waitForApp();

    // Checking for selectable external mail account in mail compose
    mail.newMail();
    I.click('~From');
    I.retry(3).dontSee(externalAddress);
    I.pressKey('Escape');
    I.click('~Close', '.io-ox-mail-compose-window');
    I.waitForDetached('.io-ox-mail-compose-window');

    I.retry(3).doubleClick('External Mail Account', '.window-sidepanel');
    I.waitForText('Inbox', 10, '.window-sidepanel .virtual.remote-folders');
    I.doubleClick('Inbox', '.window-sidepanel .virtual.remote-folders');
    mail.newMail();
    I.waitForText('From', 10, '.io-ox-mail-compose-window .sender');
    I.dontSee(externalAddress);
    I.click('~From');
    I.dontSee(externalAddress);
    I.pressKey('Escape');
    I.click('~Close', '.io-ox-mail-compose-window');
    I.waitForDetached('.io-ox-mail-compose-window', 10);
    mail.selectMail('Test subject mail');
    I.click('Reply', '.rightside .detail-view-header');
    I.waitForText('From', 10, '.io-ox-mail-compose-window .sender');
    I.waitForElement('iframe[title*="Rich Text Area"]');
    I.dontSee(externalAddress);
    I.click('~From');
    I.dontSee(externalAddress);
    I.pressKey('Escape');
    I.click('~Close', '.io-ox-mail-compose-window');
    I.waitForDetached('.io-ox-mail-compose-window');
});
