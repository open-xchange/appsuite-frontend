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

Feature('Switchboard > Presence');

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


const presenceStates = [
    { status: 'Absent', value: 'absent', class: 'absent' },
    { status: 'Busy', value: 'busy', class: 'busy' },
    { status: 'Invisible', value: 'invisible', class: 'offline' }
];

Scenario('Presence state is shown and can be changed', async function (I) {
    const checkStatus = (statusToClick, valueToCheck, classToCheck) => {
        I.say(`Check: ${statusToClick}`);
        I.clickDropdown(statusToClick);
        I.waitForDetached('.dropdown.open');
        // Check if state is updated in the topbar
        I.waitForVisible(`.taskbar .presence.${classToCheck}`);
        I.click('~My account');
        // Verify that the right status is marked as checked
        I.waitForVisible(`.dropdown.open a[data-value="${valueToCheck}"] .fa-check`);
    };

    I.login();

    // Check default online state
    I.waitForVisible('.presence.online', 20);
    I.click('~My account');
    I.waitForVisible('.dropdown.open a[data-value="online"] .fa-check');

    presenceStates.forEach((state) => {
        checkStatus(state.status, state.value, state.class);
    });
});

Scenario('Presence state is shown in mails', async function (I, users, mail) {
    const [user1] = users,
        checkStatus = (statusToClick, classToCheck) => {
            I.say(`Check: ${statusToClick}`);
            I.click('~My account');
            I.clickDropdown(statusToClick);
            I.waitForDetached('.dropdown.open');
            I.waitForVisible(`.mail-detail .presence.${classToCheck}`);
            if (statusToClick === 'Invisible') {
                I.waitForElement(`.list-view-control .presence.${classToCheck}`);
                I.dontSeeElement(`.list-view-control .presence.${classToCheck}`);
            } else I.waitForVisible(`.list-view-control .presence.${classToCheck}`);
        };

    await I.haveMail({
        from: [[user1.get('display_name'), user1.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Switchboard presence state check',
        to: [[user1.get('display_name'), user1.get('primaryEmail')]]
    });
    await I.haveSetting('io.ox/mail//showContactPictures', true);

    I.login('app=io.ox/mail');

    mail.waitForApp();
    // Check presence in list view
    I.waitForVisible('.list-view-control .presence.online');
    mail.selectMail('Switchboard presence state check');
    // Check presence in mail detail
    I.waitForVisible('.mail-detail .presence.online');

    presenceStates.forEach((state) => {
        checkStatus(state.status, state.class);
    });
});

Scenario('Presence state is shwon in call history', async function (I, users) {
    const [user1] = users;
    const { primaryEmail, display_name } = user1.userdata;

    await I.haveSetting('io.ox/switchboard//zoom/enabled', true);

    I.login('app=io.ox/mail', { user: user1 });
    I.executeScript((mail, name) => {
        require(['io.ox/switchboard/views/call-history']).then(function (ch) {
            ch.add({ email: mail, incoming: true, missed: false, name: name, type: 'zoom' });
        });
    }, primaryEmail, display_name);
    I.waitForVisible('~Call history');
    I.click('~Call history');
    I.waitForVisible('.call-history .dropdown-menu .presence.online');
});

Scenario('Check presence state of new user', (I, users) => {
    const [user1, user2] = users;

    session('userA', () => {
        I.login('app=io.ox/contacts', { user: user1 });
        I.waitForElement('.io-ox-contacts-window');
        I.waitForVisible('.io-ox-contacts-window .classic-toolbar');
        I.waitForVisible('.io-ox-contacts-window .tree-container');
        I.waitForElement(`.vgrid [aria-label="${user2.get('sur_name')}, ${user2.get('given_name')}"]`);
    });

    session('userB', () => {
        I.login('app=io.ox/contacts', { user: user2 });
        I.waitForElement('.io-ox-contacts-window');
        I.waitForVisible('.io-ox-contacts-window .classic-toolbar');
        I.waitForVisible('.io-ox-contacts-window .tree-container');
        I.waitForVisible(`.vgrid [aria-label="${user1.get('sur_name')}, ${user1.get('given_name')}"] .presence.online`);
        I.click('~My account');
        I.clickDropdown('Busy');
        I.waitForVisible(`.vgrid [aria-label="${user2.get('sur_name')}, ${user2.get('given_name')}"] .presence.busy`);
    });

    session('userA', () => {
        //this step fails, since userB presence is not updated currently
        I.waitForVisible(`.vgrid [aria-label="${user2.get('sur_name')}, ${user2.get('given_name')}"] .presence.busy`);
        I.click('~My account');
        I.clickDropdown('Absent');
        I.waitForVisible(`.vgrid [aria-label="${user1.get('sur_name')}, ${user1.get('given_name')}"] .presence.absent`);
    });

    session('userB', () => {
        I.waitForVisible(`.vgrid [aria-label="${user1.get('sur_name')}, ${user1.get('given_name')}"] .presence.absent`);
    });
});

Scenario('[OXUIB-497] Presence icon is visible after updating contact picture', (I, dialogs) => {
    I.login();

    // verify presence icon is there
    I.waitForVisible('.dropdown-toggle[aria-label="My account"] .presence .icon');
    I.waitForVisible('.contact-picture');
    I.click('.contact-picture');

    //I.waitForVisible('.dropdown.open');
    I.waitForVisible('.dropdown.open .action[data-name="user-picture"]');
    I.click('.action[data-name="user-picture"]');

    // Change user photo
    dialogs.waitForVisible();
    I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');
    I.waitForInvisible('.edit-picture.empty');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');

    // verify presence icon is still there
    I.waitForVisible('.dropdown-toggle[aria-label="My account"] .presence .icon');

});
