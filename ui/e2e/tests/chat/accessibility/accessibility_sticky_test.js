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

Before(async (users) => {
    await users.create();
    await users.create();
    await users[0].context.hasCapability('chat');
});

After(async (users) => {
    await users.removeAll();
});

Scenario.only('Check Tab Navigation in sticky mode', async (I, mail, dialogs) => {

    function pressTab(times) {
        for (let i = 0; i < times; i++) {
            I.pressKey('Tab');
        }
    }

    I.login();
    mail.waitForApp();

    // Open chat, initial focus: New Chat
    I.pressKey(['Shift', 'Tab']);
    I.wait(1);
    I.pressKey(['Shift', 'Tab']);
    I.pressKey('ArrowLeft');
    I.pressKey('ArrowLeft');

    I.pressKey('Enter');
    I.waitForVisible('.ox-chat');

    // test dropdown: open and close
    ['Enter', 'ArrowDown', 'ArrowUp', 'Space'].forEach(function (key) {
        I.pressKey(key);
        I.waitForVisible('.ox-chat .classic-toolbar-container .dropdown-menu');
        I.pressKey('Escape');
        I.waitForInvisible('.ox-chat .classic-toolbar-container .dropdown-menu');
        I.waitForFocus('.ox-chat .classic-toolbar-container .dropdown-toggle');
    });

    // test dropdown: navigate with arrow keys
    I.pressKey('Enter');
    for (let i = 3; i > 0; i--) {
        I.waitForFocus(`.ox-chat .classic-toolbar-container .dropdown-menu li:nth-of-type(${i % 3 + 2}) > a`);
        I.pressKey('ArrowUp');
    }
    I.pressKey('Escape');
    I.waitForFocus('.ox-chat .classic-toolbar-container .dropdown-toggle');
    I.pressKey('Enter');
    for (let i = 0; i < 3; i++) {
        I.waitForFocus(`.ox-chat .classic-toolbar-container .dropdown-menu li:nth-of-type(${i % 3 + 2}) > a`);
        I.pressKey('ArrowDown');
    }

    // check create private chat
    I.pressKey('Enter');
    dialogs.waitForVisible();
    I.waitForText('Start new conversation', 5, dialogs.locators.header);
    I.waitForFocus('.modal-dialog .search-field');
    pressTab(2);
    I.pressKey('Enter');
    I.waitForEnabled('.modal-dialog .btn-primary', 5);
    pressTab(2);
    I.pressKey('Enter');
    I.waitForDetached('.modal-dialog');
    I.waitForElement('.ox-chat .controls');

    // send message in newly created chat
    I.waitForFocus('[aria-label="Message"]');
    I.type('Test message');
    I.pressKey('Tab');
    I.pressKey('Enter');

    // go back to list
    for (let i = 0; i < 4; i++) I.pressKey(['Shift', 'Tab']);
    I.pressKey('RightArrow');
    I.pressKey('RightArrow');

    // test dropdown 'More actions': open and close
    ['Enter', 'ArrowDown', 'ArrowUp', 'Space'].forEach(function (key) {
        I.pressKey(key);
        I.waitForVisible('.smart-dropdown-container .dropdown-menu');
        I.pressKey('Escape');
        I.waitForInvisible('.smart-dropdown-container .dropdown-menu');
        I.waitForFocus('.ox-chat .chat-rightside .classic-toolbar-container .dropdown-toggle');
    });

    // test dropdown 'More actions: navigate with arrow keys
    I.pressKey('Enter');
    for (let i = 2; i > 0; i--) {
        I.waitForFocus(`.smart-dropdown-container li:nth-of-type(${i % 2 + 1}) > a`);
        I.pressKey('ArrowUp');
    }
    I.pressKey('Escape');
    I.waitForFocus('.ox-chat .chat-rightside .classic-toolbar-container .dropdown-toggle');
    I.pressKey('Enter');
    for (let i = 0; i < 3; i++) {
        I.waitForFocus(`.smart-dropdown-container .dropdown-menu li:nth-of-type(${i % 2 + 1}) > a`);
        I.pressKey('ArrowDown');
    }

    // TBD: is this the proper fix? expect first tabbable to be focused
    // switch to floating window and back
    I.pressKey('Escape');
    I.pressKey('ArrowLeft');
    I.pressKey('Enter');
    I.waitForVisible('.floating-window .ox-chat');
    I.pressKey(['Shift', 'Tab']);
    I.pressKey('Enter');

    I.waitForVisible('.ox-chat.columns');
    I.pressKey('Enter');
    I.waitForVisible('.ox-chat .accessible-list');
    I.pressKey(['Shift', 'Tab']);
    I.pressKey(['Shift', 'Tab']);
    I.pressKey('ArrowDown');

    // check create group chat
    I.pressKey('Enter');
    dialogs.waitForVisible();
    I.waitForText('Create group chat', 5, dialogs.locators.header);
    I.waitForFocus('.modal-dialog .form-group input.form-control:nth-of-type(1)');
    I.pressKey(['Shift', 'Tab']);
    I.waitForFocus('.modal-dialog div.contact-photo.empty');
    I.pressKey('Tab');
    I.type('Test group');
    pressTab(2);
    I.pressKey('Enter');
    I.waitForText('Select contacts', 5, dialogs.locators.header);
    I.pressKey('Escape');
    I.waitForText('Create group chat', 5, dialogs.locators.header);
    pressTab(4);
    I.pressKey('Enter');
    I.waitForDetached('.modal-dialog');
    I.waitForElement('.ox-chat .controls');

    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Enter');
    I.waitForEnabled('.modal-dialog .btn-primary', 5);
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Enter');
    I.waitForDetached('.modal-dialog');
    I.waitForElement('.ox-chat .controls');    // check private chat
    I.pressKey('Enter');
    dialogs.waitForVisible();
    I.waitForText('Start new conversation', 5, dialogs.locators.header);
    I.waitForFocus('.modal-dialog .search-field');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Enter');
    I.waitForEnabled('.modal-dialog .btn-primary', 5);
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Enter');
    I.waitForDetached('.modal-dialog');
    I.waitForElement('.ox-chat .controls');


    // // Close chat
    // // TODO: Behavior for '~Close chat' or '~Chats' expected: something is selected from chat | actual: nothing is selected
    // // TBD: selection on chat if existing (should be after Richards fix), otherwise first of list -> Ask David

    // // TODO: Same for group and channels, expected: 3 in list
    // // TBD: How to access editing a group profile picture?

    // // TODO: All Channels, All files, History

    // // check group chat
    // I.pressKey('Enter');
    // I.pressKey('ArrowDown');
    // I.pressKey('Enter');
    // dialogs.waitForVisible();
    // I.waitForText('Create group chat', dialogs.locators.header);
    // dialogs.clickButton('Cancel');
    // I.waitForDetached('.modal-dialog');

    // // check channel
    // I.pressKey('Enter');
    // I.pressKey('ArrowDown');
    // I.pressKey('ArrowDown');
    // I.pressKey('Enter');
    // dialogs.waitForVisible();
    // I.waitForText('Create group chat', dialogs.locators.header);
    // dialogs.clickButton('Cancel');
    // I.waitForDetached('.modal-dialog');

    // pause();

    // I.pressKey(['Shift', 'Tab']);
    // I.waitForFocus('~New Chat');
    // Check

    // // toolbar: unselect-state
    // I.say('> toolbar: unselect-state');
    // I.pressKey('Tab');
    // I.pressKey('Tab');
    // I.pressKey('Tab');
    // I.pressKey('Tab');
    // await toolbar.testFocus(selector);
    // await toolbar.testWrapAround(selector);
    // //await toolbar.testDropdowns(selector);
    // await toolbar.testTabindex(selector);

    // // toolbar: sidepopup
    // I.say('> toolbar: sidepopup');
    // selector = '.io-ox-sidepopup-pane .inline-toolbar';
    // I.click('.appointment');
    // I.waitForElement(selector);
    // I.pressKey('Tab');
    // await toolbar.testFocus(selector);
    // await toolbar.testWrapAround(selector);
    // //await toolbar.testDropdowns(selector);
    // await toolbar.testTabindex(selector);
    // I.pressKey('Escape');
    // I.waitForDetached(selector);

    // // toolbar: unselect-state (list)
    // I.say('> toolbar: unselect-state (list)');
    // selector = '.classic-toolbar-container > ul[role="toolbar"]';
    // I.clickToolbar(calendar.locators.view);
    // I.click('List', calendar.locators.dropdown);
    // I.waitForText('test appointment');
    // I.pressKey('Tab');
    // await toolbar.testFocus(selector);
    // await toolbar.testWrapAround(selector);
    // //await toolbar.testDropdowns(selector);
    // await toolbar.testTabindex(selector);

    // // toolbar: select-state
    // I.say('> toolbar: select-state');
    // I.click('.list-item.selectable');
    // I.pressKey(['Shift', 'Tab']);
    // await toolbar.testFocus(selector);
    // await toolbar.testWrapAround(selector);
    // //await toolbar.testDropdowns(selector);
    // await toolbar.testTabindex(selector);

    // // toolbar: detail view (floating window)
    // I.say('> toolbar: detail view (floating window');
    // selector = '.io-ox-calendar-detail-window .inline-toolbar';
    // I.doubleClick(locate('.list-view .list-item.selectable').first());
    // I.waitForElement(selector);
    // I.pressKey('Tab');
    // I.pressKey('Tab');
    // I.pressKey('Tab');
    // await toolbar.testFocus(selector);
    // await toolbar.testWrapAround(selector);
    // //await toolbar.testDropdowns(selector);
    // await toolbar.testTabindex(selector);
});
