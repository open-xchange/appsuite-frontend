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

Feature('Mail Compose > Attachment quota');

const expect = require('chai').expect;

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('I can not send too large files as mail attachments', async ({ I, users, mail }) => {
    I.login('app=io.ox/mail');
    mail.waitForApp();
    await I.executeScript(function () {
        require('settings!io.ox/core').set('properties', { attachmentQuotaPerFile: 2 * 1024 * 1024 });
    });

    // compose mail with receiver and subject
    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Test');

    // add a too large file as attachment
    I.attachFile('.composetoolbar input[type="file"]', 'media/files/generic/16MB.dat');
    I.waitForText('The file "16MB.dat" cannot be uploaded because it exceeds the maximum file size of 2 MB', 5, '.io-ox-alert.io-ox-alert-error');
    I.waitForElement('.btn-link.close', 5, '.io-ox-alert.io-ox-alert-error');
    I.click('.btn-link.close', '.io-ox-alert.io-ox-alert-error');
    I.waitForDetached('.io-ox-alert.io-ox-alert-error', 5);

    // change attachment and send successfully
    I.attachFile('.composetoolbar input[type="file"]', 'media/files/generic/2MB.dat');
    I.waitForText('DAT', 5, '.inline-items.preview');
    I.waitForDetached('.progress-container', 15, '.share-attachments');

    // send mail successfully
    mail.send();
    I.waitForElement('.list-item.selectable.unread', 30, '.list-view.mail-item');
});

Scenario('I can not send too large accumulated mail attachments', async ({ I, users, mail }) => {
    I.login('app=io.ox/mail');
    mail.waitForApp();
    await I.executeScript(function () {
        require('settings!io.ox/core').set('properties', { attachmentQuotaPerFile: 16 * 1024 * 1024 });
        require('settings!io.ox/core').set('properties', { attachmentQuota: 5 * 1024 * 1024 });
    });

    // compose mail with receiver and subject
    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Test');

    // add attachments
    I.attachFile('.composetoolbar input[type="file"]', 'media/files/generic/2MB.dat');
    I.waitForText('DAT', 5, '.inline-items.preview');
    I.waitForDetached('.progress-container', 15, '.share-attachments');
    I.attachFile('.composetoolbar input[type="file"]', 'media/files/generic/16MB.dat');

    I.waitForText('The file "16MB.dat" cannot be uploaded because it exceeds the total attachment size limit of 5 MB', 5, '.io-ox-alert.io-ox-alert-error');
});

Scenario('I can send multiple files up to maximum attachment limit', async ({ I, users, mail }) => {
    I.login('app=io.ox/mail');
    mail.waitForApp();
    await I.executeScript(function () {
        require('settings!io.ox/core').set('properties', { attachmentQuota: 6 * 1024 * 1024 });
    });

    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Test');

    // add a too large file as attachment
    I.attachFile('.composetoolbar input[type="file"]', 'media/files/generic/2MB.dat');

    // try adding a too large file as attachment to make sure it will not be accepted.
    I.attachFile('.composetoolbar input[type="file"]', 'media/files/generic/16MB.dat');
    I.waitForText('The file "16MB.dat" cannot be uploaded because it exceeds the total attachment size limit of 6 MB', 5, '.io-ox-alert.io-ox-alert-error');
    I.waitForElement('.btn-link.close', 5, '.io-ox-alert.io-ox-alert-error');
    I.attachFile('.composetoolbar input[type="file"]', 'media/files/generic/2MB.dat');

    // After reaching the maximum quota, we try to upload a large file again to check that the file is still not accepted
    I.attachFile('.composetoolbar input[type="file"]', 'media/files/generic/16MB.dat');
    I.waitForText('The file "16MB.dat" cannot be uploaded because it exceeds the total attachment size limit of 6 MB', 5, '.io-ox-alert.io-ox-alert-error');
    I.waitForElement('.btn-link.close', 5, '.io-ox-alert.io-ox-alert-error');
    I.click('.btn-link.close', '.io-ox-alert.io-ox-alert-error');
    I.waitForDetached('.io-ox-alert.io-ox-alert-error', 5);

    // change attachment and send successfully
    I.attachFile('.composetoolbar input[type="file"]', 'media/files/generic/2MB.dat');
    I.waitForText('DAT', 5, '.inline-items.preview');
    I.waitForDetached('.progress-container', 20, '.share-attachments');

    // send mail successfully
    mail.send();
    I.waitForElement('.list-item.selectable.unread', 30, '.list-view.mail-item');
});

