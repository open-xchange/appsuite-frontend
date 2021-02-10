/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Olena Stute <olena.stute@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

//Need to be refactored for 1 user = 1 context

Feature('Portal');

Before(async ({ users, contexts }) => {
    const ctx = await contexts.create();

    await Promise.all([
        ctx.hasQuota(1000),
        users.create(users.getRandom(), ctx)
    ]);
});
After(async ({ users, contexts }) => {
    await users.removeAll();
    await contexts[1].remove();
});

Scenario('[C7495] Quota update', async ({ I, users }) => {

    const assert = require('chai').assert;

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    //Add Recently changed files widget to Portal
    I.login('app=io.ox/portal');
    I.waitForVisible('.io-ox-portal');
    I.click('Add widget');
    I.waitForVisible('.io-ox-portal-settings-dropdown');
    I.click('Quota');
    I.waitForElement('~Quota');
    I.waitForText('File quota', 5, '.widget[aria-label="Quota"]');

    //Save file quota values
    const textBefore = await I.grabTextFrom(locate('.widget .io-ox-quota-view .numbers').inside(locate('.io-ox-quota-view').withText('File quota')));
    const quotaBefore = Number.parseFloat(textBefore.split(' ')[0]);
    const [progressWidthBefore] = await I.grabCssPropertyFrom(locate('.widget .io-ox-quota-view .progress-bar.default').inside(locate('.io-ox-quota-view').withText('File quota')), 'width');
    const progressBefore = Number.parseFloat(progressWidthBefore.replace('px', ''));

    // Add a file to portal
    I.openApp('Drive');
    I.waitForVisible('.io-ox-files-window');
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testspreadsheed.xlsm');

    I.waitForVisible('~Refresh');
    I.retry(5).click('~Refresh', '#io-ox-appcontrol');
    I.waitForElement('#io-ox-refresh-icon .fa-spin');
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');

    //Go back to Portal, refresh
    I.openApp('Portal');
    I.waitForVisible('.io-ox-portal-window');
    I.waitForVisible('~Refresh');
    I.retry(5).click('~Refresh', '#io-ox-appcontrol');
    I.waitForElement('#io-ox-refresh-icon .fa-spin');
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');

    //Get updated quota
    const textAfter = await I.grabTextFrom(locate('.widget .io-ox-quota-view .numbers').inside(locate('.io-ox-quota-view').withText('File quota')));
    const quotaAfter = Number.parseFloat(textAfter.split(' ')[0]);
    const [progressWidthAfter] = await I.grabCssPropertyFrom(locate('.widget .io-ox-quota-view .progress-bar.default').inside(locate('.io-ox-quota-view').withText('File quota')), 'width');
    const progressAfter = Number.parseFloat(progressWidthAfter.replace('px', ''));

    //Verify quota is updated
    assert.isAbove(quotaAfter, quotaBefore, 'Oops');
    assert.isAtLeast(progressAfter, progressBefore, 'Oops'); //(>=)
});

