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

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C110279] Primary mail account name can be changed', async function ({ I, dialogs }) {
    const name = 'Räuber Hotzenplotz';
    await I.haveFolder({ title: 'Personal', module: 'mail', parent: 'default0/INBOX' });
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/settings/accounts');

    I.say(`rename to "${name}"`, 'blue');
    I.retry(10).click('Edit');

    dialogs.waitForVisible();
    I.fillField('Account name', name);
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForText('Account updated');
    I.waitForElement('.close', '.io-ox-alert');
    I.click('.close', '.io-ox-alert');
    I.waitForDetached('.io-ox-alert');

    I.say('check list item title', 'blue');
    I.waitForText(name, '.list-item-title');

    I.say('check mail folder view', 'blue');
    I.openApp('Mail');
    I.waitForElement('.tree-container');
    I.waitForText(name);
    I.seeTextEquals(name, '.tree-container [data-id= "virtual/myfolders"] > .folder-node .folder-label');
});
