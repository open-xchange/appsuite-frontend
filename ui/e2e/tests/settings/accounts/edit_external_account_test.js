/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Björn Köster <bjoern.koester@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Custom mail account');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7839] Edit external mail account', async ({ I, mail, settings, dialogs }) => {
    await I.haveSetting('io.ox/mail//messageFormat', 'text');

    const { data: {
        primary_address
    } } = await I.haveMailAccount({ name: 'External', extension: 'ext' });

    I.login();
    mail.waitForApp();
    I.openApp('Settings');
    settings.waitForApp();
    settings.select('Accounts');
    I.waitForVisible('~Edit External');
    I.retry(10).click('~Edit External');
    dialogs.waitForVisible();
    I.fillField('Account name', primary_address);
    I.fillField('Email address', primary_address);
    I.dontSeeElement('input[name="name"][disabled]');
    I.dontSeeElement('input[name="personal"][disabled]');
    I.dontSeeElement('input[name="primary_address"][disabled]');
    I.seeElement('select[name="mail_protocol"][disabled]');
    I.dontSeeElement('input[name="mail_server"][disabled]');
    I.dontSeeElement('select[name="mail_secure"][disabled]');
    I.dontSeeElement('input[name="mail_port"][disabled]');
    I.dontSeeElement('input[name="login"][disabled]');
    I.dontSeeElement('input[id="password"][disabled]');
    I.dontSeeElement('input[name="transport_server"][disabled]');
    I.dontSeeElement('select[name="transport_secure"][disabled]');
    I.dontSeeElement('input[name="transport_port"][disabled]');
    I.dontSeeElement('select[name="transport_auth"][disabled]');
    I.seeElement('input[name="transport_login"][disabled]');
    I.seeElement('input[id="transport_password"][disabled]');
});
