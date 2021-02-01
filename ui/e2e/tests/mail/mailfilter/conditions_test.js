/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2019 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Christoph Kopp <christoph.kopp@open-xchange.com>
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mailfilter');

Before(async function ({ users }) {
    await Promise.all([
        users.create(),
        users.create()
    ]);
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7792] Filter mail on sender', async ({ I, users, mail, mailfilter }) => {
    const [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0368');
    mailfilter.addCondition('From', user.get('primaryEmail'));
    mailfilter.setFlag('Blue');
    mailfilter.save();

    I.openApp('Mail');
    mail.waitForApp();
    // compose mail
    mail.newMail();

    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0368');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    mail.send();
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement('.vsplit .flag_2', 30);

});

Scenario('[C7793] Filter mail on any recipient', async function ({ I, users, mail, mailfilter }) {
    const [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0369');
    mailfilter.addCondition('Any recipient', user.get('primaryEmail'));
    mailfilter.setFlag('Red');
    mailfilter.save();

    I.openApp('Mail');
    mail.waitForApp();

    // compose mail
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0369');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    mail.send();
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement('.vsplit .flag_1', 30);

});

Scenario('[C7794] Filter mail on to-field', async function ({ I, users, mail, mailfilter }) {
    const [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0373');
    mailfilter.addCondition('To', user.get('primaryEmail'));
    mailfilter.setFlag('Red');
    mailfilter.save();

    I.openApp('Mail');
    mail.waitForApp();

    // compose mail
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0373');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    mail.send();
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement('.vsplit .flag_1', 30);

});

Scenario('[C7795] Filter mail on subject', async function ({ I, users, mail, mailfilter }) {
    const [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0374');
    mailfilter.addCondition('Subject', 'TestCase0374');
    mailfilter.setFlag('Red');
    mailfilter.save();

    I.openApp('Mail');
    mail.waitForApp();

    // compose mail
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0374');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    mail.send();
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement('.vsplit .flag_1', 30);
});

Scenario('[C7796] Filter mail on cc-field', async function ({ I, users, mail, mailfilter }) {
    const [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0375');
    mailfilter.addCondition('Cc', user.get('primaryEmail'));
    mailfilter.setFlag('Red');
    mailfilter.save();

    I.openApp('Mail');
    mail.waitForApp();

    // compose mail
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.click('CC');
    I.fillField('.io-ox-mail-compose div[data-extension-id="cc"] input.tt-input', user.get('primaryEmail'));

    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0375');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    mail.send();
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement('.vsplit .flag_1', 30);
});

Scenario('[C7797] Filter mail on header', async function ({ I, users, mail, mailfilter }) {
    const [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0381');
    mailfilter.addCondition('Header', user.get('primaryEmail'));

    I.click('Matches');
    I.waitForVisible('.open.dropdownlink');
    I.click('Contains');
    I.fillField('headers', 'Delivered-To');

    mailfilter.setFlag('Red');
    mailfilter.save();

    I.openApp('Mail');
    mail.waitForApp();

    // compose mail
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));

    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0381');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    mail.send();
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement('.vsplit .flag_1', 30);
});

Scenario('[C7800] Filter mail on envelope', async function ({ I, users, mail, mailfilter }) {
    const [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0384');
    mailfilter.addCondition('Envelope', user.get('primaryEmail'));

    I.click('Is exactly');
    I.waitForVisible('.open.dropdownlink');
    I.click('Contains');

    mailfilter.setFlag('Red');
    mailfilter.save();

    I.openApp('Mail');
    mail.waitForApp();

    // compose mail
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].get('primaryEmail'));
    I.click('BCC');
    I.fillField('.io-ox-mail-compose div[data-extension-id="bcc"] input.tt-input', users[0].get('primaryEmail'));

    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0384');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    mail.send();
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement('.vsplit .flag_1', 30);
});
