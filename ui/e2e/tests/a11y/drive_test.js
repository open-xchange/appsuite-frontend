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

const { expect } = require('chai');

Feature('Accessibility');

BeforeSuite(async function ({ users }) {
    await users.create();
});

AfterSuite(async function ({ users }) {
    await users.removeAll();
});

Scenario('Drive - List view w/o files', async ({ I }) => {
    I.login('app=io.ox/files');
    I.waitForElement('.file-list-view.complete');
    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Drive - Icon view w/o files', async ({ I }) => {
    I.login('app=io.ox/files');
    I.waitForText('View', undefined, '.classic-toolbar[aria-label^="Drive toolbar"]');
    I.clickToolbar('View');
    I.click('Icons');
    I.waitForElement('.file-list-view.complete.grid-layout');
    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Drive - Tiles view w/o files', async ({ I }) => {
    I.login('app=io.ox/files');
    I.waitForText('View');
    I.clickToolbar('View');
    I.click('Tiles');
    I.waitForElement('.file-list-view.complete.tile-layout');
    expect(await I.grabAxeReport()).to.be.accessible;
});
