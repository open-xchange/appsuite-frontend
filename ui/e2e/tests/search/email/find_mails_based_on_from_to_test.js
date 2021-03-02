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

Feature('Mail > Search');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C8404] Find mails based on from/to', async ({ I, users }) => {

    const USER = users[0];
    const INBOX = 'default0/INBOX';

    await I.haveMail({
        folder: INBOX,
        path: 'e2e/media/mails/c8404_1.eml'
    }, { USER });

    await I.haveMail({
        folder: INBOX,
        path: 'e2e/media/mails/c8404_2.eml'
    }, { USER });

    // 1. Start a new search in mail

    I.login('app=io.ox/mail');
    I.waitForVisible('.search-box');

    // 2. Click into the input field.

    I.click('.search-box');

    // 3. Start typing some user name

    I.fillField('.search-box input', 'john@doe.com');
    I.waitForText('john@doe.com', 5, '.contacts');
    I.click('john@doe.com', '.contacts');

    // 4. Select a user by clicking it or hit "Enter"

    I.pressKey('Enter');

    I.waitForText('John Doe', 5, '.list-view');
    I.waitForText('Mail#2', 5, '.list-view');
    I.waitForText('Duis autem vel eum', 5, '.list-view');

    I.dontSee('Jane Doe', '.list-view');
    I.dontSee('Mail#1', '.list-view');
    I.dontSee('Lorem ipsum', '.list-view');

    I.click('john@doe.com');
    I.waitForVisible('.smart-dropdown-container');

    I.click('To');

    I.waitForText('Jane Doe', 5, '.list-view');
    I.waitForText('Mail#1', 5, '.list-view');
    I.waitForText('Lorem ipsum', 5, '.list-view');

    I.dontSee('John Doe', '.list-view');
    I.dontSee('Mail#2', '.list-view');
    I.dontSee('Duis autem vel eum', '.list-view');

    I.click('john@doe.com');
    I.waitForVisible('.smart-dropdown-container');
    I.click('From/To');

    I.waitForText('John Doe', 5, '.list-view');
    I.waitForText('Mail#2', 5, '.list-view');
    I.waitForText('Duis autem vel eum', 5, '.list-view');

    I.waitForText('Jane Doe', 5, '.list-view');
    I.waitForText('Mail#1', 5, '.list-view');
    I.waitForText('Lorem ipsum', 5, '.list-view');

});
