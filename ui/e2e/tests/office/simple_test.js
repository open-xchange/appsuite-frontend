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

const TEXT1 = 'This is a test paragraph.';
const TEXT2 = ' Bold text.';
const ALLSAVED = 'All changes saved';

Scenario('[C9999] simple test', async function (I, users) {

    // login and wait for the "Text Portal" app to appear
    const [user] = users;
    I.login('app=io.ox/office/portal/text', { user });
    I.waitForVisible('.io-ox-office-portal-text-window');

    // click the "Blank text document" button to create a new text document
    I.waitForText('Blank text document');
    I.click('Blank text document');

    // wait for the new browser tab to appear
    I.wait(1);
    I.retry().switchToNextTab();

    // wait for the top navigation bar, and for the text page to be editable
    I.waitForVisible('#io-ox-appcontrol', 10);
    I.waitForVisible('.io-ox-office-text-main .page.edit-mode', 10);

    // type some text into the page, wait for the text to be saved to server
    I.type(TEXT1, 25);
    I.waitForText(TEXT1, 1, '.page.edit-mode');
    I.waitForText(ALLSAVED);

    // activate the "Format" toolpane, press the "Bold" button
    I.click('.group[data-key="view/toolbars/tab"] a[data-value="format"]');
    I.click('.group[data-key="character/bold"] a');

    // type more text into the page, wait for the text to be saved to server
    I.type(TEXT2, 25);
    I.waitForText(TEXT2, 1, '.page.edit-mode');
    I.waitForText(ALLSAVED);

    // close the document, and wait for the "Text Portal" app in the browser tab
    I.click('.group[data-key="app/quit"] a');
    I.waitForVisible('.io-ox-office-portal-text-window', 5);
});
