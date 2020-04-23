/// <reference path="../../../steps.d.ts" />

Feature('Mail > Virtual Attachments');

Before(async (users) => {
    const user = await users.create();
    await Promise.all([
        user.hasConfig('com.openexchange.file.storage.mail.enabled', true),
        user.hasConfig('com.openexchange.file.storage.mail.fullNameAll', 'VirtualAttachments/virtual/all'),
        user.hasConfig('com.openexchange.file.storage.mail.fullNameReceived', 'VirtualAttachments/INBOX'),
        user.hasConfig('com.openexchange.file.storage.mail.fullNameSent', 'VirtualAttachments/INBOX/Sent')
    ]);
});

After(async (users) => {
    await users.removeAll();
});

async function prepare() {
    const { I, users, mail } = inject();
    const [user] = users;
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail');
    I.waitForText('View all attachments', 5, '.folder-tree');
    mail.newMail();
    within('.io-ox-mail-compose-window', function () {
        I.fillField('To', user.userdata.primaryEmail);
        I.pressKey('Enter');
        I.fillField('Subject', 'C83396');
        I.pressKey('Enter');
        I.fillField({ css: 'textarea.plain-text' }, 'Yo!');
        I.say('Add attachments');
        mail.addAttachment('e2e/media/files/generic/testdocument.rtf');
        mail.addAttachment('e2e/media/files/generic/testdocument.odt');
        mail.addAttachment('e2e/media/files/generic/testpresentation.ppsm');
    });
    mail.send();
}

Scenario('[C83396] View all attachments (from Mail)', async (I, drive) => {
    await prepare();
    I.click('View all attachments', '.folder-tree');
    drive.waitForApp();
    within('.list-view', () => {
        I.waitForText('In Sent');
        I.waitForText('In Inbox');
        I.waitForText('testdocument.rtf');
    });
});

Scenario('[C83405] View all attachments (from Mail-View)', async (I, drive) => {
    await prepare();
    I.clickToolbar('View');
    I.click('All attachments', '.dropdown.open .dropdown-menu');
    drive.waitForApp();
    within('.list-view', () => {
        I.waitForText('In Sent');
        I.waitForText('In Inbox');
        I.waitForText('testdocument.rtf');
    });
});

Scenario('[C83397] View all attachments (from Drive)', async (I, drive) => {
    await prepare();
    I.logout();
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.selectFolder('My attachments');
    within('.list-view', () => {
        I.waitForText('In Sent');
        I.waitForText('In Inbox');
        I.waitForText('testdocument.rtf');
    });
});

Scenario('[C83398] View all INBOX attachments', async (I, drive) => {
    await prepare();
    I.logout();
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.selectFolder('My attachments');
    I.selectFolder('In Inbox');
    within('.list-view', () => {
        I.waitForText('testdocument.rtf');
        I.waitForText('testdocument.odt');
        I.waitForText('testpresentation.ppsm');
        I.seeNumberOfVisibleElements('.list-item', 3);
        I.dontSee('In Sent');
        I.dontSee('In Inbox');
    });
});

Scenario('[C83399] View all SENT attachments', async (I, drive) => {
    await prepare();
    I.logout();
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.selectFolder('My attachments');
    I.selectFolder('In Sent');
    within('.list-view', () => {
        I.waitForText('testdocument.rtf');
        I.waitForText('testdocument.odt');
        I.waitForText('testpresentation.ppsm');
        I.seeNumberOfVisibleElements('.list-item', 3);
        I.dontSee('In Sent');
        I.dontSee('In Inbox');
    });
});

