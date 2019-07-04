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

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Create never ending appointment and check display in several views', async function (I) {

    I.login('app=io.ox/calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    // toggle weeks to activate caching
    I.clickToolbar('View');
    I.click('Week');
    I.waitForVisible('.weekview-container.week button.weekday.today');
    I.click('~Next Week', '.weekview-container.week');
    I.dontSeeElement('.weekview-container.week button.weekday.today');
    I.click('~Previous Week', '.weekview-container.week');
    I.waitForVisible('.weekview-container.week button.weekday.today');
    I.click('.date.today', '.date-picker');

    // toggle months to activate caching
    I.clickToolbar('View');
    I.click('Month');
    I.waitForVisible('.monthview-container td.day.today');

    // just skip 2 months, because "today" might still be visible in the "next" month
    I.click('~Next Month', '.monthview-container');
    I.click('~Next Month', '.monthview-container');
    I.dontSeeElement('.monthview-container td.day.today:not(.out)');

    I.click('~Previous Month', '.monthview-container');
    I.click('~Previous Month', '.monthview-container');
    I.waitForVisible('.monthview-container td.day.today');

    // create in List view
    I.selectFolder('Calendar');
    I.clickToolbar('View');
    I.click('List');
    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test caching');
    I.fillField('Location', 'caching location');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(moment().startOf('week').add('1', 'day').format('l'));
    I.pressKey('Enter');

    I.click('All day', '.io-ox-calendar-edit-window');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click('.btn.btn-link.summary'); // Variable so it needs a selector

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Daily');

    I.click('Apply', '.modal-dialog');

    I.waitForDetached('.modal-dialog');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');

    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in week view
    I.clickToolbar('View');
    I.click('Week');
    I.waitForVisible('.weekview-container.week button.weekday.today', 5);

    I.waitForText('test caching', undefined, '.weekview-container.week .appointment .title');
    I.seeNumberOfElements('.weekview-container.week .appointment .title', 6);
    I.click('~Next Week', '.weekview-container.week');
    I.wait(2); // Nothing else seems to work here
    I.dontSeeElement('.weekview-container.week button.weekday.today');

    I.waitForText('test caching', undefined, '.weekview-container.week .appointment .title');
    I.seeNumberOfElements('.weekview-container.week .appointment .title', 7);
    I.click('~Previous Week', '.weekview-container.week');
    I.waitForVisible('.weekview-container.week button.weekday.today', 5);
    I.click('.date.today', '.date-picker');
    // check in month view
    I.clickToolbar('View');
    I.click('Month');

    I.waitForVisible('.monthview-container td.day.today');

    I.waitForVisible('.monthview-container .day .appointment .title');
    I.see('test caching', '.monthview-container .day .appointment .title');

    // just skip 2 months, because "today" might still be visible in the "next" month
    I.click('~Next Month', '.monthview-container');
    I.click('~Next Month', '.monthview-container');
    I.dontSeeElement('.monthview-container td.day.today:not(.out)');

    I.waitForText('test caching', undefined, '.monthview-container .appointment .title');
    I.seeNumberOfElements('.monthview-container .day:not(.out) .appointment .title', moment().add(2, 'months').daysInMonth());

    I.logout();

});
