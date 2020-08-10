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
        await users.create(),
        await users.create()
    ]);
});

After(async (users) => {
    await users.removeAll();
});


const presenceStates = [
    { status: 'Absent', class: 'absent' },
    { status: 'Busy', class: 'busy' },
    { status: 'Offline', class: 'offline' }
];

Scenario('Presence state is shown and can be changed', async function (I) {
    const checkStatus = (statusToClick, classToCheck) => {
        I.say(`Check: ${statusToClick}`);
        I.clickDropdown(statusToClick);
        I.waitForDetached('.dropdown.open');
        // Check if state is updated in the topbar
        I.waitForVisible(`.taskbar .presence.${classToCheck}`);
        I.click('~Support');
        // Verify that the right status is marked as checked
        I.waitForVisible(`.dropdown.open a[data-value="${classToCheck}"] .fa-check`);
    };

    I.login();

    // Check default online state
    I.waitForVisible('.presence.online', 20);
    I.click('~Support');
    I.waitForVisible('.dropdown.open a[data-value="online"] .fa-check');

    presenceStates.forEach((state) => {
        checkStatus(state.status, state.class);
    });
});

Scenario('Presence state is shown in mails', async function (I, users, mail) {
    const [user1] = users,
        checkStatus = (statusToClick, classToCheck) => {
            I.say(`Check: ${statusToClick}`);
            I.click('~Support');
            I.clickDropdown(statusToClick);
            I.waitForDetached('.dropdown.open');
            I.waitForVisible(`.mail-detail .presence.${classToCheck}`);
            if (statusToClick === 'Offline') {
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
            console.log(ch);
            ch.add({ email: mail, incoming: true, missed: false, name: name, type: 'zoom' });
            console.log(ch);
        });
    }, primaryEmail, display_name);
    I.waitForVisible('~Call history');
    I.click('~Call history');
    I.waitForVisible('.call-history .dropdown-menu .presence.online');
});
