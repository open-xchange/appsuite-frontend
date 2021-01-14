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

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7821] Add inbox widget', async ({ I, users }) => {

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

Scenario('[C7822] Add Birthday widget', async ({ I }) => {

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

Scenario('[C7823] Add calendar widget', async ({ I }) => {

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

Scenario('[C7825] Add quota widget', async ({ I }) => {

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

Scenario('[C7826] Add RSS Feed widget', async ({ I }) => {

    let rssFeedURL = 'http://rss.kicker.de/team/borussiadortmund';
    let rssFeedDescription = 'Kicker RSS Feed';

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/portal']);
    I.waitForText('Portal settings');

    // Add the portal widget
    I.click('Add widget');
    I.click('RSS Feed', '.io-ox-portal-settings-dropdown');

    // Fill out the RSS feed popup
    I.fillField('#rss_url', rssFeedURL);
    I.fillField('#rss_desc', rssFeedDescription);
    I.click('Save');

    // Verify that the widget is shown in the list
    I.waitForElement('~Color ' + rssFeedDescription);

    // Switch to portal an check the widget
    I.openApp('Portal');
    I.waitForText(rssFeedDescription);
});

Scenario('[C7827] Add task widget', async ({ I }) => {

    const moment = require('moment');

    const taskSummary = 'Summary7823';
    const taskDescription = 'Description7823';

    // create a task which is shown in the portal widget
    await I.haveTask({
        folder_id: `${await I.grabDefaultFolder('tasks')}`,
        title: taskSummary,
        note: taskDescription,
        end_time: moment().add(2, 'days').valueOf()
    });

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/portal']);
    I.waitForText('Portal settings');

    // Add the portal widget
    I.click('Add widget');
    I.click('My tasks', '.io-ox-portal-settings-dropdown');

    // Verify that the widget is shown in the list
    I.waitForElement('~Color My tasks');

    // Switch to portal an check the widget
    I.openApp('Portal');
    I.waitForText('My tasks');
    I.waitForText(taskSummary);

    // open the side popup
    I.click('.item', '~My tasks');
    I.waitForElement('.io-ox-sidepopup');
    I.waitForText(taskSummary, 10, '.io-ox-sidepopup');
    I.waitForText(taskDescription, 10, '.io-ox-sidepopup');
});

Scenario('[C7830] Add User data widget', async ({ I, users }) => {

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    // ensure the user has the capability to edit his password
    await users[0].hasConfig('com.openexchange.capabilities.edit_password', false);

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/portal']);
    I.waitForText('Portal settings');

    // Add the portal widget
    I.click('Add widget');
    I.click('User data', '.io-ox-portal-settings-dropdown');

    // Verify that the widget is shown in the list
    I.waitForElement('~Color User data');

    // Switch to portal an check the widget
    I.openApp('Portal');
    I.waitForText('User data');
    I.waitForText('My contact data');

    // TODO add again when change password is possible on a backend without sso
    // I.waitForText('My password');

});

Scenario('[C7833] Disable widgets', async ({ I }) => {

    I.login(['app=io.ox/portal']);

    const widget1 = 'Inbox';
    const widget2 = 'Appointments';
    const widget3 = 'My tasks';

    // Verify the portal widgets are shown
    I.waitForText(widget1, 10, '.widgets');
    I.waitForText(widget2, '.widgets');
    I.waitForText(widget3, '.widgets');

    // Switch to settings
    I.click('Customize this page');
    I.waitForText('Portal settings');

    // Disable the first widget
    I.click('~Disable ' + widget1);

    // Disable the second widget
    I.click('~Disable ' + widget2);

    // Disable the third widget
    I.click('~Disable ' + widget3);

    // Switch to portal and check that the widgets are removed
    I.openApp('Portal');
    I.waitForText('Customize this page');
    I.dontSee(widget1, '.widgets');
    I.dontSee(widget2, '.widgets');
    I.dontSee(widget3, '.widgets');
});

Scenario('[C7834] Modify widget color', async ({ I }) => {

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/portal']);
    I.waitForText('Portal settings');

    // Change the Inbox widget color to red
    I.click('~Color Inbox');
    I.click('a[data-color="red"]', '.dropdown.open');
    I.waitForElement(locate('span.widget-color-red').withText('Inbox'));

    // Change the Appointments widget color to green
    I.click('~Color Appointments');
    I.click('a[data-color="green"]', '.dropdown.open');
    I.waitForElement(locate('span.widget-color-green').withText('Appointments'));

    // Change the My latest files widget color to blue
    I.click('~Color My latest files');
    I.click('a[data-color="blue"]', '.dropdown.open');
    I.waitForElement(locate('span.widget-color-blue').withText('My latest files'));

    // Switch to portal an check the widgets
    I.openApp('Portal');
    I.waitForElement((locate('span').withText('Inbox')).inside('li.widget-color-red'));
    I.waitForElement((locate('span').withText('Appointments')).inside('li.widget-color-green'));
    I.waitForElement((locate('span').withText('My latest files')).inside('li.widget-color-blue'));
});

Scenario('[C7832] Remove widgets', async ({ I, dialogs }) => {

    I.login(['app=io.ox/portal']);

    const widget1 = 'Inbox';
    const widget2 = 'Appointments';
    const widget3 = 'My latest files';

    // Verify the portal widgets are shown
    I.waitForText(widget1, 10, '.widgets');
    I.waitForText(widget2, '.widgets');
    I.waitForText(widget3, '.widgets');

    // Switch to settings
    I.click('Customize this page');
    I.waitForText('Portal settings');

    // Remove the first widget
    I.click('~Remove ' + widget1);
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');

    // Remove the second widget
    I.click('~Remove ' + widget2);

    // Remove the third widget
    I.click('~Remove ' + widget3);

    // Switch to portal an check that the widgets are removed
    I.openApp('Portal');
    I.waitForText('Customize this page');
    I.dontSee(widget1, '.widgets');
    I.dontSee(widget2, '.widgets');
    I.dontSee(widget3, '.widgets');
});

Scenario.skip('[C7835] Re-order widgets', async ({ I }) => {

    I.login(['app=io.ox/portal']);

    const widget1 = 'Inbox';
    const widget2 = 'Appointments';
    const widget3 = 'My latest files';

    // Verify the portal widgets are shown
    I.waitForText(widget1, 10, '.widgets');
    I.waitForText(widget2, '.widgets');
    I.waitForText(widget3, '.widgets');

    let originalPosition = await I.grabAttributeFrom('li.widget', 'aria-label');
    I.say(originalPosition); // Inbox,Appointments,My tasks,Birthdays,My latest files

    // Switch to settings
    I.click('Customize this page');

    I.waitForText('Portal settings');

    let widget1Handle = locate('a.drag-handle').inside(locate('li.settings-list-item.draggable').withChild(locate('span').withText('Inbox')));
    let container = locate('li.settings-list-item.draggable').withChild(locate('span').withText('My latest files'));

    await I.dragAndDrop(widget1Handle, container);

    I.wait(10);
});
