/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('Calendar > iTIP');

Before(async (users) => {
    await users.create();
});

After(async (contexts, users) => {
    await users.removeAll();
});

Scenario('[C241126] iTIP mails without appointment reference', async function (I, users, mail, calendar) {
    // 1.) Import the attached mail 'mail3.eml'
    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/c241126_3.eml' });
    // 2.) Read the mail3
    I.login('app=io.ox/mail');
    I.waitForText('Appointment canceled: #1');
    mail.selectMail('Appointment canceled: #1');
    I.waitForText('This email contains an appointment');
    I.waitForText('The organizer would like to cancel an appointment that could not be found.');
    // 3.) Import the attached mail 'mail2.eml'
    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/c241126_2.eml' });
    // 4.) Read the mail2
    I.waitForText('tthamm accepted the invitation: #1');
    mail.selectMail('tthamm accepted the invitation: #1');
    I.waitForText('This email contains an appointment');
    I.waitForText('An attendee wanted to change his/her participant state in an appointment that could not be found.');
    I.waitForText('Probably the appointment was already canceled.');
    // 5.) Import the attached mail 'mail1.eml'
    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/c241126_1.eml' });
    // 6.) Read the mail1
    I.waitForText('New appointment: #1');
    mail.selectMail('New appointment: #1');
    I.waitForText('Accept');
    I.waitForText('Tentative');
    I.waitForText('Decline');
    // 7.) 'Accept' the appointment
    I.click('Accept');
    I.waitForText('You have accepted the appointment');
    I.openApp('Calendar');
    I.executeScript(function () {
        // go to 2018-03-22
        ox.ui.App.getCurrentApp().setDate(1521720000000);
    });
    I.click('3/22/2018, Thursday, CW 12', calendar.locators.mini);
    I.waitForText('#1');
    I.openApp('Mail');
    // 8.) Read the mail2
    mail.selectMail('tthamm accepted the invitation: #1');
    I.waitForText("You have received an E-Mail containing a reply to an appointment that you didn't organize. Best ignore it.");
    // 9.) Read the mail3
    mail.selectMail('Appointment canceled: #1');
    I.waitForText('Delete');
    // 10.) 'Delete'
    I.click('Delete');
    I.retry(5).dontSee('Appointment canceled: #1');
});
