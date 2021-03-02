/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

const iframeLocator = '.io-ox-mail-compose-window .editor iframe';

Scenario('[C114967] Draft is created automatically on logout', async function ({ I, mail }) {

    const mailSubject = 'C114967';
    const defaultText = 'Draft is created automatically on logout';

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail');

    mail.newMail();

    // Fill out to and subject
    I.fillField('Subject', mailSubject);

    // Write some text with the default settings
    await within({ frame: iframeLocator }, async () => {
        I.click('.default-style');
        I.fillField({ css: 'body' }, defaultText);
        I.pressKey('Enter');
        I.pressKey('Enter');
    });

    // Let's stick around a bit for sending to finish
    I.wait(1);
    I.logout();

    I.login('app=io.ox/mail');
    mail.waitForApp();

    I.waitForText(mailSubject, 5, '#io-ox-taskbar');
    I.click(mailSubject, '#io-ox-taskbar');
    I.waitForElement(iframeLocator, 10);

    await within({ frame: iframeLocator }, async () => {
        I.waitForText(defaultText, 5, { css: 'body' });
    });
});

Scenario('Did you know dialog is correctly shown on save and close', async function ({ I, mail }) {

    I.login('app=io.ox/mail');

    // save draft and close, click ok
    mail.newMail();

    I.click({ css: '[data-extension-id="composetoolbar-menu"] a' });
    I.waitForText('Save draft and close', 5);
    I.click('Save draft and close');

    I.waitForText('Did you know?', 5);

    I.click('OK');

    I.waitForInvisible('.io-ox-mail-compose', 5);


    // save draft and close check checkbox
    mail.newMail();

    I.click({ css: '[data-extension-id="composetoolbar-menu"] a' });
    I.waitForText('Save draft and close', 5);
    I.click('Save draft and close');

    I.waitForText('Did you know?', 5);

    I.checkOption('Do not show again.');

    I.click('OK');

    I.waitForInvisible('.io-ox-mail-compose', 5);

    // save draft, no "did you know" dialog should pop up
    mail.newMail();

    I.click({ css: '[data-extension-id="composetoolbar-menu"] a' });
    I.waitForText('Save draft and close', 5);
    I.click('Save draft and close');

    I.waitForInvisible('.io-ox-mail-compose', 5);

    // logout or we get problems with the settings not working correctly
    I.logout();

    // should reappear if setting is set
    await I.haveSetting({ 'io.ox/mail': { 'didYouKnow/saveOnCloseDontShowAgain': false } });

    I.login('app=io.ox/mail');

    mail.newMail();

    I.click({ css: '[data-extension-id="composetoolbar-menu"] a' });
    I.waitForText('Save draft and close', 5);
    I.click('Save draft and close');

    I.waitForText('Did you know?', 5);

    I.click('OK');

    I.waitForInvisible('.io-ox-mail-compose', 5);

    // logout or we get problems with the settings not working correctly
    I.logout();

    // should not appear if disabled by server setting
    await I.haveSetting({ 'io.ox/mail': { 'didYouKnow/saveOnCloseDontShowAgain': false, 'didYouKnow/saveOnCloseShow': false } });

    I.login('app=io.ox/mail');

    mail.newMail();

    I.click({ css: '[data-extension-id="composetoolbar-menu"] a' });
    I.waitForText('Save draft and close', 5);
    I.click('Save draft and close');

    I.waitForInvisible('.io-ox-mail-compose', 5);

});

Scenario('[C114959] Draft can be used as templates', async function ({ I, mail, dialogs }) {

    I.login('app=io.ox/mail');

    // save draft and close, click ok
    mail.newMail();

    I.click({ css: '[data-extension-id="composetoolbar-menu"] a' });
    I.waitForText('Save draft and close', 5);
    I.click('Save draft and close');

    I.waitForText('Did you know?', 5);

    I.click('OK');

    I.waitForInvisible('.io-ox-mail-compose', 5);

    //open draft for editing
    I.selectFolder('Drafts');
    I.waitForElement('.list-item.selectable');
    I.click('.list-item.selectable');
    I.click('Edit copy');
    I.waitForVisible('.window-container.io-ox-mail-compose-window');

    //checking some stuff in draft editing window
    I.waitForVisible('.mail-compose-fields [data-extension-id="subject"]', 10);
    //I.waitForValue('.mail-compose-fields [data-extension-id="subject"]','[Copy]');
    I.retry(5).seeInField('Subject', '[Copy]');
    //I.seeInField('Subject','[Copy]');
    I.click(mail.locators.compose.close);

    //waiting for Modal dialog "Discard message" and click on "Save as draft"
    I.waitForText('Discard message', 5, dialogs.locators.header);
    I.click('Save as draft');
    I.waitForInvisible('Discard message', 5, dialogs.locators.header);
    I.waitForInvisible('.window-container.io-ox-mail-compose-window');

    //Check new draft in list view
    I.selectFolder('Drafts');
    I.waitForElement('.list-item.selectable');
    I.waitForElement(locate('.list-item').withText('[Copy]').inside('.list-view'));
});
