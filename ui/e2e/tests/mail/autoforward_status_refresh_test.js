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

Scenario('checks if an auto forward rule is correctly listed after a status update', function ({ I, dialogs }) {

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
    I.click('.checkbox.switch.large', dialogs.locators.header);
    dialogs.clickButton('Apply changes');
    I.waitForDetached('.modal-dialog');

    I.selectFolder('Filter Rules');
    I.waitForElement('.io-ox-settings-window .io-ox-mailfilter-settings');
    I.waitForElement('.io-ox-mailfilter-settings .settings-list-item.disabled');
});

Scenario('checks if an avacation notice rule is correctly listed after a status update', function ({ I, users, dialogs }) {
    let [user] = users;

    I.haveMailFilterRule({
        'active': true,
        'actioncmds': [
            { 'days': '7', 'subject': 'test', 'text': 'test', 'id': 'vacation', 'addresses': [user.userdata.primaryEmail] }
        ],
        'test': { 'id': true },
        'flags': ['vacation'],
        'rulename': 'vacation notice'
    });

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.waitForElement({ css: '[data-id="virtual/settings/io.ox/mail"]' });

    I.selectFolder('Mail');
    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForVisible({ css: '[data-action="edit-vacation-notice"] .fa-toggle-on' });

    I.click('Vacation notice ...');

    dialogs.waitForVisible();
    I.click('.checkbox.switch.large', dialogs.locators.header);
    dialogs.clickButton('Apply changes');
    I.waitForDetached('.modal-dialog');

    I.selectFolder('Filter Rules');
    I.waitForElement('.io-ox-settings-window .io-ox-mailfilter-settings');
    I.waitForElement('.io-ox-mailfilter-settings .settings-list-item.disabled');
});
