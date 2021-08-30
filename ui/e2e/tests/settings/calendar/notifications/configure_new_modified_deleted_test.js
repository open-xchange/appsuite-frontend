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

/// <reference path="../../../../steps.d.ts" />

Feature('Settings > Calendar');

Before(async ({ users }) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7870] Configure notifications for new/modified/deleted', async ({ I, users, calendar, mail }) => {
    const [userA, userB] = users;

    async function createModifyDeleteAppointment() {
        calendar.waitForApp();
        calendar.newAppointment();
        I.fillField('Subject', 'C7870');
        await calendar.addParticipant(userA.userdata.primaryEmail, false);
        I.click('Create', calendar.locators.edit);
        I.waitForDetached(calendar.locators.edit);
        I.seeElement('.page.current .appointment');

        I.say('Modify appointment');
        I.doubleClick('.page.current .appointment');
        I.waitForVisible(calendar.locators.edit);
        I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');
        I.fillField('Subject', 'Modified Subject C7870');
        I.click('Save', calendar.locators.edit);
        I.waitForDetached(calendar.locators.edit);

        I.say('Delete appointment');
        I.click('.page.current .appointment');
        I.waitForVisible('.io-ox-sidepopup .calendar-detail');
        calendar.deleteAppointment();
        I.wait(1);
    }

    I.say('Login userA and verify notifyNewModifiedDeleted is set');
    await session('userA', () => {
        I.login('app=io.ox/settings&folder=virtual/settings/io.ox/calendar', { user: userA });
        I.waitForVisible('.io-ox-calendar-settings');
        I.waitForText('Receive notifications when an appointment');
        I.checkOption('notifyNewModifiedDeleted');
        I.seeCheckboxIsChecked('notifyNewModifiedDeleted');
    });

    I.say('Login userB, create appointment and invite userA');
    await session('userB', async () => {
        I.login('app=io.ox/calendar&perspective=week:week', { user: userB });
        await createModifyDeleteAppointment();
    });

    I.say('Verify notifications emails with userA with notifyNewModifiedDeleted set ');
    await session('userA', () => {
        I.openApp('Mail');
        I.refreshPage();
        mail.waitForApp();
        I.waitForVisible('.folder.standard-folders [aria-label^="Inbox, 3 unread"]', 10);
        I.waitForText('New appointment');
        I.waitForText('Appointment changed:');
        I.waitForText('Appointment canceled:');
        I.openFolderMenu('Inbox');
        I.clickDropdown('Mark all messages as read');

        I.say('Unset notifyNewModifiedDeleted');
        I.openApp('Settings', { folder: 'virtual/settings/io.ox/calendar' });
        I.waitForVisible('.io-ox-calendar-settings');
        I.waitForText('Receive notifications when an appointment');
        I.uncheckOption('notifyNewModifiedDeleted');
        I.waitForNetworkTraffic();
        I.dontSeeCheckboxIsChecked('notifyNewModifiedDeleted');
    });

    I.say('UserB creates appointment again');
    await session('userB', async () => {
        await createModifyDeleteAppointment();
    });

    I.say('Verify that only the deleted notification email was send to userA');
    await session('userA', () => {
        I.openApp('Mail');
        mail.waitForApp();
        I.dontSeeElement('.list-view-control .seen-unseen-indicator');
    });
});
