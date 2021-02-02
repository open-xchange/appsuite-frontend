/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Tran Dong Tran <tran-dong.tran@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

Feature('ChatAccessibility');

Before(async ({ users }) => {
    await users.create();
    await users.create();
    await users[0].context.hasCapability('chat');
});

After(async ({ users }) => {
    await users.removeAll();
});

async function pressTab(I, times) {
    for (let i = 0; i < times; i++) {
        I.pressKey('Tab');
    }
}

async function pressShiftTab(I, times) {
    I.pressKeyDown('Shift');
    for (let i = 0; i < times; i++) {
        I.pressKey('Tab');
    }
    I.pressKeyUp('Shift');
}

async function checkDropdowns(I, toggleSelector) {
    const toggleLocator = locate(toggleSelector);

    I.waitForFocus(toggleLocator);

    // dropdown 'New chat': open and close
    ['Enter', 'ArrowDown', 'ArrowUp', 'Space'].forEach(function (key) {
        I.pressKey(key);
        I.waitForVisible('.dropdown.open ul');
        I.pressKey('Escape');
        I.waitForInvisible('.dropdown.open ul');
        I.waitForFocus(toggleLocator);
    });

    I.pressKey('Enter');
    const size = await I.grabNumberOfVisibleElements('.dropdown-menu > li > a');

    for (let i = size; i > 0; i--) {
        I.waitForFocus(locate(`.dropdown.open ul li:nth-of-type(${i % size + (size - 1)}) > a`).as(`Dropdown item #${i % size + 1}`));
        I.pressKey('ArrowUp');
    }
    I.pressKey('Escape');
    I.waitForFocus(toggleLocator);
    I.pressKey('Enter');
    for (let i = 0; i < size; i++) {
        I.waitForFocus(locate(`.dropdown.open ul li:nth-of-type(${i % size + (size - 1)}) > a`).as(`Dropdown item #${i % size + 1}`));
        I.pressKey('ArrowDown');
    }
    I.pressKey('Escape');
    I.waitForFocus(toggleLocator);
}

// navigate to chat, open chat, initial focus: New Chat
async function openChat(I) {
    await pressShiftTab(I, 3);
    I.pressKey('ArrowLeft');
    I.pressKey('ArrowLeft');
    I.pressKey('Enter');
    I.waitForVisible('.ox-chat');
    I.waitForFocus(locate('a.dropdown-toggle').withText('New Chat'));
}

function getChatLocator(name) {
    return locate('.accessible-list .chat-list > li').withText(name);
}

// for tab navigation and dropdowns in main menu of sticky mode
Scenario('Check Tab Navigation in sticky mode - Main', async ({ I, mail }) => {

    const closeChatButton = locate('~Close chat'),
        navButtonLocator = (text) => locate({ css: '.navigation-actions button.btn-nav' }).withText(text);

    I.login();
    mail.waitForApp();
    await openChat(I);

    await checkDropdowns(I, locate('a.dropdown-toggle').withText('New Chat'));

    // navigate to action
    I.pressKey('Tab');
    I.waitForFocus(locate('~Search or start new chat').as('Search field'));
    I.pressKey('Tab');
    I.waitForFocus('.accessible-list');
    I.pressKey('Tab');

    // check tab order of navigation actions
    // All channels
    I.waitForFocus(navButtonLocator('All channels'));
    I.pressKey('Enter');
    I.waitForFocus(closeChatButton);
    I.pressKey('Enter');
    I.waitForFocus(navButtonLocator('All channels'));
    I.pressKey('Tab');
    // All files
    I.waitForFocus(navButtonLocator('All files'));
    I.pressKey('Enter');
    I.waitForFocus(closeChatButton);
    I.pressKey('Enter');
    I.waitForFocus(navButtonLocator('All files'));
    I.pressKey('Tab');
    // History
    I.waitForFocus(navButtonLocator('History'));
    I.pressKey('Enter');
    I.waitForFocus(closeChatButton);
    I.pressKey('Enter');
    I.waitForFocus(navButtonLocator('History'));

    // navigate to mode-toggle and check focus
    await pressShiftTab(I, 5);
    I.pressKey('RightArrow');
    I.waitForFocus(locate('~Detach window'));
    I.pressKey('Enter');
    I.waitForVisible('.floating-window .ox-chat');
    I.waitForFocus(locate('~New'));
});

Scenario('Check Tab Navigation in sticky mode - Modals and Private chats', async ({ I, users, mail, dialogs }) => {
    const newChatLocator = locate('a.dropdown-toggle').withText('New Chat'),
        messageLocator = locate('~Message');

    I.login();
    mail.waitForApp();
    await openChat(I);

    // 1. close and re-open modal-dialog
    I.pressKey('Enter');
    I.waitForVisible('.ox-chat .open .dropdown-menu');
    I.pressKey('Enter');
    dialogs.waitForVisible();
    I.pressKey('Escape');
    I.waitForFocus(newChatLocator);
    I.pressKey('Enter');
    I.waitForVisible('.ox-chat .open .dropdown-menu');
    I.pressKey('Enter');
    dialogs.waitForVisible();

    // 2. create a private chat
    I.waitForText('Start new conversation', 5, dialogs.locators.header);
    I.waitForFocus('.modal-dialog .search-field');
    await pressTab(I, 2);
    I.pressKey('Enter');
    I.waitForEnabled('.modal-dialog .btn-primary', 5);
    await pressTab(I, 2);
    I.pressKey('Enter');
    I.waitForDetached('.modal-dialog');
    I.waitForElement('.ox-chat .controls');
    I.waitForVisible(messageLocator);
    I.haveFocus(messageLocator);

    // 3. go back and check focus
    // TODO: Remove check for dropdown
    await pressShiftTab(I, 3);
    I.pressKey('RightArrow');
    I.pressKey('RightArrow');
    await checkDropdowns(I, locate('~More actions'));
    I.pressKey('LeftArrow');
    I.pressKey('LeftArrow');
    I.pressKey('Enter');
    I.waitForFocus(getChatLocator(users[1].userdata.sur_name));

    // 4. When refocus is correct, this should re-open the chat
    I.pressKey('Enter');
    I.waitForText(users[1].userdata.sur_name, 5, '.ox-chat .toolbar-title');
});

// TODO SCENARIOS:
// - Check focus on favorite toggle
// - Check focus when there are multiple people in chat-list (and favorite?)
// - Check modals for creating groups
// -
