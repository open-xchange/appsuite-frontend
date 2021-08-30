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

/// <reference path="../../steps.d.ts" />

Feature('General > Floating windows');

Before(async function ({ users }) {
    await users.create();
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

const { expect } = require('chai');

Scenario('Opening multiple windows', async function ({ I, users, calendar, dialogs }) {
    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    calendar.newAppointment();

    I.retry(5).fillField('Subject', 'Participants test');
    I.click('.fa.fa-address-book');
    dialogs.waitForVisible();
    I.waitForEnabled('.modal-content .search-field');
    I.fillField('.modal-content .search-field', users[1].get('primaryEmail'));
    I.waitForEnabled('.modal-content .list-item-content');
    I.click(users[1].get('sur_name'), '.modal-content .list-item-content');
    dialogs.clickButton('Select');
    I.waitForDetached('.modal-dialog');

    I.click('Create');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.waitForVisible('.appointment');
    I.click('Participants test', '.appointment');
    I.waitForText(users[1].get('sur_name'), 5, '.participants-view');
    I.click(users[1].get('sur_name'), '.participants-view');

    I.waitForVisible({ css: '[data-block="communication"]' });
    I.click(users[1].get('primaryEmail'), { css: '[data-block="communication"]' });

    // wait until compose window is active
    I.waitForVisible('.io-ox-mail-compose-window.active');

    const composeIndex = await I.grabCssPropertyFromAll('.io-ox-mail-compose-window', 'zIndex');
    const sidePopupIndizes = await I.grabCssPropertyFromAll('.io-ox-sidepopup', 'zIndex');
    sidePopupIndizes.map(s => Number.parseInt(s, 10)).forEach(function (sidePopupIndex) {
        expect(Number.parseInt(composeIndex, 10)).to.be.above(sidePopupIndex);
    });
});
