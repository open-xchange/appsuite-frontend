/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/// <reference path="../../steps.d.ts" />

Feature('Settings > Security > 2-Step Verification');
const OTPAuth = require('otpauth');
const { I } = inject();

function getTotp(secret) {
    const totp = new OTPAuth.TOTP({
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret.replace(/ /g, '')
    });
    return totp.generate();
}

Before(async ({ users }) => {
    const user = await users.create();
    await Promise.all([
        user.context.hasCapability('multifactor'),
        I.haveSetting('io.ox/tours//server/disableTours', true, { user })
    ]);
});

After(async ({ users }) => {
    await users[0].context.doesntHaveCapability('multifactor');
    await users.removeAll();
});

async function enterCode(code) {
    I.waitForVisible('.multifactorAuthDiv .mfInput');
    I.fillField('.mfInput', code);
    I.click('Next');
}

async function addSMS() {
    I.click('#addDevice');
    I.waitForVisible('.mfIcon.fa-mobile');
    I.click('.mfIcon.fa-mobile');
    I.waitForVisible('#deviceNumber');

    I.waitForVisible('.countryCodes');
    I.fillField('#deviceNumber', '5555551212');
    I.wait(1);
    I.click('Ok');
    I.waitForVisible('.multifactorSelector .mfInput');
    I.fillField('.multifactorSelector .mfInput', '0815');
    I.click('Ok');
}

async function addTOTP() {
    I.click('#addDevice');
    I.waitForVisible('.mfIcon.fa-google');
    I.click('.mfIcon.fa-google');
    I.waitForVisible('.totpShared');

    const secret = await I.grabTextFrom('.totpShared');
    const code = getTotp(secret);
    I.fillField('#verification', code);
    I.click('Ok');
    return secret;
}

async function handleBackup({ cancel } = {}) {
    I.waitForVisible('ul.mfAddDevice');
    if (cancel) {
        I.click('Close');
        return;
    }
    I.waitForVisible('.fa-file-text-o.mfIcon');
    I.click('.fa-file-text-o.mfIcon');
    I.waitForVisible('.multifactorRecoveryCodeDiv');
    const recovery = await I.grabTextFrom('.multifactorRecoveryCodeDiv');
    I.click('Ok');
    return recovery;
}

Scenario('Add TOTP multifactor and login using', async ({ I, users }) => {

    const [user] = users;
    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/multifactor']);
    I.waitForVisible('#addDevice');
    I.wait(1);
    const secret = await addTOTP();
    await handleBackup();

    I.waitForVisible('.multifactorStatusDiv .fa-google.mfIcon');   // Listed in active list

    I.logout();
    I.wait(1);
    I.login('app=io.ox/mail', user);  // Log back in

    await enterCode(getTotp(secret));

    I.waitForVisible('.io-ox-mail-window .window-body .classic-toolbar');
    I.logout();

});

Scenario('TOTP multifactor bad entry', async ({ I, users }) => {

    const [user] = users;
    await user.hasConfig('com.openexchange.multifactor.maxBadAttempts', 4);
    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/multifactor']);
    I.waitForVisible('#addDevice');
    I.wait(1);
    const secret = await addTOTP();
    await handleBackup();

    I.waitForVisible('.multifactorStatusDiv .fa-google.mfIcon');   // Listed in active list

    I.logout();
    I.wait(1);
    I.login('app=io.ox/mail', user);  // Log back in

    let badCode = getTotp(secret);
    badCode = badCode > 100 ? badCode - 99 : badCode + 99;
    for (let i = 0; i < 3; i++) {
        await enterCode(badCode + '');
        I.waitForVisible('.multifactorError');
        I.see('authentication failed');
    }
    await enterCode(badCode + '');
    I.waitForVisible('.io-ox-alert');
    I.see('locked', '.io-ox-alert');
    I.waitForVisible('#io-ox-login-username');
    I.login('app=io.ox/mail', user);
    I.waitForVisible('.io-ox-alert');
    I.see('locked', '.io-ox-alert');

});

Scenario('Add SMS multifactor and login using', async ({ I, users }) => {

    const [user] = users;
    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/multifactor']);
    I.waitForVisible('#addDevice');
    I.wait(1);
    await addSMS();
    await handleBackup({ cancel: true });
    I.waitForVisible('.multifactorStatusDiv .fa-mobile.mfIcon');   // Listed in active list

    I.logout();
    I.wait(1);
    I.login('app=io.ox/mail', user);  // Log back in

    await enterCode('0815');

    I.waitForVisible('.io-ox-mail-window .window-body .classic-toolbar');
    I.logout();

});

Scenario('Add SMS multifactor, then lost device', async ({ I, users }) => {

    const [user] = users;
    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/multifactor']);
    I.waitForVisible('#addDevice');
    I.wait(1);
    await addSMS();
    let recovery = await handleBackup();
    I.waitForVisible('.multifactorStatusDiv .fa-mobile.mfIcon');   // Listed in active list

    I.logout();
    I.wait(1);
    I.login('app=io.ox/mail', user);  // Log back in

    I.waitForVisible('.multifactorAuthDiv .mfInput');
    I.click('I lost my device');

    I.waitForElement('#code-0');
    I.wait(1);
    Array.from(recovery).forEach(function (k) {
        if (k !== ' ') {
            I.pressKey(k);
        }
    });
    I.wait(1);
    I.click('Next');
    I.waitForVisible('.io-ox-mail-window .window-body .classic-toolbar');
    I.logout();

});

Scenario('Add multiple multifactors, then login', async ({ I, users }) => {

    const [user] = users;
    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/multifactor']);
    I.waitForVisible('#addDevice');
    I.wait(1);
    await addSMS();
    await handleBackup();
    I.waitForVisible('.multifactorStatusDiv .fa-mobile.mfIcon');   // Listed in active list
    await addTOTP();
    I.wait(1);
    I.logout();
    I.wait(1);
    I.login('app=io.ox/mail', user);  // Log back in

    I.waitForVisible('.multifactorAuth');
    I.see('Select 2-Step Verification Method', '.modal-header');
    I.click('.fa-mobile');

    await enterCode('0815');
    I.waitForVisible('.io-ox-mail-window .window-body .classic-toolbar');
    I.logout();

});
