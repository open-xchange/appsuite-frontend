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

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

const util = require('./util');

Scenario('[C7379] Single distribution list', async function (I) {
    const display_name = util.uniqueName('C7379');
    await I.haveContact({ display_name: display_name, folder_id: await I.grabDefaultFolder('contacts'), mark_as_distributionlist: true });
    util.start(I);

    I.click(`~${display_name}`);
    I.clickToolbar('Delete');
    I.waitForElement('.modal-footer');
    I.click('Delete', '.modal-footer');
    I.waitForDetached('.modal-body');
    I.dontSee(`~${display_name}`);
});

Scenario('[C7378] Multiple distribution lists', async function (I, search) {
    const display_name = util.uniqueName('C7378'),
        defaultFolder = await I.grabDefaultFolder('contacts'),
        distributionLists = [];
    for (let i = 1; i <= 2; i++) distributionLists.push(I.haveContact({ display_name: display_name + ' - ' + i, folder_id: defaultFolder, mark_as_distributionlist: true }));
    await Promise.all(distributionLists);
    util.start(I);
    search.doSearch(display_name);
    I.waitForText(display_name, '.vgrid-cell');

    I.click('.select-all');
    I.clickToolbar('Delete');
    I.waitForElement('.modal-footer');
    I.click('Delete', '.modal-footer');
    I.waitForDetached('.modal-body');
    I.waitForText('No matching items found.');
    for (let i = 1; i <= 2; i++) I.dontSee(`${display_name} - ${i}`);
});
