/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <Daniel.Dickhaus@open-xchange.com>
 * @author Jorin Laatsch <Jorin.Laatsch@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('General > Inline help');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[7acfb1bb-68de-4115-b865-f7517386f318][C7352] Open the online app', async function (I) {
    I.login();
    I.clickToolbar('~Support');
    I.waitForText('Help');
    I.click('Help');
    I.waitForText('OX App Suite Help')
});