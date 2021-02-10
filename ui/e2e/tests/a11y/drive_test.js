/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
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
