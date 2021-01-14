/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 */

/// <reference path="../../../../steps.d.ts" />

Feature('Settings > Calendar');

Before(async function ({ users }) {
    await Promise.all([
        users.create(),
        users.create(),
        users.create()
    ]);
});

After(async function ({ users }) {
    await users.removeAll();
});

const createAppointment = async (subject, participants) => {
        const { I, calendar } = inject();
        calendar.waitForApp();
        calendar.newAppointment();
        I.fillField('Subject', subject);
        if (Array.isArray(participants)) {
            await calendar.addParticipant(participants[0]);
            await calendar.addParticipant(participants[1]);
        } else {
            await calendar.addParticipant(participants);
        }
        I.click('Create', calendar.locators.edit);
        I.waitForDetached(calendar.locators.edit);
        I.seeElement('.page.current .appointment');
    },
    clickWithinPopup = async (text) => {
        const { I } = inject();
        await within('.io-ox-sidepopup .inline-toolbar', () => {
            I.waitForText(text);
            I.click(text);
            if (text !== 'Change status') I.waitForDetached(locate('a').withText(text));
        });
    },
    verfiyParticipants = async (subject, participants) => {
        const { I, calendar } = inject();
        I.refreshPage();
        calendar.waitForApp();
        I.waitForText(subject, 5, '.page.current .appointment');
        I.wait(1);
        I.click('.appointment', '.page.current');

        I.waitForVisible('.io-ox-sidepopup', 15);
        I.waitForVisible('.io-ox-sidepopup .participant-list');
        participants.forEach(part => I.waitForText(`${part.userdata.sur_name}, User`));
    },
    changeStatus = (subject, open) => {
        const { I, calendar, dialogs } = inject();
        if (!open) {
            calendar.waitForApp();
            I.waitForDetached('.fa-spin.fa-refresh');
            I.waitForText(subject, 5, '.page.current .appointment');
            I.click(subject);
        }
        I.waitForVisible('.io-ox-sidepopup .inline-toolbar');
        clickWithinPopup('Accept');
        clickWithinPopup('Decline');
        clickWithinPopup('Change status');
        dialogs.waitForVisible();
        dialogs.clickButton('Tentative');
        I.waitForDetached('.modal-dialog');
        I.retry(5).click('~Close', '.io-ox-sidepopup');
    },
    verifyNotificationMails = (emailNotificationSet, numberOfMails) => {
        const { I, mail, dialogs } = inject();

        I.openApp('Mail');
        mail.waitForApp();
        if (emailNotificationSet) {
            I.waitForVisible(`~Inbox, ${numberOfMails} unread`);
            I.waitForText('accepted the invitation');
            I.waitForText('declined the invitation');
            I.waitForText('tentatively accepted');

            I.openFolderMenu('Inbox');
            I.clickDropdown('Delete all messages');
            dialogs.waitForVisible();
            dialogs.clickButton('Empty folder');
            I.waitForDetached('.modal-dialog');
        } else {
            I.dontSee('accepted the invitation');
            I.dontSee('declined the invitation');
            I.dontSee('tentatively accepted');
        }
    },
    deleteAppointment = subject => {
        const { I, calendar } = inject();
        I.say('Delete old appointment to get a clean slate');
        I.openApp('Calendar', { perspective: 'week:week' });
        calendar.waitForApp();
        I.waitForText(subject);
        I.click(locate('.appointment').withText(subject));
        I.waitForVisible('.io-ox-sidepopup');
        calendar.deleteAppointment();
        I.waitForDetached('.io-ox-sidepopup');
        I.waitForDetached('.page.current .appointment');
    };

