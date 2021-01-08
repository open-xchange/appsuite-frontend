/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose > Drive Mail');


Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('Checks when adding/removing attachments', async (I, mail) => {
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
    I.attachFile('.composetoolbar input[type="file"]', 'e2e/media/placeholder/1030x1030.png');
    I.waitForVisible(unchecked, 10);


    // attach inline image
    I.say('threshold: not exceeded yet (inline images do not count)');
    I.attachFile('.tinymce-toolbar input[type="file"]', 'e2e/media/placeholder/800x600.png');
    I.waitForVisible(unchecked, 10);

    // attach another image (2387)
    I.say('threshold: exceeded');
    I.attachFile('.composetoolbar input[type="file"]', 'e2e/media/placeholder/800x600-mango.png');
    I.waitForVisible(message, 10);
    I.waitForVisible(checked, 10);


    // disable and reenable again
    I.uncheckOption(checked);
    I.checkOption(unchecked);
    I.waitForVisible(message);

    // remove all file attachments
    I.click('.list-container .remove:last-child');
    I.click('.list-container .remove:last-child');
    I.uncheckOption(checked);

    // add again
    I.attachFile('.composetoolbar input[type="file"]', 'e2e/media/placeholder/1030x1030.png');
    I.waitForVisible('.list-container .inline-items .item:nth-child(2)');
    I.checkOption(unchecked);
});

Scenario('Checks when saving', async (I, mail) => {
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
    I.attachFile('.composetoolbar input[type="file"]', 'e2e/media/placeholder/1030x1030.png');
    I.waitForVisible(message, 10);
    I.waitForVisible(checked, 10);

    // toggle automatically enabled drive mail checkbox
    I.click(toggle);
    I.waitForVisible(unchecked, 10);

    // try to save draft (disabled drive mail)
    I.click(mail.locators.compose.close);
    I.waitForText('Save draft');
    I.click('Save draft');
    I.waitForVisible(message);
    I.waitForVisible(checked, 10);

    // save draft (enabled drive mail)
    I.click(mail.locators.compose.close);
    I.waitForText('Save draft');
    I.click('Save draft');
    I.waitForDetached('.io-ox-mail-compose-window');
});

Scenario('Checks when sending', async (I, mail, users) => {
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
    I.attachFile('.composetoolbar input[type="file"]', 'e2e/media/placeholder/1030x1030.png');
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
