/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Calendar');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7865] Configure to show/hide declined appointments', async ({ I }) => {
    I.login('app=io.ox/calendar');

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.retry(5).fillField('Subject', 'Appointment 1');
    I.fillField('Location', 'test location');

    I.click('~Start time');
    I.click('1:00 PM');

    I.click('Create');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.retry(5).fillField('Subject', 'Appointment 2');
    I.fillField('Location', 'test location');

    I.click('~Start time');
    I.click('2:00 PM');

    I.click('Create');
    I.waitForDetached('.io-ox-calendar-edit-window');
    I.click(locate('.appointment').withText('Appointment 2').as('"Appointment 2"'));
    I.waitForText('Decline');
    I.click('Decline', '.inline-toolbar-container');
    I.waitForText('Appointment 2');
    I.logout();
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/calendar');
    I.waitForText('Show declined appointments');
    I.uncheckOption('Show declined appointments');
    I.openApp('Calendar');
    I.dontSee('Appointment 2');

});
