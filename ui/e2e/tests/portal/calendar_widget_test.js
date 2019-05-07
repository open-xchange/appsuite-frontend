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

Feature('Portal');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Create new appointment and check display in portal widget', async function (I) {

    I.login('app=io.ox/calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    // make ssure there are no upcommig appointments
    I.clickToolbar('View');
    I.click('List');
    I.dontSeeElement('[data-page-id="io.ox/calendar/list"] li.appointment');

    // make sure portal widget is empty
    I.openApp('Portal');
    I.waitForVisible('.io-ox-portal [data-widget-id="calendar_0"]');
    I.see('You don\'t have any appointments in the near future.', '[data-widget-id="calendar_0"] li.line');

    I.openApp('Calendar');
    I.clickToolbar('View');
    I.click('List');

    // create in List view
    I.selectFolder('Calendar');
    I.clickToolbar('View');
    I.click('List');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test portal widget');
    I.fillField('Location', 'portal widget location');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in week view
    I.clickToolbar('View');
    I.click('Week');
    I.waitForVisible('.weekview-container.week button.weekday.today');

    I.see('test portal widget', '.weekview-container.week .appointment .title');
    I.seeNumberOfElements('.weekview-container.week .appointment .title', 1);

    // check in portal
    I.openApp('Portal');
    I.waitForVisible('.io-ox-portal [data-widget-id="calendar_0"] li.item div');
    I.see('test portal widget', '[data-widget-id="calendar_0"] li.item div');

    // create a second appointment
    I.openApp('Calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);
    I.clickToolbar('View');
    I.click('List');

    // create in List view
    I.selectFolder('Calendar');
    I.clickToolbar('View');
    I.click('List');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'second test portal widget ');
    I.fillField('Location', 'second portal widget location');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForVisible('.modal-dialog');
    I.click('Ignore conflicts', '.modal-dialog');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in week view
    I.clickToolbar('View');
    I.click('Week');
    I.waitForVisible('.weekview-container.week button.weekday.today');
    I.seeNumberOfElements('.weekview-container.week .appointment .title', 2);

    I.logout();

});
