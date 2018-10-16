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

const expect = require('chai').expect;

Feature('Calendar: Create appointment');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario.only('Create never ending appointment and check display in several views', async function (I, users) {
    let [user] = users;

    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//showCheckboxes', true);

    I.login('app=io.ox/calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    // toogle weeks to activate caching
    I.clickToolbar('View');
    I.click('Week');
    I.waitForVisible('a.weekday.today');

    I.click('.weekview a[title="Next Week"]');
    I.dontSeeElement('a.weekday.today');

    I.click('.weekview a[title="Previous Week"]');
    I.waitForVisible('a.weekday.today');

    // toogle months to activate caching
    I.clickToolbar('View');
    I.click('Month');
    I.waitForVisible('.month-view td.day.today');

    I.click('.month-toolbar a[title="Next"]');
    I.dontSeeElement('.month-view td.day.today');

    I.click('.month-toolbar a[title="Previous"]');
    I.waitForVisible('.month-view td.day.today')

    // create in List view
    I.selectFolder('Calendar');
    I.clickToolbar('View');
    I.click('List');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test recurring');
    I.fillField('Location', 'invite location');

    const { start } = await I.executeAsyncScript(function (done) {
        done({
            start: `.date-picker[data-attribute="startDate"] .date[id$="_${moment().startOf('week').add('1', 'day').format('l')}"]`

        });
    });

    I.click({ css: '[data-attribute="startDate"] input' });
    I.click(start);

    I.click('All day', '.io-ox-calendar-edit-window');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click('.btn.btn-link.summary');

    I.click('.modal-dialog [name="recurrence_type"]');
    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Daily');

    I.click('Apply', '.modal-dialog');

    I.waitForDetached('.modal-dialog');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');

    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in week view
    I.clickToolbar('View');
    I.click('Week');
    I.waitForVisible('a.weekday.today');

    I.see('test recurring', '.weekview .appointment .title');
    I.seeNumberOfElements('.weekview .appointment .title', 6);

    I.click('.weekview a[title="Next Week"]');
    I.dontSeeElement('a.weekday.today');

    I.see('test recurring', '.weekview .appointment .title');
    I.seeNumberOfElements('.weekview .appointment .title', 7);

    // check in month view
    I.clickToolbar('View');
    I.click('Month');
    I.waitForVisible('.month-view td.day.today');

    I.see('test recurring', '.month-view .appointment .title');
    I.click('.month-toolbar a[title="Next"]');
    I.dontSeeElement('a.weekday.today');

    I.see('test recurring', '.month-view .appointment .title');
    I.seeNumberOfElements('.month-view .appointment .title', 35);

    I.logout();

});
