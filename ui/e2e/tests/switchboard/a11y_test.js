/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 */

/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');
const moment = require('moment');

Feature('Accessibility > Switchboard');

Before(async function (users) {
    await users.create();
    await users[0].context.hasCapability('switchboard');
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Switchboard - Call history', async (I) => {

    const primaryEmail = 'someone@schmalzgollum.com';
    const display_name = 'someone';


    I.login('app=io.ox/mail');
    I.waitForText('Empty', 5, '.list-view');
    await I.executeScript((mail, name) => {
        return require(['io.ox/switchboard/views/call-history']).then(function (ch) {
            ch.add(
                [
                    { email: mail, incoming: true, missed: false, name: name, type: 'zoom' },
                    { email: mail, incoming: true, missed: true, name: name, type: 'zoom' },
                    { email: mail, incoming: true, missed: false, name: name, type: 'zoom' },
                    { email: mail, incoming: true, missed: true, name: name, type: 'zoom' }
                ]
            );
        });
    }, primaryEmail, display_name);
    I.waitForVisible('~Call history');
    I.click('~Call history');
    I.waitForVisible('.dropdown.open');
    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Switchboard - Presence', async (I) => {

    I.login();
    I.waitForVisible('~My account');
    I.click('~My account');
    I.waitForVisible('.dropdown.open');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Switchboard - Call dialog', async (I, dialogs) => {

    const primaryEmail = 'someone@schmalzgollum.com';
    const display_name = 'someone';


    I.login('app=io.ox/mail');
    I.waitForText('Empty', 5, '.list-view');
    await I.executeScript((mail, name) => {
        return require(['io.ox/switchboard/views/call-history']).then(function (ch) {
            ch.add({ email: mail, incoming: true, missed: true, name: name, type: 'zoom' });
        });
    }, primaryEmail, display_name);

    I.waitForVisible('~Call history');
    I.click('~Call history');
    I.waitForVisible('.dropdown.open');
    I.click('.call-history-item', '.dropdown.open');
    dialogs.waitForVisible();

    expect(await I.grabAxeReport()).to.be.accessible;

});

Scenario('Switchboard - Addressbook', async (I, users, contacts) => {

    I.login('app=io.ox/contacts');
    I.waitForElement('.io-ox-contacts-window');
    I.waitForVisible('.io-ox-contacts-window .classic-toolbar');
    I.waitForVisible('.io-ox-contacts-window .tree-container');

    contacts.selectContact(`${users[0].get('sur_name')}, ${users[0].get('given_name')}`);
    I.waitForText('Call', 5, '.action-button-rounded');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Switchboard - Calendar', async (I, calendar) => {
    const time = moment().startOf('day').add(10, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';

    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: 'test invite accept/decline/accept tentative',
        startDate: { tzid: 'Europe/Berlin', value: time.format(format) },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format(format) },
        flags: ['conferences', 'organizer', 'accepted'],
        conferences: [{
            id: 456,
            uri: 'https://localhost',
            label: 'Zoom Meeting',
            features: ['AUDIO', 'VIDEO'],
            extendedParameters: {
                'X-OX-TYPE': 'zoom',
                'X-OX-ID': '65498713',
                'X-OX-OWNER': 'test.user@schmalzgollum.com'
            }
        }]
    });

    I.login('app=io.ox/calendar&perspective=month');
    calendar.waitForApp();
    I.waitForVisible('.appointment');
    I.click('.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Join Zoom meeting', 5, '.io-ox-sidepopup .action-button-rounded');
    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Switchboard - Call history keyboard navigation', async (I, settings) => {

    const mail = 'someone@testsomething.com';
    const name = 'someone';

    await I.haveSetting('io.ox/switchboard//callHistory/entries', [{ email: mail, incoming: true, missed: false, name: name, type: 'zoom' }]);
    I.login('app=io.ox/settings');
    settings.waitForApp();
    I.waitForVisible('~Call history');
    I.waitForFocus('.folder[data-id="virtual/settings/io.ox/core"]', 10);
    I.pressKey(['Shift', 'Tab']);
    expect(await I.grabFocusFrom('~Call history')).to.be.true;
    I.pressKey('Space');
    I.waitForVisible('.dropdown.open.call-history');
    expect(await I.grabFocusFrom('.dropdown.open [data-action="all"]')).to.be.true;
    I.pressKey('Tab');
    I.pressKey('Tab');

    expect(await I.grabFocusFrom(locate('.call-history-item a').inside('.dropdown.open.call-history').at(1))).to.be.true;
});
