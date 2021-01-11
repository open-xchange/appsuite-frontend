/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 */

/// <reference path="../../steps.d.ts" />

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C9999] simple test', async function (I, users) {

    // login and wait for the "Text Portal" app to appear
    const [user] = users;
    I.login('app=io.ox/office/portal/text', { user });
    I.waitForVisible('.io-ox-office-portal-text-window');

    // lick the "Blank text document" button to create a new text document
    I.waitForText('Blank text document');
    I.click('Blank text document');

    // wait for the new browser tab to appear
    I.wait(1);
    I.retry().switchToNextTab();

    // wait for the top navigation bar, and for the text page to be editable
    I.waitForVisible('#io-ox-appcontrol', 10);
    I.waitForVisible('.io-ox-office-text-main .page.edit-mode', 10);

    // type some text into the page, wait for the text to be saved to server
    I.type('This is a test paragraph.', 25);
    I.waitForText('This is a test paragraph.', 1, '.page.edit-mode');
    I.waitForText('All changes saved');

    // close the document, and wait for the "Text Portal" app in the browser tab
    I.click('.group[data-key="app/quit"] a');
    I.waitForVisible('.io-ox-office-portal-text-window', 5);
});
