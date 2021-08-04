/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Detail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C114335] Links in emails can be disabled on a per-folder basis', async ({ I, users }) => {

    var icke = users[0].userdata.email1;

    await I.haveMail({
        attachments: [{
            content: 'Lorem ipsum <a href="https://www.example.com/">example.com</a>.',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [['Icke', icke]],
        subject: 'Disable links',
        to: [['Icke', icke]]
    });

    // turn links OFF
    await testCycle(true, async function () {
        I.waitForElement('.mail-detail-content.disable-links');
        I.seeNumberOfElements('.mail-detail-content > a[disabled]', 1);
    });

    // turn links ON
    await testCycle(false, async function () {
        I.waitForElement('.mail-detail-content:not(.disable-links)');
        I.seeNumberOfElements('.mail-detail-content > a:not([disabled])', 1);
    });

    async function testCycle(flag, callback) {
        // toggle HTML formatting
        await I.haveSetting({ 'io.ox/mail': { maliciousCheck: flag } });
        I.login('app=io.ox/mail');
        // injecting "maliciousFolders" does not work
        I.executeScript(function (flag) {
            require('io.ox/mail/util').isMalicious = _.constant(flag);
        }, flag);
        // wait for first email
        var firstItem = '.list-view .list-item';
        I.waitForElement(firstItem);
        I.click(firstItem);
        I.waitForVisible('.thread-view.list-view .list-item');
        I.waitForVisible('.mail-detail-frame');
        // check content
        within({ frame: '.mail-detail-frame' }, callback);
        I.logout();
    }
});
