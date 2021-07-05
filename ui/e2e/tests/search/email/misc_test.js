/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Mail > Search');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C8408] Try to run a script in search', async function ({ I, mail, search }) {
    I.login();
    mail.waitForApp();
    I.click(search.locators.box);
    I.waitForVisible(search.locators.field);

    I.fillField(search.locators.field, '<script>document.body.innerHTML=\'I am a hacker\'</script>');
    I.waitForElement('.tt-suggestions');
    I.pressKey('Enter');

    I.wait(1);
    expect(await I.grabHTMLFrom({ xpath: '//body' })).to.not.equal('I am a hacker');
});

Scenario('Disable cache for search results (OXUIB-252)', async ({ I, search, mail }) => {

    // Precondition: Some emails are in the inbox- and in a subfolder and have the subject "test".
    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/c8402_1.eml' });

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.waitForVisible(search.locators.box);

    // when cached an event wouldn't be triggered that lists 'Select all messages' in dropdown
    ['cold-cache', 'second-run'].forEach(function (state) {
        I.say(state);
        search.doSearch('test');
        I.retry(5).clickToolbar('All');
        I.waitForText('Select all messages');
        I.click('Select all messages');
        search.cancel();
        mail.selectMail('test');
    });
});
