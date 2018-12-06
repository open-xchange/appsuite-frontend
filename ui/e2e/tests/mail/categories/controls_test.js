/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

Feature('Mail categories');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('User can enable/disable/adjust feature', function (I, users) {
    const [user] = users;

    // capabiliy enabled
    I.login('app=io.ox/mail&cap=mail_categories', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.selectFolder('Inbox');
    I.clickToolbar('View');

    I.seeElementInDOM('.dropdown.open a[data-name="categories"]');
    I.seeElementInDOM('.dropdown.open a[data-name="categories-config"]');

    I.click('.dropdown.open a[data-name="categories-config"]');
    I.waitForVisible('.modal[data-point="io.ox/mail/categories/edit"]');
    I.click('Cancel');

    I.logout();

    // capabiliy disabled
    I.login('app=io.ox/mail&cap=-mail_categories', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.selectFolder('Inbox');
    I.clickToolbar('View');

    I.dontSeeElementInDOM('.dropdown.open a[data-name="categories"]');
    I.dontSeeElementInDOM('.dropdown.open a[data-name="categories-config"]');

    I.pressKey('Escape');

    I.logout();
});
