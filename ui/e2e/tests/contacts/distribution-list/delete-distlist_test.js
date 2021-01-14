/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

Feature('Contacts > Distribution List > Delete');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

const util = require('./util');

Scenario('[C7379] Single distribution list', async function ({ I, contacts, dialogs }) {
    const display_name = util.uniqueName('C7379'),
        listElement = { css: '[aria-label="' + display_name + '"]' };
    await I.haveContact({ display_name: display_name, folder_id: await I.grabDefaultFolder('contacts'), mark_as_distributionlist: true });

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForElement(listElement);
    I.click(listElement);
    I.clickToolbar('Delete');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');
    I.dontSee(listElement);
});

Scenario('[C7378] Multiple distribution lists', async function ({ I, search, contacts, dialogs }) {
    const display_name = util.uniqueName('C7378'),
        defaultFolder = await I.grabDefaultFolder('contacts'),
        distributionLists = [];
    for (let i = 1; i <= 2; i++) distributionLists.push(I.haveContact({ display_name: display_name + ' - ' + i, folder_id: defaultFolder, mark_as_distributionlist: true }));
    await Promise.all(distributionLists);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    search.doSearch(display_name);
    I.waitForText(display_name, '.vgrid-cell');

    I.click('.select-all');
    I.clickToolbar('Delete');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');
    I.waitForText('No matching items found.');
    for (let i = 1; i <= 2; i++) I.dontSee(`${display_name} - ${i}`);
});
