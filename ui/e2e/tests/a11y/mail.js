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

Scenario('Mail - List view w/o mail', async (I) => {
    I.login('app=io.ox/mail');
    I.waitForElement('.mail-detail-pane');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Mail - Compose window (with exceptions)', async (I) => {
    // Exceptions:
    // Typeahead missing label (critical), TinyMCE toolbar invalid role (minor issue)
    const excludes = { exclude: [['.to'], ['.mce-open'], ['.mce-toolbar']] };

    I.login('app=io.ox/mail');
    I.waitForElement('.mail-detail-pane');
    I.clickToolbar('Compose');
    I.waitForElement('.mce-tinymce');

    expect(await I.grabAxeReport(excludes)).to.be.accessible;
});
