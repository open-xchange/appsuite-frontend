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

Scenario('Create appointment with zoom conference', async (I, users, calendar) => {

    const [user1, user2] = users;

    session('userA', async () => {
        I.login('app=io.ox/calendar', { user: user1 });
        calendar.newAppointment();
        I.fillField('Subject', 'Appointment with Zoom conference');
        I.selectOption('conference-type', 'Zoom Meeting');
        I.waitForText('Connect with Zoom');
        I.click('Connect with Zoom');
        I.waitForVisible('.fa.fa-video-camera');
        I.waitForText('Link', 5, '.conference-view.zoom');
        await calendar.addParticipant(user2.get('name'));
        I.click('Create');
    });

    session('userB', () => {
        I.login('app=io.ox/calendar', { user: user2 });
        calendar.waitForApp();
        I.waitForVisible('.appointment');
        I.click('.appointment');
        I.waitForVisible('.io-ox-sidepopup');
        I.waitForVisible('.io-ox-sidepopup .switchboard-actions .btn[data-action="join"]');
        I.click('.io-ox-sidepopup .switchboard-actions .btn[data-action="join"]');
    });

    session('userA', () => {
        I.waitForVisible('.appointment');
        I.click('.appointment');
        I.waitForVisible('.io-ox-sidepopup');
        I.waitForVisible('.io-ox-sidepopup .switchboard-actions .btn[data-action="join"]');
        I.click('.io-ox-sidepopup .switchboard-actions .btn[data-action="join"]');
    });
});

Scenario('Create call from call history and check call history after hang up', (I, users, dialogs) => {
    const [user1, user2] = users;
    const { primaryEmail, display_name } = user2.userdata;


    session('userB', () => {
        I.login({ user: user2 });
    });

    session('userA', () => {
        I.login({ user: user1 });
        I.executeScript((mail, name) => {
            require(['io.ox/switchboard/views/call-history']).then(function (ch) {
                ch.add({ email: mail, incoming: true, missed: false, name: name, type: 'zoom' });
            });
        }, primaryEmail, display_name);
        I.waitForVisible('~Call history');
        I.click('~Call history');
        I.waitForVisible('.dropdown.open .call-history-item');
        I.click('.dropdown.open .call-history-item a');
        dialogs.waitForVisible();
        I.waitForText('You first need to connect OX App Suite with Zoom.', 5, dialogs.locators.body);
        I.click('Connect with Zoom', dialogs.locators.footer);
        I.waitForText('Call', 5, dialogs.locators.footer);
        dialogs.clickButton('Call');
        I.waitForText('Hang up', 5, dialogs.locators.footer);
    });

    session('userB', () => {
        dialogs.waitForVisible();
    });

    session('userA', () => {
        dialogs.clickButton('Hang up');
        I.waitForDetached('.modal');
        I.click('~Call history');
        I.waitForVisible(
            locate('.call-history-item')
            .inside('.dropdown.open')
            .withAttr({ title: `You called ${user2.get('sur_name')}, ${user2.get('given_name')}` })
        );
    });

    session('userB', () => {
        I.click('~Call history');
        I.waitForVisible(
            locate('.call-history-item')
            .inside('.dropdown.open')
            .withAttr({ title: `Missed call from ${user1.get('sur_name')}, ${user1.get('given_name')}` })
        );
    });
});

Scenario('Creating never ending recurring appointment with zoom conference', (I, calendar) => {

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    calendar.newAppointment();
    I.fillField('Subject', 'Recurring Zoom Appointment');
    calendar.recurAppointment();
    I.waitForText('Apply', 5, calendar.locators.recurrenceview);
    I.click('Apply', calendar.locators.recurrenceview);
    I.selectOption('conference-type', 'Zoom Meeting');
    I.waitForText('Connect with Zoom');
    I.click('Connect with Zoom');
    I.waitForVisible('.fa.fa-video-camera');
    I.waitForText('Link', 5, '.conference-view.zoom');
    I.waitForVisible('.alert-info.recurrence-warning');
    I.waitForText('Zoom meetings expire after 365 days.');
    I.click('Create');
    I.waitForVisible('.io-ox-alert');
});

Scenario('Check call history filtering', (I, users) => {

    const [user1, user2] = users;
    const { primaryEmail, display_name } = user2.userdata;

    I.login({ user: user1 });
    I.executeScript((mail, name) => {
        require(['io.ox/switchboard/views/call-history']).then(function (ch) {
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
    I.seeNumberOVisiblefElements('.call-history-item', 4);
    I.clickDropdown('Missed');
    I.seeNumberOfElements('.call-history-item.missed', 2);
    I.seeNumberOfVisibleElements('.call-history-item', 2);

});
