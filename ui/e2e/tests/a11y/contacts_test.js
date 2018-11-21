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

const excludedElements = [
    ['#io\\.ox\\/contacts-search-field80'],  // Search field does not have a visible label
    ['.select-all[role="checkbox"]'], // role checkbox is not allowed here
    ['header.contact-header'] // The banner landmark is contained in another landmark
];

const excludedRules = {
    'region': { enabled: false }, // Feedback Button and Foldertree toggle should have a landmark role
    'landmark-no-duplicate-banner': { enabled: false } // No duplicate landmark (No header in contact detail)
};

Feature('A11y for Contacts App');

Before(async function (users) {
    await users.create();
});

Scenario('Default List view w/o contact', async function (I) {
    I.login('app=io.ox/contacts');

    I.waitForElement('.contact-detail');
    I.waitForElement('.vgrid-cell.selectable.contact.selected');
    I.click('View');
    I.click('Checkboxes');
    I.click('.vgrid-cell.selectable.contact.selected .vgrid-cell-checkbox');
    I.waitForElement('.summary.empty');

    const currentView = await I.grabAxeReport({ exclude: excludedElements }, { rules: excludedRules });
    expect(currentView).to.be.accessible;
});


Scenario('Default List view with contact detail view', async function (I) {
    I.login('app=io.ox/contacts');

    I.waitForElement('.contact-detail');
    const currentView = await I.grabAxeReport({ exclude: excludedElements }, { rules: excludedRules });
    expect(currentView).to.be.accessible;
});
