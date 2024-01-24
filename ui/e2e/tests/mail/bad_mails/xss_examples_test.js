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

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Listview @codeReview');

const fs = require('fs'),
    util = require('util'),
    readFile = util.promisify(fs.readFile),
    assert = require('assert'),
    FormData = require('form-data'),
    helperUtil = require('@open-xchange/codecept-helper').util;

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

async function importMails(I, path, start, end) {
    const files = JSON.parse(await readFile(path));
    let size = 0;
    // forEach does not handle await correctly
    I.say(start + ':' + end + ':' + files.length, 'blue');
    for (let index = 0; index < files.length; index++) {
        if (index >= start && index < end) {
            size++;
            const { httpClient, session } = await helperUtil.getSessionForUser();
            let form, response;

            // import the mail
            form = new FormData();
            form.append('file', files[index].content, { filename: files[index].filename, 'Content-Type': files[index]['Content-Type'] });
            response = await httpClient.post('/appsuite/api/mail', form, {
                params: {
                    action: 'import',
                    session: session,
                    folder: 'default0/INBOX',
                    force: true
                },
                headers: form.getHeaders()
            });

            // magic hack to just get the json out of the html response
            const matches = /\((\{.*?\})\)/.exec(response.data);
            const resData = matches && matches[1] ? JSON.parse(matches[1]) : response.data;
            assert.strictEqual(resData.error, undefined, JSON.stringify(resData));
        }
    }
    return size;
}

async function run(I, start, end) {
    var size = await importMails(I, 'media/mails/badmails-xss.json', start, end);
    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window .list-view');
    for (let i = (size - 1); i >= 0; i--) {
        I.retry().waitForElement(`.list-view .list-item[data-index="${i}"] .drag-title`);
    }
    I.logout();
}

Scenario('[C204747] Listing mailbox content (chunk #1)', async function ({ I }) {
    await run(I, 0, 20, 'media/mails/badmails-xss.json');
});
Scenario('[C204747] Listing mailbox content (chunk #2)', async function ({ I }) {
    await run(I, 20, 40, 'media/mails/badmails-xss.json');
});
Scenario('[C204747] Listing mailbox content (chunk #3)', async function ({ I }) {
    await run(I, 40, 60, 'media/mails/badmails-xss.json');
});
Scenario('[C204747] Listing mailbox content (chunk #4)', async function ({ I }) {
    await run(I, 60, 80, 'media/mails/badmails-xss.json');
});
Scenario('[C204747] Listing mailbox content (chunk #5)', async function ({ I }) {
    await run(I, 80, 100, 'media/mails/badmails-xss.json');
});
Scenario('[C204747] Listing mailbox content (chunk #6)', async function ({ I }) {
    await run(I, 100, 120, 'media/mails/badmails-xss.json');
});
