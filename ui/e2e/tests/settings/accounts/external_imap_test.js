/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

/// <reference path="../../../steps.d.ts" />

Feature('Custom mail account');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

/*
 * Depending on the setup, this test might fail, as the mail domain might be rejected
 * by the java middleware. Check "com.openexchange.mail.account.blacklist" setting in this case.
*/
Scenario('[C7836] Add custom mail account (IMAP)', async ({ I, users, mail, dialogs, contexts }) => {
    const secondContext = await contexts.create();
    await users.create(users.getRandom(), secondContext);
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    const [internalUser, externalUser] = users;
    const mailDomain = externalUser.get('primaryEmail').replace(/.*@/, '');

    I.login({ user: internalUser });
    mail.waitForApp();
    I.click('Add mail account');
    dialogs.waitForVisible();
    I.waitForText('Your mail address');
    I.fillField('Your mail address', externalUser.get('primaryEmail'));
    I.fillField('Your password', externalUser.userdata.password);
    dialogs.clickButton('Add');
    dialogs.clickButton('Configure manually');

    dialogs.waitForVisible();
    I.fillField('Account name', externalUser.userdata.primaryEmail);
    I.fillField('Email address', externalUser.userdata.primaryEmail);
    I.fillField('#transport_server', mailDomain);
    I.fillField('#mail_server', mailDomain);
    I.fillField('#password', externalUser.userdata.password);
    I.fillField('#transport_port', '25');
    I.selectOption('#transport_auth', 'None');
    I.wait(1);
    dialogs.clickButton('Save');

    I.waitToHide('.modal-dialog');
    I.retry(10).waitForText('Ignore Warnings', 12);
    dialogs.clickButton('Ignore Warnings');
    mail.newMail();
    I.fillField('To', externalUser.userdata.primaryEmail);
    I.fillField('Subject', 'Howdee yihaa!');
    I.fillField({ css: 'textarea.plain-text' }, 'We are not in Cansas anymore!');
    mail.send();
    I.waitForText(externalUser.userdata.primaryEmail);
    I.doubleClick(externalUser.userdata.primaryEmail);
    I.waitForText('Inbox', 5, '.remote-folders');
    I.click('Inbox', '.remote-folders');
    I.triggerRefresh();
    I.retry(10).waitForText('Howdee yihaa!', 12);
    mail.selectMail('Howdee yihaa!');
    I.waitForText('Reply');
    I.click('Reply');
    I.waitForFocus('textarea.plain-text');
    I.fillField({ css: 'textarea.plain-text' }, 'Masks on!');
    mail.send();
    I.selectFolder('Inbox');
    I.triggerRefresh();
    I.retry(10).waitForText('Re: Howdee yihaa!', 12);

    await secondContext.remove();
});
