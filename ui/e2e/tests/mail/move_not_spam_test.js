/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Anne Matthes <anne.matthes@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('Mail > mark as not spam and move to inbox');

Before(async function (I, users) {
    const user = users.getRandom();
    user.gui_spam_filter_enabled = true;
    await users.create(user);
});

After(async function (I, users) {
    await users.removeAll();
});

// TODO: skip can be removed as soon as https://gitlab.open-xchange.com/frontend/codecept-helpers/merge_requests/72 is released
Scenario.skip('Mark mail in spam folder as not spam and move to inbox', async function (I, users) {
    let [user] = users,
        subject = 'test subject';

    await user.hasCapability('spam');

    await I.haveMail({
        from: user,
        to: user,
        subject: subject
    });

    I.login('app=io.ox/mail');

    I.waitForVisible('.io-ox-mail-window');
    I.waitForVisible(locate('span').withAttr({ 'title': subject }));
    I.rightClick(subject);
    I.click('Mark as spam', '.smart-dropdown-container');
    I.selectFolder('Spam');
    I.waitForVisible(locate('span').withAttr({ 'title': subject }));
    I.rightClick(subject);
    I.click('Not spam', '.smart-dropdown-container');
    I.selectFolder('Inbox');
    I.waitForVisible(locate('span').withAttr({ 'title': subject }));

    I.logout();
});
