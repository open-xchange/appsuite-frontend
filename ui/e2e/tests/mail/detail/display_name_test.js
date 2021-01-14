/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Mail > Detail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[Bug 67245] Forwarded mails from external clients without a displayname get NULL as name', async ({ I, users, mail }) => {


    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'e2e/media/mails/Bug_67245.eml'
    }, users[0]);

    I.login('app=io.ox/mail');
    mail.waitForApp();

    // check mail
    I.waitForText('Bestest Mail Ever');
    I.click('.list-view .list-item');
    I.waitForVisible('.thread-view.list-view .list-item .mail-detail-frame');
    I.waitForText('mostawesomeaddress@world.bestest');
    I.dontSee('null');

    // check mail in mail compose as forwarded mail
    I.click('Forward');
    // same as helper
    I.waitForVisible('.io-ox-mail-compose [placeholder="To"]', 30);
    I.waitForFocus('.io-ox-mail-compose [placeholder="To"]');

    // dont use seeInField here as it cannot match partial text (only works with exact match)
    var content = await I.grabValueFrom('.io-ox-mail-compose textarea.plain-text');
    expect(content).to.contain('From: mostAwesomeAddress@world.bestest');
    expect(content).to.not.contain('null');
});
