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

Feature('Mail > Search');

Before(async (users) => {
    await users.create();
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});
const searchField = '.search-box input[type=search]';

function getTestMail(from, to, opt) {
    opt = opt || {};
    return {
        attachments: [{
            content: opt.content,
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[from.get('displayname'), from.get('primaryEmail')]],
        sendtype: 0,
        subject: opt.subject,
        to: [[to.get('displayname'), to.get('primaryEmail')]],
        folder_id: opt.folder,
        flags: opt.flags
    };
}

Scenario('Supports delayed autoselect', async function (I, mail, search) {

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

Scenario('[C8407] Perform a multi search', async function (I, users) {
    const [user1, user2] = users;

    await I.haveMail(getTestMail(user1, user2, {
        subject: 'test 123',
        content: ''
    }));
    await I.haveMail(getTestMail(user1, user2, {
        subject: 'test',
        content: ''
    }));
    //let searchField = 'input[type=search]';

    I.login('app=io.ox/mail', { user: user2 });

    I.waitForVisible('.search-box');
    I.click('.search-box');
    I.waitForFocus(searchField);
    I.fillField(searchField, 'test');
    I.pressKey('Enter');
    I.waitForVisible('.list-view [data-index="0"]');
    I.waitForVisible('.list-view [data-index="1"]');
    I.waitForElement('.token span[title="test"] + a');
    I.fillField(searchField, '123');
    I.pressKey('Enter');
    I.waitForElement('.list-view [data-index="0"]');
    I.waitForInvisible('.list-view [data-index="1"]');
});


Scenario('[C8406] Delete a string from multi search', async function (I, users) {
    const [user1, user2] = users;

    await I.haveMail(getTestMail(user1, user2, {
        subject: 'test 123',
        content: ''
    }));
    await I.haveMail(getTestMail(user1, user2, {
        subject: 'test',
        content: ''
    }));
    //let searchField = 'input[type=search]';

    I.login('app=io.ox/mail', { user: user2 });

    I.waitForVisible('.search-box');
    I.click('.search-box');
    I.waitForFocus(searchField);
    I.fillField(searchField, 'test');
    I.pressKey('Enter');
    I.waitForVisible('.list-view [data-index="0"]');
    I.waitForVisible('.list-view [data-index="1"]');
    I.waitForElement('.token span[title="test"] + a');
    I.fillField(searchField, '123');
    I.pressKey('Enter');
    I.waitForElement('.list-view [data-index="0"]');
    I.waitForInvisible('.list-view [data-index="1"]');
    I.waitForElement('.token span[title="123"] + a');
    I.click('.token span[title="123"] + a');
    I.waitForVisible('.list-view [data-index="0"]');
    I.waitForVisible('.list-view [data-index="1"]');

});

Scenario('[C8408] Try to run a script in search', async function (I) {
    I.login();
    I.waitForElement('.search-box');
    I.click('.search-box');
    I.waitForFocus(searchField);

    I.fillField(searchField, '<script>document.body.innerHTML=\'I am a hacker\'</script>');
    I.waitForElement('.tt-suggestions');
    I.pressKey('Enter');

    I.wait(1);
    expect(await I.grabHTMLFrom({ xpath: '//body' })).to.not.equal('I am a hacker');
});
