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
 */

/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Mail > Detail');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C101622] Aggressive image replacements @shaky', async (I) => {

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    await I.haveSetting('io.ox/mail//allowHtmlImages', true);

    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'e2e/media/mails/c101622.eml'
    });

    I.login('app=io.ox/mail');
    I.waitForText('Aggressive image replacements');
    I.click('Aggressive image replacements', '.list-item.selectable');

    await within({ frame: '.mail-detail-frame' }, async () => {

        I.waitForElement('.mail-detail-content img');
        I.wait(1);

        let height = await I.executeScript(function () {
            return document.querySelector('.mail-detail-content img').offsetHeight;
        });
        expect(height).to.be.equal(314);

        let width = await I.executeScript(function () {
            return document.querySelector('.mail-detail-content img').offsetWidth;
        });
        expect(width).to.be.equal(236);
    });
});
