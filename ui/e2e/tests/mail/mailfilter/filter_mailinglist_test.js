/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2020 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Christoph Kopp <christoph.kopp@open-xchange.com>
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mailfilter');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7799] Filter mail on mailing list', async ({ I, users, mail, mailfilter }) => {

    const user = users[0];

    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'e2e/media/mails/c7799.eml'
    }, { user });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0383');
    mailfilter.addCondition('Mailing list', 'open-xchange');
    mailfilter.setFlag('Red');

    // save the form
    I.click('Save and apply rule now');

    I.waitForText('Please select the folder to apply the rule to');
    I.waitForVisible('li.selected[data-id="default0/INBOX"]');
    I.click('Apply filter rule', '.modal-dialog');

    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');

    I.openApp('Mail');
    mail.waitForApp();

    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement('.vsplit .flag_1', 30);

});
