/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('General > Federated Sharing');

Before(async function ({ users, contexts }) {
    const ctxs = await Promise.all([
        contexts.create({ id: process.env.CONTEXT_ID }),
        contexts.create({ id: process.env.CONTEXT_ID + 1 })
    ]);
    await Promise.all([
        users.create(users.getRandom(), ctxs[0]),
        users.create(users.getRandom(), ctxs[1])
    ]);
});

Scenario.skip('TODO', async function ({ I, users, drive, mail }) {
    const owner = users[0];
    I.login('app=io.ox/files', { owner });
    drive.waitForApp();
    I.logout();

    // TODO

    const consumer = users[1];
    I.login('app=io.ox/mail', { consumer });
    mail.waitForApp();
    I.logout();
});
