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

const moment = require('moment');

Feature('Portal');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

// if the month changes between today and tomorrow
async function goToDate(I, date) {
    var day = await I.executeScript(function (date) {
        const monthName = moment(date).format('MMMM');
        if (monthName !== $('.switch-mode').text().split(' ')[0]) {
            $('.btn-next').click();
        }
        return moment(date).format('M/D/YYYY');
    }, date);
    I.retry(5).click({ css: `td[aria-label*="${day}"` });
}

Scenario('Create new appointment and check display in portal widget', async function ({ I, portal, calendar, dialogs }) {
    // add one day to secure that the appointment will be in the future
    const day = moment().startOf('day').add('1', 'day').add('1', 'hour');

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    I.selectFolder('Calendar');
    I.clickToolbar('View');
    I.click('List', '.dropdown.open .dropdown-menu');
    I.dontSeeElement('.appointment');

    // make sure portal widget is empty
    I.openApp('Portal');
    portal.waitForApp();
    I.waitForText('You don\'t have any appointments in the near future.', 10, { css: '[data-widget-id="calendar_0"] li.line' });

    I.openApp('Calendar');
    calendar.waitForApp();
    I.clickToolbar('View');
    I.click('List', '.dropdown.open .dropdown-menu');

    // create in List view
    I.selectFolder('Calendar');
    calendar.waitForApp();
    calendar.switchView('List');
    calendar.newAppointment();

    I.retry(5).fillField('Subject', 'test portal widget');
    I.fillField('Location', 'portal widget location');
    I.fillField('.time-field', '2:00 PM');
    await calendar.setDate('startDate', day);

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in week view
    calendar.switchView('Week');
    await goToDate(I, day);
    I.waitForVisible('.weekview-container.week .appointment .title');
    I.see('test portal widget', '.weekview-container.week .appointment .title');
    I.seeNumberOfElements('.weekview-container.week .appointment .title', 1);

    // check in portal
    I.openApp('Portal');
    portal.waitForApp();
    I.waitForVisible('.io-ox-portal [data-widget-id="calendar_0"] li.item div');
    I.see('test portal widget', { css: '[data-widget-id="calendar_0"] li.item div' });

    // create a second appointment
    I.openApp('Calendar');
    calendar.waitForApp();
    calendar.switchView('List');

    // create in List view
    I.selectFolder('Calendar');
    calendar.switchView('List');
    calendar.newAppointment();

    I.retry(5).fillField('Subject', 'second test portal widget ');
    I.fillField('Location', 'second portal widget location');
    I.fillField('.time-field', '2:00 PM');
    await calendar.setDate('startDate', day);

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    dialogs.waitForVisible();
    dialogs.clickButton('Ignore conflicts');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in week view
    calendar.switchView('Week');
    await goToDate(I, day);
    I.waitForVisible('.weekview-container.week button.weekday.today');
    I.seeNumberOfElements('.weekview-container.week .appointment .title', 2);
});
