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

const expect = require('chai').expect;
// depends on https://gitlab.open-xchange.com/frontend/Infrastructure/preview_apps/issues/5

Feature('Mail > Categories');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

const SELECTORS = {
    toolbar: '.classic-toolbar.categories',
    dialog: 'body > .modal[data-point="io.ox/mail/categories/edit"',
    checkbox1: { xpath: "(.//input[./@type = 'checkbox'])[1]" },
    checkbox2: { xpath: '(.//label)[2]' },
    checkbox3: { xpath: '(.//label)[3]' },
    checkbox4: { xpath: '(.//label)[4]' },
    checkbox5: '.category-item[data-id="uc1"] > .checkbox.custom .toggle',
    checkbox6: '.category-item[data-id="uc2"] > .checkbox.custom .toggle'
};

const A = {
    toggle: function (I) {
        I.clickToolbar('View');
        I.waitForVisible({ css: 'a[data-name="categories"]' }, 5, 'body > .dropdown');
        I.click({ css: 'a[data-name="categories"]' }, 'body > .dropdown');
    },
    openConfiguration: function (I) {
        I.clickToolbar('View');
        I.waitForVisible({ css: 'a[data-name="categories-config"]' }, 5, 'body > .dropdown');
        I.click({ css: 'a[data-name="categories-config"]' }, 'body > .dropdown');
    }
};

// PARTIAL: missing drag and drop steps
Scenario.skip('[C85634] Enable/disable tabbed inbox', function ({ I }) {
    I.haveSetting('io.ox/mail//categories/enabled', true);

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');

    I.seeElement('.classic-toolbar.categories');
    A.toggle(I);

    // TODO: add missing steps that involves drag and drop

    I.dontSeeElement('.classic-toolbar.categories');
    A.toggle(I);
    I.seeElement('.classic-toolbar.categories');
});

Scenario('[C85626] Mail categories can be renamed', function ({ I }) {
    I.haveSetting('io.ox/mail//categories/enabled', true);

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');

    A.openConfiguration(I);
    I.waitForElement(SELECTORS.dialog);
    within(SELECTORS.dialog, async () => {
        I.say('Rename categories', 'blue');
        I.fillField({ css: '[data-id="uc1"] input[type="text"]' }, 'C85626-01');
        I.fillField({ css: '[data-id="uc2"] input[type="text"]' }, 'C85626-02');

        I.click('Save');
    });
    I.waitForDetached(SELECTORS.dialog);
    I.wait(1);

    I.seeTextEquals('C85626-01', SELECTORS.toolbar + ' [data-id="uc1"] .category-name');
    I.seeTextEquals('C85626-02', SELECTORS.toolbar + ' [data-id="uc2"] .category-name');
});

Scenario('[C85626] Categories can be enabled or disabled', function ({ I, mail }) {
    I.haveSetting('io.ox/mail//categories/enabled', true);

    I.login('app=io.ox/mail');
    mail.waitForApp();

    I.say('Disable all categories except "General"', 'blue');
    A.openConfiguration(I);
    I.waitForVisible(SELECTORS.dialog);
    within(SELECTORS.dialog, async () => {
        // custom checkboxes so we use labels for toggling
        I.click(SELECTORS.checkbox2);
        I.click(SELECTORS.checkbox3);
        I.click(SELECTORS.checkbox4);
        I.click(SELECTORS.checkbox5);
        I.click(SELECTORS.checkbox6);

        I.click('Save');
    });
    I.waitForDetached(SELECTORS.dialog);
    I.waitForNetworkTraffic();
    I.waitForInvisible({ css: '[data-id="promotion"]' });

    I.say('Ensure all tabss except "General" are hidden', 'blue');
    I.waitForVisible({ css: '[data-id="general"]' }, 5, SELECTORS.toolbar);
    I.dontSeeElement({ css: '[data-id="promotion"]' }, SELECTORS.toolbar);
    I.dontSeeElement({ css: '[data-id="social"]' }, SELECTORS.toolbar);
    I.dontSeeElement({ css: '[data-id="purchases"]' }, SELECTORS.toolbar);
    I.dontSeeElement({ css: '[data-id="uc1"]' }, SELECTORS.toolbar);
    I.dontSeeElement({ css: '[data-id="uc2"]' }, SELECTORS.toolbar);

    I.say('Enable all categories except "General"', 'blue');
    A.openConfiguration(I);
    I.waitForVisible(SELECTORS.dialog);
    within(SELECTORS.dialog, async () => {
        I.click(SELECTORS.checkbox2);
        I.click(SELECTORS.checkbox3);
        I.click(SELECTORS.checkbox4);
        I.click(SELECTORS.checkbox5);
        I.click(SELECTORS.checkbox6);

        I.click('Save');
    });
    I.waitForDetached(SELECTORS.dialog);
    I.waitForNetworkTraffic();

    I.say('Check names of custom categories', 'blue');
    I.waitForVisible(SELECTORS.toolbar);
    I.waitForVisible({ css: '[data-id="promotion"]' }, 5, SELECTORS.toolbar);
    I.waitForVisible({ css: '[data-id="general"]' }, 5, SELECTORS.toolbar);
    I.waitForVisible({ css: '[data-id="promotion"]' }, 5, SELECTORS.toolbar);
    I.waitForVisible({ css: '[data-id="social"]' }, 5, SELECTORS.toolbar);
    I.waitForVisible({ css: '[data-id="purchases"]' }, 5, SELECTORS.toolbar);
    I.waitForVisible({ css: '[data-id="uc1"]' }, 5, SELECTORS.toolbar);
    I.waitForVisible({ css: '[data-id="uc2"]' }, 5, SELECTORS.toolbar);
});

