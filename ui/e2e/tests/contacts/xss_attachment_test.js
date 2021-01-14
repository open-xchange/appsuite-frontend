/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Contacts');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('adds an malicious attachment to a contact', async function ({ I, contacts }) {
    const folder = await I.grabDefaultFolder('contacts');
    const { id } = await I.haveContact({ folder_id: folder, first_name: 'Evil', last_name: 'Knivel' });
    await I.haveAttachment(
        'contacts',
        { id, folder },
        { name: 'e2e/media/files/><img src=x onerror=alert(123)>', content: '<img src=x onerror=alert(123)>' }
    );

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.selectContact('Knivel, Evil');
    I.waitForVisible({ css: 'section[data-block="attachments"]' });
    I.see('><img src=x onerror=alert(123)>');
});
