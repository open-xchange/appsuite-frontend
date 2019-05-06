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
    await users.create(); // Sender
    await users.create(); // Recipient
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C7391] Send mail with attachment from Drive', async (I, users) => {
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
    I.waitForText('Compose');
    I.click('Compose');
    // Wait for the compose dialog
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');

    // Pick Recipient
    I.wait(1); // wait for autofocus
    I.fillField('To', recipient.get('primaryEmail'));

    // Add Subject
    I.fillField('Subject', 'Principia Discordia');

    // Open Filepicker
    I.click('Attachments');
    I.click('Add from Drive');

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
    I.click('Send');

    // Let's stick around a bit for sending to finish
    I.waitForDetached('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(2);
    I.logout();
    /////////////////// Continue as 'recipient' ///////////////////////
    // Log in as second user and navigate to mail app
    I.login('app=io.ox/mail', { user: recipient });

    I.waitForText('Principia Discordia', 2);
    // Open mail
    I.click(locate('.list-item').withText('Principia Discordia').inside('.list-view'));
    // Verify Attachment
    I.waitForText('1 attachment', 2);
    I.click('1 attachment');
    I.see('Principia.txt');
    // Let's view the content
    I.click('Principia.txt');
    I.waitForElement('.smart-dropdown-container');
    I.click(locate('li').withText('View').inside('.smart-dropdown-container'));
    I.waitForText('fnord', 10); // Only the enlightened will see 'fnord', so this might fail on an unenlightened computer. Introduce it to Discordianism prior to running the test.
});
