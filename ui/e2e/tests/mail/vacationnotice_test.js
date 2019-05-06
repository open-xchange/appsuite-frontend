/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

Feature('Mailfilter > Vacation notice');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('adds and removes a vacation notice', function (I) {
    I.login('app=io.ox/settings');
    I.waitForVisible('.rightside h1');
    I.see('Basic settings', '.rightside h1');

    I.waitForElement('li[data-id="virtual/settings/io.ox/mail"]');
    I.selectFolder('Mail');
    I.waitForVisible('.rightside  .io-ox-mail-settings');
    I.see('Mail', '.rightside h1');

    I.waitForVisible('[data-action="edit-vacation-notice"]');
    I.see('Vacation notice ...', '[data-action="edit-vacation-notice"]');
    I.click('Vacation notice ...', '.form-group.buttons [data-action="edit-vacation-notice"]');
    I.waitForElement('[data-point="io.ox/mail/vacation-notice/edit"]');

    // check for all expexted elements
    I.seeElement('.modal-header input[name="active"]');

    // buttons
    I.see('Cancel', '.modal-footer');
    I.see('Apply changes', '.modal-footer');

    // form elements
    I.seeElement('input[name="activateTimeFrame"][disabled]');
    I.seeElement('input[name="dateFrom"][disabled]');
    I.seeElement('input[name="dateUntil"][disabled]');
    I.seeElement('input[name="subject"][disabled]');
    I.seeElement('textarea[name="text"][disabled]');
    I.see('Show advanced options');

    // enable
    I.click('.modal-header .checkbox.switch.large');


    I.seeElement('input[name="activateTimeFrame"]:not([disabled])');
    I.seeElement('input[name="subject"]:not([disabled])');
    I.seeElement('textarea[name="text"]:not([disabled])');

    I.fillField('input[name="subject"]', 'Subject');
    I.fillField('textarea[name="text"]', 'Text');

    I.click('.modal-footer button[data-action="save"]');

    I.see('Vacation notice ...', '[data-action="edit-vacation-notice"]');

    I.waitForElement('[data-action="edit-vacation-notice"] .fa-toggle-on');
    I.waitForInvisible('[data-point="io.ox/mail/vacation-notice/edit"]');

    // check notification in mail
    I.openApp('Mail');
    I.waitForElement('.window-container.io-ox-mail-window');
    I.waitForElement('a[data-action="edit-vacation-notice"]');
    I.seeElement('a[data-action="edit-vacation-notice"]');
    I.see('Your vacation notice is active', 'a[data-action="edit-vacation-notice"]');

    I.click('a[data-action="edit-vacation-notice"]');
    I.waitForElement('[data-point="io.ox/mail/vacation-notice/edit"]');

    I.seeInField('input[name="subject"]', 'Subject');
    I.seeInField('textarea[name="text"]', 'Text');

    I.seeElement('input[name="dateFrom"][disabled]');
    I.seeElement('input[name="dateUntil"][disabled]');

    I.click('Send vacation notice during this time only');

    I.waitForElement('input[name="dateFrom"]:not([disabled])');
    I.seeElement('input[name="dateFrom"]:not([disabled])');

    I.waitForElement('input[name="dateUntil"]:not([disabled])');
    I.seeElement('input[name="dateUntil"]:not([disabled])');

    I.click('Cancel', '.modal-footer');
});
