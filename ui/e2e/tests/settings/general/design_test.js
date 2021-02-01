/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />
const moment = require('moment');
Feature('Settings > Basic');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C244801] Set design', async ({ I }) => {

    // dusk
    await I.haveSetting({ 'io.ox/core': { design: 'dusk' } });
    I.login();
    I.waitForElement('html.design-dusk');
    I.logout();

    // blue
    await I.haveSetting({ 'io.ox/core': { design: 'primary' } });
    I.login();
    I.waitForElement('html.design-primary');
    I.logout();

    // time-based
    await I.haveSetting({ 'io.ox/core': { design: 'time' } });
    I.login();
    var h = moment().format('H'), design = getTimeDependentDesign(h);

    // See io.ox/core/main/designs.js
    function getTimeDependentDesign(h) {
        if (h < 6) return 'night';
        if (h < 9) return 'twilight';
        if (h < 12) return 'dawn';
        if (h < 18) return 'day';
        if (h < 23) return 'dusk';
        return 'late';
    }

    I.waitForElement('html.design-' + design);
});
