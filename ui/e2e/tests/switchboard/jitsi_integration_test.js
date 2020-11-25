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
 *
 */

/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');
const jitsiHost = 'https://meet.k3s.os.oxui.de';

Feature('Switchboard > Jitsi');

Before(async (users) => {

    await Promise.all([
        users.create(),
        users.create()
    ]);
    await Promise.all([
        users[0].context.hasCapability('switchboard'),
        users[0].hasConfig('io.ox/switchboard//jitsi/enabled', true),
        users[0].hasConfig('io.ox/switchboard//jitsi/host', jitsiHost),
        users[0].hasConfig('io.ox/switchboard//zoom/enabled', false)
    ]);
});

After(async (users) => {
    await users.removeAll();
});

const waitAndSwitchTab = () => {
    const { I } = inject();
    I.wait(0.3);
    I.switchToNextTab();
};

Scenario('[OXUIB-442] Calling contact via jitsi', async (I, users, contacts, dialogs) => {
    const [user1, user2] = users;
    let meetingURL;

    session('userB', () => {
        I.login('app=io.ox/contacts', { user: user2 });
    });

    await session('userA', async () => {
        I.login('app=io.ox/contacts', { user: user1 });
        I.waitForElement('.io-ox-contacts-window');
        I.waitForVisible('.io-ox-contacts-window .classic-toolbar');
        I.waitForVisible('.io-ox-contacts-window .tree-container');
        contacts.selectContact(`${user2.get('sur_name')}, ${user2.get('given_name')}`);
        I.waitForText('Call', 5, '.action-button-rounded');
        I.waitForEnabled(locate('.action-button-rounded .btn').withText('Call'));
        I.click('Call');
        I.waitForText('Call via Jitsi', 5, '.dropdown.open');
        I.waitForEnabled('.dropdown.open .dropdown-menu a');
        I.click('Call via Jitsi');
        dialogs.waitForVisible();
        I.waitForText(jitsiHost, 5, '.conference-view.jitsi');
        dialogs.clickButton('Call');
        I.waitForText('Hang up', 5, dialogs.locators.footer);
        waitAndSwitchTab();
        meetingURL = await I.grabCurrentUrl();
    });

    await session('userB', async () => {
        dialogs.waitForVisible();
        I.waitForText('Incoming call');
        dialogs.clickButton('Answer');
        I.waitForDetached('.modal-dialog');
        waitAndSwitchTab();
        let url = await I.grabCurrentUrl();
        expect(meetingURL).to.be.equal(url);
    });
});
//needs MR-542
Scenario.skip('Create call and check call history for jitsi', async (I, users, contacts, dialogs) => {
    const [user1, user2] = users;

    session('userB', () => {
        I.login('app=io.ox/contacts', { user: user2 });
    });

    await session('userA', async () => {
        I.login('app=io.ox/contacts', { user: user1 });
        I.waitForElement('.io-ox-contacts-window');
        I.waitForVisible('.io-ox-contacts-window .classic-toolbar');
        I.waitForVisible('.io-ox-contacts-window .tree-container');
        contacts.selectContact(`${user2.get('sur_name')}, ${user2.get('given_name')}`);
        I.waitForText('Call', 5, '.action-button-rounded');
        I.waitForEnabled(locate('.action-button-rounded .btn').withText('Call'));
        I.click('Call');
        I.waitForText('Call via Jitsi', 5, '.dropdown.open');
        I.waitForEnabled('.dropdown.open .dropdown-menu a');
        I.click('Call via Jitsi');
        dialogs.waitForVisible();
        I.waitForText(jitsiHost, 5, '.conference-view.jitsi');
        dialogs.clickButton('Call');
        I.waitForText('Hang up', 5, dialogs.locators.footer);
    });

    await session('userB', async () => {
        dialogs.waitForVisible();
        I.waitForText('Incoming call');
        dialogs.clickButton('Answer');
        I.waitForDetached('.modal-dialog');
        waitAndSwitchTab();
        I.closeCurrentTab();

        I.waitForVisible('~Call history');
        I.click('~Call history');
        I.waitForVisible(
            locate('.call-history-item')
            .inside('.dropdown.open')
            .withAttr({ title: `Answered call from ${user1.get('sur_name')}, ${user1.get('given_name')}` })
        );
        I.seeNumberOfElements('.dropdown.open .call-history-item', 1);
    });

    await session('userA', () => {
        waitAndSwitchTab();
        I.closeCurrentTab();

        I.waitForVisible('~Call history');
        I.click('~Call history');
        I.waitForVisible(
            locate('.call-history-item')
            .inside('.dropdown.open')
            .withAttr({ title: `You called ${user2.get('sur_name')}, ${user2.get('given_name')}` })
        );
        I.seeNumberOfElements('.dropdown.open .call-history-item', 1);
        I.click('.call-history-item a');
        dialogs.waitForVisible();

        dialogs.clickButton('Call');
        I.waitForText('Hang up', 5, dialogs.locators.footer);
    });

    await session('userB', () => {
        //second call sometimes does not go through
        dialogs.waitForVisible();
        dialogs.clickButton('Decline');
        I.waitForDetached('.modal-dialog');
    });

    await session('userA', () => {
        I.waitForVisible(
            locate('.call-history-item')
            .inside('.dropdown.open')
            .withAttr({ title: `You called ${user2.get('sur_name')}, ${user2.get('given_name')}` })
        );
        I.seeNumberOfElements('.dropdown.open .call-history-item', 2);
    });
});

