/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Markus Wagner <markus.wagner@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('Settings > Portal');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C7821] Add inbox widget', async function (I, users) {

    const mailSubject = 'Mail7821';
    const widgetName = 'Inbox Widget 7821';

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    await I.haveMail({
        from: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]],
        sendtype: 0,
        subject: mailSubject,
        to: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]]
    });

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/portal']);
    I.waitForText('Portal settings');

    // Add the portal widget
    I.click('Add widget');
    I.click('Inbox', '.io-ox-portal-settings-dropdown');

    // Verify that the widget is shown in the list
    I.waitForElement('~Color Inbox');

    // Fill out the inbox widget popup
    I.fillField('input[class="form-control"]', widgetName);
    I.click('Save');

    // Switch to portal an check the widget
    I.openApp('Portal');
    I.waitForText(widgetName);
    I.waitForText(mailSubject);
});

Scenario('[C7822] Add Birthday widget', async function (I) {

    const moment = require('moment');

    const contactDisplayName = 'Dr. Doo, Scoobie';

    // create a contact with birthday
    await I.haveContact({
        folder_id: `${await I.grabDefaultFolder('contacts')}`,
        title: 'Dr.',
        first_name: 'Scoobie',
        last_name: 'Doo',
        display_name: contactDisplayName,
        birthday: moment().add(2, 'days').valueOf()
    });

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/portal']);
    I.waitForText('Portal settings');

    // Add the portal widget
    I.click('Add widget');
    I.click('Birthdays', '.io-ox-portal-settings-dropdown');

    // Verify that the widget is shown in the list
    I.waitForElement('~Color Birthdays');

    // Switch to portal an check the widget
    I.openApp('Portal');
    I.waitForText('Birthdays');
    I.waitForText(contactDisplayName);

    // open the side popup
    I.click('.item', '~Birthdays');
    I.waitForElement('.io-ox-sidepopup');
    I.waitForText('Birthdays', 10, '.io-ox-sidepopup');
    I.waitForText(contactDisplayName, 10, '.io-ox-sidepopup');
    I.waitForText('Buy a gift', 10, '.io-ox-sidepopup');
});

Scenario('[C7823] Add calendar widget', async function (I) {

    const moment = require('moment');

    const appointmentSummary = 'Summary7823';
    const appointmentLocation = 'Location7823';
    const appointmentDescription = 'Description7823';

    const time = moment().add(6, 'hours');
    const format = 'YYYYMMDD[T]HHmm00'; //YYYYMMDD[T]HHmmss
    const timezone = 'Europe/Berlin';

    // create an appointment which is shown in the portal widget
    await I.haveAppointment({
        folder: `cal://0/${await I.grabDefaultFolder('calendar')}`,
        summary: appointmentSummary,
        location: appointmentLocation,
        description: appointmentDescription,
        startDate: { value: time.format(format), tzid: timezone },
        endDate: { value: time.add(1, 'hour').format(format), tzid: timezone }
    });

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/portal']);
    I.waitForText('Portal settings');

    // Add the portal widget
    I.click('Add widget');
    I.click('Appointments', '.io-ox-portal-settings-dropdown');

    // Verify that the widget is shown in the list
    I.waitForElement('~Color Appointments');

    // Switch to portal an check the widget
    I.openApp('Portal');
    I.waitForText('Appointments');
    I.waitForText(appointmentSummary);

    // open the side popup
    I.click('.item', '~Appointments');
    I.waitForElement('.io-ox-sidepopup');
    I.waitForText(appointmentSummary, '.io-ox-sidepopup');
    I.waitForText(appointmentLocation, '.io-ox-sidepopup');

});

Scenario('[C7825] Add quota widget', async function (I) {

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/portal']);
    I.waitForText('Portal settings');

    // Add the portal widget
    I.click('Add widget');
    I.click('Quota', '.io-ox-portal-settings-dropdown');

    // Verify that the widget is shown in the list
    I.waitForElement('~Color Quota');

    // Switch to portal an check the widget
    I.openApp('Portal');
    I.waitForText('File quota');
    I.waitForText('Mail quota');
});
