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

