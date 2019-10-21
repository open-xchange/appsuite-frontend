/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

Feature('Contacts > Distribution List > Misc');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

const util = require('./util');

Scenario('Add external participant as contact', function (I) {
    util.start(I);
    // toolbar dropdown
    I.retry(3).click('New contact');
    // real action in dropdown
    I.waitForVisible('.dropdown-menu');
    I.click('New distribution list');
    I.waitForVisible('.io-ox-contacts-distrib-window');
    I.fillField('Name', 'Testlist');
    I.fillField('Add contact', 'test@tester.com');
    I.pressKey('Enter');

    I.waitForVisible('a.halo-link');
    I.click('a.halo-link');

    I.waitForVisible('.io-ox-sidepopup');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/contacts/actions/add-to-contactlist"]');
    I.see('Add to address book', '.io-ox-sidepopup');
    I.click('Add to address book', '.io-ox-sidepopup');

    I.waitForVisible('.io-ox-contacts-edit-window');
    I.waitForVisible({ css: '[name="last_name"]' });

    //confirm dirtycheck is working properly
    I.click('Discard', '.io-ox-contacts-edit-window');
    I.waitForText('Do you really want to discard your changes?', 5, '.modal-dialog');
    I.click('Cancel');
    I.waitForDetached('.modal-dialog');

    I.fillField('Last name', 'Lastname');

    I.click('Save', '.io-ox-contacts-edit-window');

    I.waitForDetached('.io-ox-contacts-edit-window');
    I.waitForVisible('.io-ox-sidepopup .io-ox-sidepopup-close');
    I.click('.io-ox-sidepopup [data-action="close"]');

    I.waitForVisible('.io-ox-contacts-distrib-window');
    I.click('Create list', '.io-ox-contacts-distrib-window');

    I.waitForDetached('.io-ox-contacts-distrib-window');
});

Scenario('[C7376] Send a mail to list', async function (I, users) {
    await users.create();
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    const testrailID = 'C7376',
        display_name = await util.createDistributionList(I, users, testrailID);
    util.start(I);

    I.waitForElement(`~${display_name}`);
    I.retry(3).click(`~${display_name}`);
    I.waitForText(display_name, 5, util.TITLE_SELECTOR);
    I.waitForText(`Distribution list with ${users.length} entries`, 5, util.SUBTITLE_SELECTOR);
    users.forEach(function name(user) {
        I.waitForElement('.contact-detail .participant-email [href="mailto:' + user.userdata.primaryEmail + '"]');
    });
    I.clickToolbar('Send email');
    I.waitForVisible('.plain-text');
    I.waitForElement('.io-ox-mail-compose [name="subject"]');
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + display_name);
    I.fillField({ css: 'textarea.plain-text' }, '' + display_name);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.logout();

    users.reverse().forEach(function name(user) {
        I.login('app=io.ox/mail', { user: user });
        I.selectFolder('Inbox');
        I.waitForVisible('.selected .contextmenu-control');
        I.waitForElement({ css: '[title="' + display_name + '"]' });
        I.click({ css: '[title="' + display_name + '"]' });
        I.waitForText(display_name, 5, '.mail-detail-pane .subject');
        I.logout();
    });
});
