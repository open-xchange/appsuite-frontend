/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose');

Before(async function (users) {
    await users.create();
    await users.create();
    await users.create();
    await users.create();
});
After(async function (users) {
    await users.removeAll();
});

Scenario('[C7380] Send saved draft mail', async function (I, users, mail) {
    const [user] = users;
    var testrailId = 'C7380';
    var text = Math.round(+new Date() / 1000);
    var subject = Math.round(+new Date() / 1000);
    var timestamp = Math.round(+new Date() / 1000);
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.fillField('To', users[1].userdata.primaryEmail);
    I.fillField('Subject', '' + testrailId + ' - ' + subject);
    I.fillField({ css: 'textarea.plain-text' }, '' + text);
    I.click('Discard');
    I.waitForText('Save as draft');
    I.click('Save as draft');
    I.waitForDetached('.io-ox-mail-compose');
    I.selectFolder('Drafts');
    mail.selectMail(testrailId + ' - ' + subject);
    I.doubleClick('.list-item[aria-label*="' + testrailId + ' - ' + subject + '"]');
    I.waitForFocus('.io-ox-mail-compose textarea.plain-text');
    within('.io-ox-mail-compose', () => {
        I.seeInField('Subject', testrailId + ' - ' + subject);
        I.seeInField({ css: 'textarea.plain-text' }, text);
    });
    mail.send();
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    mail.selectMail(testrailId + ' - ' + subject);
    I.doubleClick({ css: '[title="' + testrailId + ' - ' + timestamp + '"]' });
    I.waitForText(testrailId + ' - ' + timestamp, 5, '.io-ox-mail-detail-window');
});

