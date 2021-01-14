/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

Feature('Mailfilter');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('checks if an auto forward rule with copy statement is handled correctly', function ({ I, dialogs }) {

    I.haveMailFilterRule({
        'rulename': 'autoforward',
        'actioncmds': [
            { 'id': 'redirect', 'to': 'test@tester.com', 'copy': true }
        ],
        'active': true,
        'flags': ['autoforward'],
        'test': { 'id': 'true' }
    });

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.waitForElement({ css: '[data-id="virtual/settings/io.ox/mail"]' });

    I.selectFolder('Mail');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForVisible({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
    I.click('Auto forward ...');

    dialogs.waitForVisible();
    I.seeCheckboxIsChecked('Keep a copy of the message');

    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
});

Scenario('checks if an auto forward rule with keep statement is handled correctly', function ({ I, dialogs }) {
    I.haveMailFilterRule({
        'rulename': 'autoforward',
        'actioncmds': [
            { 'id': 'redirect', 'to': 'test@tester.com' },
            { 'id': 'keep' }
        ],
        'active': true,
        'flags': ['autoforward'],
        'test': { 'id': 'true' }
    });

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.waitForElement({ css: '[data-id="virtual/settings/io.ox/mail"]' });

    I.selectFolder('Mail');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForVisible({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
    I.click('Auto forward ...');

    dialogs.waitForVisible();
    I.seeCheckboxIsChecked('Keep a copy of the message');

    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
});

Scenario('checks if an auto forward rule with keep statement is written correctly', function ({ I, users, dialogs }) {
    let [user] = users;

    user.hasConfig('com.openexchange.mail.filter.blacklist.actions', 'copy');

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.waitForElement({ css: '[data-id="virtual/settings/io.ox/mail"]' });

    I.selectFolder('Mail');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForElement({ css: '[data-action="edit-auto-forward"]' });
    I.click('Auto forward ...');

    dialogs.waitForVisible();
    I.click('.checkbox.switch.large', dialogs.locators.header);
    I.fillField('Forward all incoming emails to this address', 'test@tester.com');
    I.checkOption('Keep a copy of the message');
    dialogs.clickButton('Apply changes');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
    I.click('Auto forward ...');
    dialogs.waitForVisible();
    I.seeCheckboxIsChecked('Keep a copy of the message');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
    I.waitForVisible({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
});

Scenario('checks if an auto forward rule with copy statement is written correctly', function ({ I, dialogs }) {

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.waitForElement({ css: '[data-id="virtual/settings/io.ox/mail"]' });

    I.selectFolder('Mail');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForElement({ css: '[data-action="edit-auto-forward"]' });
    I.click('Auto forward ...');

    dialogs.waitForVisible();
    I.click('.checkbox.switch.large', dialogs.locators.header);
    I.fillField('Forward all incoming emails to this address', 'test@tester.com');
    I.checkOption('Keep a copy of the message');

    dialogs.clickButton('Apply changes');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
    I.click('Auto forward ...');
    dialogs.waitForVisible();
    I.seeCheckboxIsChecked('Keep a copy of the message');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
    I.waitForVisible({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
});
