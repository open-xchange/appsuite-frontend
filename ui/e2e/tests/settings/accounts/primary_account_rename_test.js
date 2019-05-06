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

/// <reference path="../../../steps.d.ts" />

Feature('Settings');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C110279] Primary mail account name can be changed', function (I) {
    const name = 'Räuber Hotzenplotz';
    I.haveFolder('Personal', 'mail', 'default0/INBOX');
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/settings/accounts');

    I.say(`rename to "${name}"`, 'blue');
    I.click('Edit', 'a[data-action="edit"]');
    I.waitForElement('.modal-body input[name="name"]');
    I.fillField('Account name', name);
    I.click('Save');
    I.waitForDetached('.modal-body');

    I.say('check list item title', 'blue');
    I.seeTextEquals(name, '[data-id="mail0"] .list-item-title');

    I.say('check mail folder view', 'blue');
    I.openApp('Mail');
    I.waitForVisible('.tree-container');
    I.seeTextEquals(name, '[data-id= "virtual/myfolders"] > .folder-node .folder-label');

    I.logout();
});