Scenario('[J2] Create call from call history and check call history after hang up for jitsi', async (I, users, dialogs) => {
    const [user1, user2] = users;
    const { primaryEmail, display_name } = user2.userdata;


    await session('userB', () => {
        I.login({ user: user2 });
    });

    await session('userA', () => {
        I.login({ user: user1 });
        I.executeScript((mail, name) => {
            require(['io.ox/switchboard/views/call-history']).then(function (ch) {
                ch.add({ email: mail, incoming: true, missed: false, name: name, type: 'jitsi' });
            });
        }, primaryEmail, display_name);
        I.waitForVisible('~Call history');
        I.click('~Call history');
        I.waitForVisible('.dropdown.open .call-history-item');
        I.click('.dropdown.open .call-history-item a');
        dialogs.waitForVisible();
        I.waitForText('Call', 5, dialogs.locators.footer);
        dialogs.clickButton('Call');
        I.waitForText('Hang up', 5, dialogs.locators.footer);
    });

    await session('userB', () => {
        dialogs.waitForVisible();
        I.waitForText('Incoming call');
        I.waitForText('Answer');
    });

    await session('userA', () => {
        waitAndSwitchTab();
        I.closeCurrentTab();
        I.wait(0.2);
        I.waitForText('Hang up');
        dialogs.clickButton('Hang up');
        I.waitForDetached('.modal');
        I.waitForVisible('~Call history');
        I.waitForEnabled('~Call history');
        I.click('~Call history');
        I.waitForVisible(
            locate('.call-history-item')
            .inside('.dropdown.open')
            .withAttr({ title: `You called ${user2.get('sur_name')}, ${user2.get('given_name')}` })
        );
    });

    await session('userB', () => {
        I.waitForVisible('~Call history');
        I.waitForEnabled('~Call history');
        I.click('~Call history');
        I.waitForVisible(
            locate('.call-history-item')
            .inside('.dropdown.open')
            .withAttr({ title: `Missed call from ${user1.get('sur_name')}, ${user1.get('given_name')}` })
        );
    });
});

Scenario('Create appointment with jitsi conference', async (I, users, calendar) => {

    const [user1, user2] = users;
    let meetingURL;

    await session('userA', async () => {
        I.login('app=io.ox/calendar', { user: user1 });
        calendar.newAppointment();
        I.fillField('Subject', 'Appointment with Jitsi conference');
        I.selectOption('conference-type', 'Jitsi Meeting');
        I.waitForVisible('.fa.fa-video-camera');
        I.waitForText(jitsiHost, 5, '.conference-view');
        await calendar.addParticipant(user2.get('name'));
        I.click('Create');
    });

    await session('userB', async () => {
        I.login('app=io.ox/calendar', { user: user2 });
        calendar.waitForApp();
        I.waitForVisible('.appointment');
        I.click('.appointment');
        I.waitForVisible('.io-ox-sidepopup');
        I.waitForVisible('.io-ox-sidepopup .action-button-rounded .btn[data-action="join"]');
        I.click('.io-ox-sidepopup .action-button-rounded .btn[data-action="join"]');
        waitAndSwitchTab();
        meetingURL = await I.grabCurrentUrl();
    });

    await session('userA', async () => {
        I.waitForVisible('.appointment');
        I.click('.appointment');
        I.waitForVisible('.io-ox-sidepopup');
        I.waitForVisible('.io-ox-sidepopup .action-button-rounded .btn[data-action="join"]');
        I.click('.io-ox-sidepopup .action-button-rounded .btn[data-action="join"]');
        waitAndSwitchTab();
        let url = await I.grabCurrentUrl();
        expect(meetingURL).to.be.equal(url);
    });
});

Scenario('[OXUIB-443] Zoom settings are not shown when only jitsi is enabled', (I, settings) => {

    I.login('app=io.ox/settings');
    settings.waitForApp();
    I.waitForVisible('.folder[data-model="virtual/settings/tools"]');
    I.dontSeeElement('.folder[data-model="virtual/settings/zoom"]');
    I.dontSee('Zoom Integration', '.folder[data-model="virtual/settings/tools"]');
});
