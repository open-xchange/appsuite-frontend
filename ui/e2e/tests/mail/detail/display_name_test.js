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
        path: 'media/mails/Bug_67245.eml'
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
