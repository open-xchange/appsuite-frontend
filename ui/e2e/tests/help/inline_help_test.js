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

Feature('General > Inline help');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Open the help app in a floating window', async function ({ I, mail, topbar }) {
    I.login('app=io.ox/mail');
    I.waitForVisible({ css: '.io-ox-mail-window' }, 5);

    I.say('case: same app');
    // mail app
    topbar.help();
    I.waitForVisible('.io-ox-help-window', 5);
    I.see('OX App Suite Help');
    // mail app
    topbar.help();
    I.seeNumberOfElements('.io-ox-help-window', 1);
    I.click('~Close', '.io-ox-help-window');
    I.waitForDetached('.io-io-help-window', 5);

    I.say('case: different apps');
    // mail app
    topbar.help();
    I.waitForVisible('.io-ox-help-window', 5);
    I.see('OX App Suite Help');
    // mail compose app
    mail.newMail();
    topbar.help();
    I.seeNumberOfElements('.io-ox-help-window', 2);
});

Scenario('Open the help app in a modal', async function ({ I, mail, dialogs }) {
    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.newMail();

    I.click('~Select contacts');
    dialogs.waitForVisible();

    I.click('~Online help', dialogs.locators.header);
    I.waitForVisible('.modal.inline-help', 5);
    I.see('OX App Suite Help', dialogs.locators.header);

    dialogs.clickButton('Close');
    I.waitForDetached('.modal.inline-help');

    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
});
