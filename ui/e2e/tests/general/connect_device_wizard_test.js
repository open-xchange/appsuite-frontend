/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
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
            locate('.btn-link.download')
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

Scenario('Change product names and check for different platforms', async ({ I, topbar }) => {

    const mailApp = 'Awesome Mail App';
    const driveApp = 'Awesome Drive App';

    await I.haveSetting({
        'io.ox/onboarding': {
            'productNames/mail': mailApp,
            'productNames/drive': driveApp
        }
    });
    I.login('app=io.ox/mail&cap=mobile_mail_app');
    I.refreshPage();
    topbar.connectDeviceWizard();
    await within('.wizard-container', () => {
        I.waitForText('Which device do you want to configure?');
        I.waitForText('Android');
        I.click('Android');
        I.waitForText(mailApp);
        I.click(mailApp);
        I.waitForText(mailApp, 5, '.progress-steps');
        I.waitForText(`To install ${mailApp}`);
        I.click('Back');
        I.waitForText(driveApp);
        I.click(driveApp);
        I.waitForText(driveApp, 5, '.progress-steps');
        I.waitForText(`To install ${driveApp}`);
        I.click('.progress-step-one');
        I.waitForText('iPhone');
        I.click('iPhone');
        I.waitForText(mailApp);
        I.waitForText(driveApp);
    });
});
