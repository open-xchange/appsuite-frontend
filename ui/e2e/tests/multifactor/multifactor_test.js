/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Greg Hill <greg.hill@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Security > 2-Step Verification');
let assert = require('assert');
let OTPAuth = require('otpauth');

function getTotp(secret) {
    let totp = new OTPAuth.TOTP({
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret.replace(/ /g, '')
    });
    return totp.generate();
}

Before(async (users, contexts, I) => {
    await users.create();
    await contexts[0].hasCapability('multifactor');
    await I.haveSetting('io.ox/tours//server/disableTours', true, users[0]);
});

After(async (users) => {
    await users.removeAll();
});

async function enterCode(I, code) {
    I.waitForVisible('.multifactorAuthDiv .mfInput');
    I.fillField('.mfInput', code);
    I.click('Next');
}

async function addSMS(I) {
    I.click('#addDevice');
    I.waitForVisible('.mfIcon.fa-mobile');
    I.click('.mfIcon.fa-mobile');
    I.waitForVisible('#deviceNumber');

    I.waitForVisible('.countryCodes');
    I.fillField('#deviceNumber', '5555551212');
    I.wait(1);
    I.click('Ok');
    I.waitForVisible('.multifactorSelector .mfInput');
    I.fillField('.multifactorSelector .mfInput', '0815')
    I.click('Ok');
}

async function addTOTP(I) {
    I.click('#addDevice');
    I.waitForVisible('.mfIcon.fa-google');
    I.click('.mfIcon.fa-google');
    I.waitForVisible('.totpShared');

    let secret = await I.grabTextFrom('.totpShared');
    let code = getTotp(secret);
    I.fillField('#verification', code);
    I.click('Ok');
    return secret;
}

async function handleBackup(I, cancel) {
    I.waitForVisible('ul.mfAddDevice');
    if (cancel) {
        I.click('Close');
        return;
    }
    I.waitForVisible('.fa-file-text-o.mfIcon');
    I.click('.fa-file-text-o.mfIcon');
    I.waitForVisible('.multifactorRecoveryCodeDiv');
    let recovery = await I.grabTextFrom('.multifactorRecoveryCodeDiv');
    I.click('Ok');
    return recovery;
}

Scenario.skip('Add TOTP multifactor and login using', async (I, users) => {

    var [ user ] = users;
    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/multifactor']);
    I.waitForVisible('#addDevice');
    I.wait(1);
    var secret = await addTOTP(I);
    await handleBackup(I);

    I.waitForVisible('.multifactorStatusDiv .fa-google.mfIcon');   // Listed in active list

    I.logout();
    I.wait(1);
    I.login('app=io.ox/mail', user);  // Log back in

    await enterCode(I, getTotp(secret));

    I.waitForVisible('.io-ox-mail-window .window-body .classic-toolbar');
    I.logout();

});

Scenario.skip('TOTP multifactor bad entry', async (I, users) => {

    var [ user ] = users;
    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/multifactor']);
    I.waitForVisible('#addDevice');
    I.wait(1);
    var secret = await addTOTP(I);
    await handleBackup(I);

    I.waitForVisible('.multifactorStatusDiv .fa-google.mfIcon');   // Listed in active list

    I.logout();
    I.wait(1);
    I.login('app=io.ox/mail', user);  // Log back in

    var badCode = getTotp(secret);
    badCode = badCode > 100 ? badCode - 99 : badCode + 99;
    for (var i = 0; i < 3; i++) {
        await enterCode(I, badCode + '');
        I.waitForVisible('.multifactorError');
        I.see('authentication failed');
    }
    await enterCode(I, badCode + '');
    I.waitForVisible('.io-ox-alert');
    I.see('locked', '.io-ox-alert');
    I.waitForVisible('#io-ox-login-username');
    I.login('app=io.ox/mail', user);
    I.waitForVisible('.io-ox-alert');
    I.see('locked', '.io-ox-alert');

});

Scenario.skip('Add SMS multifactor and login using', async (I, users) => {

    var [ user ] = users;
    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/multifactor']);
    I.waitForVisible('#addDevice');
    I.wait(1);
    await addSMS(I);
    await handleBackup(I, true);
    I.waitForVisible('.multifactorStatusDiv .fa-mobile.mfIcon');   // Listed in active list

    I.logout();
    I.wait(1);
    I.login('app=io.ox/mail', user);  // Log back in

    await enterCode(I, '0815');

    I.waitForVisible('.io-ox-mail-window .window-body .classic-toolbar');
    I.logout();

});

Scenario.skip('Add SMS multifactor, then lost device', async (I, users) => {

    var [ user ] = users;
    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/multifactor']);
    I.waitForVisible('#addDevice');
    I.wait(1);
    await addSMS(I);
    let recovery = await handleBackup(I);
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

Scenario.skip('Add multiple multifactors, then login', async (I, users) => {

    var [ user ] = users;
    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/multifactor']);
    I.waitForVisible('#addDevice');
    I.wait(1);
    await addSMS(I);
    let recovery = await handleBackup(I);
    I.waitForVisible('.multifactorStatusDiv .fa-mobile.mfIcon');   // Listed in active list
    await addTOTP(I);
    I.wait(1);
    I.logout();
    I.wait(1);
    I.login('app=io.ox/mail', user);  // Log back in

    I.waitForVisible('.multifactorAuth');
    I.see('Select 2-Step Verification Method', '.modal-header');
    I.click('.fa-mobile');

    await enterCode(I, '0815');
    I.waitForVisible('.io-ox-mail-window .window-body .classic-toolbar');
    I.logout();

});