Scenario('[C7381] Send email to multiple recipients', async function (I, users, mail) {
    let [user] = users;
    var testrailID = 'C7381';
    var timestamp = Math.round(+new Date() / 1000);
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.fillField('To', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('To', users[2].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('To', users[3].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('Subject', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    mail.send();
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    mail.selectMail(testrailID + ' - ' + timestamp);
    I.doubleClick({ css: '[title="' + testrailID + ' - ' + timestamp + '"]' });
    I.waitForElement('.io-ox-mail-detail-window');
    I.see(testrailID + ' - ' + timestamp, '.io-ox-mail-detail-window');
    I.logout();
    I.login('app=io.ox/mail', { user: users[2] });
    I.selectFolder('Inbox');
    mail.selectMail(testrailID + ' - ' + timestamp);
    I.doubleClick({ css: '[title="' + testrailID + ' - ' + timestamp + '"]' });
    I.waitForElement('.io-ox-mail-detail-window');
    I.see(testrailID + ' - ' + timestamp, '.io-ox-mail-detail-window');
    I.logout();
    I.login('app=io.ox/mail', { user: users[3] });
    I.selectFolder('Inbox');
    mail.selectMail(testrailID + ' - ' + timestamp);
    I.doubleClick({ css: '[title="' + testrailID + ' - ' + timestamp + '"]' });
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.io-ox-mail-detail-window');
});

Scenario('[C7382] Compose plain text mail', async function (I, users, mail) {
    let [user] = users;
    var subject = `C7382 - ${Math.round(+new Date() / 1000)}`;
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.fillField('To', users[1].userdata.primaryEmail);
    I.fillField('Subject', subject);
    I.fillField({ css: 'textarea.plain-text' }, subject);
    mail.send();
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    mail.waitForApp();
    mail.selectMail(subject);
    I.doubleClick({ css: '[title="' + subject + '"]' });
    I.waitForText(subject, 5, '.io-ox-mail-detail-window');
});

Scenario('[C7384] Save draft', async function (I, users, mail) {
    const [user] = users;
    var testrailid = 'C7384';
    var text = Math.round(+new Date() / 1000);
    var subject = Math.round(+new Date() / 1000);
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', '' + testrailid + ' - ' + subject);
    I.fillField({ css: 'textarea.plain-text' }, '' + text);
    I.click('Discard');
    I.waitForElement('.io-ox-dialog-wrapper .modal-backdrop');
    I.click('Save as draft');
    I.waitForDetached('.io-ox-dialog-wrapper .modal-backdrop');
    //I.wait(1);
    I.selectFolder('Drafts');
    mail.selectMail(testrailid + ' - ' + subject, undefined, '.subject');
    I.doubleClick('.list-item[aria-label*="' + testrailid + ' - ' + subject + '"]');
    I.waitForFocus('.io-ox-mail-compose textarea.plain-text');
    I.seeInField('Subject', testrailid + ' - ' + subject);
    I.seeInField({ css: 'textarea.plain-text' }, text);
});

Scenario('[C7385] Write mail to BCC recipients', async function (I, users, mail) {
    let [user] = users;
    var testrailID = 'C7385';
    var timestamp = Math.round(+new Date() / 1000);
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.fillField('To', users[1].userdata.primaryEmail);
    I.click('BCC');
    I.fillField('BCC', users[2].userdata.primaryEmail);
    I.fillField('Subject', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    mail.send();
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    mail.selectMail(testrailID + ' - ' + timestamp);
    I.waitForText(users[0].userdata.primaryEmail, 5, '.detail-view-header');
    I.waitForElement({ css: '[title="' + users[1].userdata.primaryEmail + '"]' }, 5, '.detail-view-header');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.mail-detail-pane .subject');
    I.logout();
    I.login('app=io.ox/mail', { user: users[2] });
    I.selectFolder('Inbox');
    mail.selectMail(testrailID + ' - ' + timestamp);
    I.waitForText(users[0].userdata.primaryEmail, 5, '.detail-view-header');
    I.waitForElement({ css: '[title="' + users[1].userdata.primaryEmail + '"]' }, 5, '.detail-view-header');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.mail-detail-pane .subject');
});

Scenario('[C7386] Write mail to CC recipients', async function (I, users, mail) {
    let [user] = users;
    var testrailID = 'C7386';
    var timestamp = Math.round(+new Date() / 1000);

    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.fillField('To', users[1].userdata.primaryEmail);
    I.click('CC');
    I.fillField('CC', users[2].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('CC', users[3].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('Subject', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    mail.send();
    I.logout();

    //login and check with user1
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    mail.selectMail(testrailID);
    I.waitForText(users[0].userdata.primaryEmail, 5, '.detail-view-header');
    I.waitForElement({ css: '[title="' + users[1].userdata.primaryEmail + '"]' }, 5, '.detail-view-header');
    I.waitForElement({ css: '[title="' + users[2].userdata.primaryEmail + '"]' }, 5, '.detail-view-header');
    I.waitForElement({ css: '[title="' + users[3].userdata.primaryEmail + '"]' }, 5, '.detail-view-header');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.mail-detail-pane .subject');
    I.logout();

    // lgin and check with user2
    I.login('app=io.ox/mail', { user: users[2] });
    I.selectFolder('Inbox');
    mail.selectMail(testrailID);
    I.waitForText(users[0].userdata.primaryEmail, 5, '.detail-view-header');
    I.waitForElement({ css: '[title="' + users[1].userdata.primaryEmail + '"]' }, 5, '.detail-view-header');
    I.waitForElement({ css: '[title="' + users[2].userdata.primaryEmail + '"]' }, 5, '.detail-view-header');
    I.waitForElement({ css: '[title="' + users[3].userdata.primaryEmail + '"]' }, 5, '.detail-view-header');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.mail-detail-pane .subject');
    I.logout();

    //login and check with user3
    I.login('app=io.ox/mail', { user: users[3] });
    I.selectFolder('Inbox');
    mail.selectMail(testrailID);
    I.waitForText(users[0].userdata.primaryEmail, 5, '.detail-view-header');
    I.waitForElement({ css: '[title="' + users[1].userdata.primaryEmail + '"]' }, 5, '.detail-view-header');
    I.waitForElement({ css: '[title="' + users[2].userdata.primaryEmail + '"]' }, 5, '.detail-view-header');
    I.waitForElement({ css: '[title="' + users[3].userdata.primaryEmail + '"]' }, 5, '.detail-view-header');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.mail-detail-pane .subject');
});

function addFile(I, path) {
    var ext = path.match(/\.(.{3,4})$/)[1];
    I.attachFile({ css: 'input[type=file]' }, path);
    I.waitForText(ext.toUpperCase(), 5, '.inline-items.preview');
    //I.wait(1);
}

Scenario('[C7387] Send mail with attachment from upload', async function (I, users, mail) {
    let [user] = users;
    var testrailID = 'C7387';
    var timestamp = Math.round(+new Date() / 1000);
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    within('.io-ox-mail-compose-window', function () {
        I.say('Fill TO and SUBJECT', 'blue');
        I.fillField('To', users[1].userdata.primaryEmail);
        I.pressKey('Enter');
        I.fillField('Subject', '' + testrailID + ' - ' + timestamp);
        I.pressKey('Enter');
        I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
        I.say('Add attachments', 'blue');
        addFile(I, 'e2e/media/files/generic/testdocument.odt');
        addFile(I, 'e2e/media/files/generic/testdocument.rtf');
        addFile(I, 'e2e/media/files/generic/testpresentation.ppsm');
        addFile(I, 'e2e/media/files/generic/testspreadsheed.xlsm');
        I.say('Send mail and logout', 'blue');
        I.click('Send');
    });

    I.waitForDetached('.io-ox-mail-compose');
    I.logout();

    I.say('relogin', 'blue');
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');

    mail.selectMail(testrailID + ' - ' + timestamp);
    I.say('Show attachments as list', 'blue');
    I.click('4 attachments');
    I.waitForText('testdocument.odt');
    I.waitForText('testdocument.rtf');
    I.waitForText('testpresentation.ppsm');
    I.waitForText('testspreadsheed.xlsm');
});

Scenario('[C7388] Send mail with different priorities', async function (I, users, mail) {
    let [user] = users;
    var testrailID = 'C7388';
    var timestamp = Math.round(+new Date() / 1000);
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    let priorities = ['High', 'Normal', 'Low'];
    priorities.forEach(function (priority) {
        mail.newMail();
        I.click('Options');
        I.waitForElement('.dropdown.open .dropdown-menu', 5);
        I.click(priority);
        I.waitForDetached('.dropdown.open .dropdown-menu', 5);
        I.fillField('To', users[1].userdata.primaryEmail);
        I.pressKey('Enter');
        I.fillField('Subject', testrailID + ' - ' + timestamp + ' Priority: ' + priority + '');
        I.fillField({ css: 'textarea.plain-text' }, testrailID + ' - ' + timestamp);
        mail.send();
    });
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitNumberOfVisibleElements('.list-view .list-item', priorities.length);
    priorities.forEach(function (priority, i) {
        mail.selectMail(testrailID + ' - ' + timestamp + ' Priority: ' + priority);
        I.waitForText(testrailID + ' - ' + timestamp + ' Priority: ' + priority + '', 5, '.thread-view-header .subject');
        if (i === 0) I.waitForElement('.mail-detail-pane.selection-one .priority .high', 5);
        else if (i === 2) I.waitForElement('.mail-detail-pane.selection-one .priority .low', 5);
        //TODO: dont see element .low .high for normal mails !
    });
});

Scenario('[C7389] Send mail with attached vCard', async function (I, users, mail) {
    let [user] = users;
    var subject = `C7389 - ${Math.round(+new Date() / 1000)}`;
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.click('Options');
    I.waitForElement('.dropdown.open .dropdown-menu', 5);
    I.click('Attach Vcard');
    I.fillField('To', users[1].userdata.primaryEmail);
    I.fillField('Subject', subject);
    I.fillField({ css: 'textarea.plain-text' }, subject);
    mail.send();
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    mail.selectMail(subject);
    I.click('1 attachment');
    I.click(`${user.userdata.display_name}.vcf`);
    I.waitForElement('.dropdown.open');
    I.click('Add to address book', '.dropdown.open .dropdown-menu');
    I.waitForElement('.io-ox-contacts-edit-window', 5);

    //confirm dirtycheck is working properly
    I.click('Discard');
    I.waitForText('Do you really want to discard your changes?', 5, '.modal-dialog');
    I.click('Cancel');
    I.waitForDetached('.modal-dialog');

    I.click('Save');
    I.waitForDetached('.io-ox-contacts-edit-window', 5);
    I.openApp('Address Book');
    I.waitForVisible('.io-ox-contacts-window');
    I.selectFolder('Contacts');
    I.waitForText(`${users[0].userdata.sur_name}`);
    I.retry(5).click(locate('.contact').inside('.vgrid-scrollpane').withText(`${users[0].userdata.sur_name}`));
    I.waitForElement({ css: '[href="mailto:' + users[0].userdata.primaryEmail + '"]' });
    I.waitForText(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, 5, '.contact-detail.view .contact-header .fullname');
});

Scenario('[C7403] Forward a single mail', async function (I, users, mail) {
    let [userA, userB, userC] = users,
        testrailID = 'C7403',
        timestamp = Math.round(+new Date() / 1000);

    await I.haveSetting('io.ox/mail//messageFormat', 'text');

    I.login('app=io.ox/mail', { user: userA });
    mail.newMail();
    I.fillField('To', userB.userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('Subject', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    mail.send();
    I.logout();

    I.login('app=io.ox/mail', { user: userB });
    I.selectFolder('Inbox');
    mail.selectMail(testrailID + ' - ' + timestamp);
    I.clickToolbar('Forward');
    I.waitForFocus('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input');
    I.fillField('To', userC.userdata.primaryEmail);
    I.pressKey('Enter');
    mail.send();
    I.logout();

    I.login('app=io.ox/mail', { user: userC });
    I.selectFolder('Inbox');
    mail.selectMail('Fwd: ' + testrailID + ' - ' + timestamp);
    I.see('Fwd: ' + testrailID + ' - ' + timestamp, '.thread-view-header .subject');
});

Scenario('[C7404] Reply to single mail', async function (I, users, mail) {
    let [user] = users;
    var testrailID = 'C7404';
    var timestamp = Math.round(+new Date() / 1000);
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.fillField('To', users[1].userdata.primaryEmail);
    I.fillField('Subject', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    mail.send();
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    mail.selectMail(testrailID + ' - ' + timestamp);
    I.clickToolbar('Reply');
    I.waitForFocus('.io-ox-mail-compose textarea.plain-text');
    mail.send();
    I.logout();
    I.login('app=io.ox/mail', { user: users[0] });
    I.selectFolder('Inbox');
    mail.selectMail('Re: ' + testrailID + ' - ' + timestamp);
    I.see('Re: ' + testrailID + ' - ' + timestamp, '.mail-detail-pane .subject');
});

Scenario('[C8816] Cancel mail compose', async function (I, users, mail) {
    let [user] = users;
    var testrailID = 'C8816';
    var timestamp = Math.round(+new Date() / 1000);
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.fillField('To', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('Subject', testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, testrailID + ' - ' + timestamp);
    I.click('Discard');
    I.waitForElement('.io-ox-dialog-wrapper');
    I.see('Do you really want to discard your message?');
    I.click('Discard message');
});

Scenario('[C8820] Forward attachments', async function (I, users, mail) {
    let [user, user2, user3] = users;
    var subject = `C8820 - ${Math.round(+new Date() / 1000)}`;
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });

    //login user 1 and send mail with attachements
    mail.newMail();
    I.fillField('To', user2.userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('Subject', subject);
    I.fillField({ css: 'textarea.plain-text' }, subject);
    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/media/files/generic/testdocument.odt');
    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/media/files/generic/testdocument.rtf');
    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/media/files/generic/testpresentation.ppsm');
    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/media/files/generic/testspreadsheed.xlsm');
    mail.send();
    I.selectFolder('Sent');
    I.waitForVisible({ css: `div[title="${user2.userdata.primaryEmail}"]` });
    I.logout();

    //login user 2, check mail and forward to user 3
    I.login('app=io.ox/mail', { user: user2 });
    I.selectFolder('Inbox');
    mail.selectMail(subject);
    I.click('4 attachments');
    I.waitForElement('.mail-attachment-list.open');
    I.waitForElement('.mail-attachment-list.open [title="testdocument.odt"]');
    I.waitForElement('.mail-attachment-list.open [title="testdocument.rtf"]');
    I.waitForElement('.mail-attachment-list.open [title="testpresentation.ppsm"]');
    I.waitForElement('.mail-attachment-list.open [title="testspreadsheed.xlsm"]');
    I.see(subject, '.mail-detail-pane .subject');
    I.clickToolbar('Forward');
    I.waitForFocus('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input');
    I.fillField('To', user3.userdata.primaryEmail);
    I.pressKey('Enter');
    mail.send();
    I.logout();

    //login user 3 and check mail
    I.login('app=io.ox/mail', { user: user3 });
    I.selectFolder('Inbox');
    mail.selectMail('Fwd: ' + subject);
    I.click('4 attachments');
    I.waitForElement('.mail-attachment-list.open');
    I.waitForElement('.mail-attachment-list.open [title="testdocument.odt"]');
    I.waitForElement('.mail-attachment-list.open [title="testdocument.rtf"]');
    I.waitForElement('.mail-attachment-list.open [title="testpresentation.ppsm"]');
    I.waitForElement('.mail-attachment-list.open [title="testspreadsheed.xlsm"]');
    I.see('Fwd: ' + subject, '.mail-detail-pane .subject');
});

Scenario('[C8829] Recipients autocomplete', async function (I, users, mail) {
    let [user] = users;
    var testrailID = 'C7382';
    var timestamp = Math.round(+new Date() / 1000);
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        first_name: 'fname' + testrailID,
        last_name: 'lname' + testrailID,
        email1: 'mail1' + testrailID + '@e2e.de',
        email2: 'mail2' + testrailID + '@e2e.de',
        state_home: 'state' + timestamp,
        street_home: 'street' + timestamp,
        city_home: 'city' + timestamp
    };
    await Promise.all([
        I.haveContact(contact, { user: users[0] }),
        I.haveSetting('io.ox/mail//messageFormat', 'text')
    ]);
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.click('CC');
    I.waitForElement({ css: '.io-ox-mail-compose .cc .tt-input' }, 5);
    I.click('BCC');
    I.waitForElement({ css: '.io-ox-mail-compose .bcc .tt-input' }, 5);
    const receivers = ['To', 'CC', 'BCC'];
    const fields = [contact.email1.substring(0, 7), contact.email2.substring(0, 7), contact.first_name.substring(0, 7), contact.last_name.substring(0, 7)];
    receivers.forEach(function (receiver) {
        fields.forEach(function (field) {
            I.fillField(receiver, field);
            I.waitForText(contact.email1, 5, '.io-ox-mail-compose .tt-suggestions');
            I.waitForText(contact.email2, 5, '.io-ox-mail-compose .tt-suggestions');
            I.waitForText(contact.first_name + ' ' + contact.last_name, 5, '.io-ox-mail-compose .tt-suggestions');
            I.clearField(receiver);
        });
    });
});

Scenario('[C8830] Manually add multiple recipients via comma', async function (I, users, mail) {
    let [user] = users;
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.fillField('To', 'foo@bar.de, lol@ox.io, bla@trash.com,');
    I.waitForElement('.io-ox-mail-compose div.token', 5);
    I.seeNumberOfElements('.io-ox-mail-compose div.token', 3);
});

Scenario('[C8831] Add recipient manually', async function (I, users, mail) {
    let [user] = users;
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.click({ css: 'button[data-action="maximize"]' });
    I.fillField('To', 'super01@ox.com');
    I.pressKey('Enter');
    I.fillField('To', 'super02@ox.com');
    I.pressKey('Enter');
    I.seeNumberOfVisibleElements('.io-ox-mail-compose div[data-extension-id="to"] div.token', 2);
    I.waitForText('super01@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="to"]');
    I.waitForText('super02@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="to"]');
});

Scenario('[C12118] Remove recipients', async function (I, users, mail) {
    let [user] = users;
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.click('CC');
    I.waitForElement({ css: '.io-ox-mail-compose .cc .tt-input' }, 5);
    I.click('BCC');
    I.waitForElement({ css: '.io-ox-mail-compose .bcc .tt-input' }, 5);
    const fields = ['to', 'cc', 'bcc'];
    fields.forEach(function (field) {
        I.fillField('.io-ox-mail-compose div[data-extension-id="' + field + '"] input.tt-input', 'super01@ox.com');
        I.pressKey('Enter');
        I.fillField('.io-ox-mail-compose div[data-extension-id="' + field + '"] input.tt-input', 'super02@ox.com');
        I.pressKey('Enter');
        I.fillField('.io-ox-mail-compose div[data-extension-id="' + field + '"] input.tt-input', 'super03@ox.com');
        I.pressKey('Enter');
        I.seeNumberOfElements('.io-ox-mail-compose div[data-extension-id="' + field + '"] div.token', 3);
        I.waitForText('super01@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="' + field + '"]');
        I.waitForText('super02@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="' + field + '"]');
        I.waitForText('super03@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="' + field + '"]');
        I.click({ css: '.io-ox-mail-compose [aria-label="super02@ox.com. Press backspace to delete."] .close' });
        I.seeNumberOfElements('.io-ox-mail-compose div[data-extension-id="' + field + '"] div.token', 2);
        I.waitForText('super01@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="' + field + '"]');
        I.waitForText('super03@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="' + field + '"]');
        I.dontSeeElement('.io-ox-mail-compose div[data-extension-id="' + field + '"] [title="super02@ox.com"]');
    });
});

Scenario('[C12119] Edit recipients', async function (I, users, mail) {
    let [user] = users;
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.click('CC');
    I.waitForElement({ css: '.io-ox-mail-compose .cc .tt-input' }, 5);
    I.click('BCC');
    I.waitForElement({ css: '.io-ox-mail-compose .bcc .tt-input' }, 5);
    const fields = ['to', 'cc', 'bcc'];
    fields.forEach(function (field) {
        I.click({ css: '.io-ox-mail-compose div[data-extension-id="' + field + '"] input.tt-input' });
        I.fillField('.io-ox-mail-compose div[data-extension-id="' + field + '"] input.tt-input', 'foo@bar.de, lol@ox.io, bla@trash.com,');
        I.pressKey('Enter');
        I.waitForElement('.io-ox-mail-compose div.token', 5);
        I.seeNumberOfElements('.io-ox-mail-compose div.token', 3);
        I.waitForText('foo@bar.de', 5, '.io-ox-mail-compose [data-extension-id="' + field + '"]');
        I.waitForText('lol@ox.io', 5, '.io-ox-mail-compose [data-extension-id="' + field + '"]');
        I.waitForText('bla@trash.com', 5, '.io-ox-mail-compose [data-extension-id="' + field + '"]');
        I.doubleClick({ css: '.io-ox-mail-compose div.token:nth-of-type(3)' });
        I.fillField('.io-ox-mail-compose div[data-extension-id="' + field + '"] input.tt-input', 'super@ox.com,');
        I.pressKey('Enter');
        I.dontSee('bla@trash.com', '.io-ox-mail-compose [data-extension-id="' + field + '"]');
        I.waitForText('foo@bar.de', 5, '.io-ox-mail-compose [data-extension-id="' + field + '"]');
        I.waitForText('lol@ox.io', 5, '.io-ox-mail-compose [data-extension-id="' + field + '"]');
        I.waitForText('super@ox.com', 5, '.io-ox-mail-compose [data-extension-id="' + field + '"]');
        const recipients = ['foo@bar.de', 'lol@ox.io', 'super@ox.com'];
        recipients.forEach(function (recipients) {
            I.click({ css: '.io-ox-mail-compose [aria-label="' + recipients + '. Press backspace to delete."] .close' });
        });
        I.seeNumberOfElements('.io-ox-mail-compose div.token', 0);
    });
});

Scenario('[C12120] Recipient cartridge', async function (I, users, mail) {
    let [user] = users;
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.click('CC');
    I.waitForElement({ css: '.io-ox-mail-compose .cc .tt-input' }, 5);
    I.click('BCC');
    I.waitForElement({ css: '.io-ox-mail-compose .bcc .tt-input' }, 5);
    const fields = ['to', 'cc', 'bcc'];
    fields.forEach(function (field) {
        within('.io-ox-mail-compose div[data-extension-id="' + field + '"]', function () {
            I.fillField({ css: 'input.tt-input' }, users[1].userdata.primaryEmail);
            I.waitForElement('.tt-dropdown-menu .tt-suggestions');
            I.pressKey('Enter');
            I.fillField({ css: 'input.tt-input' }, 'super@ox.com');
            I.pressKey('Enter');
            I.seeNumberOfElements({ css: 'div.token' }, 2);
            I.waitForText(users[1].userdata.given_name + ' ' + users[1].userdata.sur_name, 5, '.token-label');
            I.waitForText('super@ox.com', 5, '.token-label');
        });
    });
});

Scenario('[C12121] Display and hide recipient fields', async function (I, mail) {
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail');
    mail.newMail();
    I.click('CC');
    I.waitForVisible({ css: '.io-ox-mail-compose .cc .tt-input' }, 5);
    I.click('BCC');
    I.waitForVisible({ css: '.io-ox-mail-compose .bcc .tt-input' }, 5);
    I.click('CC');
    I.waitForInvisible({ css: '.io-ox-mail-compose .cc .tt-input' }, 5);
    I.click('BCC');
    I.waitForInvisible({ css: '.io-ox-mail-compose .bcc .tt-input' }, 5);
});

Scenario.skip('[C83384] Automatically bcc all messages', async function (I, mail) {
    await Promise.all([
        I.haveSetting('io.ox/mail//messageFormat', 'text'),
        I.haveSetting('io.ox/mail//autobcc', 'super01@ox.com')
    ]);
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail/settings/compose');
    I.waitForText('Always add the following recipient to blind carbon copy (BCC)', 5, '.settings-detail-pane');
    I.seeInField('Always add the following recipient to blind carbon copy (BCC)', 'super01@ox.com');
    I.openApp('Mail');
    mail.newMail();
    I.see('super01@ox.com', '.io-ox-mail-compose div[data-extension-id="bcc"] div.token');
    //TODO: After consultation with Markus a mail should also be sent and verified here
});

Scenario('[C101615] Emojis', async function (I, users, mail) {
    let [user] = users;
    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/C101615.eml' }, { user: users[0] });
    I.login('app=io.ox/mail', { user });
    I.selectFolder('Inbox');
    mail.selectMail('😉✌️❤️');
    I.waitForText('😉✌️❤️', 5, '.mail-detail-pane .subject');
    within({ frame: '.mail-detail-pane .mail-detail-frame' }, () => {
        I.waitForText('😉✌️❤️', 5, '.mail-detail-content p');
    });
});

Scenario('[C101620] Very long TO field', async function (I, users, mail) {
    let [user] = users;
    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/C101620.eml' }, { user: users[0] });
    I.login('app=io.ox/mail', { user });
    I.selectFolder('Inbox');
    mail.selectMail('Very long TO field');
    I.seeCssPropertiesOnElements('.mail-detail-pane .recipients', { 'overflow': 'hidden' });
    I.seeCssPropertiesOnElements('.mail-detail-pane .recipients', { 'text-overflow': 'ellipsis' });
    //TODO: Width is not 100% when get css property?
    I.doubleClick({ css: '[title="Very long TO field"]' });
    I.waitForElement('.io-ox-mail-detail-window');
    within('.io-ox-mail-detail-window', () => {
        I.seeCssPropertiesOnElements('.floating-window-content .recipients', { 'overflow': 'hidden' });
        I.seeCssPropertiesOnElements('.floating-window-content .recipients', { 'text-overflow': 'ellipsis' });
    });
});

Scenario('[C163026] Change from display name when sending a mail', async function (I, users, mail) {
    let [user] = users;
    var timestamp = Math.round(+new Date() / 1000);
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    mail.newMail();
    I.see(users[0].userdata.given_name + ' ' + users[0].userdata.sur_name, '.io-ox-mail-compose .mail-compose-fields [aria-label="From"] .name');
    I.see('<' + users[0].userdata.primaryEmail + '>', '.io-ox-mail-compose .mail-compose-fields [aria-label="From"] .address');
    I.click('.io-ox-mail-compose [data-dropdown="from"] .fa-caret-down');
    I.waitForVisible('.dropdown.open [data-name="edit-real-names"]', 5);
    I.click('.dropdown.open .dropdown-menu [data-name="edit-real-names"]');
    I.waitForVisible('.modal-dialog [title="Use custom name"]', 5);
    I.click('.modal-dialog [title="Use custom name"]');
    I.fillField('.modal-body [title="Custom name"]', timestamp);
    I.click('Save', { css: '.modal-footer' });
    I.waitForDetached('.io-ox-dialog-wrapper', 5);
    I.waitForText(timestamp, 5, '.io-ox-mail-compose .mail-compose-fields [aria-label="From"] .name');
    I.waitForText('<' + users[0].userdata.primaryEmail + '>', 5, '.io-ox-mail-compose .mail-compose-fields [aria-label="From"] .address');
    I.click('.io-ox-mail-compose [data-dropdown="from"] .fa-caret-down');
    I.waitForVisible('.dropdown.open [data-name="edit-real-names"]', 5);
    I.click('.dropdown [data-name="sendDisplayName"]');
    I.click('.dropdown [data-name="from"]');
    I.waitForText(users[0].userdata.primaryEmail, 5, '.io-ox-mail-compose .mail-compose-fields [aria-label="From"] .address');
    I.waitForText('This email just contains your email address as sender. Your real name is not used.', 5, '.io-ox-mail-compose .sender-realname .mail-input');
});
Scenario('[C207507] Forgot mail attachment hint', async function (I, users) {
    let [user] = users;
    var testrailID = 'C207507';
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose.container', 5);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', 'super01@ox.de');
    I.fillField('.io-ox-mail-compose [name="subject"]', testrailID);
    I.fillField('.io-ox-mail-compose .plain-text', 'see attachment');
    I.click('Send', '.floating-window-content');
    I.waitForElement('.modal-open .modal-dialog', 5);
    I.waitForText('Forgot attachment?', 5, '.modal-open .modal-dialog .modal-title');
    I.click('Cancel', '.modal-footer');
    I.waitForDetached('.modal-open .modal-dialog', 5);
    I.fillField('.io-ox-mail-compose [name="subject"]', 'see attachment');
    I.fillField('.io-ox-mail-compose .plain-text', testrailID);
    I.click('Send', '.floating-window-content');
    I.waitForElement('.modal-open .modal-dialog', 5);
    I.waitForText('Forgot attachment?', 5, '.modal-open .modal-dialog .modal-title');
    I.click('Cancel', '.modal-footer');
    I.waitForDetached('.modal-open .modal-dialog', 5);
});

// TODO: skipped until backend server with feautre support is available
Scenario.skip('[C273801] Download infected file', async function (I, users) {
    let [user] = users;
    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/Virus_attached!.eml' }, { user: users[0] });
    I.haveSetting('io.ox/mail//layout', 'vertical');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.selectFolder('Inbox');
    I.waitForElement(locate('.list-item').withText('Virus attached!').inside('.list-view'));
    I.click(locate('.list-item').withText('Virus attached!').inside('.list-view'));
    I.waitForElement(locate('[data-action="io.ox/mail/attachment/actions/download"]').withText('Download').inside('.mail-detail-pane'));
    I.click(locate('[data-action="io.ox/mail/attachment/actions/download"]').withText('Download').inside('.mail-detail-pane'));
    I.waitForElement(locate('.modal-open .modal-title').withText('Malicious file detected'));
    I.waitForElement(locate('.modal-open button').withText('Download infected file'));
    I.waitForElement(locate('.modal-open button').withText('Cancel'));
});

// TODO: skipped until backend server with feautre support is available
Scenario.skip('[C273802] Download multiple files (one infected)', async function (I, users) {
    let [user] = users;
    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/C273802.eml' }, { user: users[0] });
    I.haveSetting('io.ox/mail//layout', 'vertical');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.selectFolder('Inbox');
    I.waitForElement(locate('.list-item').withText('C273802').inside('.list-view'));
    I.click(locate('.list-item').withText('C273802').inside('.list-view'));
    I.waitForElement(locate('.toggle-details').withText('2 attachments').inside('.mail-attachment-list .header'));
    I.waitForElement(locate('[data-action="io.ox/mail/attachment/actions/download"]').withText('Download').inside('.mail-detail-pane'));
    I.click(locate('[data-action="io.ox/mail/attachment/actions/download"]').withText('Download').inside('.mail-detail-pane'));
    I.waitForElement(locate('.modal-open .modal-title').withText('Malicious file detected'));
    I.waitForElement(locate('.modal-open button').withText('Download infected file'));
    I.waitForElement(locate('.modal-open button').withText('Cancel'));
});

Scenario('[C274142]- Disable autoselect in mail list layout', async function (I, users) {
    let [user] = users;
    let mailcount = 10;
    const promises = [I.haveSetting('io.ox/mail//layout', 'list')];
    let i;
    for (i = 0; i < mailcount; i++) {
        promises.push(I.haveMail({
            attachments: [{
                content: 'C274142\r\n',
                content_type: 'text/plain',
                raw: true,
                disp: 'inline'
            }],
            from: [[user.get('displayname'), user.get('primaryEmail')]],
            sendtype: 0,
            subject: 'C274142',
            to: [[user.get('displayname'), user.get('primaryEmail')]]
        }));
    }
    await Promise.all(promises);
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.see(mailcount, { css: '[data-contextmenu-id="default0/INBOX"][data-model="default0/INBOX"] .folder-counter' });
    I.dontSeeElement({ css: '[data-ref="io.ox/mail/listview"] [aria-selected="true"]' });
});
