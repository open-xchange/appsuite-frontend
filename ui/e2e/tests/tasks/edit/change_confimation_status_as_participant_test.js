/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Tasks > Edit');

Before(async (users) => {
    await users.create();
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C125311] Change confimation status as participant @shaky', async function (I, users) {

    I.haveSetting('io.ox/core//autoOpenNotification', false, { user: users[1] });
    I.haveSetting('io.ox/calendar//deleteInvitationMailAfterAction', false, { user: users[1] });

    // 1. Login as User#A

    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('[data-app-name="io.ox/tasks"]');

    // 2. Create a new task and add another user to the task

    I.clickToolbar('New');
    I.waitForVisible('[data-app-name="io.ox/tasks/edit"]');

    I.fillField('Subject', 'Yo, I\'ll tell you what I want, what I really really want');
    I.click('Expand form');
    I.fillField('Add contact …', users[1].get('primaryEmail'));
    I.pressKey('Enter');
    I.waitForVisible('.participant-wrapper');
    I.click('Create');

    I.logout();

    // 3. Login as User#B and verify a notification has been received

    I.login('app=io.ox/mail', { user: users[1] });
    I.waitForVisible('[data-ref="io.ox/mail/listview"]');

    let mailCount = await I.grabNumberOfVisibleElements('.list-item');
    let retries = 6;

    while (mailCount < 1) {
        if (retries > 0) {
            I.waitForElement('#io-ox-refresh-icon', 5, '.taskbar');
            I.click('#io-ox-refresh-icon', '.taskbar');
            I.waitForElement('.launcher .fa-spin-paused', 5);
            I.wait(60);
            console.log('No mail(s) found. Waiting 1 minute ...');
            mailCount = await I.grabNumberOfVisibleElements('.list-item');
            retries--;
        } else {
            console.log('Timeout exceeded. No mails found.');
            break;
        }
    }

    // 4. Open notification mail

    I.click('.list-item[aria-label*="Yo, I\'ll tell you what I want, what I really really want"]');
    I.waitForVisible('.notifications');

    // 5. Set the task status alternating to 'Accepted', 'Tentative' and 'Declined'

    I.click('Accept');
    I.see('You have accepted this task');
    I.click('Show task details');
    I.waitForVisible('.io-ox-sidepopup');

    let actions = ['Tentative', 'Decline', 'Accept'];

    actions.forEach(function (action) {

        I.click('~More actions', '.io-ox-sidepopup');
        I.waitForVisible('.smart-dropdown-container');
        I.click('Change confirmation status');
        I.waitForText('Change confirmation status');
        I.click(action);
        // wait until sidepopup got updated
        I.wait(1);

        if (action === 'Tentative') I.seeElement('.fa-question-circle');
        if (action === 'Decline') I.seeElement('.fa-times');
        if (action === 'Accept') I.seeElement('.fa-check');

    });
});
