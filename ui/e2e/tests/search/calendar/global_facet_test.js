
/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

const moment = require('moment');

Feature('Search > Calendar');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Search via facet "global"', async (I, calendar, search) => {
    const folder = await `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('week').add(1, 'day').add(16, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
    I.haveAppointment({
        folder,
        summary: 'summary',
        location: 'location',
        description: 'description',
        startDate: { tzid: 'Europe/Berlin', value: time.format(format) },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format(format) }
    });

    I.login('app=io.ox/calendar&perspective="week:workweek"');
    calendar.waitForApp();

    // not existing
    search.waitForWidget();
    search.doSearch('noneexisting');
    I.waitForText('No matching items found.');
    search.cancel();

    // global
    search.waitForWidget();
    search.doSearch('summary');
    I.waitNumberOfVisibleElements('.list-item.appointment', 1);
    search.cancel();

    // global: subject
    search.waitForWidget();
    search.doSearch('summary', '.subject');
    I.waitNumberOfVisibleElements('.list-item.appointment', 1);
    search.cancel();

    // global: location
    search.waitForWidget();
    search.doSearch('location', '.location');
    I.waitNumberOfVisibleElements('.list-item.appointment', 1);
    search.cancel();

    // global: description
    search.waitForWidget();
    search.doSearch('description', '.description');
    I.waitNumberOfVisibleElements('.list-item.appointment', 1);
    search.cancel();

});

Scenario('Search via appointment status', async (I, calendar, search) => {    const folder = await `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('week').add(1, 'day').add(16, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
    I.haveAppointment({
        folder,
        summary: 'summary',
        location: 'location',
        description: 'description',
        startDate: { tzid: 'Europe/Berlin', value: time.format(format) },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format(format) }
    });

    I.login('app=io.ox/calendar&perspective="week:workweek"');
    calendar.waitForApp();

    // no result
    search.waitForWidget();
    search.option('My Status', 'Declined');
    I.waitForText('No matching items found.');
    search.cancel();

    // status
    search.waitForWidget();
    search.option('My Status', 'Accepted');
    I.waitNumberOfVisibleElements('.list-item.appointment', 1);
    search.cancel();

    // type
    search.waitForWidget();
    search.option('Type', 'Single');
    I.waitNumberOfVisibleElements('.list-item.appointment', 1);
    search.cancel();
});
