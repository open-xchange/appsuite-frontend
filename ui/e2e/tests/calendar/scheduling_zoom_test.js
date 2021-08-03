/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

const moment = require('moment');
const expect = require('chai').expect;

Feature('Calendar > Scheduling');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C244795] Zoom levels in scheduling view', async ({ I, users }) => {

    // create appointment (today)
    var format = 'YMMDD[T]HHmmss',
        start = moment().startOf('day').add(12, 'hours').format(format),
        end = moment().startOf('day').add(13, 'hours').format(format);
    await I.haveAppointment({
        folder: `cal://0/${await I.grabDefaultFolder('calendar')}`,
        summary: 'Scheduling zoom',
        startDate: { value: start, tzid: 'Europe/Berlin' },
        endDate: { value: end, tzid: 'Europe/Berlin' },
        attendees: [{ entity: users[0].userdata.id }]
    });

    I.login('app=io.ox/calendar');
    I.waitForText('Scheduling');
    I.wait(1);
    I.click('Scheduling');
    I.waitForElement('.freetime-view .appointment');

    // get 100% width
    var originalWidth = await getAppointmentWidth(), width;
    I.see('7:00 a');
    I.see('8:00 a');
    I.see('9:00 a');

    // set zoom to 50%
    I.click('.zoomlevel-selector .fa-minus');
    width = await getAppointmentWidth();
    expect(width / originalWidth).to.be.within(0.45, 0.55);
    I.see('7:00 a');
    I.see('9:00 a');
    I.dontSee('8:00 a');

    // set zoom to 25%
    I.click('.zoomlevel-selector .fa-minus');
    width = await getAppointmentWidth();
    expect(width / originalWidth).to.be.within(0.20, 0.30);
    I.see('7:00 a');
    I.dontSee('9:00 a');

    // set zoom to 200%
    I.click('.zoomlevel-selector .fa-plus');
    I.click('.zoomlevel-selector .fa-plus');
    I.click('.zoomlevel-selector .fa-plus');
    width = await getAppointmentWidth();
    expect(width / originalWidth).to.be.within(1.90, 2.10);
    I.see('7:00 a');
    I.see('8:00 a');
    I.see('9:00 a');

    // set zoom to 1000%
    I.click('.zoomlevel-selector .fa-plus');
    I.click('.zoomlevel-selector .fa-plus');
    width = await getAppointmentWidth();
    expect(width / originalWidth).to.be.within(9.50, 10.50);

    function getAppointmentWidth() {
        return I.executeScript(function () {
            return $('.freetime-view .appointment').outerWidth();
        });
    }
});
