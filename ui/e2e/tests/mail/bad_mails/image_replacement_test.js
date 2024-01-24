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
            path: 'media/mails/c101622.eml'
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
            path: 'media/mails/oxuib-39.eml'
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
            path: 'media/mails/oxuib-39.eml'
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

Scenario('[OXUIB-1355] block external images correctly', async ({ I, mail }) => {
    await Promise.all([
        I.haveSetting('io.ox/mail//allowHtmlImages', false),
        I.haveMail({ folder: 'default0/INBOX', path: 'media/mails/OXUIB-1355_1.eml' }),
        I.haveMail({ folder: 'default0/INBOX', path: 'media/mails/OXUIB-1355_2.eml' }),
        I.haveMail({ folder: 'default0/INBOX', path: 'media/mails/OXUIB-1355_3.eml' }),
        I.haveMail({ folder: 'default0/INBOX', path: 'media/mails/OXUIB-1355_4.eml' }),
        I.haveMail({ folder: 'default0/INBOX', path: 'media/mails/OXUIB-1355_5.eml' }),
        I.haveMail({ folder: 'default0/INBOX', path: 'media/mails/OXUIB-1355_6.eml' })
    ]);

    I.login();
    mail.waitForApp();

    // seems puppeteer returns current url (loaction origin + / to be exact) instead of empty string if src is empty
    var location = await I.executeScript(() => location.origin + '/appsuite/ui');

    I.say('testcase 1: No images');
    mail.selectMail('testcase1');
    I.waitForElement('.mail-detail-frame');
    I.dontSee('Show images');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForText('No images today', 10);
    });

    I.say('testcase 2: embedded image');
    mail.selectMail('testcase2');
    I.waitForElement('.mail-detail-frame');
    I.dontSee('Show images');
    await within({ frame: '.mail-detail-frame' }, async () => {
        expect(await I.grabAttributeFrom('.aspect-ratio', 'src')).to.not.equal(location);
    });

    I.say('testcase 3: data url image');
    mail.selectMail('testcase3');
    I.waitForElement('.mail-detail-frame');
    I.dontSee('Show images');
    await within({ frame: '.mail-detail-frame' }, async () => {
        expect(await I.grabAttributeFrom('.dataUrlImage', 'src')).to.not.equal(location);
    });

    I.say('testcase 4: external image');
    mail.selectMail('testcase4');
    I.waitForElement('.mail-detail-frame');
    I.see('Show images');
    await within({ frame: '.mail-detail-frame' }, async () => {
        expect(await I.grabAttributeFrom('.externalImage', 'src')).to.equal(location);
    });

    I.say('testcase 5: embeded image + external image');
    mail.selectMail('testcase5');
    I.waitForElement('.mail-detail-frame');
    I.see('Show images');
    await within({ frame: '.mail-detail-frame' }, async () => {
        expect(await I.grabAttributeFrom('.aspect-ratio', 'src')).to.not.be.empty;
        expect(await I.grabAttributeFrom('.externalImage', 'src')).to.be.equal(location);
    });

    I.say('testcase 6: embeded image + data url image + external image');
    mail.selectMail('testcase6');
    I.waitForElement('.mail-detail-frame');
    I.see('Show images');
    await within({ frame: '.mail-detail-frame' }, async () => {
        expect(await I.grabAttributeFrom('.aspect-ratio', 'src')).to.not.equal(location);
        expect(await I.grabAttributeFrom('.dataUrlImage', 'src')).to.not.equal(location);
        expect(await I.grabAttributeFrom('.externalImage', 'src')).to.equal(location);
    });

    // logout, change setting and login again
    I.logout();
    await I.haveSetting('io.ox/mail//allowHtmlImages', true);
    I.login();
    mail.waitForApp();

    I.say('testcase 1b: No images, external images allowed');
    mail.selectMail('testcase1');
    I.waitForElement('.mail-detail-frame');
    I.dontSee('Show images');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForText('No images today', 10);
    });

    I.say('testcase 2b: embeded image, external images allowed');
    mail.selectMail('testcase2');
    I.waitForElement('.mail-detail-frame');
    I.dontSee('Show images');
    await within({ frame: '.mail-detail-frame' }, async () => {
        expect(await I.grabAttributeFrom('.aspect-ratio', 'src')).to.not.equal(location);
    });

    I.say('testcase 3b: data url image, external images allowed');
    mail.selectMail('testcase3');
    I.waitForElement('.mail-detail-frame');
    I.dontSee('Show images');
    await within({ frame: '.mail-detail-frame' }, async () => {
        expect(await I.grabAttributeFrom('.dataUrlImage', 'src')).to.not.equal(location);
    });

    I.say('testcase 4b: external image, external images allowed');
    mail.selectMail('testcase4');
    I.waitForElement('.mail-detail-frame');
    I.dontSee('Show images');
    await within({ frame: '.mail-detail-frame' }, async () => {
        expect(await I.grabAttributeFrom('.externalImage', 'src')).to.not.equal(location);
    });

    I.say('testcase 5b: embeded image + external image, external images allowed');
    mail.selectMail('testcase5');
    I.waitForElement('.mail-detail-frame');
    I.dontSee('Show images');
    await within({ frame: '.mail-detail-frame' }, async () => {
        expect(await I.grabAttributeFrom('.aspect-ratio', 'src')).to.not.equal(location);
        expect(await I.grabAttributeFrom('.externalImage', 'src')).to.not.equal(location);
    });

    I.say('testcase 6b: embeded image + data url image + external image, external images allowed');
    mail.selectMail('testcase6');
    I.waitForElement('.mail-detail-frame');
    I.dontSee('Show images');
    await within({ frame: '.mail-detail-frame' }, async () => {
        expect(await I.grabAttributeFrom('.aspect-ratio', 'src')).to.not.equal(location);
        expect(await I.grabAttributeFrom('.dataUrlImage', 'src')).to.not.equal(location);
        expect(await I.grabAttributeFrom('.externalImage', 'src')).to.not.equal(location);
    });
});
