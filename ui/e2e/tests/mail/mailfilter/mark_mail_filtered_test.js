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

Scenario('[C7808] -Mark Mail- filtered mail', async function ({ I, users, mail, mailfilter }) {

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('Testcase C7808');

    mailfilter.addCondition('Subject', 'Testcase C7808');
    mailfilter.setFlag('Blue');
    mailfilter.save();

    I.openApp('Mail');

    // compose mail
    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Testcase C7808');
    I.fillField({ css: 'textarea.plain-text' }, 'lorem ipsum');
    I.seeInField({ css: 'textarea.plain-text' }, 'lorem ipsum');

    I.click('Send');

    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement('.vsplit .flag_2', 30);
});
