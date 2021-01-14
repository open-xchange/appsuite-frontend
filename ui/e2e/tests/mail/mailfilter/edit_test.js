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

Scenario('[C7790] Edit filter rule @contentReview', async function ({ I, users, dialogs }) {
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

    I.login('app=io.ox/settings', { user: users[0] });
    I.waitForVisible('.io-ox-settings-main');
    I.selectFolder('Mail');
    I.waitForVisible('.rightside h1');

    // open mailfilter settings
    I.selectFolder('Filter Rules');

    // checks the h1
    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1');
    I.see('Mail Filter Rules');
    I.click('Edit', '.settings-list-view');
    dialogs.waitForVisible();

    // edit filter
    I.fillField('rulename', 'Redirect mails with subject something that matters to ' + users[1].get('primaryEmail'));
    I.fillField('values', 'something that matters');
    I.fillField('to', users[1].get('primaryEmail'));

    // save rule
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]');
    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });

    // compose first mail for user 0
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    I.click('Send');

    // compose second mail for user 0
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'something that matters');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    I.click('Send');

    I.waitForElement('~Sent, 2 total. Right click for more options.');
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.');

    I.logout();

    I.login('app=io.ox/mail', { user: users[2] });

    // check for mail
    I.waitForElement('~Inbox');
});
