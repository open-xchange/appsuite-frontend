/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Chat > Accessibility > Sticky Mode');

Before(async ({ users }) => {
    await users.create();
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
        I.waitForFocus(locate('.dropdown.open ul li[role="presentation"] > a').at(i % size + 1).as(`Dropdown item #${i % size + 1}`));
        I.pressKey('ArrowUp');
    }
    I.pressKey('Escape');
    I.waitForFocus(toggleLocator);
    I.pressKey('Enter');
    for (let i = 0; i < size; i++) {
        I.waitForFocus(locate('.dropdown.open ul li[role="presentation"] > a').at(i % size + 1).as(`Dropdown item #${i % size + 1}`));
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

Scenario.only('Check Tab Navigation in sticky mode - Modals and Private chats', async ({ I, mail, dialogs }) => {
    const newChatLocator = locate('a.dropdown-toggle').withText('New Chat'),
        messageLocator = locate('~Message');

    I.login();
    mail.waitForApp();
    await openChat(I);

    // 1. close and re-open modal-dialog
    I.say('1.');
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
    I.say('2.');
    I.waitForText('Start new conversation', 5, dialogs.locators.header);
    I.waitForFocus('.modal-dialog .search-field');
    await pressTab(I, 2);
    // get user names for focus checks, need to save it here since address book is sorted alphabetically
    var user1 = await I.grabTextFrom(locate('.list-item .last_name').at(1)),
        user2 = await I.grabTextFrom(locate('.list-item .last_name').at(2));
    I.say(`I see user1 (${user1}) and user2 (${user2})`);
    I.pressKey('Enter');
    I.waitForEnabled('.modal-dialog .btn-primary', 5);
    await pressTab(I, 2);
    I.pressKey('Enter');
    I.waitForDetached('.modal-dialog');
    I.waitForElement('.ox-chat .controls');
    I.waitForVisible(messageLocator);
    I.haveFocus(messageLocator);
    I.waitForText(user1);

    // 3. go back and check focus
    I.say('3.');
    await pressShiftTab(I, 3);
    I.pressKey('RightArrow');
    I.pressKey('RightArrow');
    await checkDropdowns(I, locate('~More actions'));
    I.pressKey('LeftArrow');
    I.pressKey('LeftArrow');
    I.pressKey('Enter');
    I.waitForFocus(getChatLocator(user1));

    // 4. When refocus is correct, this should re-open the chat, go back afterwards
    I.say('4.');
    I.pressKey('Enter');
    I.waitForText(user1);
    await pressShiftTab(I, 3);
    I.pressKey('Enter');
    I.waitForFocus(getChatLocator(user1));

    // 5. create second chat
    I.say('5.');
    await pressShiftTab(I, 2);
    I.pressKey('Enter');
    I.waitForVisible('.ox-chat .open .dropdown-menu');
    I.pressKey('Enter');
    dialogs.waitForVisible();
    I.waitForText('Start new conversation', 5, dialogs.locators.header);
    I.waitForFocus('.modal-dialog .search-field');
    await pressTab(I, 2);
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    I.waitForEnabled('.modal-dialog .btn-primary', 5);
    await pressTab(I, 2);
    I.pressKey('Enter');
    I.waitForDetached('.modal-dialog');
    I.waitForElement('.ox-chat .controls');
    I.waitForVisible(messageLocator);
    I.haveFocus(messageLocator);
    I.waitForText(user2);

    // 6. go back and check focus on user2
    I.say('6.');
    await pressShiftTab(I, 3);
    I.pressKey('Enter');
    I.waitForFocus(getChatLocator(user2));

    // 7. re-open and add to favorites
    I.say('7.');
    I.pressKey('Enter');
    I.waitForVisible(messageLocator);
    I.haveFocus(messageLocator);
    I.waitForText(user2);
    await pressShiftTab(I, 3);
    I.pressKey('RightArrow');
    I.pressKey('RightArrow');
    I.pressKey('Enter');
    I.waitForVisible('.dropdown.open ul');
    I.waitForText('Add to favorites', 5, '.dropdown.open ul');
    I.pressKey('Enter');
    I.waitForInvisible('.dropdown.open ul');

    // 8. go back and check focus
    I.say('8.');
    I.pressKey('ArrowLeft');
    I.pressKey('ArrowLeft');
    I.pressKey('Enter');
    I.waitForText('Favorites', 5, '.ox-chat');
    I.waitForFocus(getChatLocator(user2));
});

Scenario('Check Tab Navigation in sticky mode - Group chats', async ({ I, mail, dialogs }) => {
    const newChatLocator = locate('a.dropdown-toggle').withText('New Chat'),
        messageLocator = locate('~Message');

    I.login();
    mail.waitForApp();
    await openChat(I);

    // 1. close and re-open new chat modal-dialog
    I.say('1. Close and re-open new chat modal-dialog');
    I.pressKey('Enter');
    I.waitForVisible('.ox-chat .open .dropdown-menu');
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    dialogs.waitForVisible();
    I.pressKey('Escape');
    I.waitForFocus(newChatLocator);

    // 2. create a group chat
    I.say('2. Create a group chat');
    I.pressKey('Enter');
    I.waitForVisible('.ox-chat .open .dropdown-menu');
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    dialogs.waitForVisible();
    I.waitForText('Create group chat', 5, dialogs.locators.header);
    I.haveFocus('.modal-dialog .form-group input');
    // can access group image editor
    await pressShiftTab(I, 1);
    I.pressKey('Enter');
    I.waitForText('Change image', 5, dialogs.locators.header);
    I.pressKey('Escape');
    I.waitForVisible('.modal-dialog .form-group input');
    I.haveFocus('.modal-dialog .form-group input');
    // can access address book
    await pressTab(I, 2);
    I.pressKey('Enter');
    I.waitForText('Select contacts', 5, dialogs.locators.header);
    I.waitForFocus('.modal-dialog .search-field');
    I.pressKey('Escape');
    I.waitForVisible('.modal-dialog .form-group input');
    I.waitForFocus('.modal-dialog .form-group input');
    I.type('Test 1');
    await pressTab(I, 4);
    I.pressKey('Enter');
    I.waitForDetached('.modal-dialog');
    I.waitForElement('.ox-chat .controls');
    I.waitForVisible(messageLocator);
    I.haveFocus(messageLocator);
    I.waitForText('Test 1');

    // 3. go back and check focus
    I.say('3. Go back and check focus');
    await pressShiftTab(I, 3);
    I.pressKey('RightArrow');
    I.pressKey('RightArrow');
    await checkDropdowns(I, locate('~More actions'));
    I.pressKey('LeftArrow');
    I.pressKey('LeftArrow');
    I.pressKey('Enter');
    I.waitForFocus(getChatLocator('Test 1'));

    // 4. create second chat and check focus
    I.say('4. create second chat and check focus');
    await pressShiftTab(I, 2);
    I.waitForFocus(newChatLocator);
    I.pressKey('Enter');
    I.waitForVisible('.ox-chat .open .dropdown-menu');
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    dialogs.waitForVisible();
    I.waitForText('Create group chat', 5, dialogs.locators.header);
    I.waitForFocus('.modal-dialog .form-group input');
    I.type('Test 2');
    await pressTab(I, 4);
    I.pressKey('Enter');
    I.waitForDetached('.modal-dialog');
    I.waitForElement('.ox-chat .controls');
    I.waitForVisible(messageLocator);
    I.haveFocus(messageLocator);
    I.waitForText('Test 2');
    await pressShiftTab(I, 3);
    I.pressKey('Enter');
    I.waitForFocus(getChatLocator('Test 2'));

    // 5. check focus after favorite
    I.say('5. check focus after favorite');
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    I.waitForVisible(messageLocator);
    I.haveFocus(messageLocator);
    I.waitForText('Test 1');
    await pressShiftTab(I, 3);
    I.pressKey('ArrowRight');
    I.pressKey('ArrowRight');
    I.pressKey('Enter');
    I.waitForVisible('.dropdown.open ul');
    I.pressKey('Enter');
    I.waitForInvisible('.dropdown.open ul');
    I.pressKey('ArrowLeft');
    I.pressKey('ArrowLeft');
    I.pressKey('Enter');
    I.waitForText('Favorites', 5, '.ox-chat');
    I.waitForFocus(getChatLocator('Test 1'));
});
