/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Tasks > Misc');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[Z104304] Subscribe shared folder and Unsubscribe shared folder', async function ({ I, users }) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false }
    });

    const defaultFolder = await I.grabDefaultFolder('tasks');
    const sharedFolderName = `${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: New folder`;
    const busystate = locate('.modal modal-body.invisible');

    await I.haveFolder({
        title: 'New folder',
        module: 'tasks',
        parent: defaultFolder
    });

    I.login('app=io.ox/tasks');
    I.waitForText('My tasks');
    I.retry(5).doubleClick('My tasks');

    I.waitForText('New folder');
    I.rightClick({ css: '[aria-label^="New folder"]' });
    I.waitForText('Share / Permissions');
    I.wait(0.2);
    I.click('Share / Permissions');
    I.waitForText('Permissions for folder "New folder"');
    I.waitForDetached(busystate);
    I.wait(0.5);

    I.fillField('.modal-dialog .tt-input', users[1].userdata.primaryEmail);
    I.waitForText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`, undefined, '.tt-dropdown-menu');
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    I.click('Save');
    I.waitToHide('.share-permissions-dialog');
    I.logout();

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false }
    }, { user: users[1] });
    I.login('app=io.ox/tasks', { user: users[1] });
    I.retry(5).doubleClick('~Shared tasks');
    I.waitForText(sharedFolderName);
    I.click('Add new folder');
    I.click('Subscribe to shared folder');
    I.waitForText('Shared task folders');
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedFolderName)).find({ css: 'input[name="subscribed"]' }));
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedFolderName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedFolderName)).find('.checkbox'));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedFolderName)).find({ css: 'input[name="subscribed"]' }));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedFolderName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForInvisible(locate('*').withText(sharedFolderName));

    I.click('Add new folder');
    I.click('Subscribe to shared folder');
    I.waitForText('Shared task folders');

    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedFolderName)).find({ css: 'input[name="subscribed"]' }));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedFolderName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedFolderName)).find('.checkbox'));
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedFolderName)).find({ css: 'input[name="subscribed"]' }));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedFolderName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedFolderName)).find({ css: 'label' }).withText('Sync via DAV'));

    I.click('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForText(sharedFolderName);
});
