/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Ejaz Ahmed <ejaz.ahmed@open-xchange.com>
 *
 */
/// <reference path="../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Search > General');

Before(async (users) => {
    await users.create();
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('Handles options properly', async function (I, mail, search) {

    const FOLDER1 = 'Inbox';
    const FOLDER2 = 'Trash';

    I.login('app=io.ox/mail');
    mail.waitForApp();

    // inital: current folder as initial value
    search.waitForWidget();
    I.click(search.locators.options);
    I.waitForVisible(search.locators.dropdown);
    I.see(FOLDER1);
    I.pressKey('Enter');
    I.pressKey(['Shift', 'Tab']);

    // set
    search.waitForWidget();
    search.option('Folder', FOLDER2);
    I.wait(0.5);
    I.seeElement('.search-field.focus');

    // check
    I.click(search.locators.options);
    I.waitForVisible(search.locators.dropdown);
    I.see(FOLDER2);
    I.pressKey('Enter');
    I.pressKey(['Shift', 'Tab']);

    // exit (smart-cancel) and check again for initial value
    I.click(FOLDER1, '.folder-tree');
    I.dontSeeElement('io-ox-find.active');
    search.waitForWidget();
    I.click(search.locators.options);
    I.waitForVisible(search.locators.dropdown);
    I.see(FOLDER1);
});

Scenario('Supports smart-exit', async function (I, mail, search) {

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.seeElement('.io-ox-find.initial');

    // load
    I.say('load');
    search.waitForWidget();
    I.seeElement('.io-ox-find.loaded');

    // open options dropdown
    I.say('open options dropdown');
    I.click(search.locators.options);
    I.waitForVisible(search.locators.dropdown);
    I.seeElement('.io-ox-find.active');

    // exit via cancel
    I.say('exit via cancel');
    search.cancel();
    I.dontSeeElement('.io-ox-find.active');

    // exit via 'focusout' (keyboard)
    I.say('exit via \'focusout\' (keyboard)');
    search.waitForWidget();
    I.pressKey(['Shift', 'Tab']);
    I.wait(0.5);
    I.dontSeeElement('.io-ox-find.active');

    // exit via 'focusout' (mouse)
    I.say('exit via \'focusout\' (mouse)');
    search.waitForWidget();
    I.click('Inbox', '.folder-tree');
    I.wait(0.5);
    I.dontSeeElement('.io-ox-find.active');
});

Scenario('Supports delayed autoselect', async function (I, mail, search) {

    const query = 'my-input';
    I.login('app=io.ox/mail');
    mail.waitForApp();
    search.waitForWidget();

    I.retry(5).fillField(search.locators.field, query);
    I.dontSeeElement('.autocomplete-item');
    I.pressKey('Enter');

    I.say('check created token');
    I.waitForText(query, 2, '.token-label');
});

Scenario('Disable cache for search results (OXUIB-252)', async (I, users, search, mail) => {

    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/c8402_1.eml' });

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.waitForVisible(search.locators.box);

    // when cached an event wouldn't be triggered that lists 'Select all messages' in dropdown
    ['cold-cache', 'second-run'].forEach(function (state) {
        I.say(state);
        search.waitForWidget();
        search.doSearch('test');
        I.retry(5).clickToolbar('All');
        I.waitForText('Select all messages');
        I.click('Select all messages');
        search.cancel();
        mail.selectMail('test');
    });
});

Scenario('[C8408] Try to run a script in search', async function (I, mail, search) {
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
