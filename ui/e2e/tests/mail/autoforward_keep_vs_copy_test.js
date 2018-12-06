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

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('checks if an auto forward rule with copy statement is handled correctly', function (I) {

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
    I.waitForElement('[data-id="virtual/settings/io.ox/mail"]');

    I.selectFolder('Mail');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForVisible('[data-action="edit-auto-forward"] .fa-toggle-on');
    I.click('Auto forward ...');

    I.waitForElement('.modal-dialog');
    I.seeCheckboxIsChecked('Keep a copy of the message');

    I.click('Cancel', '.modal-dialog');
    I.waitForInvisible('.modal-dialog');
    I.logout();
});

Scenario('checks if an auto forward rule with keep statement is handled correctly', function (I) {

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
    I.waitForElement('[data-id="virtual/settings/io.ox/mail"]');

    I.selectFolder('Mail');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForVisible('[data-action="edit-auto-forward"] .fa-toggle-on');
    I.click('Auto forward ...');

    I.waitForElement('.modal-dialog');
    I.seeCheckboxIsChecked('Keep a copy of the message');

    I.click('Cancel', '.modal-dialog');
    I.waitForInvisible('.modal-dialog');
    I.logout();
});

Scenario('checks if an auto forward rule with keep statement is written correctly', function (I, users) {
    let [user] = users;

    user.hasConfig('com.openexchange.mail.filter.blacklist.actions', 'copy');

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.waitForElement('[data-id="virtual/settings/io.ox/mail"]');

    I.selectFolder('Mail');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForElement('[data-action="edit-auto-forward"]');
    I.click('Auto forward ...');

    I.waitForElement('.modal-dialog');
    I.waitForElement('.modal-dialog .checkbox.switch.large');

    I.click('.modal-dialog .checkbox.switch.large');
    I.fillField('Forward all incoming emails to this address', 'test@tester.com');
    I.waitForVisible('.modal-dialog .checkbox.custom.small [name="copy"]:not(disabled)');
    I.click('Keep a copy of the message');

    I.click('Apply changes', '.modal-dialog');
    I.waitForInvisible('.modal-dialog');

    I.waitForVisible('[data-action="edit-auto-forward"] .fa-toggle-on');
    I.click('Auto forward ...');
    I.waitForElement('.modal-dialog');
    I.seeCheckboxIsChecked('Keep a copy of the message');
    I.click('Cancel', '.modal-dialog');
    I.waitForInvisible('.modal-dialog');

    I.logout();
});

Scenario('checks if an auto forward rule with copy statement is written correctly', function (I) {

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.waitForElement('[data-id="virtual/settings/io.ox/mail"]');

    I.selectFolder('Mail');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForElement('[data-action="edit-auto-forward"]');
    I.click('Auto forward ...');

    I.waitForElement('.modal-dialog');
    I.waitForElement('.modal-dialog .checkbox.switch.large');

    I.click('.modal-dialog .checkbox.switch.large');
    I.fillField('Forward all incoming emails to this address', 'test@tester.com');
    I.waitForVisible('.modal-dialog .checkbox.custom.small [name="copy"]:not(disabled)');
    I.click('Keep a copy of the message');

    I.click('Apply changes', '.modal-dialog');
    I.waitForInvisible('.modal-dialog');

    I.waitForVisible('[data-action="edit-auto-forward"] .fa-toggle-on');
    I.click('Auto forward ...');
    I.waitForElement('.modal-dialog');
    I.seeCheckboxIsChecked('Keep a copy of the message');
    I.click('Cancel', '.modal-dialog');
    I.waitForInvisible('.modal-dialog');

    I.logout();
});
