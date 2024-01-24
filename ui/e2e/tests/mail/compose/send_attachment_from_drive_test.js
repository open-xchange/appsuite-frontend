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

Feature('Mail Compose');

Before(async ({ users }) => {
    await users.create(); // Sender
    await users.create(); // Recipient
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7391] Send mail with attachment from Drive', async ({ I, users, mail }) => {
    let [sender, recipient] = users;
    // Log in and navigate to mail app
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    I.login('app=io.ox/mail', { user: sender });
    // Create a file
    await I.executeAsyncScript(function (done) {
        require(['settings!io.ox/core', 'io.ox/files/api'], function (settings, filesAPI) {
            var blob = new window.Blob(['fnord'], { type: 'text/plain' });
            filesAPI.upload({
                folder: settings.get('folder/infostore'), file: blob, filename: 'Principia.txt', params: {} }
            ).done(done);
        });
    });
    // Open Compose
    mail.newMail();

    I.fillField('To', recipient.get('primaryEmail'));
    I.fillField('Subject', 'Principia Discordia');

    I.click(mail.locators.compose.drivefile);

    // Click on the file. Not really necessary since it's the only file and auto-selected
    // Still I don't think the test should fail if it isn't autoselected, so we click on it
    // anyway
    I.waitForText('Principia.txt');
    I.click(locate('div.name').withText('Principia.txt').inside('.io-ox-fileselection'));
    // Add the file
    I.click('Add');

    // Wait for the filepicker to close
    I.waitForDetached('.io-ox-fileselection');
    // Send
    mail.send();

    I.logout();
    /////////////////// Continue as 'recipient' ///////////////////////
    // Log in as second user and navigate to mail app
    I.login('app=io.ox/mail', { user: recipient });

    I.waitForText('Principia Discordia');
    // Open mail
    mail.selectMail('Principia Discordia');
    // Verify Attachment
    I.waitForText('1 attachment');
    I.click('1 attachment');
    I.see('Principia.txt');
    // Let's view the content
    I.click('Principia.txt');
    I.waitForElement('.dropdown.open');
    I.click('View', '.dropdown.open .dropdown-menu');
    I.waitForText('fnord', 20); // Only the enlightened will see 'fnord', so this might fail on an unenlightened computer. Introduce it to Discordianism prior to running the test.
});
