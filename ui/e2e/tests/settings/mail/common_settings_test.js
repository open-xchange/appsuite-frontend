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

Scenario('[C7779] Mail formatting @shaky', async function (I, users) {

    const [user] = users;

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/compose']);


    I.retry(5).checkOption(locate('label').withText('Plain text'));
    I.seeCheckboxIsChecked('[name="messageFormat"][value="text"]');

    I.openApp('Mail');

    I.retry(5).click('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text');

    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject');
    I.fillField('.io-ox-mail-compose textarea.plain-text', 'Testcontent');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');

    I.retry(10).click(locate('span').withText('Testsubject'));

    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.see('Testcontent');
        I.dontSeeElement(locate('strong').withText('Testcontent'));
    });

    // switch back to settings
    I.click('#io-ox-topbar-dropdown-icon');
    I.waitForVisible('#topbar-settings-dropdown');
    I.click('Settings');

    I.retry(5).checkOption(locate('label').withText('HTML'));
    I.seeCheckboxIsChecked('[name="messageFormat"][value="html"]');

    I.openApp('Mail');
    I.retry(5).click('Compose');

    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject2');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.appendField('body', 'Testcontent2');
        I.pressKey(['Control', 'a']);
    });
    I.click('.mce-i-bold');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');

    I.retry(10).click(locate('span').withText('Testsubject2'));

    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.seeElement(locate('strong').withText('Testcontent2'));
    });

    // switch back to settings
    I.click('#io-ox-topbar-dropdown-icon');
    I.waitForVisible('#topbar-settings-dropdown');
    I.click('Settings');

    I.retry(5).checkOption(locate('label').withText('HTML and plain text'));
    I.seeCheckboxIsChecked('[name="messageFormat"][value="alternative"]');

    I.openApp('Mail');
    I.retry(5).click('Compose');

    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject3');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.appendField('body', 'Testcontent3');
        I.pressKey(['Control', 'a']);
    });
    I.click('.mce-i-bold');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');

    I.retry(10).click(locate('span').withText('Testsubject3'));

    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.seeElement(locate('strong').withText('Testcontent3'));
    });

});
