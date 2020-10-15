/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2020 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Christoph Kopp <christoph.kopp@open-xchange.com>
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mailfilter');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C7798] Filter mail on size', async function (I, users, mail, mailfilter) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');
    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0382');
    mailfilter.addCondition('Size', '512', 'sizeValue');
    mailfilter.setFlag('Red');
    mailfilter.save();

    await I.executeAsyncScript(function (done) {
        require(['settings!io.ox/core', 'io.ox/files/api'], function (settings, filesAPI) {
            var blob = new window.Blob(['fnord'], { type: 'text/plain' });
            filesAPI.upload({
                folder: settings.get('folder/infostore'), file: blob, filename: 'Principia.txt', params: {} }
            ).done(done);
        });
    });

    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');
    I.openApp('Mail');
    mail.waitForApp();
    // compose mail
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0382');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    // Open Filepicker
    I.click(mail.locators.compose.drivefile);

    I.waitForText('Principia.txt');
    I.click(locate('div.name').withText('Principia.txt').inside('.io-ox-fileselection'));
    // Add the file
    I.click('Add');

    // Wait for the filepicker to close
    I.waitForDetached('.io-ox-fileselection');

    mail.send();

    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('TestCase0382'), 30);
});
