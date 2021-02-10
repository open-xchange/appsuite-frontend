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

Feature('Mail > Detail');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C101624] Parsing CSS in HTML mails', async function ({ I }) {

    await I.haveMail({ folder: 'default0/INBOX', path:   'e2e/media/mails/c101624_1.eml' });
    await I.haveMail({ folder: 'default0/INBOX', path:   'e2e/media/mails/c101624_2.eml' });

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window .list-view');

    I.say('check c101624_1.eml', 'blue');
    I.waitForVisible('.list-item[data-index="0"]');
    I.click('.list-item[data-index="0"]', '.list-view');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.waitForVisible('.mail-detail-frame');
    await within({ frame: '.mail-detail-frame' }, async function () {
        I.seeTextEquals('HTML BODY', 'body');
    });

    I.say('check c101624_2.eml', 'blue');
    I.click('.list-item[data-index="1"]', '.list-view');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.waitForVisible('.mail-detail-frame');
    await within({ frame: '.mail-detail-frame' }, async function () {
        I.seeTextEquals('BODY 1', 'body');
    });
});

