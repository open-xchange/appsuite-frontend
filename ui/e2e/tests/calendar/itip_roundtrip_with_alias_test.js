/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('Calendar > iTIP - Alias Handling');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C223834] iTIP mail alias handling', async function (I, users, mail, calendar, contexts) {
    // We need two users. The organizer and the attendee
    // We put them in two contexts, so they synchronize
    // their calendars via iTIP only
    // The attendee also has an alias
    const secondContext = await contexts.create();
    await users.create(users.getRandom(), secondContext);
    const [organizer, attendee] = users;
    // We'll use "plus addressing" or "sub addressing" to generate the alias
    // Commonly bla+something@example.com is routed to bla@example.com
    const attendees_alias_address = attendee.userdata.primaryEmail.replace('@', '+alias@');
    const attendees_alias_display_name = attendee.userdata.display_name + '+alias';
    await attendee.hasAlias(attendees_alias_address);

    // Invite attendee by alias
    I.login('app=io.ox/calendar', { user: organizer });
    calendar.waitForApp();

    I.click('~Next Week', { css: '.page.current' });
    calendar.newAppointment();
    I.fillField('Subject', 'C223834');
    await calendar.addParticipant(attendees_alias_address, false);
    I.click('Create');
    I.waitForNetworkTraffic();
    // As the attendee, accept the invitation
    I.logout();
    I.login('app=io.ox/mail', { user: attendee });
    mail.waitForApp();
    mail.selectMail('New appointment: C223834');
    I.waitForText('Accept');
    I.click('Accept');
    I.waitForNetworkTraffic();
    // As the organizer, check the send address of the attendee
    I.logout();
    I.login('app=io.ox/mail', { user: organizer });
    mail.waitForApp();
    mail.selectMail(attendees_alias_display_name + ' accepted the invitation: C223834');
    I.waitForText(attendees_alias_address);

    await secondContext.remove();
});
