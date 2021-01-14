/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <chrsitoph.kopp@open-xchange.com>
 */

const moment = require('moment');

Feature('Calendar > Create');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

// TODO: broken for last 5 runs (expected number of elements (.weekview-container.week .appointment .title) is 6, but found 4)
Scenario('Create never ending appointment and check display in several views', async function ({ I, calendar, dialogs }) {

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    // toggle weeks to activate caching
    calendar.switchView('Week');
    I.click('~Next Week', '.weekview-container.week');
    I.dontSeeElement('.weekview-container.week button.weekday.today');
    I.click('~Previous Week', '.weekview-container.week');
    I.waitForVisible('.weekview-container.week button.weekday.today');
    I.click('.date.today', '.date-picker');

    // toggle months to activate caching
    calendar.switchView('Month');
    // just skip 2 months, because "today" might still be visible in the "next" month
    I.retry(5).click('~Next Month', '.monthview-container');
    I.retry(5).click('~Next Month', '.monthview-container');
    I.dontSeeElement('.monthview-container td.day.today:not(.out)');

    I.click('~Previous Month', '.monthview-container');
    I.click('~Previous Month', '.monthview-container');
    I.waitForVisible('.monthview-container td.day.today');

    // create in List view
    calendar.switchView('List');
    calendar.newAppointment();

    I.fillField('Subject', 'test caching');
    I.fillField('Location', 'caching location');
    I.pressKey('Enter');

    await calendar.setDate('startDate', moment().startOf('week').add('1', 'day'));

    I.checkOption('All day', '.io-ox-calendar-edit-window');
    calendar.recurAppointment();
    dialogs.waitForVisible();
    I.waitForText('Edit recurrence', 5, dialogs.locators.header);
    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Daily');

    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForInvisible('.io-ox-calendar-edit-window', 5);

    // check in week view
    calendar.switchView('Week');

    I.waitForText('test caching', 5, '.weekview-container.week .appointment .title');
    I.seeNumberOfElements('.weekview-container.week .appointment .title', 6);
    I.click('~Next Week', '.weekview-container.week');
    I.dontSeeElement('.weekview-container.week button.weekday.today');

    I.waitForText('test caching', 5, '.weekview-container.week .appointment .title');
    I.seeNumberOfElements('.weekview-container.week .appointment .title', 7);
    I.click('~Previous Week', '.weekview-container.week');
    I.waitForVisible('.weekview-container.week button.weekday.today', 5);
    I.click('.date.today', '.date-picker');

    // check in month view
    calendar.switchView('Month');

    I.waitForVisible('.monthview-container .day .appointment .title');
    I.see('test caching', '.monthview-container .day .appointment .title');

    // just skip 2 months, because "today" might still be visible in the "next" month
    I.click('~Next Month', '.monthview-container');
    I.click('~Next Month', '.monthview-container');
    I.dontSeeElement('.monthview-container td.day.today:not(.out)');

    I.waitForText('test caching', undefined, '.monthview-container .appointment .title');
    I.seeNumberOfElements('.monthview-container .day:not(.out) .appointment .title', moment().add(2, 'months').daysInMonth());
});
