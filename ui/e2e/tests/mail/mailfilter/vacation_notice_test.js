/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../../steps.d.ts" />
const moment = require('moment');

Feature('Mailfilter > Vacation notice');

Before(async function ({ users }) {
    await users.create();
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7785] Set vacation notice', async function ({ I, users, mail, dialogs }) {
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    }, { user: users[1] });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail');
    I.waitForVisible('.rightside .io-ox-mail-settings');
    I.see('Mail', '.rightside h1');

    I.waitForVisible('.form-group.buttons [data-action="edit-vacation-notice"]');
    I.click('Vacation notice ...', '.form-group.buttons [data-action="edit-vacation-notice"]');
    dialogs.waitForVisible();

    // check for all expexted elements
    I.seeElement('.modal-header input[name="active"]');

    // buttons
    I.see('Cancel', '.modal-footer');
    I.see('Apply changes', '.modal-footer');

    // form elements
    I.seeElement('.modal input[name="activateTimeFrame"][disabled]');
    I.seeElement('.modal input[name="dateFrom"][disabled]');
    I.seeElement('.modal input[name="dateUntil"][disabled]');
    I.seeElement('.modal input[name="subject"][disabled]');
    I.seeElement('.modal textarea[name="text"][disabled]');
    I.see('Show advanced options');

    // enable
    I.click('.checkbox.switch.large', dialogs.locators.header);


    I.seeElement('.modal input[name="activateTimeFrame"]:not([disabled])');
    I.seeElement('.modal input[name="subject"]:not([disabled])');
    I.seeElement('.modal textarea[name="text"]:not([disabled])');

    I.fillField('.modal input[name="subject"]', 'Vacation subject');
    I.fillField('.modal textarea[name="text"]', 'Vacation text');

    dialogs.clickButton('Apply changes');

    I.see('Vacation notice ...', '.settings-detail-pane [data-action="edit-vacation-notice"]');

    I.waitForElement('.settings-detail-pane [data-action="edit-vacation-notice"] .fa-toggle-on');
    I.waitForDetached('.modal-dialog');

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    mail.waitForApp();

    // compose mail for user 0
    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    mail.send();
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);

    I.logout();

    I.login('app=io.ox/mail', { user: users[0] });
    mail.waitForApp();

    // check for mail
    I.waitForVisible('.io-ox-mail-window .leftside ul li.unread');
    I.click('.io-ox-mail-window .leftside ul li.unread');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Test subject', '.mail-detail-pane');

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    mail.waitForApp();

    // check for vacation notice
    I.waitForVisible('.io-ox-mail-window .leftside ul li.unread');
    I.click('.io-ox-mail-window .leftside ul li.unread');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Vacation subject', '.mail-detail-pane');

});

Scenario('[C163027] User gets notified if a vacation notice is avtive (banner in inbox)', async function ({ I, users }) {
    let [user] = users;

    I.haveMailFilterRule({
        rulename: 'vacation notice',
        active: true,
        flags: ['vacation'],
        test: { 'id': 'true' },
        actioncmds: [
            { days: '7', subject: 'Test Subject', text: 'Test Text', id: 'vacation', addresses: [user.get('primaryEmail')] }
        ]
    });

    I.login('app=io.ox/mail');
    I.waitForElement('.window-body .leftside .alert');
    I.see('Your vacation notice is active', '.window-body .leftside .alert');
});

