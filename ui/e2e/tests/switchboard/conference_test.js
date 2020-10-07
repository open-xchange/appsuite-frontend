/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

const moment = require('moment');

Feature('Switchboard > Conference');

Before(async (users) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
    await users[0].context.hasCapability('switchboard');
});

After(async (users) => {
    await users.removeAll();
});

const connectZoomCalendar = () => {
    const { I } = inject();

    I.selectOption('conference-type', 'Zoom Meeting');
    I.waitForText('Connect with Zoom');
    I.click('Connect with Zoom');
    I.waitForVisible('.fa.fa-video-camera');
    I.waitForText('Link', 5, '.conference-view.zoom');
};

const editAppointment = () => {
    const { I } = inject();

    I.waitForVisible('.io-ox-sidepopup a[data-action="io.ox/calendar/detail/actions/edit"]');
    I.waitForClickable('.io-ox-sidepopup a[data-action="io.ox/calendar/detail/actions/edit"]');
    I.click('Edit');
};

const removeConference = () => {
    const { I } = inject();

    I.waitForVisible('.io-ox-calendar-edit select[name="conference-type"]');
    I.selectOption('conference-type', 'None');
    I.waitForDetached('.conference-view.zoom');
    I.dontSee('Link:');
    I.dontSeeElement('.fa.fa-video-camera');
};

Scenario('Create appointment with zoom conference', async (I, users, calendar) => {

    const [user1, user2] = users;

    await session('userA', async () => {
        I.login('app=io.ox/calendar', { user: user1 });
        calendar.newAppointment();
        I.fillField('Subject', 'Appointment with Zoom conference');
        I.selectOption('conference-type', 'Zoom Meeting');
        I.waitForText('Connect with Zoom');
        I.click('Connect with Zoom');
        I.waitForVisible('.fa.fa-video-camera');
        I.waitForText('Link', 5, '.conference-view.zoom');
        await calendar.addParticipant(user2.get('name'));
        I.click('Create');
    });

    await session('userB', () => {
        I.login('app=io.ox/calendar', { user: user2 });
        calendar.waitForApp();
        I.waitForVisible('.appointment');
        I.click('.appointment');
        I.waitForVisible('.io-ox-sidepopup');
        I.waitForVisible('.io-ox-sidepopup .action-button-rounded .btn[data-action="join"]');
        I.click('.io-ox-sidepopup .action-button-rounded .btn[data-action="join"]');
    });

    await session('userA', () => {
        I.waitForVisible('.appointment');
        I.click('.appointment');
        I.waitForVisible('.io-ox-sidepopup');
        I.waitForVisible('.io-ox-sidepopup .action-button-rounded .btn[data-action="join"]');
        I.click('.io-ox-sidepopup .action-button-rounded .btn[data-action="join"]');
    });
});

Scenario('Creating never ending recurring appointment with zoom conference', (I, calendar) => {

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    calendar.newAppointment();
    I.fillField('Subject', 'Recurring Zoom Appointment');
    calendar.recurAppointment();
    I.waitForText('Apply', 5, calendar.locators.recurrenceview);
    I.click('Apply', calendar.locators.recurrenceview);
    connectZoomCalendar();
    I.waitForVisible('.alert-info.recurrence-warning');
    I.waitForText('Zoom meetings expire after 365 days.');
    I.click('Create');
    I.waitForVisible('.io-ox-alert');
});

// TODO: bugfix needed
Scenario.skip('[OXUIB-397] Appointment with zoom conference can be changed into a series', (I, calendar) => {

    // Create normal appointment with zoom conference
    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    calendar.newAppointment();
    I.fillField('Subject', 'OXUIB-397');
    connectZoomCalendar();
    I.click('Create');

    // Change appointment into a series
    I.waitForDetached(calendar.locators.edit);
    I.waitForVisible('.appointment');
    I.click('.appointment');
    editAppointment();
    I.waitForVisible(calendar.locators.edit);
    I.waitForText('Repeat', 5, calendar.locators.edit);
    calendar.recurAppointment();
    within(calendar.locators.recurrenceview, () => {
        I.selectOption('.modal-dialog [name="until"]', 'After a number of occurrences');
        I.waitForVisible('.modal-dialog [name="occurrences"]');
        I.fillField('.modal-dialog [name="occurrences"]', '5');
        I.click('Apply', '.modal-footer');
    });
    I.waitForDetached(calendar.locators.recurrenceview);
    I.click('Save', calendar.locators.edit);
    I.waitForDetached(calendar.locators.edit);
    I.waitForVisible('.appointment .recurrence-flag');
});

