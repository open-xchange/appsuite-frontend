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

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C7799] Filter mail on mailing list', async (I, users, mail) => {

    const user = users[0];

    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'e2e/media/mails/c7799.eml'
    }, { user });

    function createFilterRule(I, name, condition, value, flag) {
        I.login('app=io.ox/settings');
        I.waitForVisible('.io-ox-settings-main');
        I.waitForElement({ css: 'li .folder[data-id="virtual/settings/io.ox/mail"]>.folder-node' });
        I.selectFolder('Mail');
        I.waitForVisible('.rightside h1');

        // open mailfilter settings
        I.selectFolder('Filter Rules');

        // checks the h1 and the empty message
        I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1');
        I.see('Mail Filter Rules');

        I.see('There is no rule defined');

        // create a test rule and check the inintial display
        I.click('Add new rule');
        I.waitForText('Create new rule');
        I.see('This rule applies to all messages. Please add a condition to restrict this rule to specific messages.');
        I.see('Please define at least one action.');

        I.fillField('rulename', name);

        // add condition
        I.click('Add condition');
        I.click(condition);
        I.fillField('values', value);

        // add action
        I.click('Add action');
        I.click('Set color flag');
        I.click('.actions .dropdown-toggle');
        I.waitForVisible('.flag-dropdown');
        I.click(flag, '.flag-dropdown');
    }

    createFilterRule(I, 'TestCase0383', 'Mailing list', 'open-xchange', 'Red');
    // save the form
    I.click('Save and apply');

    I.waitForText('Select the folder to apply the rule to');
    I.waitForVisible('li.selected[data-id="default0/INBOX"]');
    I.click('Apply', '.modal-dialog');

    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');

    I.openApp('Mail');
    mail.waitForApp();

    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement('.vsplit .flag_1', 30);

});
