/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose');

const expect = require('chai').expect;

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C12122] Auto-size recipient fields', async function (I, mail) {

    let height;

    I.login('app=io.ox/mail');
    mail.newMail();

    height = await I.grabCssPropertyFrom({ css: '[data-extension-id="to"]' }, 'height');
    expect(parseInt(height, 10)).to.be.lessThan(35);

    I.click({ css: '[placeholder="To"]' });
    for (let i = 0; i < 5; i++) {
        I.fillField('To', `testmail${i}@testmail.com`);
        I.pressKey('Enter');
        I.wait(0.2);
    }

    height = await I.grabCssPropertyFrom({ css: '[data-extension-id="to"]' }, 'height');
    expect(parseInt(height, 10)).to.be.greaterThan(35);

    for (let i = 1; i < 5; i++) {
        I.click('~Remove', `~testmail${i}@testmail.com`);
    }

    height = await I.grabCssPropertyFrom({ css: '[data-extension-id="to"]' }, 'height');
    expect(parseInt(height, 10)).to.be.lessThan(35);

});
