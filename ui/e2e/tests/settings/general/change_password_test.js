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

Feature('Settings > Basic');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

// Password changes only for App Suite. So no login with the updated password is possible anymore.
Scenario.skip('[C7764] Change password', async ({ I, users }) => {

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
    // wait for form (the button we're interesting in has no meta data)
    I.waitForText('Change password');
    I.click('Change password ...');
    // modal dialog opens
    I.waitForElement('.current-password');

    I.say('case 1: all input fields are empty');
    I.click('Change password and sign out');
    I.waitForVisible('.io-ox-alert');
    I.seeTextEquals('Your new password may not be empty.', '.io-ox-alert');

    I.say('case 2: new passwords differ');
    I.fillField('New password', 'one');
    I.fillField('Repeat new password', 'two');
    I.click('Change password and sign out');
    I.waitForVisible('.io-ox-alert');
    I.seeTextEquals('The two newly entered passwords do not match.', '.io-ox-alert');

    I.say('case 3: wrong current password');
    I.fillField('Your current password', 'wrong');
    I.fillField('New password', 'sneaky');
    I.fillField('Repeat new password', 'sneaky');
    I.click('Change password and sign out');
    I.waitForVisible('.io-ox-alert');
    I.seeTextEquals('The current password is incorrect. Please enter your correct current password and try again.', '.io-ox-alert > .message > div');

    I.say('case 4: correct current password but mismatch');
    I.fillField('Your current password', 'secret');
    I.fillField('New password', 'one');
    I.fillField('Repeat new password', 'two');
    I.click('Change password and sign out');
    I.waitForVisible('.io-ox-alert');
    I.seeTextEquals('The two newly entered passwords do not match.', '.io-ox-alert');

    I.say('case 5: correct current password but new password empty (see bug 64388)');
    I.fillField('Your current password', 'secret');
    I.fillField('New password', '');
    I.fillField('Repeat new password', '');
    I.click('Change password and sign out');
    I.waitForVisible('.io-ox-alert');
    I.seeTextEquals('Your new password may not be empty.', '.io-ox-alert');

    I.say('case 6: correct current password and correct new passwords');
    I.fillField('Your current password', 'secret');
    I.fillField('New password', 'sneaky');
    I.fillField('Repeat new password', 'sneaky');
    I.click('Change password and sign out');
    I.waitForDetached('.io-ox-dialog-popup');

    I.say('login with old password');
    I.waitForFocus('#io-ox-login-username', 30);
    const [user] = users;
    I.fillField('User name', user.get('name') + (user.context ? '@' + user.context.id : ''));
    I.fillField('Password', 'secret');
    I.click('Sign in');
    I.waitForText('The user name or password is incorrect. (LGI-0006)', 5, '#io-ox-login-feedback > .alert');

    I.say('login with new password');
    I.fillField('Password', 'sneaky');
    I.click('Sign in');
    I.waitForElement('#io-ox-launcher', 20);
});