Scenario('[C110281] Vacation notice is time zone capable', async function ({ I, users, mail, dialogs }) {

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' },
        'io.ox/core': { timezone: 'Europe/London' }
    }, { user: users[0] });
    await I.haveSetting({
        'io.ox/core': { timezone: 'Pacific/Kiritimati' }
    }, { user: users[1] });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail', { user: users[1] });
    I.waitForVisible('.rightside .io-ox-mail-settings');
    I.see('Mail', '.rightside h1');

    I.waitForVisible('.form-group.buttons [data-action="edit-vacation-notice"]');
    I.click('Vacation notice ...', '.form-group.buttons [data-action="edit-vacation-notice"]');
    dialogs.waitForVisible();

    // enable
    I.click('.modal-header .checkbox.switch.large', dialogs.locators.header);

    I.fillField('.modal input[name="subject"]', 'Vacation subject');
    I.fillField('.modal textarea[name="text"]', 'Vacation text');

    I.checkOption('Send vacation notice during this time only');
    dialogs.clickButton('Apply changes');

    I.see('Vacation notice ...', '.form-group.buttons [data-action="edit-vacation-notice"]');

    I.waitForElement('.form-group.buttons [data-action="edit-vacation-notice"] .fa-toggle-on');
    I.waitForDetached('.modal-dialog');

    I.logout();

    I.login('app=io.ox/mail', { user: users[0] });
    mail.waitForApp();

    // compose mail for user 1
    mail.newMail();
    I.fillField('To', users[1].get('primaryEmail'));
    I.fillField('Subject', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    mail.send();

    // check for mail
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);

    I.waitForVisible('.io-ox-mail-window .leftside ul li.unread');
    I.click('.io-ox-mail-window .leftside ul li.unread');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Vacation subject', '.mail-detail-pane');

});

Scenario.skip('[OXUIB-2065] Vacation notice button with vacationDomains setting', async ({ I, mail, users }) => {
    const mxDomain = () => users[0].get('primaryEmail').split('@')[1];
    await users[0].hasConfig('com.openexchange.mail.filter.vacationDomains', `${mxDomain()},example.org`);

    // seems the setting doesn't really have an effect,
    // so we just create a filter rule using API
    // otherwise, it can be created via UI at this point
    await I.haveMailFilterRule({
        rulename: 'Abwesenheitsbenachrichtigung',
        active: true,
        flags: ['vacation'],
        test: {
            id: 'allof',
            tests: [{
                id: 'address',
                comparison: 'is',
                addresspart: 'domain',
                headers: ['from'],
                values: [mxDomain, 'example.com']
            }, {
                id: 'allof',
                tests: [{
                    zone: '+0200',
                    id: 'currentdate',
                    comparison: 'ge',
                    datepart: 'date',
                    datevalue: [moment().subtract(1, 'day').valueOf()]
                }, {
                    zone: '+0200',
                    id: 'currentdate',
                    comparison: 'le',
                    datepart: 'date',
                    datevalue: [moment().add(7, 'days').valueOf()]
                }]
            }]
        },
        actioncmds: [{
            id: 'vacation',
            days: '7',
            addresses: [users[0].get('primaryEmail')],
            subject: 'I am on vacation',
            text: 'Please contact me later'
        }]
    });

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.waitForText('Your vacation notice is active');
    I.openApp('Settings', { folder: 'virtual/settings/io.ox/mail' });

    I.waitForText('Vacation notice ...');
    I.click('Vacation notice ...', '.io-ox-mail-settings');

    const nextWeekStart = moment().utc().add(7, 'days').startOf('week');
    const yesterday = moment().utc().subtract(1, 'day').startOf('day');

    I.waitForText('Send vacation notice during this time only');
    I.checkOption('Send vacation notice during this time only');
    I.dontSee('3 days');
    I.fillField('Start', yesterday.format('l'));
    I.pressKey('Enter');
    I.fillField('End', yesterday.clone().add(3, 'days').startOf('day').format('l'));
    I.pressKey('Enter');
    const diffDays = Math.round(yesterday.clone().add(3, 'days').endOf('day').diff(yesterday) / 1000 / 60 / 60 / 24);
    I.see(`${diffDays} days`);
    I.click('Apply changes');
    I.waitForDetached('.modal');

    I.openApp('Mail');
    // TODO: there is something wrong with event handling here,
    // so we need to refresh the page to get the correct state
    I.refreshPage();

    I.waitForText('Your vacation notice is active');
    I.click('Your vacation notice is active');
    I.waitForText(`${diffDays} days`);

    I.fillField('Start', nextWeekStart.format('l'));
    I.pressKey('Enter');
    I.fillField('End', nextWeekStart.clone().add(2, 'days').format('l'));
    I.pressKey('Enter');
    I.see('3 days');
    I.click('Apply changes');

    I.dontSee('You vacation notice is active');
});
