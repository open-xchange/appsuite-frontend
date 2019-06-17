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

    let waitForMail = async (subject, timeout = 60, retries = 10) => {
        let mailCount = await I.grabNumberOfVisibleElements(locate('span').withText(subject)),
            remaining = retries;

        I.say(`Trying to get the mail with subject "${subject}"`);
        while (mailCount < 1) {
            if (remaining > 0) {
                I.say(`Try ${retries - remaining + 1} of ${retries}`);
                I.waitForElement('#io-ox-refresh-icon', 5, '.taskbar');
                I.click('#io-ox-refresh-icon', '.taskbar');
                I.waitForElement('.launcher .fa-spin-paused', 5);
                I.say(`No mail(s) found. Waiting ${timeout} seconds ...`);
                I.wait(timeout);
                mailCount = await I.grabNumberOfVisibleElements(locate('.list-view .subject').withText(subject));
                remaining--;
            } else {
                I.say('Timeout exceeded. No mails found.');
                break;
            }
        }
    };

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/compose']);
    I.waitForText('Mail Compose');
    I.checkOption('Plain text');
    I.seeCheckboxIsChecked('[name="messageFormat"][value="text"]');

    I.openApp('Mail');

    I.retry(5).click('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text');

    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject');
    I.fillField('.io-ox-mail-compose textarea.plain-text', 'Testcontent');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');

    await waitForMail('Testsubject', 10, 60);
    I.waitForText('Testsubject', undefined, '.list-view .subject');
    I.click('Testsubject', '.list-view .subject');

    I.waitForText('Testsubject', 'h1.subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.see('Testcontent');
        I.dontSeeElement(locate('strong').withText('Testcontent'));
    });

    // switch back to settings
    I.click('#io-ox-topbar-dropdown-icon');
    I.waitForVisible('#topbar-settings-dropdown');
    I.click('Settings');

    I.checkOption('HTML');
    I.seeCheckboxIsChecked('[name="messageFormat"][value="html"]');

    I.openApp('Mail');
    I.retry(5).click('Compose');

    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.wait(0.5);
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject2');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.appendField('body', 'Testcontent2');
        I.pressKey(['Control', 'a']);
    });
    I.click('.mce-i-bold');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');

    await waitForMail('Testsubject2', 10, 60);
    I.waitForText('Testsubject2', undefined, '.list-view .subject');
    I.click('Testsubject2', '.list-view .subject');

    I.waitForText('Testsubject2', 'h1.subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.seeElement(locate('strong').withText('Testcontent2'));
    });

    // switch back to settings
    I.click('#io-ox-topbar-dropdown-icon');
    I.waitForVisible('#topbar-settings-dropdown');
    I.click('Settings');

    I.checkOption('HTML and plain text');
    I.seeCheckboxIsChecked('[name="messageFormat"][value="alternative"]');

    I.openApp('Mail');
    I.retry(5).click('Compose');

    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.wait(0.5);
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject3');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.appendField('body', 'Testcontent3');
        I.pressKey(['Control', 'a']);
    });
    I.click('.mce-i-bold');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');

    await waitForMail('Testsubject3', 10, 60);
    I.waitForText('Testsubject3', undefined, '.list-view .subject');
    I.click('Testsubject3', '.list-view .subject');

    I.waitForText('Testsubject3', 'h1.subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.seeElement(locate('strong').withText('Testcontent3'));
    });

});
