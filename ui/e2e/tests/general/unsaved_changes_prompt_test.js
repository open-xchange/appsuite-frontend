/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Tran Dong Tran <tran-dong.tran@open-xchange.com>
 */

/// <reference path="../../steps.d.ts" />
Feature('General > Show unsaved prompt');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('Unsaved prompt setting enabled: /mail/compose', async function (I, mail) {
    await I.haveSetting('io.ox/mail//autoSaveAfter', 1000);
    await I.haveSetting('io.ox/core//features/showUnsavedPrompt', true);
    I.login('app=io.ox/mail');

    // show prompt when dirty
    mail.newMail();
    I.fillField('To', 'anke@test.com');
    I.fillField('Subject', 'This is a test');
    I.refreshPage();
    I.cancelPopup();

    // do not show prompt when saved
    I.waitForText('Saved', 2, '.inline-yell');
    I.refreshPage();

    // show prompt when dirty after a save
    mail.newMail();
    I.fillField('To', 'peter@test.com');
    I.fillField('Subject', 'This is');
    I.waitForText('Saved', 2, '.inline-yell');
    I.fillField('Subject', 'a test too');

    I.refreshPage();
    I.acceptPopup();

    mail.waitForApp();
    I.logout();
});

Scenario('Unsaved prompt setting enabled: /contacts/edit', async function (I, contacts) {
    await I.haveSetting('io.ox/core//features/showUnsavedPrompt', true);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    contacts.newContact();
    I.fillField('First name', 'Peter');
    I.fillField('Last name', 'Lustig');

    I.refreshPage();
    I.acceptPopup();

    contacts.waitForApp();
    I.logout();
});

Scenario('Unsaved prompt setting enabled: /tasks/edit', async function (I, tasks) {
    await I.haveSetting('io.ox/core//features/showUnsavedPrompt', true);
    I.login('app=io.ox/tasks');
    tasks.waitForApp();

    tasks.newTask();
    I.fillField('Subject', 'New Test Task');
    I.fillField('Description', 'Hope all goes well');

    I.refreshPage();
    I.acceptPopup();

    tasks.waitForApp();
    I.logout();
});

Scenario('Unsaved prompt setting enabled: /calendar/edit', async function (I, calendar) {
    await I.haveSetting('io.ox/core//features/showUnsavedPrompt', true);
    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    calendar.newAppointment();
    I.fillField('Subject', 'Test unsaved prompt feature');
    I.fillField('Location', 'Terminal');

    I.refreshPage();
    I.acceptPopup();

    calendar.waitForApp();
    I.logout();
});

Scenario('Unsaved prompt setting disabled: /contacts/edit', async function (I, contacts) {
    await I.haveSetting('io.ox/core//features/showUnsavedPrompt', false);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    contacts.newContact();
    I.fillField('First name', 'Peter');
    I.fillField('Last name', 'Lustig');

    I.refreshPage();

    contacts.waitForApp();
    I.logout();
});

Scenario('Show minimized and unsaved apps after cancelling the prompt', async function (I, contacts) {
    await I.haveSetting('io.ox/core//features/showUnsavedPrompt', true);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    contacts.newContact();
    I.fillField('First name', 'Peter');
    I.fillField('Last name', 'Lustig');
    I.click('~Minimize');

    I.wait(1);
    I.dontSeeElement('.floating-window');
    I.refreshPage();
    I.cancelPopup();

    I.click('Save', '.io-ox-contacts-edit-window');
    I.waitForDetached('.io-ox-contacts-edit-window');
    I.logout();
});
