/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Floating windows');

BeforeSuite(async function (users) {
    await users.create();
});

AfterSuite(async function (users) {
    await users.removeAll();
});

const { expect } = require('chai');

Scenario('Opening multiple windows', async function (I, users) {
    I.login('', { user: users[0] });
    I.click('#io-ox-launcher');
    I.click('Calendar', '#io-ox-launcher');
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');

    I.clickToolbar('New');
    I.waitForVisible('*[data-app-name="io.ox/calendar/edit"]');

    I.fillField('Subject', 'Participants test');
    I.click('.fa.fa-address-book');
    I.click('Ejaz', '.modal-content .list-item-content');
    I.click('Select');
    I.wait(0.5);

    I.click('Create');
    I.waitForDetached('*[data-app-name="io.ox/calendar/edit"]');

    I.waitForVisible('.appointment');
    I.click('Participants test', '.appointment');
    I.click('Ejaz', '.participants-view');

    I.waitForVisible({ css: '[data-block="messaging"]' });
    I.click('eahmed@', { css: '[data-block="messaging"]' });

    const composeIndex = await I.grabCssPropertyFrom('.io-ox-mail-compose-window', 'z-index');
    const sidePopupIndizes = await I.grabCssPropertyFrom('.io-ox-sidepopup', 'z-index');
    sidePopupIndizes.map(s => Number.parseInt(s, 10)).forEach(function (sidePopupIndex) {
        expect(Number.parseInt(composeIndex, 10)).to.be.above(sidePopupIndex);
    });

    I.waitForDetached('[data-app-name="io.ox/mail/compose"] .busy');

    I.click('Discard');

    I.logout();
});
