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

const { expect } = require('chai');

Feature('General > Connect your device wizard');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

// new connect your device wizard, see OXUI-793

Scenario('Show available setup scenarios based on capabilites', async ({ I, topbar, users }) => {

    I.login();
    I.refreshPage();
    topbar.connectDeviceWizard();
    await within('.wizard-container', () => {
        I.waitForText('Which device do you want to configure?');
        I.click('Windows PC');
        I.waitForText('OX Drive');
        I.click('OX Drive');
        I.waitForElement(
            locate('.btn.download')
            .withText('OX Drive for Windows')
        );
        I.click('.progress-btn[data-action="reset"]');
        I.waitForText('Which device do you want to configure?');
        I.waitForText('Android');
        I.click('Android');
        I.waitForText('OX Drive');
    });


    await users[0].hasModuleAccess({ infostore: false });
    I.refreshPage();
    topbar.connectDeviceWizard();
    await within('.wizard-container', () => {
        I.waitForText('Which device do you want to configure?');
        I.click('Windows PC');
        I.waitForText('Mail');
        I.dontSee('OX Drive');
        I.click('Back');
        I.waitForText('Android');
        I.click('Android');
        I.waitForText('Email with Android Mail');
        I.dontSee('OX Drive');
        I.click('Close');
    });

    I.logout();
    I.login('app=io.ox/mail&cap=caldav');
    I.refreshPage();
    topbar.connectDeviceWizard();
    await within('.wizard-container', () => {
        I.waitForText('Which device do you want to configure?');
        I.click('Android');
        I.waitForText('Calendar');
        I.click('Calendar');
        I.waitForText('URL');
        I.click('Close');
    });

});

Scenario('Progressbar updates on selection and navigation', async ({ I, topbar }) => {

    I.login();
    I.refreshPage();
    topbar.connectDeviceWizard();
    await within('.wizard-container', () => {
        I.waitForText('Which device do you want to configure?');
        I.waitForElement('.progress-step-one.active');
        I.click('Android');
        I.waitForElement('.progress-step-two.active');
        I.dontSeeElement('.progress-step-one.active');
        I.waitForText('Android', 5, '.progress-steps');
        I.waitForText('Email with Android Mail');
        I.click('Email with Android Mail');
        I.waitForElement('.progress-step-three.active');
        I.dontSeeElement('.progress-step-two.active');
        I.waitForText('Mail', 5, '.progress-steps');
        I.waitForText('IMAP');
        I.click('.progress-step-two');
        I.waitForElement('.progress-step-two.active');
        I.dontSeeElement('.progress-step-three.active');
        I.waitForText('Email with Android Mail');
        I.click('Email with Android Mail');
        I.waitForText('IMAP');
        I.click('.progress-step-one');
        I.waitForElement('.progress-step-one.active');
        I.dontSeeElement('.progress-step-three.active');
        I.dontSee('Android', '.progress-steps');
        I.dontSee('Mail', '.progress-steps');
    });
});

Scenario('Generate QR codes for app downloads', async ({ I, topbar }) => {

    I.login('app=io.ox/mail&cap=mobile_mail_app');
    I.refreshPage();
    topbar.connectDeviceWizard();
    await within('.wizard-container', () => {
        I.waitForText('Which device do you want to configure?');
        I.waitForText('Android');
        I.click('Android');
        I.waitForText('Email with OX Mail');
        I.click('Email with OX Mail');
        I.waitForVisible('.qrcode');
        I.click('Back');
        I.waitForText('OX Drive');
        I.click('OX Drive');
        I.waitForVisible('.qrcode');
        I.click('.progress-step-one');
        I.waitForText('iPhone or iPad');
        I.click('iPhone or iPad');
        I.waitForText('Email with OX Mail');
        I.click('Email with OX Mail');
        I.waitForVisible('.qrcode');
        I.click('Back');
        I.waitForText('OX Drive');
        I.click('OX Drive');
        I.waitForVisible('.qrcode');
        I.click('Close');
    });
});

