/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

Feature('Mailfilter');

Before(async function ({ users }) {
    await users.create();
    await users.create();
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7789] Delete filter rule @contentReview', async function ({ I, users, dialogs }) {
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    }, { user: users[1] });

    I.haveMailFilterRule({
        rulename: 'Redirect mails with subject Test subject to ' + users[2].get('primaryEmail'),
        active: true,
        flags: [],
        test: {
            id: 'subject',
            headers: 'Subject',
            comparison: 'contains',
            values: ['Test subject']
        },
        actioncmds: [{
            id: 'redirect',
            to: users[2].get('primaryEmail')
        }]
    }, { user: users[0] });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');
    I.waitForVisible('.settings-detail-pane .io-ox-mailfilter-settings h1');
    I.see('Mail Filter Rules');

    I.click('.settings-list-view [title="Remove Redirect mails with subject Test subject to ' + users[2].get('primaryEmail') + '"]');
    dialogs.waitForVisible();
    I.waitForText('Do you really want to delete this filter rule?', 5, dialogs.locators.body);
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');
    I.see('There is no rule defined');

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });

    // compose mail for user 0
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    I.click('Send');
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);

    I.logout();

    I.login('app=io.ox/mail', { user: users[2] });

    // check for mail
    I.waitForElement('~Inbox');
});
