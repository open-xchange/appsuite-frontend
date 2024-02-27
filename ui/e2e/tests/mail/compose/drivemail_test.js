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

Feature('Mail Compose > Drive Mail');


Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});


Scenario('Checks when adding/removing attachments', async ({ I, mail }) => {
    const checked = locate({ css: '.share-attachments [name="enabled"]:checked' }).as('Drive mail: checked'),
        unchecked = locate({ css: '.share-attachments [name="enabled"]' }).as('Drive mail: unchecked'),
        message = locate({ css: '.io-ox-alert' }).as('Yell: warning');

    //await I.haveSetting('attachments/layout/compose/large', 'list');
    I.login('app=io.ox/mail');
    // I.haveSetting doest not work here (why?)
    await I.executeScript(function () {
        require('settings!io.ox/mail').set('compose/shareAttachments/threshold', 3800);
        return require('settings!io.ox/mail').set('attachments/layout/compose/large', 'list');
    });

    // compose mail
    mail.newMail();

    // attach my vcard
    I.click(mail.locators.compose.options);
    I.click('Attach Vcard');

    // attach image (3720)
    I.say('threshold: not exceeded yet');
    I.attachFile('.composetoolbar input[type="file"]', 'media/placeholder/1030x1030.png');
    I.waitForVisible(unchecked, 10);


    // attach inline image
    I.say('threshold: not exceeded yet (inline images do not count)');
    I.attachFile('.tinymce-toolbar input[type="file"]', 'media/placeholder/800x600.png');
    I.waitForVisible(unchecked, 10);

    // attach another image (2387)
    I.say('threshold: exceeded');
    I.attachFile('.composetoolbar input[type="file"]', 'media/placeholder/800x600-mango.png');
    I.waitForVisible(message, 10);
    I.waitForVisible(checked, 10);
    I.waitForNetworkTraffic();

    // try to disable checkbox. Shouldn't be possible when over threshold
    I.uncheckOption(checked);
    I.waitForText('Saved a few seconds ago', 5, '.window-footer .inline-yell');
    I.checkOption(checked);

    // remove all file attachments
    I.waitForElement('.list-container .inline-items > :nth-child(3)');
    I.click('.remove', '.list-container .inline-items > :nth-child(3)');
    I.waitForDetached('.list-container .inline-items > :nth-child(3)');
    I.click('.remove', '.list-container .inline-items > :nth-child(2)');
    I.waitForDetached('.list-container .inline-items > :nth-child(2)');
    I.uncheckOption(checked);

    // add again
    I.attachFile('.composetoolbar input[type="file"]', 'media/placeholder/1030x1030.png');
    I.waitForVisible('.list-container .inline-items .item:nth-child(2)');
    I.checkOption(unchecked);
});

Scenario.skip('Checks when saving', async ({ I, mail }) => {
    const checked = locate({ css: '.share-attachments [name="enabled"]:checked' }).as('Drive mail: checked'),
        unchecked = locate({ css: '.share-attachments [name="enabled"]' }).as('Drive mail: unchecked'),
        toggle = locate({ css: '.share-attachments .checkbox.custom label' }),
        message = locate({ css: '.io-ox-alert' }).as('Yell: warninig');

    I.login('app=io.ox/mail');
    // I.haveSetting doest not work here (why?)
    await I.executeScript(function () {
        require('settings!io.ox/mail').set('compose/shareAttachments/threshold', 1000);
        return require('settings!io.ox/mail').set('attachments/layout/compose/large', 'list');
    });

    // compose mail
    mail.newMail();

    // prepare scenario
    I.say('threshold: exceeded');
    I.attachFile('.composetoolbar input[type="file"]', 'media/placeholder/1030x1030.png');
    I.waitForVisible(message, 10);
    I.waitForVisible(checked, 10);

    // toggle automatically enabled drive mail checkbox
    I.click(toggle);
    I.waitForVisible(unchecked, 10);

    // try to save draft (disabled drive mail)
    I.click('~Save and close', '.io-ox-mail-compose-window');
    I.waitForText('Save draft');
    I.click('Save draft');
    I.waitForVisible(message);
    I.waitForVisible(checked, 10);

    // save draft (enabled drive mail)
    I.click('~Save and close', '.io-ox-mail-compose-window');
    I.waitForText('Save draft');
    I.click('Save draft');
    I.waitForDetached('.io-ox-mail-compose-window');
});

Scenario.skip('Checks when sending', async ({ I, mail, users }) => {
    const [user] = users,
        checked = locate({ css: '.share-attachments [name="enabled"]:checked' }).as('Drive mail: checked'),
        unchecked = locate({ css: '.share-attachments [name="enabled"]' }).as('Drive mail: unchecked'),
        toggle = locate({ css: '.share-attachments .checkbox.custom label' }),
        message = locate({ css: '.io-ox-alert' }).as('Yell: warninig');

    I.login('app=io.ox/mail');
    // I.haveSetting doest not work here (why?)
    await I.executeScript(function () {
        require('settings!io.ox/mail').set('compose/shareAttachments/threshold', 1000);
        return require('settings!io.ox/mail').set('attachments/layout/compose/large', 'list');
    });

    // compose mail
    mail.newMail();
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Threshold when sending');

    // prepare scenario
    I.say('threshold: exceeded');
    I.attachFile('.composetoolbar input[type="file"]', 'media/placeholder/1030x1030.png');
    I.waitForVisible(message, 10);
    I.waitForVisible(checked, 10);

    // toggle automatically enabled drive mail checkbox
    I.click(toggle);
    I.waitForVisible(unchecked, 10);

    // save draft (enabled drive mail)
    I.click('Send');
    I.waitForVisible(message, 10);
    I.waitForVisible(checked, 10);
});
