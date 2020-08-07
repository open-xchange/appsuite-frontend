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
    const { I } = inject();

    await Promise.all([
        await users.create(),
        await users.create()
    ]);
    await I.haveCapability('switchboard', users[0]);
    await I.haveCapability('switchboard', users[1]);
});

After(async (users) => {
    await users.removeAll();
});

const loginAndReload = (options) => {
    const { I } = inject();
    I.login(options);
    I.refreshPage();
    I.waitForVisible('#io-ox-launcher', 20);
};

Scenario('Presence state is shown and can be changed', async function (I) {
    const presenceStates = [
            { status: 'Absent', class: 'absent' },
            { status: 'Busy', class: 'busy' },
            { status: 'Offline', class: 'offline' }
        ],
        checkStatus = (statusToClick, classToCheck) => {
            I.say(`Check: ${statusToClick}`);
            I.clickDropdown(statusToClick);
            I.waitForDetached('.dropdown.open');
            // Check if state is updated in the topbar
            I.waitForVisible(`.taskbar .presence.${classToCheck}`);
            I.click('~Support');
            // Verify that the right status is marked as checked
            I.waitForVisible(`.dropdown.open a[data-value="${classToCheck}"] .fa-check`);
        };

    loginAndReload();

    // Check default online state
    I.waitForVisible('.presence.online', 20);
    I.click('~Support');
    I.waitForVisible('.dropdown.open a[data-value="online"] .fa-check');

    presenceStates.forEach((state) => {
        checkStatus(state.status, state.class);
    });
});

Scenario('Presence state is shown in mails', async function (I, users, mail) {
    const [user1] = users;

    await I.haveMail({
        from: [[user1.get('display_name'), user1.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Switchboard presence state check',
        to: [[user1.get('display_name'), user1.get('primaryEmail')]]
    });
    await I.haveSetting('io.ox/mail//showContactPictures', true);

    loginAndReload('app=io.ox/mail');

    mail.waitForApp();
    // Check presence in list view
    I.waitForVisible('.list-view-control .presence.online');
    mail.selectMail('Switchboard presence state check');
    // Check presence in mail detail
    I.waitForVisible('.mail-detail .presence.online');

});