Scenario('Appointment series with zoom conference can be changed into a single appointment', (I, calendar, dialogs) => {

    // Create recurring appointment with zoom conference
    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    calendar.newAppointment();
    I.fillField('Subject', 'OXUIB-397');
    connectZoomCalendar();
    calendar.recurAppointment();
    within(calendar.locators.recurrenceview, () => {
        I.selectOption('.modal-dialog [name="until"]', 'After a number of occurrences');
        I.waitForVisible('.modal-dialog [name="occurrences"]');
        I.fillField('.modal-dialog [name="occurrences"]', '10');
        I.click('Apply', '.modal-footer');
    });
    I.waitForDetached(calendar.locators.recurrenceview);
    I.click('Create');

    // Change appointment series into a single appointment
    I.waitForDetached(calendar.locators.edit);
    I.click('.page.current .appointment');
    editAppointment();
    dialogs.waitForVisible();
    dialogs.clickButton('Edit series');
    I.waitForVisible(calendar.locators.edit);
    removeConference();
    I.click('Save', calendar.locators.edit);
    I.waitForDetached(calendar.locators.edit);
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForDetached('.io-ox-sidepopup .action-button-rounded');
    I.dontSee('Join Zoom meeting', '.io-ox-sidepopup');
});

Scenario('Remove zoom conference from series exception', (I, calendar, dialogs) => {

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    calendar.newAppointment();
    I.fillField('Subject', 'Series');
    connectZoomCalendar();
    calendar.recurAppointment();
    within(calendar.locators.recurrenceview, () => {
        I.selectOption('.modal-dialog [name="until"]', 'After a number of occurrences');
        I.waitForVisible('.modal-dialog [name="occurrences"]');
        I.fillField('.modal-dialog [name="occurrences"]', '10');
        I.click('Apply', '.modal-footer');
    });
    I.waitForDetached(calendar.locators.recurrenceview);
    I.click('Create');

    // Check next series entry and remove zoom conference
    I.click('.control.next');
    I.waitForVisible('.page.current .appointment');
    I.click('.page.current .appointment');
    editAppointment();
    dialogs.waitForVisible();
    dialogs.clickButton('Edit this appointment');
    I.waitForVisible(calendar.locators.edit);
    removeConference();
    I.click('Save', calendar.locators.edit);
    I.waitForDetached(calendar.locators.edit);
    I.waitForDetached('.io-ox-sidepopup');
    I.click('.page.current .appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.dontSeeElement('.io-ox-sidepopup .action-button-rounded');
    I.dontSee('Join Zoom meeting', '.io-ox-sidepopup');
    I.click('~Close', '.io-ox-sidepopup');

    // Check if next entry still has zoom conference
    I.click('.control.next');
    I.waitForVisible('.page.current .appointment');
    I.click('.page.current .appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Join Zoom meeting');

});

Scenario('Remove zoom conference from appointment series and check exception', async (I, calendar, dialogs) => {

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    calendar.newAppointment();
    I.fillField('Subject', 'Series');
    connectZoomCalendar();
    await calendar.setDate('startDate', moment().startOf('week').add(1, 'day'));
    I.fillField(calendar.locators.starttime, '12:00 PM');
    calendar.recurAppointment();
    within(calendar.locators.recurrenceview, () => {
        I.selectOption('.modal-dialog select[name="recurrence_type"]', 'Daily');
        I.selectOption('.modal-dialog select[name="until"]', 'After a number of occurrences');
        I.waitForVisible('.modal-dialog input[name="occurrences"]');
        I.fillField('.modal-dialog input[name="occurrences"]', '5');
        I.click('Apply', '.modal-footer');
    });
    I.waitForDetached(calendar.locators.recurrenceview);
    I.click('Create', calendar.locators.edit);
    I.waitForDetached(calendar.locators.edit);
    I.seeNumberOfVisibleElements('.page.current .appointment', 5);

    // Edit second appointment of the series to make it an exception
    I.click(locate('.page.current .appointment').at(2));
    editAppointment();
    dialogs.waitForVisible();
    dialogs.clickButton('Edit this appointment');
    I.waitForVisible(calendar.locators.edit);
    I.waitForVisible('.io-ox-calendar-edit input[name="summary"]');
    I.fillField('Subject', 'Exception');
    I.fillField(calendar.locators.starttime, '14:00 PM');
    I.click('Save', calendar.locators.edit);
    I.waitForDetached(calendar.locators.edit);

    // Edit the whole series and remove zoom conference
    I.click('.page.current .appointment');
    editAppointment();
    dialogs.waitForVisible();
    dialogs.clickButton('Edit series');
    I.waitForVisible(calendar.locators.edit);
    removeConference();
    I.click('Save', calendar.locators.edit);
    I.waitForDetached(calendar.locators.edit);
    I.waitForDetached('.io-ox-sidepopup .action-button-rounded');
    I.dontSee('Join Zoom meeting');
    I.click('~Close', '.io-ox-sidepopup');
    I.waitForDetached('.io-ox-sidepopup');

    // See if exception still has a zoom conference
    I.click(locate('.page.current .appointment').at(2));
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Join Zoom meeting', 5, '.io-ox-sidepopup');

});
