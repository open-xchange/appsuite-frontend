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

Feature('Contacts > Distribution List > Create');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

const util = require('./util');

Scenario('External mail address', function (I) {
    const name = 'Testlist',
        mail = 'test@tester.com';
    util.start(I);

    // toolbar dropdown
    I.click('New contact');
    I.waitForVisible('.dropdown-menu');
    I.click('New distribution list');
    I.waitForVisible('.io-ox-contacts-distrib-window');
    I.fillField('Name', name);
    I.fillField('Add contact', mail);
    I.pressKey('Enter');

    I.waitForVisible('a.halo-link');
    I.click('Create list', '.io-ox-contacts-distrib-window');
    I.waitForText(name, 5, util.TITLE_SELECTOR);
    I.waitForText('Distribution list with 1 entry', 5, util.SUBTITLE_SELECTOR);
    I.waitForElement(`.contact-detail .participant-email [href="mailto:${mail}"]`);
});

Scenario('[C7372] Existing contact', async function (I, users) {
    const display_name = util.uniqueName('C7372');
    // more users please
    await users.create();
    await users.create();
    util.start(I);

    I.click('New contact');
    I.waitForVisible('.dropdown-menu');
    I.click('New distribution list');
    I.waitForVisible('.floating-window-content');
    I.fillField('Name', display_name);
    users.forEach(function (user) {
        I.fillField('Add contact', user.userdata.primaryEmail);
        I.pressKey('Enter');
        I.waitForElement(locate('.participant-email a').withText(user.userdata.primaryEmail));
    });
    I.click('Create list');
    I.waitForDetached('.floating-window-content');
    I.waitForElement(`~${display_name}`);
    I.doubleClick(`~${display_name}`);
    I.waitForText(display_name);
    I.see(`Distribution list with ${users.length} entries`);
    users.forEach(function (user) {
        I.see(user.userdata.primaryEmail, '.contact-detail');
        I.see(user.userdata.name, '.contact-detail');
    });
});
