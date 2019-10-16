/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Anne Matthes <anne.matthes@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('Chat > change online state');

Before(async function (I, users, chatUsers) {
    await users.create();
    await users.create();
    await users.create();

    await Promise.all(users.map(user => chatUsers.createFromUser(user)));
});

After(async function (users, chatUsers) {
    await users.removeAll();
    await chatUsers.deleteAll();
});

Scenario.skip('Current user logs in and is online', async function (I) {
    I.logIntoChat();
    I.login('app=io.ox/mail&cap=chat&chatHost=host.docker.internal:8080');

    I.refreshPage();
});
