/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Anne Matthes <anne.matthes@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />
Feature('Chat > Appearance');

Before(async ({ users }) => {
    await users.create();
    await users[0].context.hasCapability('chat');
});

After(async ({ users }) => {
    await users[0].context.doesntHaveCapability('chat');
    await users.removeAll();
});

Scenario('Open, close and toggle chat', ({ I, chat }) => {
    I.login();
    chat.openChat();
    I.waitForElement('.io-ox-windowmanager-sticky-panel .ox-chat');
    I.waitForText('New Chat', 3, '.io-ox-windowmanager-sticky-panel .ox-chat');

    I.click('~Chat', '#io-ox-toprightbar');
    I.dontSee('New Chat');

    I.click('~Chat', '#io-ox-toprightbar');
    I.see('New Chat', '.io-ox-windowmanager-sticky-panel .ox-chat');

    I.click('~Detach window');
    I.see('OX Chat', '.floating-window');

    I.click('~Chat', '#io-ox-toprightbar');
    I.waitForDetached('OX Chat', 3, '.floating-window');

});
