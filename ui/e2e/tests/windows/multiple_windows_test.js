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

Feature('Floating windows').tag('5');

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

const { expect } = require('chai');

Scenario('Opening multiple windows', async function (I, users) {
    I.login('app=io.ox/calendar');
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');

    I.clickToolbar('New');
    I.waitForVisible('*[data-app-name="io.ox/calendar/edit"]');

    I.fillField('Subject', 'Participants test');
    I.click('.fa.fa-address-book');
    I.waitForEnabled('.modal-content .search-field');
    I.fillField('.modal-content .search-field', users[1].get('primaryEmail'));
    I.waitForEnabled('.modal-content .list-item-content');
    I.click(users[1].get('sur_name'), '.modal-content .list-item-content');
    I.click('Select');
    I.wait(0.5);

    I.click('Create');
    I.waitForDetached('*[data-app-name="io.ox/calendar/edit"]');

    I.waitForVisible('.appointment');
    I.click('Participants test', '.appointment');
    I.click(users[1].get('sur_name'), '.participants-view');

    I.waitForVisible({ css: '[data-block="messaging"]' });
    I.click(users[1].get('primaryEmail'), { css: '[data-block="messaging"]' });

    const composeIndex = await I.grabCssPropertyFrom('.io-ox-mail-compose-window', 'z-index');
    const sidePopupIndizes = await I.grabCssPropertyFrom('.io-ox-sidepopup', 'z-index');
    sidePopupIndizes.map(s => Number.parseInt(s, 10)).forEach(function (sidePopupIndex) {
        expect(Number.parseInt(composeIndex, 10)).to.be.above(sidePopupIndex);
    });

    I.waitForVisible('.window-blocker.io-ox-busy');
    I.waitForInvisible('.window-blocker.io-ox-busy');

    I.click('Discard');

    I.logout();
});