Scenario('[C85626] Support different aspects of categories', function ({ I }) {
    I.haveSetting('io.ox/mail//categories/enabled', true);

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');

    A.openConfiguration(I);
    I.seeElement(SELECTORS.dialog);
    within(SELECTORS.dialog, async () => {

        I.say('First category is active', 'blue');
        I.seeCheckboxIsChecked(locate('input').first('[type="checkbox"]'));

        I.say('First category is readonly', 'blue');
        var classlist = await I.grabAttributeFrom(SELECTORS.checkbox1, 'class');
        expect(classlist.toString()).to.contain('disabled');

        I.say('Shows category description', 'blue');
        I.seeTextEquals('Promotion Description', '.description');

        I.click('Cancel');
    });
    I.waitForDetached(SELECTORS.dialog);
});

function getTestMail(from, to, opt) {
    opt = opt || {};
    return {
        attachments: [{
            content: opt.content,
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[from.get('displayname'), from.get('primaryEmail')]],
        sendtype: 0,
        subject: opt.subject,
        to: [[to.get('displayname'), to.get('primaryEmail')]],
        folder_id: opt.folder,
        flags: opt.flags
    };
}

// PARTIAL: missing drag and drop steps
Scenario.skip('[C85632] Move mails to another category', async function ({ I, users }) {
    await users.create();
    await users.create();
    await users.create();

    const user1 = users[0];
    const user2 = users[1];
    const user3 = users[2];

    I.haveSetting('io.ox/mail//categories/enabled', true, { user: user3 });

    await I.haveMail(getTestMail(user1, user3, {
        subject: 'Test Mail 1',
        content: 'Testing is still fun'
    }));
    await I.haveMail(getTestMail(user1, user3, {
        subject: 'Test Mail 2',
        content: 'Testing is still fun'
    }));
    await I.haveMail(getTestMail(user2, user3, {
        subject: 'Test Mail 3',
        content: 'Testing is still awesome'
    }), { user: user2 });
    await I.haveMail(getTestMail(user2, user3, {
        subject: 'Test Mail 4',
        content: 'Testing is still awesome'
    }), { user: user2 });

    I.login('app=io.ox/mail', { user: user3 });

    await I.executeScript(function () {
        return $('body').addClass('dragging');
    });

    I.waitForVisible('.io-ox-mail-window');
    I.waitForVisible('.io-ox-mail-window .list-view');

    let item = locate('.list-item[data-index="0"]').inside(locate('.list-view'));
    let target = locate('[data-id="social"] .category-drop-helper').inside(locate('.classic-toolbar.categories'));
    I.seeElement(item);
    I.seeElement(item);

    // TODO: add missing steps that involves drag and drop
    await I.dragAndDrop(item, target);
});

function reply(I, user) {
    I.login('app=io.ox/mail', { user: user });
    I.waitForVisible('.io-ox-mail-window');
    I.waitForVisible('.io-ox-mail-window .list-view');
    I.click('.list-item[data-index="0"]', '.list-view');
    I.wait(1);
    I.click({ css: 'a[data-action="io.ox/mail/actions/reply"]' });
    I.wait(2);
    I.click('Send');
    I.wait(1);
    I.logout({ user: user });
    I.wait(1);
}

// PARTIAL: missing drag and drop steps
Scenario.skip('[C96951] Conversations', async function ({ I, users }) {
    await users.create();
    await users.create();

    const user1 = users[0];
    const user2 = users[1];

    await I.haveMail(getTestMail(user1, user2, {
        subject: 'Test Mail 1',
        content: 'Testing is still fun'
    }));

    reply(I, user2);
    reply(I, user1);
    reply(I, user2);
    reply(I, user1);
    reply(I, user2);

    I.haveSetting('io.ox/mail//categories/enabled', true, { user: user1 });
    I.login('app=io.ox/mail', { user: user1 });
    I.waitForVisible('.io-ox-mail-window');
    I.waitForVisible('.io-ox-mail-window .list-view');

    // TODO: add missing step: "Move <message-3> from tab "General" to "Promotions"

    I.say('Enable Conversations/Threads', 'blue');
    I.click('Sort', '.list-view-control');
    I.waitForVisible({ css: '[data-name="thread"]' }, 5, { css: 'body > .dropdown' });
    I.click({ css: '[data-name="thread"]' }, { css: 'body > .dropdown' });
    I.wait(2);

    I.say('Check Thread in "inbox"', 'blue');
    I.see('6', '.list-view .thread-size');

    I.say('Check Thread in "promotion"', 'blue');
    I.click({ css: '[data-id="promotion"]' }, SELECTORS.toolbar);
    I.see('6', '.list-view .thread-size');
});
