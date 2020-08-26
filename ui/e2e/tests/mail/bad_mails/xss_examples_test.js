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
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Listview @codeReview');

const fs = require('fs'),
    util = require('util'),
    readFile = util.promisify(fs.readFile),
    assert = require('assert'),
    FormData = require('form-data'),
    helperUtil = require('@open-xchange/codecept-helper').util,
    path = require('path');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

async function importMails(I, location, start, end) {
    const files = JSON.parse(await readFile(path.resolve(global.codecept_dir, location)));
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
    var size = await importMails(I, 'e2e/media/mails/badmails-xss.json', start, end);
    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window .list-view');
    for (let i = (size - 1); i >= 0; i--) {
        I.retry().waitForElement(`.list-view .list-item[data-index="${i}"] .drag-title`);
    }
    I.logout();
}

Scenario('[C204747] Listing mailbox content (chunk #1)', async function (I) {
    await run(I, 0, 20, 'e2e/media/mails/badmails-xss.json');
});
Scenario('[C204747] Listing mailbox content (chunk #2)', async function (I) {
    await run(I, 20, 40, 'e2e/media/mails/badmails-xss.json');
});
Scenario('[C204747] Listing mailbox content (chunk #3)', async function (I) {
    await run(I, 40, 60, 'e2e/media/mails/badmails-xss.json');
});
Scenario('[C204747] Listing mailbox content (chunk #4)', async function (I) {
    await run(I, 60, 80, 'e2e/media/mails/badmails-xss.json');
});
Scenario('[C204747] Listing mailbox content (chunk #5)', async function (I) {
    await run(I, 80, 100, 'e2e/media/mails/badmails-xss.json');
});
Scenario('[C204747] Listing mailbox content (chunk #6)', async function (I) {
    await run(I, 100, 120, 'e2e/media/mails/badmails-xss.json');
});
