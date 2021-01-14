/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

const moment = require('moment');

Feature('Settings > Basic');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7763] Configure notification area', async ({ I, users }) => {

    var userA = users[0], userB = users[1];

    // userA invites userB to an appointment
    // appointment needs to be in the future in order to get a notification
    var format = 'YMMDD[T]HHmmss',
        start = moment().startOf('day').add(36, 'hours').format(format),
        end = moment().startOf('day').add(37, 'hours').format(format);
    await I.haveAppointment({
        folder: `cal://0/${await I.grabDefaultFolder('calendar')}`,
        summary: 'Timezone test',
        startDate: { value: start, tzid: 'Europe/Berlin' },
        endDate: { value: end, tzid: 'Europe/Berlin' },
        attendees: [{ entity: userA.userdata.id }, { entity: userB.userdata.id }]
    });

    // userB logs in
    await I.haveSetting({ 'io.ox/core': { autoOpenNotification: false } }, { user: userB });
    I.login('app=io.ox/mail', { user: userB });
    I.waitForText('1', 10, '#io-ox-notifications-icon');
    I.dontSeeElement('#io-ox-notifications-icon.open');
    I.logout();

    // userB logs in (again)
    await I.haveSetting({ 'io.ox/core': { autoOpenNotification: true } }, { user: userB });
    I.login('app=io.ox/mail', { user: userB });
    I.waitForText('1', 10, '#io-ox-notifications-icon');
    I.seeElement('#io-ox-notifications-icon.open');
});
