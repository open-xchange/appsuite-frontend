/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

/// <reference path="../../steps.d.ts" />

Feature('Mail > Flags');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

var flagged = '.mail-item .list-item .flag [title="Flagged"]',
    colorFlag = '.list-item .color-flag.flag_10';

// --------------------------------------------------------------------------

Scenario('[C114336] Flag an E-Mail with a color flag (flaggedImplicit)', async ({ I, mail }) => {

    const me = getUtils();
    await me.login({ color: true, star: true });
    mail.selectMail('Icke');
    I.click('~Set color');
    I.wait(0.5);
    I.waitForText('Yellow');
    I.retry(10).click('[data-action="color-yellow"]', '.smart-dropdown-container.flag-picker');
    I.waitForVisible(colorFlag);
    I.click('~Set color');
    I.wait(0.5);
    I.waitForText('Yellow');
    I.retry(10).click('[data-action="color-none"]', '.smart-dropdown-container.flag-picker');
    I.waitForInvisible('.list-item .color-flag');
});

Scenario('[C114337] Flag an E-Mail as Flagged/Starred (flaggedOnly)', async ({ I, mail }) => {

    var me = getUtils();
    await me.login({ color: false, star: true });
    mail.selectMail('Icke');
    I.clickToolbar({ css: '[data-action="io.ox/mail/actions/flag"]:not(.disabled)' });
    //me.clickToolbarAction('flag');
    I.dontSee({ css: '[data-action="io.ox/mail/actions/color"]' });
    I.waitForElement(flagged);
});

Scenario('[C114338] Flag an E-Mail with a color flag (flaggedAndColor)', async ({ I, mail }) => {

    var me = getUtils();
    await me.login({ color: true, star: true });
    mail.selectMail('Icke');
    me.clickToolbarAction('color');
    me.waitAndClick('.smart-dropdown-container.flag-picker [data-action="color-yellow"]');
    I.waitForElement(colorFlag);
    me.clickToolbarAction('flag');
    I.waitForElement(flagged);
    me.removeAllFlags(1);
    I.waitForDetached(colorFlag);
    I.waitForDetached(flagged);
});

Scenario('[C114339] Flag an E-Mail with Starred flag on an alternative client (flaggedAndColor)', async ({ I }) => {

    var me = getUtils();
    await me.login({ color: true, star: true }, 8);
    me.setFlags(0, true);
    me.selectMail();
    I.waitForElement(flagged);
    I.dontSee(colorFlag);
});

Scenario('[OXUIB-2703] Order of star flagged', async ({ I, mail, users }) => {
    const from = [['You', users[0].get('primaryEmail')]];
    const to = [['Me', users[0].get('primaryEmail')]];

    await Promise.all([
        I.haveSetting('io.ox/core//autoStart', 'none'),
        I.haveMail({ subject: 'Lorem #1', from, to }),
        I.haveMail({ subject: 'Lorem #2', from, to }),
        I.haveMail({ subject: 'Lorem #3', from, to }),
        I.haveMail({ subject: 'Lorem #4', from, to }),
        I.haveMail({ subject: 'Lorem #5', from, to }),
        I.haveMail({ subject: 'Lorem #6', from, to }),
        I.haveMail({ subject: 'Lorem #7', from, to }),
        I.haveMail({ subject: 'Lorem #8', from, to }),
        I.haveMail({ subject: 'Lorem #9', from, to })
    ]);


    I.login();
    I.executeScript(() => require('settings!io.ox/mail').set('features/flag', { color: false, star: true }));
    I.waitForInvisible('#background-loader');
    I.openApp('Mail');
    mail.waitForApp();
    I.waitForText('No message selected');

    // fill cache
    I.click('Sort', '.list-view-control');
    I.clickDropdown('Flag');

    I.click('Sort', '.list-view-control');
    I.clickDropdown('Subject');

    mail.selectMail('Lorem #4');
    I.clickToolbar('[data-action="io.ox/mail/actions/flag"]:not(.disabled)');
    I.waitForElement('.mail-item .list-item.selected .flag [title="Flagged"]');

    mail.selectMail('Lorem #5');
    I.clickToolbar('[data-action="io.ox/mail/actions/flag"]:not(.disabled)');
    I.waitForElement('.mail-item .list-item.selected .flag [title="Flagged"]');

    I.click('Sort', '.list-view-control');
    I.clickDropdown('Flag');

    // check if flagged mails listed last
    mail.selectMailByIndex(7);
    I.waitForElement('.mail-item .list-item.selected .flag [title="Flagged"]');
    mail.selectMailByIndex(8);
    I.waitForElement('.mail-item .list-item.selected .flag [title="Flagged"]');

    I.click('Sort', '.list-view-control');
    I.clickDropdown('Ascending');

    // check if flagged mails listed first
    mail.selectMailByIndex(0);
    I.waitForElement('.mail-item .list-item.selected .flag [title="Flagged"]');
    mail.selectMailByIndex(1);
    I.waitForElement('.mail-item .list-item.selected .flag [title="Flagged"]');
});

// --------------------------------------------------------------------------

function getUtils() {
    const { I, mail, users } = inject();
    return {

        login: async function (options, flags) {

            await I.haveSetting('io.ox/core//autoStart', 'none');

            const icke = users[0].userdata.email1;
            await I.haveMail({
                attachments: [{
                    content: 'Lorem ipsum',
                    content_type: 'text/plain',
                    disp: 'inline'
                }],
                flags: flags || 0,
                from: [['Icke', icke]],
                subject: 'Flag mails',
                to: [['Icke', icke]]
            });

            I.login();
            this.haveSetting(options);
            I.waitForInvisible('#background-loader');
            I.openApp('Mail');
            mail.waitForApp();
            I.waitForText('No message selected');
        },

        haveSetting: function (options) {
            I.executeScript(function (options) {
                require('settings!io.ox/mail').set('features/flag', options);
            }, options);
        },

        selectMail: function () {
            // wait for first email
            this.waitAndClick('.list-view .list-item');
            I.waitForVisible('.thread-view.list-view .list-item');
        },

        waitAndClick: function (arg) {
            I.waitForElement(arg);
            I.click(arg);
        },

        clickToolbarAction: function (action) {
            var selector = '.classic-toolbar [data-action="io.ox/mail/actions/' + action + '"]:not(.disabled)';
            this.waitAndClick(selector);
        },

        setFlags: async function (color_label, flag) {
            await I.executeAsyncScript(function (color_label, flag, done) {
                var http = require('io.ox/core/http');
                http.PUT({
                    module: 'mail',
                    params: { action: 'update', id: 1, folder: 'default0/INBOX' },
                    data: { color_label: color_label || 0, flags: 8, value: !!flag },
                    appendColumns: false
                })
                .always(function () {
                    window.list.reload();
                    done();
                });
            }, color_label, flag);
        },

        removeAllFlags: function () {
            this.setFlags(0, false);
        },

        refreshList: function () {
            I.executeScript(function () {

            });
        }
    };
}