Scenario('Change product names and check for different platforms', async ({ I, topbar, users }) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);

    const [user1, user2, user3] = users;
    const customMailApp = 'Awesome Mail App';
    const customDriveApp = 'Awesome Drive App';

    const checkAppNames = async (mailAppName, driveAppName) => {
        await within('.wizard-container', () => {
            I.waitForText('Which device do you want to configure?');
            I.waitForText('Android');
            I.click('Android');
            I.waitForText(mailAppName);
            I.click(mailAppName);
            I.waitForText(mailAppName, 5, '.progress-steps');
            I.waitForText(`To install ${mailAppName}`);
            I.click('Back');
            I.waitForText(driveAppName);
            I.click(driveAppName);
            I.waitForText(driveAppName, 5, '.progress-steps');
            I.waitForText(`To install ${driveAppName}`);
            I.click('.progress-step-one');
            I.waitForText('iPhone');
            I.click('iPhone');
            I.waitForText(mailAppName);
            I.waitForText(driveAppName);
        });
    };
    await session('Alice', async () => {
        await I.haveSetting({
            'io.ox/onboarding': {
                'productNames/mail': customMailApp
            }
        }, { user: user1 });
        I.login('app=io.ox/mail&cap=mobile_mail_app', { user: user1 });
        I.refreshPage();
        topbar.connectDeviceWizard();
        await checkAppNames(customMailApp, 'OX Drive');
    });

    await session('Bob', async () => {
        await I.haveSetting({
            'io.ox/onboarding': {
                'productNames/drive': customDriveApp
            }
        }, { user: user2 });
        I.login('app=io.ox/mail&cap=mobile_mail_app', { user: user2 });
        I.refreshPage();
        topbar.connectDeviceWizard();
        await checkAppNames('OX Mail', customDriveApp);
    });

    await session('Charlie', async () => {
        await I.haveSetting({
            'io.ox/onboarding': {
                'productNames/mail': customMailApp,
                'productNames/drive': customDriveApp
            }
        }, { user: user3 });
        I.login('app=io.ox/mail&cap=mobile_mail_app', { user: user3 });
        I.refreshPage();
        topbar.connectDeviceWizard();
        await checkAppNames(customMailApp, customDriveApp);

    });

});

Scenario('Connect your device wizards supports upsell', async ({ I, topbar, mail, users }) => {
    // access combination groupware disables active_sync capability
    await users[0].hasAccessCombination('groupware');

    I.login();
    I.refreshPage();
    mail.waitForApp();

    topbar.connectDeviceWizard();

    // Scenario 1: Upsell is not enabled && capability is disabled (don't show EAS entry)
    await within('.wizard-container', () => {
        I.waitForText('Which device do you want to configure?');
        I.click('iPhone or iPad');

        I.waitForText('Which application do you want to use?');
        I.waitForText('OX Drive');
        I.click('OX Drive');
        I.waitForVisible('.qrcode');
        I.click('Back');

        // check if button is disabled
        I.waitForText('Which application do you want to use?');
        I.dontSee('Exchange Active Sync');
    });

    await I.haveSetting('io.ox/core//upsell/enabled/active_sync', true);
    I.refreshPage();
    mail.waitForApp();
    await I.executeScript('ox.on("upsell:requires-upgrade", () => console.log("Event caught"))');
    topbar.connectDeviceWizard();

    // Scenario 2: Upsell is enabled && capability is disabled (show locked EAS entry)
    await within('.wizard-container', () => {
        I.waitForText('Which device do you want to configure?');
        I.click('iPhone or iPad');

        I.waitForText('Which application do you want to use?');
        I.waitForText('OX Drive');
        I.click('OX Drive');
        I.waitForVisible('.qrcode');
        I.click('Back');

        // check if button is disabled
        I.waitForText('Which application do you want to use?');
        I.waitForVisible(locate('.list-btn.disabled .list-description').withText('Exchange Active Sync'));
        I.click('Exchange Active Sync');
    });
    // check if event "upsell:requires-upgrade" was fired by checking console
    const logs = await I.grabBrowserLogs();
    const msg = logs.find(log => log._text === 'Event caught');
    expect(msg).to.exist;

    // enable active_sync again, check if upsell is not offered
    await users[0].hasAccessCombination('all');
    I.refreshPage();
    mail.waitForApp();
    topbar.connectDeviceWizard();

    // Scenario 3: Upsell is enabled && user does not have capability (show unlocked EAS entry)
    await within('.wizard-container', () => {
        I.waitForText('Which device do you want to configure?');
        I.click('iPhone or iPad');

        I.waitForText('Which application do you want to use?');
        I.waitForText('Exchange Active Sync');
        I.click('Exchange Active Sync');
        I.waitForVisible('.qrcode');
    });
});
