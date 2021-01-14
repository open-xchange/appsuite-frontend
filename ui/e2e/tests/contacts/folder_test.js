/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Markus Wagner <markus.wagner@open-xchange.com>
 */

/// <reference path="../../steps.d.ts" />

Feature('Contacts > Folder');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C85620] Global address book is the default folder - switch capability for user', async function ({ I, users }) {

    // Make sure user has the global address book enabled
    await users[0].hasCapability('gab');

    I.login('app=io.ox/contacts');

    // The global address book is shown
    I.waitForElement(locate('span.folder-name').withText('Global address book'), 10);

    // This async script execution is needed because codecept otherwise doesn't execute the test in a correct order
    await I.executeScript(function () {
        return require('io.ox/core/capabilities').has('gab');
    });

    I.logout();

    // Disable the global address book for the user
    await users[0].doesntHaveCapability('gab');
    I.refreshPage();

    I.login('app=io.ox/contacts');

    // The users contacts folder is shown
    I.waitForElement(locate('span.folder-name').withText('Contacts'), 10);

    // This async script execution is needed because codecept otherwise doesn't execute the test in a correct order
    await I.executeScript(function () {
        return require('io.ox/core/capabilities').has('gab');
    });
});

Scenario('[C85620] Global address book is the default folder - check first login', async function ({ I, users }) {

    // Make sure user has the global address book enabled
    await users[1].doesntHaveCapability('gab');

    I.login('app=io.ox/contacts', { user: users[1] });

    // The users contacts folder is shown
    I.waitForElement(locate('span.folder-name').withText('Contacts'), 10);

    // The global address book isn't shown
    I.dontSeeElement(locate('span.folder-name').withText('Global address book'));

    // This async script execution is needed because codecept otherwise doesn't execute the test in a correct order
    await I.executeScript(function () {
        return require('io.ox/core/capabilities').has('gab');
    });
});

Scenario('[C7355] - Create a new private folder', function ({ I, contacts }) {
    const folderName = 'C7355';

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.newAddressbook(folderName);
    I.waitForVisible(locate({ css: '[aria-label="My address books"] .folder:not(.selected) .folder-label' }).withText(folderName).as(folderName));

});

Scenario('[C7356] - Create a new public folder ', function ({ I, users, contacts }) {
    const folderName = 'C7356';

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    I.click('Add new address book');
    I.clickDropdown('Personal address book');
    I.waitForVisible('.modal-body');
    I.fillField('[placeholder="New address book"][type="text"]', folderName);
    I.checkOption('Add as public folder');
    I.click('Add');
    I.waitForDetached('.modal-body');
    // Verfiy new folder is sorted correctly
    I.waitForVisible(locate({ css: '[aria-label="Public address books"] .folder-label' }).at(2).withText(folderName));
    I.selectFolder('C7356');
    I.logout();

    I.login('app=io.ox/contacts', { user: users[1] });
    contacts.waitForApp();
    I.dontSee(folderName);
});
