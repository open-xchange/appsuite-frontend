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

Scenario('[C101622] Aggressive image replacements', async ({ I, mail }) => {

    await Promise.all([
        I.haveSetting('io.ox/mail//features/registerProtocolHandler', false),
        I.haveSetting('io.ox/mail//allowHtmlImages', true),
        I.haveMail({
            folder: 'default0/INBOX',
            path: 'e2e/media/mails/c101622.eml'
        })
    ]);

    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.selectMail('Aggressive image replacements');

    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, async () => {

        I.waitForVisible('.mail-detail-content img');

        let height;
        // TODO: Might want to move this into a helper
        // repeat check until img is loaded
        for (let i = 0; i < 10; i++) {
            height = await I.executeScript(function getImgHeight() {
                return document.querySelector('.mail-detail-content img').offsetHeight;
            });
            if (height > 0) break;
            I.say('Image not loaded yet, retrying...');
            I.wait(0.5);
        }
        expect(height).to.be.equal(314);

        let width = await I.executeScript(function getImgWidth() {
            return document.querySelector('.mail-detail-content img').offsetWidth;
        });
        expect(width).to.be.equal(236);
    });
});

Scenario('[OXUIB-134] XSS after loading external images automatically', async ({ I, mail }) => {
    await Promise.all([
        I.haveSetting('io.ox/mail//features/registerProtocolHandler', false),
        I.haveSetting('io.ox/mail//allowHtmlImages', true),
        I.haveMail({
            folder: 'default0/INBOX',
            path: 'e2e/media/mails/oxuib-39.eml'
        })
    ]);

    I.login();
    mail.waitForApp();
    mail.selectMail('test?');

    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForElement({ css: 'a' });
        I.see('XSS?');
    });
});

Scenario('[OXUIB-39] XSS after loading external images on demand', async ({ I, mail }) => {
    await Promise.all([
        I.haveSetting('io.ox/mail//features/registerProtocolHandler', false),
        I.haveSetting('io.ox/mail//allowHtmlImages', false),
        I.haveMail({
            folder: 'default0/INBOX',
            path: 'e2e/media/mails/oxuib-39.eml'
        })
    ]);

    I.login();
    mail.waitForApp();
    mail.selectMail('test?');

    I.waitForElement('.mail-detail-frame');
    I.click('Show images');

    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForElement({ css: 'a' });
        I.see('XSS?');
    });
});
