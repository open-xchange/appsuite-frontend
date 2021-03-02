/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Mail > Search');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C8408] Try to run a script in search', async function ({ I, mail, search }) {
    I.login();
    mail.waitForApp();
    I.click(search.locators.box);
    I.waitForVisible(search.locators.field);

    I.fillField(search.locators.field, '<script>document.body.innerHTML=\'I am a hacker\'</script>');
    I.waitForElement('.tt-suggestions');
    I.pressKey('Enter');

    I.wait(1);
    expect(await I.grabHTMLFrom({ xpath: '//body' })).to.not.equal('I am a hacker');
});

Scenario('Supports delayed autoselect', async function ({ I, mail, search }) {

    I.login('app=io.ox/mail');
    mail.waitForApp();
    var query = 'my-input';

    I.say('enter query');
    I.click(search.locators.box);
    I.waitForVisible(search.locators.field);
    I.fillField(search.locators.field, query);

    I.dontSeeElement('.autocomplete-item');
    I.pressKey('Enter');

    I.say('check created token');
    I.waitForText(query, 2, '.token-label');
});

Scenario('Disable cache for search results (OXUIB-252)', async ({ I, search, mail }) => {

    // Precondition: Some emails are in the inbox- and in a subfolder and have the subject "test".
    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/c8402_1.eml' });

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.waitForVisible(search.locators.box);

    // when cached an event wouldn't be triggered that lists 'Select all messages' in dropdown
    ['cold-cache', 'second-run'].forEach(function (state) {
        I.say(state);
        search.doSearch('test');
        I.retry(5).clickToolbar('All');
        I.waitForText('Select all messages');
        I.click('Select all messages');
        search.cancel();
        mail.selectMail('test');
    });
});
