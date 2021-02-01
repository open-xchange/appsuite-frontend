/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */


/// <reference path="../../../steps.d.ts" />

Feature('Settings > Mail');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

// TODO: shaky, failed at least once (10 runs on 2019-11-28)
Scenario.skip('[C7779] Mail formatting', async function ({ I, users, mail }) {

    const [user] = users;

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/compose']);
    I.waitForText('Mail Compose');
    I.checkOption('Plain text');
    I.seeCheckboxIsChecked('[name="messageFormat"][value="text"]');

    I.openApp('Mail');

    mail.newMail();

    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject');
    I.fillField('.io-ox-mail-compose textarea.plain-text', 'Testcontent');

    mail.send();

    I.wait(0.5); // wait for mail to arrive
    I.triggerRefresh();
    I.waitForText('Testsubject', 600, '.list-view');
    mail.selectMail('Testsubject');

    I.waitForText('Testsubject', 20, 'h1.subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.see('Testcontent');
        I.dontSeeElement(locate('strong').withText('Testcontent'));
    });

    I.openApp('Settings');

    I.checkOption('HTML');
    I.seeCheckboxIsChecked('[name="messageFormat"][value="html"]');

    I.openApp('Mail');

    mail.newMail();
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject2');
    I.click('.mce-i-bold');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.appendField('body', 'Testcontent2');
    });

    mail.send();

    I.wait(0.5); // wait for mail to arrive
    I.triggerRefresh();
    I.waitForText('Testsubject2', 600, '.list-view');
    mail.selectMail('Testsubject2');
    I.waitForText('Testsubject2', 20, 'h1.subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.seeElement(locate('strong').withText('Testcontent2'));
    });

    I.openApp('Settings');

    I.checkOption('HTML and plain text');
    I.seeCheckboxIsChecked('[name="messageFormat"][value="alternative"]');

    I.openApp('Mail');
    mail.newMail();

    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject3');
    I.click('.mce-i-bold');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.appendField('body', 'Testcontent3');
    });

    mail.send();

    I.wait(0.5); // wait for mail to arrive
    I.triggerRefresh();
    I.waitForText('Testsubject3', 600, '.list-view');
    mail.selectMail('Testsubject3');

    I.waitForText('Testsubject3', 20, 'h1.subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.seeElement(locate('strong').withText('Testcontent3'));
    });
});
