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

Feature('General > Connect your device wizard');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

// new connect your device wizard, see OXUI-793

Scenario('Show available setup scenarios based on capabilites', async ({ I, topbar, users, mail }) => {

    I.login();
    mail.waitForApp();
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
    mail.waitForApp();
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
    mail.waitForApp();
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

Scenario('Progressbar updates on selection and navigation', async ({ I, topbar, mail }) => {

    I.login();
    mail.waitForApp();
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

Scenario('Generate QR codes for app downloads', async ({ I, topbar, mail }) => {

    I.login('app=io.ox/mail&cap=mobile_mail_app');
    mail.waitForApp();
    topbar.connectDeviceWizard();
    await within('.wizard-container', () => {
        I.waitForText('Which device do you want to configure?');
        I.waitForText('Android');
        I.click('Android');
        I.waitForText('OX Drive');
        I.click('OX Drive');
        I.waitForVisible('.qrcode');
        I.click('.progress-step-one');
        I.waitForText('iPhone or iPad');
        I.click('iPhone or iPad');
        I.waitForText('OX Drive');
        I.click('OX Drive');
        I.waitForVisible('.qrcode');
        I.click('Close');
    });
});

Scenario('Change product names and check for different platforms', async ({ I, topbar, users, mail }) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);

    const [user1] = users;
    const customDriveApp = 'Awesome Drive App';

    const checkAppNames = async (driveAppName) => {
        await within('.wizard-container', () => {
            I.waitForText('Which device do you want to configure?');
            I.waitForText('Android');
            I.click('Android');
            I.waitForText(driveAppName);
            I.click(driveAppName);
            I.waitForText(driveAppName, 5, '.progress-steps');
            I.waitForText(`To install ${driveAppName}`);
            I.click('.progress-step-one');
            I.waitForText('iPhone');
            I.click('iPhone');
            I.waitForText(driveAppName);
        });
    };

    await session('Bob', async () => {
        await I.haveSetting({
            'io.ox/onboarding': {
                'productNames/drive': customDriveApp
            }
        }, { user: user1 });

        I.login('app=io.ox/mail&cap=mobile_mail_app', { user: user1 });
        mail.waitForApp();
        topbar.connectDeviceWizard();
        await checkAppNames(customDriveApp);
    });

});

Scenario('Connect your device wizards supports upsell', async ({ I, topbar, mail, users }) => {
    // access combination groupware disables active_sync capability
    await users[0].hasAccessCombination('webmail');

    I.login();
    mail.waitForApp();

    topbar.connectDeviceWizard();

    // Scenario 1: Upsell is not enabled && capability is disabled (don't show EAS entry)
    I.waitForText('Which device do you want to configure?', 5, '.wizard-container');
    I.click('iPhone or iPad', '.wizard-container');

    I.waitForText('Which application do you want to use?', 5, '.wizard-container');
    // check if button is disabled
    I.waitForText('Which application do you want to use?', 5, '.wizard-container');
    I.dontSee('Exchange Active Sync', '.wizard-container');

    await I.haveSetting({
        'io.ox/core': {
            'upsell/activated': true,
            'upsell/enabled': { active_sync: true, caldav: true, carddav: true }
        }
    });
    I.refreshPage();
    mail.waitForApp();
    await I.executeScript(function () {
        ox.on('upsell:requires-upgrade', () => document.body.classList.add('upsell-triggered'));
    });
    topbar.connectDeviceWizard();

    // Scenario 2: Upsell is enabled && capability is disabled (show locked EAS entry)
    I.waitForText('Which device do you want to configure?', 5, '.wizard-container');
    I.click('iPhone or iPad', '.wizard-container');

    I.waitForText('Which application do you want to use?', 5, '.wizard-container');
    I.waitForVisible(locate('.list-btn.disabled .list-description').withText('Calendar'));
    I.waitForVisible(locate('.list-btn.disabled .list-description').withText('Address Book'));
    I.waitForVisible(locate('.list-btn.disabled .list-description').withText('Exchange Active Sync'));
    I.click('Exchange Active Sync', '.wizard-container');

    // check if event "upsell:requires-upgrade" was fired by checking if body has class "upsell-triggered"
    I.waitForElement('.upsell-triggered');
    // enable active_sync again, check if upsell is not offered
    await users[0].hasAccessCombination('all');
    I.refreshPage();
    mail.waitForApp();
    topbar.connectDeviceWizard();

    // Scenario 3: Upsell is enabled && user does not have capability (show unlocked EAS entry)
    I.waitForText('Which device do you want to configure?', 5, '.wizard-container');
    I.click('iPhone or iPad', '.wizard-container');

    I.waitForText('Which application do you want to use?', 5, '.wizard-container');
    I.waitForText('Exchange Active Sync', 5, '.wizard-container');
    I.dontSeeElement(locate('.list-btn.disabled .list-description').withText('Exchange Active Sync'));
    I.click('Exchange Active Sync', '.wizard-container');
    I.waitForVisible('.wizard-container .qrcode');
});