Scenario('I can send multiple inline images up to maximum attachment limit', async ({ I, users, mail }) => {
    I.login('app=io.ox/mail');
    mail.waitForApp();
    await I.executeScript(function () {
        require('settings!io.ox/mail').set('attachments/layout/compose/large', 'list');
        require('settings!io.ox/mail').set('compose/maxMailSize', 5 * 1024);
    });

    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Test');

    I.attachFile('.tinymce-toolbar input[type="file"]', 'media/placeholder/800x600-limegreen.png');
    await within({ frame: '.mce-edit-area iframe' }, async () => {
        I.waitForElement('#tinymce img');
        I.dontSee('The file cannot be uploaded because it exceeds the maximum email size of 5 KB');
    });

    I.attachFile('.tinymce-toolbar input[type="file"]', 'media/placeholder/800x600-mango.png');
    await within({ frame: '.mce-edit-area iframe' }, async () => {
        I.waitForElement('#tinymce img');
        I.dontSee('The file cannot be uploaded because it exceeds the maximum email size of 5 KB');
    });

    I.attachFile('.tinymce-toolbar input[type="file"]', 'media/placeholder/800x600.png');
    I.waitForText('The file cannot be uploaded because it exceeds the maximum email size of 5 KB', 5, '.io-ox-alert.io-ox-alert-error');
});

Scenario('I can not send an email that exceeds the mail max size', async ({ I, users, mail }) => {
    I.login('app=io.ox/mail');
    mail.waitForApp();
    await I.executeScript(function () {
        require('settings!io.ox/mail').set('compose/maxMailSize', 3 * 1024);
    });

    // compose mail with receiver and subject
    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Test');

    // first attached, second inline
    I.attachFile('.composetoolbar input[type="file"]', 'media/placeholder/800x600-limegreen.png');
    I.waitForDetached('.progress-container', 15, '.share-attachments');
    I.attachFile('.tinymce-toolbar input[type="file"]', 'media/placeholder/800x600.png');

    I.waitForText('The file cannot be uploaded because it exceeds the maximum email size of 3 KB', 5, '.io-ox-alert.io-ox-alert-error');
    I.click('.btn-link.close', '.io-ox-alert.io-ox-alert-error');
    I.waitForDetached('.io-ox-alert.io-ox-alert-error', 5);
    await within({ frame: '.mce-edit-area iframe' }, async () => {
        I.dontSee('#tinymce img');
        expect(await I.grabNumberOfVisibleElements('#tinymce img')).to.equal(0);
    });

    // remove attached
    I.click('.mail-attachment-list a[title="Toggle preview"]');
    I.waitForElement('.mail-attachment-list a[title="Remove attachment"]');
    I.click('.mail-attachment-list a[title="Remove attachment"]');
    I.waitForDetached('.mail-attachment-list span[title="2MB.dat"]');

    // first inline, second attached
    I.attachFile('.tinymce-toolbar input[type="file"]', 'media/placeholder/800x600-limegreen.png');
    await within({ frame: '.mce-edit-area iframe' }, async () => {
        I.waitForElement('#tinymce img');
        expect(await I.grabNumberOfVisibleElements('#tinymce img')).to.equal(1);
    });
    I.attachFile('.tinymce-toolbar input[type="file"]', 'media/placeholder/800x600.png');

    I.waitForText('The file cannot be uploaded because it exceeds the maximum email size of 3 KB', 5, '.io-ox-alert.io-ox-alert-error');
    I.click('.btn-link.close', '.io-ox-alert.io-ox-alert-error');
    I.waitForDetached('.io-ox-alert.io-ox-alert-error', 5);

    // try multiple inline images
    I.attachFile('.tinymce-toolbar input[type="file"]', 'media/placeholder/800x600-mango.png');
    I.waitForText('The file cannot be uploaded because it exceeds the maximum email size of 3 KB', 5, '.io-ox-alert.io-ox-alert-error');
    I.click('.btn-link.close', '.io-ox-alert.io-ox-alert-error');
    I.waitForDetached('.io-ox-alert.io-ox-alert-error', 5);

    await within({ frame: '.mce-edit-area iframe' }, async () => {
        I.waitForElement('#tinymce img');
        expect(await I.grabNumberOfVisibleElements('#tinymce img')).to.equal(1);
    });
});

