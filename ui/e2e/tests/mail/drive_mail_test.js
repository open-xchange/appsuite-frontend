/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 * @author Björn Köster <bjoern.koester@open-xchange.com>
 */


/// <reference path="../../steps.d.ts" />

Feature('Mail > Drive Mail');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C85691] Cloud icon is used for drive-mail', async function ({ I, users, mail }) {
    I.login('app=io.ox/mail');
    mail.newMail();

    I.fillField('To', users[1].get('primaryEmail'));
    I.fillField('Subject', 'Git Gud');

    I.attachFile('.io-ox-mail-compose-window .composetoolbar input[type="file"]', 'e2e/media/files/generic/testdocument.rtf');
    I.click('Use Drive Mail', '.share-attachments');
    mail.send();

    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.waitForElement('.io-ox-mail-window');
    I.waitForText('Git Gud');
    I.waitForElement('.fa-cloud-download.is-shared-attachement');
});

Scenario('[C85685] Send drive-mail to internal recipient', async ({ I, users, mail }) => {
    const [batman, robin] = users;

    // 1. Go to Mail -> Compose
    I.login('app=io.ox/mail', { user: batman });
    mail.newMail();

    // 2. Add internal recipient, subject and mail text
    const subject = 'About the Batcave',
        mailText = 'WE NEED TO TALK ASAP!';
    I.fillField('To', robin.userdata.primaryEmail);
    I.fillField('Subject', subject);
    await within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        I.fillField('body', mailText);
        I.pressKey('Enter');
        I.pressKey('Enter');
    });

    // 3. Under Attachments choose "Add local file"
    // 4. Select a file
    // I use a helper function here and directly feed the file into the input field
    const batFile = 'testdocument.odt';
    I.attachFile('.io-ox-mail-compose-window .composetoolbar input[type="file"]', `e2e/media/files/generic/${batFile}`);

    // Expected Result: Attachment section opens containing a link: "Drive Mail"
    I.waitForText('ODT', undefined, '.io-ox-mail-compose-window');
    I.waitForText('Use Drive Mail', undefined, '.io-ox-mail-compose-window');

    // 5. Click "Drive Mail" to enable Drive Mail
    I.click('Use Drive Mail', '.share-attachments');

    // Expected Result: Drive Mail will get enabled and further options are shown.
    I.waitForText('Options', undefined, '.io-ox-mail-compose-window .attachments');
    I.seeCheckboxIsChecked('.io-ox-mail-compose-window .share-attachments input[type="checkbox"]');

    mail.send();

    // Expected Result: Mail gets sent successfully
    I.selectFolder('Sent');
    I.waitForText(subject, undefined, '.list-view');

    // 7. Verify a new folder with the name of the mail's subject was created in Drive, containing the mail's attachments
    const locateClickableFolder = (text) => locate('li.list-item.selectable').withDescendant(locate('div').withText(text));
    I.openApp('Drive');
    I.waitForText('Drive Mail', undefined, '.file-list-view');
    I.doubleClick(locateClickableFolder('Drive Mail'), '.file-list-view');

    // Expected Result: Drive -> My files -> Drive Mail -> $subject
    I.waitForText(subject, undefined, '.file-list-view');
    I.doubleClick(locateClickableFolder(subject), '.file-list-view');
    I.waitForText(batFile, undefined, '.file-list-view');

    I.logout();

    // 8. Verify the mail as the recipient
    I.login('app=io.ox/mail', { user: robin });
    mail.selectMail(subject);

    // Expected Result: Above the content an information is shown that the sender has shared some files with you plus a link to that files
    I.see(`${batman.userdata.given_name} ${batman.userdata.sur_name} has shared the following file with you:`);
    I.see(batFile);

    I.waitForElement('.mail-detail-frame');
    // 9. Verify link redirects you to the files and the files are accessible.
    await within({ frame: '.mail-detail-frame' }, async () => {
        I.click('View file');
    });
    I.waitForText(batFile, 30, '.list-view');
    // TODO: check if a download helper is feasible
});

Scenario('[C85690] Expire date can be forced', async function ({ I, users, mail }) {

    I.login('app=io.ox/mail');
    mail.waitForApp();
    // TODO: find a better way to do provisioning here.
    await I.executeScript(function () {
        require('settings!io.ox/mail').set('compose/shareAttachments/requiredExpiration', true);
    });
    mail.newMail();

    I.fillField('To', users[1].get('primaryEmail'));
    I.fillField('Subject', 'Plus Ultra!');

    I.attachFile('.io-ox-mail-compose-window .composetoolbar input[type="file"]', 'e2e/media/files/generic/testdocument.rtf');

    I.click('Use Drive Mail', '.share-attachments');
    I.click('Options', '.mail-attachment-list');
    ['1 day', '1 week', '1 month', '3 months', '6 months', '1 year'].forEach((val) => {
        I.see(val);
    });

    I.dontSee('Never');
    I.selectOption('#expiration-select-box', '1 day');
    I.click('Apply');
    mail.send();

    I.openApp('Drive');
    const locateClickableFolder = (text) => locate('li.list-item.selectable').withDescendant(locate('div').withText(text));
    I.waitForText('Drive Mail', undefined, '.file-list-view');
    I.doubleClick(locateClickableFolder('Drive Mail'), '.file-list-view');
    I.waitForText('Plus Ultra!');

    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.waitForElement('.io-ox-mail-window');
    I.waitForText('Plus Ultra!');
});
