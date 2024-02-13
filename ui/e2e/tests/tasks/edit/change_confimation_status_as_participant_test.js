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

Feature('Tasks > Edit');

Before(async ({ users }) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C125311] Change confimation status as participant', async function ({ I, users, tasks, mail }) {

    I.haveSetting('io.ox/core//autoOpenNotification', false, { user: users[1] });
    I.haveSetting('io.ox/calendar//deleteInvitationMailAfterAction', false, { user: users[1] });

    // 1. Login as User#A

    I.login('app=io.ox/tasks', { user: users[0] });
    tasks.waitForApp();

    // 2. Create a new task and add another user to the task

    tasks.newTask();

    I.fillField('Subject', 'Where is the money Lebowski?');
    I.click('Expand form');
    I.fillField('Add contact …', users[1].get('primaryEmail'));
    I.pressKey('Enter');
    I.waitForVisible('.participant-wrapper');
    I.click('Create');

    I.logout();

    // 3. Login as User#B and verify a notification has been received

    I.login('app=io.ox/mail', { user: users[1] });
    mail.waitForApp();

    // 4. Open notification mail

    mail.selectMail('Where is the money Lebowski?');
    I.waitForText('1', 30, '.notifications-icon .number');

    // 5. Set the task status alternating to 'Accepted', 'Tentative' and 'Declined'

    I.click('Accept');
    I.waitForText('You have accepted this task');
    I.click('Show task details');
    I.waitForVisible('.io-ox-sidepopup .participants-view .participant');
    // wait for toolbar to settle :/
    I.wait(0.5);

    let actions = [{ text: 'Tentative', class: 'tentative' }, { text: 'Decline', class: 'declined' }, { text: 'Accept', class: 'accepted' }];

    actions.forEach(function (action) {
        I.click('~More actions', '.io-ox-sidepopup');
        I.waitForVisible('.dropdown.open');
        I.click('Change confirmation status', '.dropdown.open .dropdown-menu');
        I.waitForText('Change confirmation status');
        I.click(action.text);
        I.waitForElement('.io-ox-sidepopup .status.' + action.class);

        if (action.text === 'Tentative') I.waitForElement('.status.tentative');
        if (action.text === 'Decline') I.waitForElement('.status .fa-times');
        if (action.text === 'Accept') I.waitForElement('.status .fa-check');

    });
});
