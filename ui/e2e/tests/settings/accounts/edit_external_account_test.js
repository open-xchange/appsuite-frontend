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

Before(async function (users, contexts) {
    const [JITTER_MIN, JITTER_MAX] = [1000, 2000];
    const secondContextId = Math.trunc(process.env.CONTEXT_ID)
        + Math.floor(Math.random()
        * (JITTER_MAX - JITTER_MIN + 1) + JITTER_MIN);
    await users.create();
    const secondContext = await contexts.create({ id: secondContextId });
    await users.create(users.getRandom(), secondContext);
});

After(async function (users, contexts) {
    await users.removeAll();
    await contexts.removeAll();
});

Scenario('[C7839] Edit external mail account', async (I, users, mail, settings, dialogs) => {
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    const [internalUser, externalUser] = users;
    const {
        primaryEmail,
        imapSchema,
        imapServer,
        imapPort,
        imapLogin,
        password,
        smtpSchema,
        smtpServer,
        smtpPort
    } = externalUser.userdata;

    const externalAccount = {
        name: 'External',
        primary_address: primaryEmail,
        login: imapLogin,
        password: password,
        mail_url: `${imapSchema}${imapServer}:${imapPort}`,
        transport_url: `${smtpSchema}${smtpServer}:${smtpPort}`,
        transport_auth: 'none'
    };

    await I.haveMailAccount(externalAccount);

    I.login({ user: internalUser });
    mail.waitForApp();
    I.click('~Settings');
    settings.waitForApp();
    settings.select('Accounts');
    I.waitForVisible('~Edit External');
    I.retry(10).click('~Edit External');
    dialogs.waitForVisible();
    I.fillField('Account name', externalUser.userdata.primaryEmail);
    I.fillField('Email address', externalUser.userdata.primaryEmail);
    I.seeAttributesOnElements('input[name="name"]', { disabled: false });
    I.seeAttributesOnElements('input[name="personal"]', { disabled: false });
    I.seeAttributesOnElements('input[name="primary_address"]', { disabled: false });
    I.seeAttributesOnElements('select[name="mail_protocol"]', { disabled: true });
    I.seeAttributesOnElements('input[name="mail_server"]', { disabled: false });
    I.seeAttributesOnElements('select[name="mail_secure"]', { disabled: false });
    I.seeAttributesOnElements('input[name="mail_port"]', { disabled: false });
    I.seeAttributesOnElements('input[name="login"]', { disabled: false });
    I.seeAttributesOnElements('input[id="password"]', { disabled: false });
    I.seeAttributesOnElements('input[name="transport_server"]', { disabled: false });
    I.seeAttributesOnElements('select[name="transport_secure"]', { disabled: false });
    I.seeAttributesOnElements('input[name="transport_port"]', { disabled: false });
    I.seeAttributesOnElements('select[name="transport_auth"]', { disabled: false });
    I.seeAttributesOnElements('input[name="transport_login"]', { disabled: true });
    I.seeAttributesOnElements('input[id="transport_password"]', { disabled: true });
});
