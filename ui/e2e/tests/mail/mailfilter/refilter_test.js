/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2019 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Julian Bäume <julian.baeume@open-xchange.com>
*/
/// <reference path="../../../steps.d.ts" />

Feature('Mailfilter > Apply to folder');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

function setup(I, user) {
    return Promise.all([
        I.haveMail({
            folder: 'default0/INBOX',
            from: user, to: user,
            subject: 'foobar', content: 'nothing special'
        }),
        I.haveFolder({ title: 'foo', module: 'mail', parent: 'default0/INBOX' })
    ]);
}

function sampleRule(I) {
    return I.haveMailFilterRule({
        id: 0,
        position: 0,
        rulename: 'no foobar in inbox',
        active: true,
        flags: [],
        test: {
            id: 'subject',
            comparison: 'contains',
            values: ['foobar']
        },
        actioncmds: [{ id: 'move', into: 'default0/INBOX/foo' }]
    });
}

function extendedLogin(I) {
    I.login();
    I.waitForText('nothing special');
    I.waitForText('foobar', 5, '.subject');
    I.openApp('Settings', { folder: 'virtual/settings/io.ox/mailfilter' });
    I.waitForText('Add new rule', 30, '.settings-detail-pane');
}

function checkForFilteredMail(I) {
    I.waitForText('Apply');
    I.waitForElement('#io-ox-refresh-icon .fa-spin');
    I.waitForElement('#io-ox-refresh-icon .fa-spin-paused');

    I.openApp('Mail');
    I.waitToHide('foobar');
    I.waitForText('Empty');
    I.selectFolder('foo');
    I.waitForElement({ css: '.list-view .list-item .subject .drag-title' }, 10);
    I.see('foobar', { css: '.list-view .list-item .subject .drag-title' });
}

// TODO: shaky, failed at least once (10 runs on 2019-11-28)
Scenario('[C290529] Refilter mails in INBOX folder', async ({ I, users, dialogs }) => {
    const [user] = users;
    await setup(I, user);
    await sampleRule(I);
    extendedLogin(I);

    I.click('Apply');
    dialogs.waitForVisible();
    I.waitForElement(locate('.modal .folder.selected').withText('Inbox'));
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');

    checkForFilteredMail(I);
});
//TODO: I see "foobar", ".subject" fails, stale element reference
Scenario('[C290530] Create and apply new filter rule', async ({ I, users, dialogs }) => {
    const [user] = users;
    await setup(I, user);
    extendedLogin(I);

    I.click('Add new rule');
    dialogs.waitForVisible();

    I.fillField('Rule name', 'move foobar mails');

    I.click('Add condition');
    I.clickDropdown('Subject');
    // wait for focus events to settle
    I.wait(0.5);
    I.fillField('Subject Contains', 'foobar');

    I.click('Add action');
    I.click('File into');
    I.click('Select folder');
    dialogs.waitForVisible();
    I.waitForElement(locate('.modal .folder[data-id="virtual/myfolders"]'));
    I.click('.modal .folder[data-id="virtual/myfolders"] .folder-arrow');
    I.click(locate('.modal .folder.selectable').withText('foo'));
    dialogs.clickButton('Select');

    I.waitForText('Create new rule', 5, dialogs.locators.header);
    dialogs.clickButton('Save and apply rule now');
    I.waitForVisible(locate('.modal .folder.selected').withText('Inbox'));
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');

    checkForFilteredMail(I);
});

Scenario('[C290531] Edit and apply existing filter rule', async ({ I, users, dialogs }) => {
    const [user] = users;
    await setup(I, user);
    await sampleRule(I);
    extendedLogin(I);

    I.click('Edit');
    dialogs.waitForVisible();
    I.fillField('Rule name', 'no foo in inbox');
    I.fillField('Subject Contains', 'foo');
    dialogs.clickButton('Save and apply rule now');
    I.waitForVisible(locate('.modal .folder.selected').withText('Inbox'));
    dialogs.clickButton('Apply filter rule');

    checkForFilteredMail(I);
});
