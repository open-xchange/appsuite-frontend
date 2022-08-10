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

const { expect } = require('chai');
const jitsiHost = 'https://mock-jitsi.k3s.os2.oxui.de/';

Feature('Switchboard > Jitsi');

Before(async ({ users }) => {

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

After(async ({ users }) => {
    await users.removeAll();
});

const waitAndSwitchTab = () => {
    const { I } = inject();
    I.wait(0.3);
    I.switchToNextTab();
};

Scenario('[OXUIB-442] Calling contact via jitsi', async ({ I, users, contacts, dialogs }) => {
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
Scenario.skip('Create call and check call history for jitsi', async ({ I, users, contacts, dialogs }) => {
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

Scenario('[J2] Create call from call history and check call history after hang up for jitsi', async ({ I, users, dialogs }) => {
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

Scenario('[OXUIB-443] Zoom settings are not shown when only jitsi is enabled', ({ I, settings }) => {

    I.login('app=io.ox/settings');
    settings.waitForApp();
    I.waitForVisible('.folder[data-model="virtual/settings/tools"]');
    I.dontSeeElement('.folder[data-model="virtual/settings/zoom"]');
    I.dontSee('Zoom Integration', '.folder[data-model="virtual/settings/tools"]');
});