// TODO: not able to adjust quota with `I.executeScript` approach 😞
Scenario.skip('[OXUIB-1089] I can send a quota exceeding file out of drive by mail', async ({ I, drive }) => {
    // file size 9462 (4731 * 2)
    await I.haveFile(await I.grabDefaultFolder('infostore'), 'media/files/generic/testdocument.odt');

    I.login('app=io.ox/files');
    drive.waitForApp();

    // adjust quota
    await I.executeScript(async function () {
        require(['io.ox/core/api/quota.js'], function (quotaAPI) {
            quotaAPI.mailQuota.set('quota', 1024);
        });
    });

    I.waitForElement(locate('.filename').withText('testdocument.odt'));
    I.retry(5).click(locate('.filename').withText('testdocument.odt'));
    I.waitForVisible('~Details');
    I.clickToolbar('~More actions');
    I.clickDropdown('Send by email');

    I.waitForText('Mail quota limit reached.');

    I.waitForVisible('.active .io-ox-mail-compose [placeholder="To"]', 30);
    I.waitForFocus('.active .io-ox-mail-compose [placeholder="To"]');
    I.see('ODT');
    I.seeCheckboxIsChecked('.share-attachments [type="checkbox"]');
});

// TODO: not able to adjust quota with `I.executeScript` approach 😞
Scenario.skip('[OXUIB-1089] I can send file out of drive by mail', async ({ I, drive }) => {
    // file size 9462 (4731 * 2)
    await I.haveFile(await I.grabDefaultFolder('infostore'), 'media/files/generic/testdocument.odt');

    I.login('app=io.ox/files');
    drive.waitForApp();

    // adjust quota
    await I.executeScript(async function () {
        require(['io.ox/core/api/quota.js'], function (quotaAPI) {
            quotaAPI.mailQuota.set('quota', 16 * 1024);
        });
    });

    I.waitForElement(locate('.filename').withText('testdocument.odt'));
    I.retry(5).click(locate('.filename').withText('testdocument.odt'));
    I.waitForVisible('~Details');
    I.clickToolbar('~More actions');
    I.clickDropdown('Send by email');

    I.waitForVisible('.active .io-ox-mail-compose [placeholder="To"]', 30);
    I.waitForFocus('.active .io-ox-mail-compose [placeholder="To"]');
    I.see('ODT');
    I.dontSeeCheckboxIsChecked('.share-attachments [type="checkbox"]');
});

Scenario('I can not use drive if the infoStore limits get exceeded', async ({ I, users, mail }) => {
    I.login('app=io.ox/mail');
    mail.waitForApp();
    await I.executeScript(async function () {
        require('settings!io.ox/mail').set('compose/maxMailSize', 3 * 1024);
        require('settings!io.ox/core').set('properties', { infostoreQuota: 7 * 1024 });
    });

    // compose mail with receiver and subject
    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Test');

    // attach
    I.attachFile('.composetoolbar input[type="file"]', 'media/placeholder/800x600.png');
    I.waitForDetached('.progress-container', 15, '.share-attachments');

    // error for attachment and inline
    I.attachFile('.composetoolbar input[type="file"]', 'media/placeholder/800x600-limegreen.png');
    I.waitForText('The file cannot be uploaded because it exceeds the maximum email size of 3 KB', 5, '.io-ox-alert.io-ox-alert-error');
    I.click('.btn-link.close', '.io-ox-alert.io-ox-alert-error');
    I.waitForDetached('.io-ox-alert.io-ox-alert-error', 5);
    I.attachFile('.tinymce-toolbar input[type="file"]', 'media/placeholder/800x600-limegreen.png');
    I.waitForText('The file cannot be uploaded because it exceeds the maximum email size of 3 KB', 5, '.io-ox-alert.io-ox-alert-error');
    I.click('.btn-link.close', '.io-ox-alert.io-ox-alert-error');
    I.waitForDetached('.io-ox-alert.io-ox-alert-error', 5);

    // use drive
    I.checkOption('Use Drive Mail', '.share-attachments');

    // attach another
    I.attachFile('.composetoolbar input[type="file"]', 'media/placeholder/800x600-mango.png');
    I.waitForDetached('.progress-container', 15, '.share-attachments');
    I.attachFile('.tinymce-toolbar input[type="file"]', 'media/placeholder/800x600.png');
    await within({ frame: '.mce-edit-area iframe' }, async () => {
        I.waitForElement('#tinymce img');
        expect(await I.grabNumberOfVisibleElements('#tinymce img')).to.equal(1);
    });

    I.uncheckOption('Use Drive Mail', '.share-attachments');
    I.waitForText('The uploaded attachment exceeds the maximum email size of 3 KB', 5, '.io-ox-alert.io-ox-alert-error');
});

// Scenario.skip('I can remove and upload new inlineImages without exceeding the max mail size', async () => {
// });
