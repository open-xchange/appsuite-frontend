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

Feature('Switchboard > Calls');

Before(async (users) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
    await users[0].context.hasCapability('switchboard');
});

After(async (users) => {
    await users.removeAll();
});

const switchAndCloseTab = () => {
    const { I } = inject();

    I.wait(0.2);
    I.switchToNextTab();
    I.closeCurrentTab();
};

Scenario('Create call and check call history from addressbook', async (I, users, contacts, dialogs) => {

    const [user1, user2] = users;

    session('userB', () => {
        I.login({ user: user2 });
    });

    session('userA', () => {
        console.log(user1);
        I.login('app=io.ox/contacts', { user1: user1 });
        I.waitForElement('.io-ox-contacts-window');
        I.waitForVisible('.io-ox-contacts-window .classic-toolbar');
        I.waitForVisible('.io-ox-contacts-window .tree-container');
        contacts.selectContact(`${user2.get('sur_name')}, ${user2.get('given_name')}`);

        I.waitForText('Call', 5, '.switchboard-actions');
        I.waitForEnabled(locate('.switchboard-actions .btn').withText('Call'));
        I.click('Call');
        I.waitForText('Call via Zoom', 5, '.dropdown.open');
        I.waitForEnabled('.dropdown.open .dropdown-menu a');
        I.click('Call via Zoom');
        dialogs.waitForVisible();
        I.waitForText('You first need to connect OX App Suite with Zoom.', 5, dialogs.locators.body);
        I.click('Connect with Zoom', dialogs.locators.footer);
        I.waitForText('Call', 5, dialogs.locators.footer);
        dialogs.clickButton('Call');
        I.waitForText('Hang up', 5, dialogs.locators.footer);
    });

    session('userB', () => {
        dialogs.waitForVisible();
        I.waitForText('Incoming call');
        dialogs.clickButton('Answer');
        I.waitForDetached('.modal-dialog');
        switchAndCloseTab();


        I.waitForVisible('~Call history');
        I.click('~Call history');
        I.waitForVisible(
            locate('.call-history-item')
            .inside('.dropdown.open')
            .withAttr({ title: `Answered call from ${user1.get('sur_name')}, ${user1.get('given_name')}` })
        );
        I.seeNumberOfElements('.dropdown.open .call-history-item', 1);
    });

    session('userA', () => {
        switchAndCloseTab();
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

    session('userB', () => {
        //second call sometimes does not go through
        dialogs.waitForVisible();
        dialogs.clickButton('Decline');
        I.waitForDetached('.modal-dialog');
    });

    session('userA', () => {
        I.waitForVisible(
            locate('.call-history-item')
            .inside('.dropdown.open')
            .withAttr({ title: `You called ${user2.get('sur_name')}, ${user2.get('given_name')}` })
        );
        I.seeNumberOfElements('.dropdown.open .call-history-item', 2);
    });
});
