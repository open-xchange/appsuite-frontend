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
    readdir = util.promisify(fs.readdir);

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

const importMails = async (I, path, start, end) => {
    const files = await readdir(path);
    let size = 0;
    // forEach does not handle await correctly
    I.say(start + ':' + end + ':' + files.length, 'blue');
    for (let index = 0; index < files.length; index++) {
        if (index >= start && index < end) {
            size++;
            await I.haveMail({ folder: 'default0/INBOX', path: `${path}/${files[index]}` });
        }
    }
    return size;
};

const run = async (I, start, end, path) => {
    var size = await importMails(I, 'e2e/media/mails/badmails-xss', start, end);
    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window .list-view');
    for (let i = (size - 1); i >= 0; i--) {
        I.seeElement(`.list-view .list-item[data-index="${i}"] .drag-title`)
    }
    I.logout();
}

Scenario('[C204747] Listing mailbox content (chunk #1)', async function (I) {
    await run(I, 0, 20, 'e2e/media/mails/badmails-xss');
});
Scenario('[C204747] Listing mailbox content (chunk #2)', async function (I) {
    await run(I, 20, 40, 'e2e/media/mails/badmails-xss');
});
Scenario('[C204747] Listing mailbox content (chunk #3)', async function (I) {
    await run(I, 40, 60, 'e2e/media/mails/badmails-xss');
});
Scenario('[C204747] Listing mailbox content (chunk #4)', async function (I) {
    await run(I, 60, 80, 'e2e/media/mails/badmails-xss');
});
Scenario('[C204747] Listing mailbox content (chunk #5)', async function (I) {
    await run(I, 80, 100, 'e2e/media/mails/badmails-xss');
});
Scenario('[C204747] Listing mailbox content (chunk #6)', async function (I) {
    await run(I, 100, 120, 'e2e/media/mails/badmails-xss');
});
