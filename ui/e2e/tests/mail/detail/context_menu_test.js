/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Detail');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C248438] Context menu can be opened by right click', async (I, users) => {

    var icke = users[0].userdata.email1,
        subject = 'Context menu can be opened by right click';

    await I.haveMail({
        attachments: [{
            content: 'Lorem ipsum',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [['Icke', icke]],
        subject: subject,
        to: [['Icke', icke]]
    });

    await I.haveSetting({ 'io.ox/mail': { 'features/registerProtocolHandler': false } });
    I.login('app=io.ox/mail');

    // wait for first email
    var firstItem = '.list-view .list-item';
    I.waitForElement(firstItem);
    I.click(firstItem);
    I.waitForVisible('.thread-view.list-view .list-item');

    // we need to wait until the message is seen
    I.wait(1);

    // Mark unread
    rightClick();
    clickAction('io.ox/mail/actions/mark-unread');
    I.waitForElement('a.unread-toggle[aria-label="Mark as read"]');

    // View source
    rightClick();
    clickAction('io.ox/mail/actions/source');
    I.waitForElement('.mail-source-dialog');
    I.click('Close');

    // Move
    rightClick();
    clickAction('io.ox/mail/actions/move');
    I.waitForElement('.folder-picker-dialog');
    I.click('Cancel');

    // Reply
    rightClick();
    clickAction('io.ox/mail/actions/reply');
    I.waitForElement('button[data-action="discard"]:not(.disabled)');
    I.seeInField('subject', 'Re: ' + subject);
    // no better approach yet. I.waitForMailCompose() might be a good one
    I.wait(1);
    I.click('Close');

    // // Shift-F10 (view source again)
    // --- DOES NOT WORK YET -----
    // shiftF10();
    // clickAction('io.ox/mail/actions/source');
    // I.waitForElement('.mail-source-dialog');
    // I.click('Close');

    // Delete
    rightClick();
    I.seeNumberOfElements('.leftside .list-view .list-item', 1);
    clickAction('io.ox/mail/actions/delete');
    I.waitForDetached('.leftside .list-view .list-item');

    function rightClick() {
        I.executeScript(function () {
            var e = $.Event('contextmenu', { pageY: 200, pageX: 350 });
            // eslint-disable-next-line no-undef
            list.$el.trigger(e);
        });
        I.seeElement('.smart-dropdown-container.dropdown.open');
    }

    function clickAction(action) {
        var selector = '.smart-dropdown-container a[data-action="' + action + '"]';
        I.waitForElement(selector);
        I.click(selector);
    }

    // function shiftF10() {
    //     I.executeScript(function () {
    //         var e = $.Event('keydown', { button: 0, shiftKey: true, which: 121 });
    //         list.$el.children('.selected').first().trigger(e);
    //     });
    // }
});

