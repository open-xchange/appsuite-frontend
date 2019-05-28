/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Mail compose: Drafts');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

// skipped cause it's not absolutely deterministic
Scenario.skip('[B60850] remove restore point when draft is deleted', async function (I) {
    await I.haveSetting('io.ox/mail//deleteDraftOnTransport', true);
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    I.login('app=io.ox/mail');

    var limit = 10;

    I.say('🚩Create savepoints');
    for (let index = 1; index <= limit; index++) {
        I.clickToolbar('Compose');
        I.waitForVisible('.io-ox-mail-compose-window.normal.active');
        I.waitForFocus('.io-ox-mail-compose-window.active input[type="email"].token-input.tt-input');
        I.fillField('.io-ox-mail-compose-window.active [name="subject"]', index);
        I.click('.io-ox-mail-compose-window.active [data-action="minimize"]');
        I.say(`🚩Minimized mail #${index}`);
    }

    I.say('🚩Relogin #1');
    I.logout();
    I.login('app=io.ox/mail');

    I.say('🚩Empty Drafts');
    I.selectFolder('Drafts');
    I.waitForVisible('.folder.selected');
    I.click('.folder.selected .folder-options');
    I.click('Delete all messages', '.smart-dropdown-container');
    I.click('Empty folder');
    I.wait(2);

    I.say('🚩Relogin #2');
    I.logout();
    I.login('app=io.ox/mail');

    var first = await I.grabTextFrom('#io-ox-taskbar li:first-child .title');
    I.click('#io-ox-taskbar button');
    I.waitForVisible('.message.user-select-text');
    I.wait(2);
    I.say(`🚩Restore failed for '${first}'`);

    I.say('🚩Relogin #3');
    I.logout();
    I.login('app=io.ox/mail');

    var second = await I.grabTextFrom('#io-ox-taskbar li:first-child .title');

    I.say('🚩Check removed savepoint.');
    expect(first).is.not.equal(second);

});
