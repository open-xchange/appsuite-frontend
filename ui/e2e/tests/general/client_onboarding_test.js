/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Ejaz Ahmed <ejaz.ahmed@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('General > Client Onboarding');

const { I } = inject();

Before(async ({ users }) => {
    await users.create();
    await I.haveSetting('io.ox/core//onboardingWizard', false);
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C73767] Platform Availability', function ({ I, topbar }) {

    I.login();
    topbar.connectYourDevice();
    I.see('Windows');
    I.see('Android');
    I.see('Apple');
});

Scenario('[C73768] Device Availability', function ({ I, topbar }) {

    I.login();
    topbar.connectYourDevice();
    I.click('Apple');
    I.waitForText('What type of device do you want to configure?');
    I.see('iPhone');
    I.see('iPad');
    I.see('Mac');
    I.click({ css: '[data-value="back"]' });
    I.waitForText('Please select the platform of your device.');
    I.click('Android');
    I.see('Smartphone');
    I.see('Tablet');
    I.click({ css: '[data-value="back"]' });
    I.waitForText('Please select the platform of your device.');
    I.click('Windows');
    I.see('Laptop + PC');
});

Scenario('[C73769] Application Availability', function ({ I, topbar }) {

    I.login();
    topbar.connectYourDevice();
    I.click('Apple');
    I.waitForText('What type of device do you want to configure?');
    I.click('iPhone');
    I.see('Mail');
    I.see('Calendar + Address Book');
    I.click({ css: '[data-value="back"]' });
    I.waitForText('What type of device do you want to configure?');
    I.click('iPad');
    I.see('Mail');
    I.see('Calendar + Address Book');
    I.click({ css: '[data-value="back"]' });
    I.waitForText('What type of device do you want to configure?');
    I.click('Mac');
    I.see('Mail');
    I.see('Calendar + Address Book');
    I.click({ css: '[data-value="back"]' });
    I.waitForText('What type of device do you want to configure?');
    I.click({ css: '[data-value="back"]' });
    I.waitForText('Take OX App Suite with you! Stay up-to-date on your favorite devices.');
    I.click('Android');
    I.waitForText('Take OX App Suite with you! Stay up-to-date on your favorite devices.');
    I.click('Smartphone');
    I.see('Mail');
    I.click({ css: '[data-value="back"]' });
    I.waitForText('Take OX App Suite with you! Stay up-to-date on your favorite devices.');
    I.click('Tablet');
    I.see('Mail');
    I.click({ css: '[data-value="back"]' });
    I.waitForText('Take OX App Suite with you! Stay up-to-date on your favorite devices.');
    I.click({ css: '[data-value="back"]' });
    I.click('Windows');
    I.see('Laptop + PC');
});

Scenario('[C73776] Mail Configuration', async function ({ I, users, topbar }) {

    I.login();
    topbar.connectYourDevice();
    // lazy load for user data requires "slower" user interaction
    I.wait(1);
    I.click('Apple');
    I.waitForText('What type of device do you want to configure?');
    I.click('iPhone');
    I.click('Show more options');
    I.click('Configuration Email');
    I.seeElement('input[name=email]');
    let emailId = await I.grabValueFrom({ css: 'input[name=email]' });
    emailId = Array.isArray(emailId) ? emailId[0] : emailId;
    I.seeInField({ css: 'input[name=email]' }, users[0].get('primaryEmail'));
    I.clearField('email');
    I.fillField('email', emailId);
    I.clearField('email');
    let emailwithOutDomain = emailId.substring(0, emailId.indexOf('@') + 1);
    I.fillField('email', emailwithOutDomain);
    I.click('Send', '.action.expanded');
    I.waitForText('Unexpected error: Missing domain');
    I.clearField('email');
    I.seeElement(locate('//button').withText('Send').as('disabled'));
    I.fillField('email', emailId);
    I.click('Send', '.action.expanded');
    I.waitForElement('.fa-check.button-clicked');
});
