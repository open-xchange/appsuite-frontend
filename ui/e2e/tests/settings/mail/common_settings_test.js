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

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C7779] Mail formatting', async function (I, users) {

    const [user] = users;

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/compose']);
    I.waitForText('Mail Compose');
    I.checkOption('Plain text');
    I.seeCheckboxIsChecked('[name="messageFormat"][value="text"]');

    I.openApp('Mail');

    I.retry(5).clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text');

    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject');
    I.fillField('.io-ox-mail-compose textarea.plain-text', 'Testcontent');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');

    I.waitForText('Testsubject', 600, '.list-view .subject');
    I.click('Testsubject', '.list-view .subject');

    I.waitForText('Testsubject', 'h1.subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.see('Testcontent');
        I.dontSeeElement(locate('strong').withText('Testcontent'));
    });

    // switch back to settings
    I.click('~Settings', '#io-ox-settings-topbar-icon');

    I.checkOption('HTML');
    I.seeCheckboxIsChecked('[name="messageFormat"][value="html"]');

    I.openApp('Mail');
    I.retry(5).clickToolbar('Compose');

    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.waitForFocus('[placeholder="To"]');
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject2');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.appendField('body', 'Testcontent2');
        I.pressKey(['Control', 'a']);
    });
    I.click('.mce-i-bold');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');

    I.waitForText('Testsubject2', 600, '.list-view .subject');
    I.click('Testsubject2', '.list-view .subject');

    I.waitForText('Testsubject2', 'h1.subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.seeElement(locate('strong').withText('Testcontent2'));
    });

    // switch back to settings
    I.click('~Settings', '#io-ox-settings-topbar-icon');

    I.checkOption('HTML and plain text');
    I.seeCheckboxIsChecked('[name="messageFormat"][value="alternative"]');

    I.openApp('Mail');
    I.retry(5).clickToolbar('Compose');

    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.waitForFocus('[placeholder="To"]');
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject3');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.appendField('body', 'Testcontent3');
        I.pressKey(['Control', 'a']);
    });
    I.click('.mce-i-bold');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');

    I.waitForText('Testsubject3', 600, '.list-view .subject');
    I.click('Testsubject3', '.list-view .subject');

    I.waitForText('Testsubject3', 'h1.subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.seeElement(locate('strong').withText('Testcontent3'));
    });

});
