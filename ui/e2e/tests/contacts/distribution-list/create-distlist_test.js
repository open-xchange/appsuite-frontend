/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

Feature('Contacts > Distribution List > Create');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

const util = require('./util');

Scenario('External mail address', function ({ I, contacts }) {
    const name = 'Testlist',
        mail = 'test@tester.com';

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.newDistributionlist();

    I.fillField('Name', name);
    I.fillField('Add contact', mail);
    I.pressKey('Enter');

    I.waitForVisible('a.halo-link');
    I.click('Create list', '.io-ox-contacts-distrib-window');
    I.waitForText(name, 5, util.TITLE_SELECTOR);
    I.waitForText('Distribution list with 1 entry', 5, util.SUBTITLE_SELECTOR);
    I.waitForElement(`.contact-detail .participant-email [href="mailto:${mail}"]`);
});

Scenario('[C7372] Create new distribution list', async function ({ I, users, contacts }) {
    const display_name = util.uniqueName('C7372');

    await Promise.all([
        users.create(),
        users.create()
    ]);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.newDistributionlist();

    I.fillField('Name', display_name);
    users.forEach(function (user) {
        I.fillField('Add contact', user.userdata.primaryEmail);
        I.pressKey('Enter');
        I.waitForElement(locate('.participant-email a').withText(user.userdata.primaryEmail));
    });
    I.click('Create list');
    I.waitForDetached('.floating-window-content');
    I.waitForText('Distribution list has been saved');
    I.waitForDetached('.io-ox-alert');
    I.waitForElement(`~${display_name}`);
    I.doubleClick(`~${display_name}`);
    I.waitForText(display_name);
    I.see(`Distribution list with ${users.length} entries`);
    users.forEach(function (user) {
        I.see(user.userdata.primaryEmail, '.contact-detail');
        I.see(user.userdata.name, '.contact-detail');
    });
});