Scenario('[C7871] Configure accept/decline notification for creator', async ({ I, users, settings }) => {
    const [userA, userB] = users;
    const subject = 'C7871';

    I.say('Login userA and check, if setting notifyAcceptedDeclinedAsCreator is set.');
    await session('userA', async () => {
        I.login('app=io.ox/settings&folder=virtual/settings/io.ox/calendar', { user: userA });
        settings.waitForApp();
        I.waitForText('Receive notification as appointment creator');
        I.checkOption('notifyAcceptedDeclinedAsCreator');
        I.seeCheckboxIsChecked('notifyAcceptedDeclinedAsCreator');

        I.openApp('Calendar', { perspective: 'week:week' });
        await createAppointment(subject, userB.userdata.primaryEmail);
    });

    I.say('Login userB');
    await session('userB', async () => {
        I.login('app=io.ox/calendar&perspective=week:week', { user: userB });
        await changeStatus(subject, false);
    });

    I.say('Verify that all 3 notification emails were recieved as userA.');
    await session('userA', async () => {
        I.refreshPage();
        I.waitForVisible('#io-ox-appcontrol', 10);
        await verifyNotificationMails(true, 3);

        I.say('Unset notifyAcceptedDeclinedAsCreator');
        I.openApp('Settings', { folder: 'virtual/settings/io.ox/calendar' });
        settings.waitForApp();
        I.waitForText('Receive notification as appointment creator');
        I.uncheckOption('notifyAcceptedDeclinedAsCreator');
        I.waitForNetworkTraffic();
        I.dontSeeCheckboxIsChecked('notifyAcceptedDeclinedAsCreator');

        await deleteAppointment(subject);

        await createAppointment(subject, userB.userdata.primaryEmail);
    });

    await session('userB', async () => {
        I.refreshPage();
        I.waitForVisible('.notifications-icon', 10);
        await changeStatus(subject, false);
    });

    I.say('Verify that no notification email was sent.');
    await session('userA', async () => {
        I.refreshPage();
        I.waitForVisible('#io-ox-appcontrol', 10);
        await verifyNotificationMails(false);
    });
});

Scenario('[C7872] Configure accept/decline for participant', async ({ I, users, settings }) => {
    const [userA, userB, userC] = users,
        subject = '[C7872]';

    I.say('Login userC and set notifyAcceptedDeclinedAsParticipant.');
    await session('userC', () => {
        I.login('app=io.ox/settings&folder=virtual/settings/io.ox/calendar', { user: userC });
        settings.waitForApp();
        I.waitForText('Receive notification as appointment participant');
        I.checkOption('notifyAcceptedDeclinedAsParticipant');
        I.seeCheckboxIsChecked('notifyAcceptedDeclinedAsParticipant');
    });

    I.say('Login userA and create appointment with all participants.');
    await session('userA', async () => {
        I.login('app=io.ox/calendar&perpective=week:week', { user: userA });
        await createAppointment(subject, [userB.userdata.primaryEmail, userC.userdata.primaryEmail]);
    });

    I.say('Login userB, verify all participants and change status.');
    await session('userB', async () => {
        I.login('app=io.ox/calendar&perpective=week:week', { user: userB });
        await verfiyParticipants(subject, [userA, userB, userC]);
        await changeStatus(subject, true);
    });

    I.say('As userC verfiy that all notification mails were received.');
    await session('userC', async () => {
        // there are 4 mails, as the invitation mail is also sent
        I.refreshPage();
        I.waitForVisible('#io-ox-appcontrol', 10);
        await verifyNotificationMails(true, 4);

        I.say('As userC unset notifyAcceptedDeclinedAsParticipant');
        I.openApp('Settings', { folder: 'virtual/settings/io.ox/calendar' });
        settings.waitForApp();
        I.waitForText('Receive notification as appointment participant');
        I.uncheckOption('notifyAcceptedDeclinedAsParticipant');
        I.dontSeeCheckboxIsChecked('notifyAcceptedDeclinedAsParticipant');
    });

    await session('userA', async () => {
        I.waitForText(subject);
        await deleteAppointment(subject);

        I.say('As userA create appointment again with all participants.');
        await createAppointment(subject, [userB.userdata.primaryEmail, userC.userdata.primaryEmail]);
    });

    I.say('As userB, verify all participants and change status again.');
    await session('userB', async () => {
        I.refreshPage();
        await verfiyParticipants(subject, [userA, userB, userC]);
        await changeStatus(subject, true);
    });

    I.say('As userC, verify that no notification mails were received.');
    await session('userC', async () => {
        I.refreshPage();
        I.waitForVisible('#io-ox-appcontrol', 10);
        await verifyNotificationMails(false);
    });
});
