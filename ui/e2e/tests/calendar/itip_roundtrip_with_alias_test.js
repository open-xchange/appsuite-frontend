/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('Calendar > iTIP - Alias Handling');

Before(async function ({ users, contexts }) {
    await users.create();
    const secondContext = await contexts.create();
    await users.create(users.getRandom(), secondContext);
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C223834] iTIP mail alias handling', async function ({ I, users, mail, calendar }) {
    // We need two users. The organizer and the attendee
    // We put them in two contexts, so they synchronize
    // their calendars via iTIP only
    // The attendee also has an alias
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
    I.waitForText('New appointment: C223834', 10);
    mail.selectMail('New appointment: C223834');
    I.waitForText('Accept');
    I.click('Accept');
    I.waitForNetworkTraffic();
    // As the organizer, check the send address of the attendee
    I.logout();
    I.login('app=io.ox/mail', { user: organizer });
    mail.waitForApp();
    // check mail recipient
    const item = locate('.person').withText(attendees_alias_display_name);
    I.waitForElement(item, 30);
    // select by index as generated mail body may contain only displayname and not alias-displayname
    mail.selectMailByIndex(0);
    I.waitForText(attendees_alias_address);
});
