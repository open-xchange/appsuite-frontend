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
/// <reference path="../../steps.d.ts" />

Feature('testrail - mail - compose').tag('5');

Before(async function (users) {
    await users.create();
    await users.create();
    await users.create();
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C7384] - Save draft', function (I, users) {
    //define testrail ID
    it('(C7384) Save draft');
    const [user] = users;
    var testrailid = 'C7384';
    var text = Math.round(+new Date() / 1000);
    var subject = Math.round(+new Date() / 1000);


    // 0) log in to settings and set compose mode to html
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    //I.haveSetting('io.ox/mail//autoSaveDraftsAfter', 'disabled');
    I.login('app=io.ox/mail', { user });
    // 1.2) continue opening mail compose
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailid + ' - ' + subject);
    I.fillField({ css: 'textarea.plain-text' }, '' + text);
    I.seeInField({ css: 'textarea.plain-text' }, '' + text);
    I.click('Discard');
    I.waitForElement('.io-ox-dialog-wrapper .modal-backdrop');
    I.click('Save as draft');
    I.waitForDetached('.io-ox-dialog-wrapper .modal-backdrop');
    I.selectFolder('Drafts');
    I.waitForText('' + testrailid + ' - ' + subject, 5, '.subject');
    I.doubleClick('.list-item[aria-label*="' + testrailid + ' - ' + subject + '"]');
    I.see(testrailid + ' - ' + subject);
    I.see(text);
});

Scenario('[C7382] - Compose plain text mail', function (I, users) {
    //define testrail ID
    it('(C7382) Compose plain text mail');
    let [user] = users;
    var testrailID = 'C7382';
    var timestamp = Math.round(+new Date() / 1000);

    // 0) log in to settings and set compose mode to html
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.see(testrailID + ' - ' + timestamp);
    I.logout();
});

Scenario('[C8816] - Cancel mail compose', function (I, users) {
    //define testrail ID
    it('(C8816) Cancel mail compose');
    let [user] = users;
    var testrailID = 'C8816';
    var timestamp = Math.round(+new Date() / 1000);

    // 0) log in to settings and set compose mode to html
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Discard');
    I.waitForElement('.io-ox-dialog-wrapper');
    I.see('Do you really want to discard your message?');
    I.click('Discard message');
    I.logout();
});

Scenario('[C7381] - Send email to multiple recipients', function (I, users) {
    //define testrail ID
    it('(C7381) Send email to multiple recipients');
    let [user] = users;
    var testrailID = 'C7381';
    var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    // 0) log in to settings and set compose mode to html
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[2].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[3].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.see(testrailID + ' - ' + timestamp);
    I.logout();
    I.login('app=io.ox/mail', { user: users[2] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.see(testrailID + ' - ' + timestamp);
    I.logout();
    I.login('app=io.ox/mail', { user: users[3] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.see(testrailID + ' - ' + timestamp);
    I.logout();
});

Scenario('[C7380] - Send saved draft mail', function (I, users) {
    //define testrail ID
    it('(C7380) Send saved draft mail');
    const [user] = users;
    var testrailId = 'C7380';
    var text = Math.round(+new Date() / 1000);
    var subject = Math.round(+new Date() / 1000);
    var timestamp = Math.round(+new Date() / 1000);


    // 0) log in to settings and set compose mode to html
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);

    // 3) Set a recipient, add a subject and mail text
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail); // User2
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailId + ' - ' + subject);
    I.fillField({ css: 'textarea.plain-text' }, '' + text);
    I.seeInField({ css: 'textarea.plain-text' }, '' + text);


    // 4) Send the E-Mail and check it as recipient
    I.click('Discard');
    I.waitForElement('.io-ox-dialog-wrapper .modal-backdrop');
    I.click('Save as draft');
    I.waitForDetached('.io-ox-dialog-wrapper .modal-backdrop');

    // Select draf frolder

    I.selectFolder('Drafts');

    I.waitForText('' + testrailId + ' - ' + subject, 5, '.subject');
    I.doubleClick('.list-item[aria-label*="' + testrailId + ' - ' + subject + '"]');
    I.see(testrailId + ' - ' + subject);
    I.see(text);
    I.wait(3);
    I.click('Send');
    I.wait(3);
    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailId + ' - ' + timestamp + '"]');
    I.see(testrailId + ' - ' + timestamp);
    I.logout();
});
Scenario('[C7385] - Write mail to BCC recipients', function (I, users) {
    //define testrail ID
    it('(C7385) Write mail to BCC recipients');
    let [user] = users;
    var testrailID = 'C7385';
    var timestamp = Math.round(+new Date() / 1000);

    // 0) log in to settings and set compose mode to html
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.click('BCC');
    I.fillField('.io-ox-mail-compose [placeholder="BCC"]', users[2].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.see(users[0].userdata.primaryEmail);
    I.see(users[1].userdata.primaryEmail);
    I.dontSee(users[2].userdata.primaryEmail);
    I.see(testrailID + ' - ' + timestamp);
    I.logout();

    I.login('app=io.ox/mail', { user: users[2] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.see(users[0].userdata.primaryEmail);
    I.see(users[1].userdata.primaryEmail);
    I.see(testrailID + ' - ' + timestamp);
    I.dontSee(users[2].userdata.primaryEmail);
    I.logout();
});

Scenario('[C7386] - Write mail to CC recipients', function (I, users) {
    //define testrail ID
    it('(C7386) Write mail to CC recipients');
    let [user] = users;
    var testrailID = 'C7386';
    var timestamp = Math.round(+new Date() / 1000);

    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.click('CC');
    I.fillField('.io-ox-mail-compose [placeholder="CC"]', users[2].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('.io-ox-mail-compose [placeholder="CC"]', users[3].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');
    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    ///TODO: Check if recipients is under TO or under Copy...
    I.see(users[0].userdata.primaryEmail);
    I.see(users[1].userdata.primaryEmail);
    I.see(users[2].userdata.primaryEmail);
    I.see(users[3].userdata.primaryEmail);
    I.see(testrailID + ' - ' + timestamp);
    I.logout();

    I.login('app=io.ox/mail', { user: users[2] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    ///TODO: Check if recipients is under TO or under Copy...
    I.see(users[0].userdata.primaryEmail);
    I.see(users[1].userdata.primaryEmail);
    I.see(users[2].userdata.primaryEmail);
    I.see(users[3].userdata.primaryEmail);
    I.see(testrailID + ' - ' + timestamp);
    I.logout();

    I.login('app=io.ox/mail', { user: users[3] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    ///TODO: Check if recipients is under TO or under Copy...
    I.see(users[0].userdata.primaryEmail);
    I.see(users[1].userdata.primaryEmail);
    I.see(users[2].userdata.primaryEmail);
    I.see(users[3].userdata.primaryEmail);
    I.see(testrailID + ' - ' + timestamp);
    I.logout();

});

Scenario('[C7388] - Send mail with different priorities', function (I, users) {
    //define testrail ID
    it('(C7388) Send mail with different priorities');
    let [user] = users;
    var testrailID = 'C7388';
    var timestamp = Math.round(+new Date() / 1000);

    // 0) log in to settings and set compose mode to html
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.click('Options');
    I.click('High');
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp + ' Priority: High');
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.click('Options');
    I.click('Normal');
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp + ' Priority: Normal');
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.click('Options');
    I.click('Low');
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp + ' Priority: Low');
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.wait(2);
    I.retry(5).doubleClick('[title="' + testrailID + ' - ' + timestamp + ' Priority: High"]');
    I.waitForElement('.floating-window-content .window-container-center .thread-view');
    I.see(testrailID + ' - ' + timestamp);
    I.seeElement('.detail-view-app .detail-view-row [title="High priority"]');
    I.dontSeeElement('.detail-view-app .detail-view-row [title="Low priority"]');
    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.wait(2);
    I.retry(5).doubleClick('[title="' + testrailID + ' - ' + timestamp + ' Priority: Low"]');
    I.waitForElement('.floating-window-content .window-container-center .thread-view');
    I.see(testrailID + ' - ' + timestamp);
    I.dontSeeElement('.detail-view-app .detail-view-row [title="High priority"]');
    I.seeElement('.detail-view-app .detail-view-row [title="Low priority"]');
    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.wait(2);
    I.retry(5).doubleClick('[title="' + testrailID + ' - ' + timestamp + ' Priority: Normal"]');
    I.waitForElement('.floating-window-content .window-container-center .thread-view');
    I.see(testrailID + ' - ' + timestamp);
    I.dontSeeElement('.detail-view-app .detail-view-row [title="High priority"]');
    I.dontSeeElement('.detail-view-app .detail-view-row [title="Low priority"]');
    I.logout();
});

Scenario('[C7389] - Send mail with attached vCard', function (I, users) {
    //define testrail ID
    it('(C7389) Send mail with attached vCard');
    let [user] = users;
    var testrailID = 'C7389';
    var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    // 0) log in to settings and set compose mode to html
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.click('Options');
    I.click('Attach Vcard');
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');
    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.wait(2);
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.click('.detail-view-app .toggle-details');
    I.click('.list-container .file.dropdown a[data-toggle="dropdown"][role="button"]');
    I.click('.dropdown.open [data-action="vcard"][data-ref="io.ox/mail/actions/vcard"]');
    I.seeElement('.io-ox-contacts-edit-window');
    I.click('Save');
    I.wait(2);
    I.click('.floating-window-content [aria-label="Close"][type="button"]');
    I.openApp('Address Book');
    I.wait(2);
    I.selectFolder('Contacts');
    I.wait(2);
    I.doubleClick('//*[contains(@class, "contact-grid-container")]//div[contains(text(), "' + users[0].userdata.primaryEmail + '")]/..');
    I.see(users[0].userdata.primaryEmail);
    I.see(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.logout();
});

Scenario('[C7387] - Send mail with attachment from upload', function (I, users) {
    //define testrail ID
    it('(C7387) Send mail with attachment from upload');
    let [user] = users;
    var testrailID = 'C7387';
    var timestamp = Math.round(+new Date() / 1000);

    // 0) log in to settings and set compose mode to html
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/tests/testrail/files/mail/compose/testdocument.odt');
    I.waitForElement('//div[contains(@class, "mail-attachment-list")]//div[contains(@class, "preview-container")]//span[contains(@class, "file")]/../div[contains(text(), "odt")]');
    //I.see('Mail size: 4.6 KB');
    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/tests/testrail/files/mail/compose/testdocument.rtf');
    I.waitForElement('//div[contains(@class, "mail-attachment-list")]//div[contains(@class, "preview-container")]//span[contains(@class, "file")]/../div[contains(text(), "rtf")]');
    //I.see('Mail size: 43.5 KB');
    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/tests/testrail/files/mail/compose/testpresentation.ppsm');
    I.waitForElement('//div[contains(@class, "mail-attachment-list")]//div[contains(@class, "preview-container")]//span[contains(@class, "file")]/../div[contains(text(), "ppsm")]');
    //I.see('Mail size: 77.2 KB');
    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/tests/testrail/files/mail/compose/testspreadsheed.xlsm');
    I.waitForElement('//div[contains(@class, "mail-attachment-list")]//div[contains(@class, "preview-container")]//span[contains(@class, "file")]/../div[contains(text(), "xlsm")]');
    //I.see('Mail size: 86.9 KB');
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.click('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "attachments mail-attachment-list")]//a[contains(@class, "toggle-details")]');
    I.wait(2);
    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testdocument.odt")]');
    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testdocument.rtf")]');
    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testpresentation.ppsm")]');
    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testspreadsheed.xlsm")]');
    I.see(testrailID + ' - ' + timestamp);
    I.logout();
});

//Scenario('C7391 - Send mail with attachment from Drive', function (I, users) {
//    //define testrail ID
//    it('(C7391) Send mail with attachment from Drive');
//    let [user] = users;
//    var testrailID = "C7391"
//    var timestamp = Math.round(+new Date()/1000);
//
//    // 0) log in to settings and set compose mode to html
//    I.login('app=io.ox/files', { user });
//    I.waitForVisible('.io-ox-files-window');
//
//    I.attachFile('.dropdown.open ul.dropdown-menu input[type=file]', 'e2e/tests/testrail/files/mail/compose/testdocument.odt')
//
//    pause();
//
//    I.clickToolbar('Compose');
//    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
//    I.wait(1);
//    I.click('Options')
//    I.click('Plain Text')
//    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail)
//    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + " - " + timestamp);
//    I.fillField({ css: 'textarea.plain-text' }, '' +testrailID+' - '+timestamp);
//    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/tests/testrail/files/mail/compose/testdocument.odt')
//    I.waitForElement('//div[contains(@class, "mail-attachment-list")]//div[contains(@class, "preview-container")]//span[contains(@class, "file")]/../div[contains(text(), "odt")]');
//    //I.see('Mail size: 4.6 KB');
//    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/tests/testrail/files/mail/compose/testdocument.rtf')
//    I.waitForElement('//div[contains(@class, "mail-attachment-list")]//div[contains(@class, "preview-container")]//span[contains(@class, "file")]/../div[contains(text(), "rtf")]');
//    //I.see('Mail size: 43.5 KB');
//    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/tests/testrail/files/mail/compose/testpresentation.ppsm')
//    I.waitForElement('//div[contains(@class, "mail-attachment-list")]//div[contains(@class, "preview-container")]//span[contains(@class, "file")]/../div[contains(text(), "ppsm")]');
//    //I.see('Mail size: 77.2 KB');
//    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/tests/testrail/files/mail/compose/testspreadsheed.xlsm')
//    I.waitForElement('//div[contains(@class, "mail-attachment-list")]//div[contains(@class, "preview-container")]//span[contains(@class, "file")]/../div[contains(text(), "xlsm")]');
//    //I.see('Mail size: 86.9 KB');
//    I.click('Send');
//    I.waitForDetached('.io-ox-mail-compose');
//    I.logout();
//    I.login('app=io.ox/mail', {user: users[1]});
//    I.selectFolder('Inbox');
//    I.waitForVisible('.selected .contextmenu-control');
//    I.doubleClick('[title="'+testrailID+' - '+timestamp+'"]');
//    I.click('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "attachments mail-attachment-list")]//a[contains(@class, "toggle-details")]')
//    I.wait(2)
//    pause();
//    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testdocument.odt")]')
//    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testdocument.rtf")]')
//    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testpresentation.ppsm")]')
//    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testspreadsheed.xlsm")]')
//    I.see(testrailID+' - '+timestamp)
//    I.logout();
//})


//Reply / Forward
Scenario('[C7403] - Forward a single mail', function (I, users) {
    //define testrail ID
    it('(C7403) Forward a single mail');
    let [user] = users;
    var testrailID = 'C7403';
    var timestamp = Math.round(+new Date() / 1000);

    // 0) log in to settings and set compose mode to html
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');
    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.see(testrailID + ' - ' + timestamp);
    I.click('.io-ox-mail-detail-window a[data-ref="io.ox/mail/actions/forward"]');
    I.wait(2);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[2].userdata.primaryEmail);
    I.click('Send');
    I.wait(2);
    I.logout();

    I.login('app=io.ox/mail', { user: users[2] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="Fwd: ' + testrailID + ' - ' + timestamp + '"]');
    I.see('Fwd: ' + testrailID + ' - ' + timestamp);
    I.logout();
});

Scenario('[C7404] - Reply to single mail', function (I, users) {
    //define testrail ID
    it('(C7404) Reply to single mail');
    let [user] = users;
    var testrailID = 'C7404';
    var timestamp = Math.round(+new Date() / 1000);

    // 0) log in to settings and set compose mode to html
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');
    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.see(testrailID + ' - ' + timestamp);
    I.click('.io-ox-mail-detail-window a[data-ref="io.ox/mail/actions/reply"]');
    I.wait(2);
    I.click('Send');
    I.wait(2);
    I.logout();

    I.login('app=io.ox/mail', { user: users[0] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="Re: ' + testrailID + ' - ' + timestamp + '"]');
    I.see('Re: ' + testrailID + ' - ' + timestamp);
    I.logout();
});

Scenario('[C8820] - Forward attachments', function (I, users) {
    //define testrail ID
    it('(C8820) Forward attachments');
    let [user] = users;
    var testrailID = 'C8820';
    var timestamp = Math.round(+new Date() / 1000);

    // 0) log in to settings and set compose mode to html
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/tests/testrail/files/mail/compose/testdocument.odt');
    I.waitForElement('//div[contains(@class, "mail-attachment-list")]//div[contains(@class, "preview-container")]//span[contains(@class, "file")]/../div[contains(text(), "odt")]');
    //I.see('Mail size: 4.6 KB');
    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/tests/testrail/files/mail/compose/testdocument.rtf');
    I.waitForElement('//div[contains(@class, "mail-attachment-list")]//div[contains(@class, "preview-container")]//span[contains(@class, "file")]/../div[contains(text(), "rtf")]');
    //I.see('Mail size: 43.5 KB');
    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/tests/testrail/files/mail/compose/testpresentation.ppsm');
    I.waitForElement('//div[contains(@class, "mail-attachment-list")]//div[contains(@class, "preview-container")]//span[contains(@class, "file")]/../div[contains(text(), "ppsm")]');
    //I.see('Mail size: 77.2 KB');
    I.attachFile('.io-ox-mail-compose-window input[type=file]', 'e2e/tests/testrail/files/mail/compose/testspreadsheed.xlsm');
    I.waitForElement('//div[contains(@class, "mail-attachment-list")]//div[contains(@class, "preview-container")]//span[contains(@class, "file")]/../div[contains(text(), "xlsm")]');
    //I.see('Mail size: 86.9 KB');
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');
    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.click('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "attachments mail-attachment-list")]//a[contains(@class, "toggle-details")]');
    I.wait(2);
    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testdocument.odt")]');
    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testdocument.rtf")]');
    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testpresentation.ppsm")]');
    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testspreadsheed.xlsm")]');
    I.see(testrailID + ' - ' + timestamp);
    I.click('.io-ox-mail-detail-window a[data-ref="io.ox/mail/actions/forward"]');
    I.wait(2);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[2].userdata.primaryEmail);
    I.click('Send');
    I.wait(2);
    I.logout();

    I.login('app=io.ox/mail', { user: users[2] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.doubleClick('[title="Fwd: ' + testrailID + ' - ' + timestamp + '"]');
    I.wait(2);
    I.click('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "attachments mail-attachment-list")]//a[contains(@class, "toggle-details")]');
    I.wait(2);
    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testdocument.odt")]');
    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testdocument.rtf")]');
    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testpresentation.ppsm")]');
    I.seeElement('//div[contains(@class, "io-ox-mail-detail-window")]//section[contains(@class, "mail-attachment-list open")]//div[contains(@class, "list-container")]//li[contains(@title, "testspreadsheed.xlsm")]');
    I.see('Fwd: ' + testrailID + ' - ' + timestamp);
});

Scenario('[C7405] - Delete E-Mail', function (I, users) {
    //define testrail ID
    it('(C7405) Delete E-Mail');
    let [user] = users;
    var testrailID = 'C7405';
    var timestamp = Math.round(+new Date() / 1000);

    // 0) log in to settings and set compose mode to html
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.retry(5).waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.retry(5).click('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.clickToolbar('Delete');
    I.retry(5).dontSee(testrailID + ' - ' + timestamp);
    I.selectFolder('Trash');
    I.retry(5).see(testrailID + ' - ' + timestamp);
    I.logout();
});

Scenario('[C7406] - Delete several E-Mails', function (I, users) {
    //define testrail ID
    it('(C7406) Delete several E-Mails');
    let [user] = users;
    var testrailID = 'C7406';
    var timestamp = Math.round(+new Date() / 1000);

    // 0) log in to settings and set compose mode to html
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp + ' - 1');
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp + ' - 1');
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp + ' - 2');
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp + ' - 2');
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.click('[title="' + testrailID + ' - ' + timestamp + ' - 1"]');
    I.clickToolbar('Delete');
    I.wait(0.5);
    I.click('[title="' + testrailID + ' - ' + timestamp + ' - 2"]');
    I.clickToolbar('Delete');
    I.wait(3);
    I.dontSee(testrailID + ' - ' + timestamp + ' - 1');
    I.dontSee(testrailID + ' - ' + timestamp + ' - 2');
    I.retry(5).selectFolder('Trash');
    I.wait(0.2);
    I.retry(10).seeElement('[title="' + testrailID + ' - ' + timestamp + ' - 1"]');
    I.retry(10).seeElement('[title="' + testrailID + ' - ' + timestamp + ' - 2"]');
    I.logout();
});


Scenario('[C101615] - Emojis', async function (I, users) {
    //define testrail ID
    it('(C101615) Emojis');
    let [user] = users;
    //var testrailID = 'C101615';
    //var timestamp = Math.round(+new Date() / 1000);


    I.importMail({ user: users[0] }, 'default0/INBOX', 'e2e/tests/testrail/files/mail/badmails/C101615/C101615.eml');
    //console.log(data)

    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.selectFolder('Inbox');
    I.doubleClick('[title="😉✌️❤️"]');
    I.see('😉✌️❤️', '.floating-header .title');
    I.see('😉✌️❤️', '.floating-body .subject');
    within({ frame: '.floating-window-content iframe.mail-detail-frame' }, () => {
        I.see('😉✌️❤️', '.mail-detail-content p');
    });
    I.logout();
});

//Scenario('C101617 - Mail with <strike> element </strike>', async function (I, users) {
//    //define testrail ID
//    it('(C101617) Mail with <strike> element </strike>');
//    let [user] = users;
//    //var testrailID = 'C101617';
//    //var timestamp = Math.round(+new Date() / 1000);
//
//
//    I.importMail({ user: users[0] }, 'default0/INBOX', 'e2e/tests/testrail/files/mail/badmails/C101617/C101617.eml');
//    //console.log(data)
//
//    I.login('app=io.ox/mail', { user });
//    I.waitForVisible('.io-ox-mail-window');
//    I.selectFolder('Inbox');
//    I.doubleClick('//*[contains(text(), "mail with <strike> element </strike>")]', 'span.drag-title');
//    I.see('mail with <strike> element </strike>', '.floating-header .title');
//    I.see('mail with <strike> element </strike>', '.floating-window-content h1.subject');
//
//    within({ frame: '.floating-window-content iframe.mail-detail-frame' }, () => {
//        I.see('i use strike!!!!', '.mail-detail-content div strike');
//    });
//    I.logout();
//});

Scenario('[C101620] - Very long TO field', async function (I, users) {
    //define testrail ID
    it('(C101620) Very long TO field');
    let [user] = users;
    //var testrailID = 'C101620';
    //var timestamp = Math.round(+new Date() / 1000);


    I.importMail({ user: users[0] }, 'default0/INBOX', 'e2e/tests/testrail/files/mail/badmails/C101620/C101620.eml');
    //console.log(data)

    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.selectFolder('Inbox');

    I.click('//*[contains(text(), "Very long TO field")]', 'span.drag-title');
    I.seeCssPropertiesOnElements('.mail-detail-pane .recipients', { 'overflow': 'hidden' });
    I.seeCssPropertiesOnElements('.mail-detail-pane .recipients', { 'text-overflow': 'ellipsis' });
    //TODO: Width is not 100% when get css property?
    //I.doubleClick('//*[contains(text(), "Very long TO field")]', 'span.drag-title');
    I.doubleClick('[title="Very long TO field"]');
    I.waitForElement('.window-container-center .detail-view-app .thread-view-list');
    //pause();

    I.seeCssPropertiesOnElements('.floating-window-content .recipients', { 'overflow': 'hidden' });
    I.seeCssPropertiesOnElements('.floating-window-content .recipients', { 'text-overflow': 'ellipsis' });

    I.logout();
});

//Scenario('C101619 - CSS a:link test', async function (I, users) {
//    //define testrail ID
//    it('(C101619) CSS a:link test');
//    let [user] = users;
//    //var testrailID = 'C101619';
//    //var timestamp = Math.round(+new Date() / 1000);
//
//
//    I.importMail({ user: users[0] }, 'default0/INBOX', 'e2e/tests/testrail/files/mail/badmails/C101619/C101619.eml');
//    //console.log(data)
//
//    I.login('app=io.ox/mail', { user });
//    I.waitForVisible('.io-ox-mail-window');
//    I.selectFolder('Inbox');
//
//    I.doubleClick('//*[contains(text(), "CSS a:link test")]', 'span.drag-title');
//
//    within({ frame: '.floating-window-content iframe.mail-detail-frame' }, () => {
//        I.see(' a:link {   color:blue;   text-decoration:underline;  }', '.mail-detail-content p');
//    });
//    I.logout();
//});

//Scenario('C273801 - Download infected file', async function (I, users) {
//    //define testrail ID
//    it('(C273801) Download infected file');
//    let [user] = users;
//    //var testrailID = 'C273801';
//    //var timestamp = Math.round(+new Date() / 1000);
//
//
//    I.importMail({ user: users[0] }, 'default0/INBOX', 'e2e/tests/testrail/files/mail/Virus_attached!.eml');
//    //console.log(data)
//
//    I.login('app=io.ox/mail', { user });
//    I.waitForVisible('.io-ox-mail-window');
//    I.selectFolder('Inbox');
//
//    I.doubleClick('//*[contains(text(), "Virus attached!")]', 'span.drag-title');
//    I.click('.detail-view-app [data-ref="io.ox/mail/actions/download-attachment"]');
//    I.seeElement('.detail-view-app [data-ref="io.ox/mail/actions/download-attachment"]');
//});

//Scenario('C114958 - Delete draft when closing composer', async function (I, users) {
//    //define testrail ID
//    it('(C114958) Delete draft when closing composer');
//    let [user] = users;
//    //var testrailID = 'C114958';
//    //var timestamp = Math.round(+new Date() / 1000);
//
//    const setting1 = await I.haveSetting('io.ox/mail//features/deleteDraftOnClose', true);
//    console.log(setting1);
//    I.importMail({ user: users[0] }, 'default0/INBOX/Drafts', 'e2e/tests/testrail/files/mail/Virus_attached!.eml');
//
//    I.login('app=io.ox/mail', { user });
//    I.waitForVisible('.io-ox-mail-window');
//    I.selectFolder('Drafts');
//    I.click('//*[contains(text(), "Virus attached!")]', 'span.drag-title');
//    I.clickToolbar('Edit draft');
//
//    //pause();
//    I.click('.detail-view-app [data-ref="io.ox/mail/actions/download-attachment"]');
//    I.seeElement('.detail-view-app [data-ref="io.ox/mail/actions/download-attachment"]');
//});


Scenario('OXUI-618', async function (I, users) {
    let [user] = users;
    let mailcount = 10;
    //set layout default to listview
    I.haveSetting('io.ox/mail//layout', 'list');
    //generate mails for inbox
    let i;
    for (i = 0; i < mailcount; i++) {
        await I.haveMail({
            attachments: [{
                content: 'OXUI-618\r\n',
                content_type: 'text/plain',
                raw: true,
                disp: 'inline'
            }],
            from: [[user.get('displayname'), user.get('primaryEmail')]],
            sendtype: 0,
            subject: 'OXUI-618',
            to: [[user.get('displayname'), user.get('primaryEmail')]]
        });
    }
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    //verify unread mail count in folderlist
    I.see(mailcount, '[data-contextmenu-id="default0/INBOX"][data-model="default0/INBOX"] .folder-counter');
    //verifiy that no mail is selected in listview
    I.dontSeeElement('[data-ref="io.ox/mail/listview"] [aria-selected="true"]');
    I.logout();
});
Scenario('[C8829] - Recipients autocomplete', async function (I, users) {
    //define testrail ID
    let [user] = users;
    var testrailID = 'C7382';
    let testrailName = 'Recipients autocomplete';
    var timestamp = Math.round(+new Date() / 1000);
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.getDefaultFolder('contacts', { user: users[0] }),
        first_name: 'fname' + testrailID,
        last_name: 'lname' + testrailID,
        email1: 'mail1' + testrailID + '@e2e.de',
        email2: 'mail2' + testrailID + '@e2e.de',
        state_home: 'state' + timestamp,
        street_home: 'street' + timestamp,
        city_home: 'city' + timestamp
    };
    I.createContact(contact, { user: users[0] });
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose.container', 5);
    I.click({ css: '.recipient-actions button[data-type="cc"]' });
    I.waitForElement({ css: '.io-ox-mail-compose .cc .tt-input' }, 5);
    I.click({ css: '.recipient-actions button[data-type="bcc"]' });
    I.waitForElement({ css: '.io-ox-mail-compose .bcc .tt-input' }, 5);
    const receivers = ['to', 'cc', 'bcc'];
    const fields = [contact.email1.substring(0, 7), contact.email2.substring(0, 7), contact.first_name.substring(0, 7), contact.last_name.substring(0, 7)];
    receivers.forEach(function (receiver) {
        fields.forEach(function (field) {
            I.click('.io-ox-mail-compose div[data-extension-id="' + receiver + '"] input.tt-input');
            I.waitForFocus('.io-ox-mail-compose div[data-extension-id="' + receiver + '"] input.tt-input', 5);
            I.pressKey(field);
            I.waitForEnabled('.io-ox-mail-compose .' + receiver + ' .twitter-typeahead .tt-dropdown-menu', 5);
            I.waitForElement({ css: '.io-ox-mail-compose .' + receiver + ' .autocomplete-item' });
            I.waitForText(contact.email1, 5, { css: '.io-ox-mail-compose .tt-suggestions .tt-suggestion' });
            I.waitForText(contact.email2, 5, { css: '.io-ox-mail-compose .tt-suggestions .tt-suggestion' });
            I.waitForText(contact.first_name + ' ' + contact.last_name, 5, { css: '.io-ox-mail-compose .tt-suggestions .tt-suggestion' });
            I.clearField({ css: '.io-ox-mail-compose div[data-extension-id="' + receiver + '"] input.tt-input' });
        });
    });
    I.logout();
});

Scenario('[C8830] - Manually add multiple recipients via comma', async function (I, users) {
    //define testrail ID
    let [user] = users;
    var testrailID = 'C8830';
    let testrailName = 'Manually add multiple recipients via comma';
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose.container', 5);
    I.click({ css: '.io-ox-mail-compose div[data-extension-id="to"] input.tt-input' });
    I.pressKey('foo@bar.de, lol@ox.io, bla@trash.com,');
    I.waitForElement('.io-ox-mail-compose div.token', 5);
    I.seeNumberOfElements('.io-ox-mail-compose div.token', 3);
    I.logout();
});

Scenario('[C12119] - Edit recipients', async function (I, users) {
    //define testrail ID
    let [user] = users;
    var testrailID = 'C12119';
    let testrailName = 'Edit recipients';
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose.container', 5);

    I.click({ css: '.recipient-actions button[data-type="cc"]' });
    I.waitForElement({ css: '.io-ox-mail-compose .cc .tt-input' }, 5);
    I.click({ css: '.recipient-actions button[data-type="bcc"]' });
    I.waitForElement({ css: '.io-ox-mail-compose .bcc .tt-input' }, 5);

    const fields = ['to', 'cc', 'bcc'];
    
    fields.forEach(function (field) {
        I.click({ css: '.io-ox-mail-compose div[data-extension-id="' + field + '"] input.tt-input' });
        I.pressKey('foo@bar.de, lol@ox.io, bla@trash.com,');
        I.waitForElement('.io-ox-mail-compose div.token', 5);
        I.seeNumberOfElements('.io-ox-mail-compose div.token', 3);
        I.waitForText('foo@bar.de', 5, '.io-ox-mail-compose div.token');
        I.waitForText('lol@ox.io', 5, '.io-ox-mail-compose div.token');
        I.waitForText('bla@trash.com', 5, '.io-ox-mail-compose div.token');
        I.doubleClick({ css: '.io-ox-mail-compose div.token:nth-of-type(3)' });
        I.pressKey('super@ox.com,');
        I.dontSee('bla@trash.com', '.io-ox-mail-compose div.token');
        I.waitForText('foo@bar.de', 5, '.io-ox-mail-compose div.token');
        I.waitForText('lol@ox.io', 5, '.io-ox-mail-compose div.token');
        I.waitForText('super@ox.com', 5, '.io-ox-mail-compose div.token');
        const recipients = ['foo@bar.de', 'lol@ox.io', 'super@ox.com'];
        recipients.forEach(function (recipients) {
            I.click({ css: '.io-ox-mail-compose [aria-label="' + recipients + '. Press backspace to delete."] .close' });
        });
        I.seeNumberOfElements('.io-ox-mail-compose div.token', 0);
    });
    I.logout();
});

Scenario('[C12120] - Recipient cartridge', async function (I, users) {
    //define testrail ID
    let [user] = users;
    var testrailID = 'C12120';
    let testrailName = 'Recipient cartridge';
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose.container', 5);
    I.click({ css: '.recipient-actions button[data-type="cc"]' });
    I.waitForElement({ css: '.io-ox-mail-compose .cc .tt-input' }, 5);
    I.click({ css: '.recipient-actions button[data-type="bcc"]' });
    I.waitForElement({ css: '.io-ox-mail-compose .bcc .tt-input' }, 5);
    const fields = ['to', 'cc', 'bcc'];
    fields.forEach(function (field) {
        I.fillField('.io-ox-mail-compose div[data-extension-id="' + field + '"] input.tt-input', users[1].userdata.primaryEmail);
        I.pressKey('Enter');
        I.fillField('.io-ox-mail-compose div[data-extension-id="' + field + '"] input.tt-input', 'super@ox.com');
        I.pressKey('Enter');
        I.seeNumberOfElements('.io-ox-mail-compose div[data-extension-id="' + field + '"] div.token', 2);
        I.waitForText(users[1].userdata.given_name + ' ' + users[1].userdata.sur_name, 5, '.io-ox-mail-compose div[data-extension-id="' + field + '"] div.token');
        I.waitForText('super@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="' + field + '"] div.token');
    });
    I.logout();
});

Scenario('[C12118] - Remove recipients', async function (I, users) {
    //define testrail ID
    let [user] = users;
    var testrailID = 'C12118';
    let testrailName = 'Remove recipients';
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose.container', 5);
    I.click({ css: '.recipient-actions button[data-type="cc"]' });
    I.waitForElement({ css: '.io-ox-mail-compose .cc .tt-input' }, 5);
    I.click({ css: '.recipient-actions button[data-type="bcc"]' });
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
        I.waitForText('super01@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="' + field + '"] div.token');
        I.waitForText('super02@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="' + field + '"] div.token');
        I.waitForText('super03@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="' + field + '"] div.token');
        I.click({ css: '.io-ox-mail-compose [aria-label="super02@ox.com. Press backspace to delete."] .close' });
        I.seeNumberOfElements('.io-ox-mail-compose div[data-extension-id="' + field + '"] div.token', 2);
        I.waitForText('super01@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="' + field + '"] div.token');
        I.waitForText('super03@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="' + field + '"] div.token');
        I.dontSeeElement('.io-ox-mail-compose div[data-extension-id="' + field + '"] div.token [title="super02@ox.com"]');
    });
    I.logout();
});

Scenario('[C12121] - Display and hide recipient fields', async function (I, users) {
    //define testrail ID
    let [user] = users;
    var testrailID = 'C12121';
    let testrailName = 'Display and hide recipient fields';
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose.container', 5);
    I.click({ css: '.recipient-actions button[data-type="cc"]' });
    I.waitForVisible({ css: '.io-ox-mail-compose .cc .tt-input' }, 5);
    I.click({ css: '.recipient-actions button[data-type="bcc"]' });
    I.waitForVisible({ css: '.io-ox-mail-compose .bcc .tt-input' }, 5);
    I.click({ css: '.recipient-actions button[data-type="cc"]' });
    I.waitForInvisible({ css: '.io-ox-mail-compose .cc .tt-input' }, 5);
    I.click({ css: '.recipient-actions button[data-type="bcc"]' });
    I.waitForInvisible({ css: '.io-ox-mail-compose .bcc .tt-input' }, 5);
    I.logout();
});

Scenario('[C83384] - Automatically bcc all messages', async function (I, users) {
    //define testrail ID
    let [user] = users;
    var testrailID = 'C83384';
    let testrailName = 'Automatically bcc all messages';
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.haveSetting('io.ox/mail//autobcc', 'super01@ox.com');
    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.waitForElement('[data-id="virtual/settings/io.ox/mail"]');
    I.selectFolder('Compose');
    I.waitForVisible('.io-ox-settings-window [data-point="io.ox/mail/settings/compose/settings/detail/view"]', 5);
    I.seeInField('[data-point="io.ox/mail/settings/compose/settings/detail/view"] [name="autobcc"]', 'super01@ox.com');
    I.openApp('Mail');
    I.waitForVisible('.io-ox-mail-window');
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose.container', 5);
    I.waitForVisible({ css: '.io-ox-mail-compose .bcc .tt-input' }, 5);
    I.waitForText('super01@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="bcc"] div.token');
    //TODO: After consultation with Markus a mail should also be sent and verified here
    I.logout();
});


Scenario('[C163026] - Change from display name when sending a mail', async function (I, users) {
    //define testrail ID
    let [user] = users;
    var testrailID = 'C163026';
    let testrailName = 'Change from display name when sending a mail';
    var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose.container', 5);
    I.waitForText(users[0].userdata.given_name + ' ' + users[0].userdata.sur_name, 5, '.io-ox-mail-compose .mail-compose-fields [aria-label="From"] .name');
    I.waitForText('<' + users[0].userdata.primaryEmail + '>', 5, '.io-ox-mail-compose .mail-compose-fields [aria-label="From"] .address');
    I.click('.io-ox-mail-compose [data-dropdown="from"] .fa-caret-down');
    I.waitForVisible('.dropdown.open [data-name="edit-real-names"]', 5);
    I.click('.dropdown.open [data-name="edit-real-names"]');
    I.waitForVisible('.io-ox-dialog-wrapper .modal-body [title="Use custom name"]', 5);
    I.click('.io-ox-dialog-wrapper .modal-body [title="Use custom name"]');
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
    I.logout();
});


Scenario('[C207507] - Forgot mail attachment hint', async function (I, users) {
    //define testrail ID
    let [user] = users;
    var testrailID = 'C207507';
    let testrailName = 'Forgot mail attachment hint';
    var timestamp = Math.round(+new Date() / 1000);
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
    I.logout();
});


Scenario('[C8831] - Add recipient manually', async function (I, users) {
    //define testrail ID
    let [user] = users;
    var testrailID = 'C8831';
    let testrailName = 'Add recipient manually';
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose.container', 5);
    I.waitForVisible('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input');
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', 'super01@ox.com');
    I.seeInField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', 'super01@ox.com');
    I.click('.io-ox-mail-compose .plain-text');
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', 'super02@ox.com');
    I.seeInField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', 'super02@ox.com');
    I.click('.io-ox-mail-compose .plain-text');
    I.seeNumberOfVisibleElements('.io-ox-mail-compose div[data-extension-id="to"] div.token', 2);
    I.waitForText('super01@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="to"] div.token');
    I.waitForText('super02@ox.com', 5, '.io-ox-mail-compose div[data-extension-id="to"] div.token');
    I.logout();
});

//Scenario('[C114353] - Mail address parsing supports multiple delimiters', async function (I, users) {
//    //define testrail ID
//    let [user] = users;
//    var testrailID = 'C114353';
//    let testrailName = 'Mail address parsing supports multiple delimiters';
//    I.haveSetting('io.ox/mail//messageFormat', 'text');
//    I.login('app=io.ox/mail', { user });
//    I.waitForVisible('.io-ox-mail-window');
//    I.clickToolbar('Compose');
//    I.waitForVisible('.io-ox-mail-compose.container', 5);
//    const bla = [
//        {
//            string: 'Foo Bar <foo@bar.com>, John Doe <john@doe.com>, Jane Doe <jane@doe.com>'
//        },
//        {
//            string: 'Foo Bar <foo@bar.com>; John Doe <john@doe.com>; Jane Doe <jane@doe.com>'
//        },
//        {
//            string: 'Foo Bar <foo@bar.com> John Doe <john@doe.com> Jane Doe <jane@doe.com>'
//        },
//        {
//            string: 'Foo Bar <foo@bar.com> John Doe <john@doe.com>   Jane Doe <jane@doe.com>'
//        },
//        {
//            string: 'Foo Bar <foo@bar.com> \
//            John Doe <john@doe.com> \
//            Jane Doe <jane@doe.com>' 
//        },
//        {
//            string: 'Fóó Bær <foo@bar.com>'
//        },
//        {
//            string: 'John Do-Do-Doe <john@doe.com>'
//        }
//    ];
//    bla.forEach(async function (input, i) {
//        I.waitForVisible('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', 5);
//        I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', input.string);
//        I.pressKey('Enter');
//        I.waitForElement('.io-ox-mail-compose div[data-extension-id="to"] div.token [title="Foo Bar <foo@bar.com>"]');
//        I.waitForElement('.io-ox-mail-compose div[data-extension-id="to"] div.token [title="John Doe <john@doe.com>"]');
//        I.waitForElement('.io-ox-mail-compose div[data-extension-id="to"] div.token [title="Jane Doe <jane@doe.com>"]');
//        I.seeNumberOfElements('.io-ox-mail-compose div[data-extension-id="to"] div.token', 3);
//        I.click({ css: '.io-ox-mail-compose .close' });
//        I.click({ css: '.io-ox-mail-compose .close' });
//        I.click({ css: '.io-ox-mail-compose .close' });
//        I.seeNumberOfElements('.io-ox-mail-compose div[data-extension-id="to"] div.token', 0);
//        pause();
//    });
//
//    I.logout();
//});

//Scenario('[C8829] - Recipients autocomplete', async function (I, users) {
//    //define testrail ID
//    let [user] = users;
//    var testrailID = 'C7382';
//    let testrailName = 'Recipients autocomplete';
//
//    // 0) log in to settings and set compose mode to html
//    I.haveSetting('io.ox/mail//messageFormat', 'text');
//    I.login('app=io.ox/mail', { user });
//    I.waitForVisible('.io-ox-mail-window');
//    I.clickToolbar('Compose');
//    I.waitForVisible('.io-ox-mail-compose.container', 5);
//    I.click('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input');
//    I.waitForFocus('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', 5);
//    I.pressKey(users[1].userdata.sur_name.substring(0, 2));
//    I.wait(2);
//    I.waitForEnabled('.io-ox-mail-compose .to .twitter-typeahead .tt-dropdown-menu', 5);
//    I.waitForElement({ css: '.io-ox-mail-compose .to .autocomplete-item' });
//    const autoCompleteCount = await I.grabNumberOfVisibleElements({ css: '.io-ox-mail-compose .to .autocomplete-item' });
//    console.log(autoCompleteCount);
//    let i;
//    let participants = [];
//    for (i = 0; i < autoCompleteCount; i++) {
//        I.waitForElement({ css: '.io-ox-mail-compose .tt-dataset-0 .tt-suggestions .tt-suggestion:nth-child(' + (i + 1) + ')' }, 5);
//        let participantEmail = await I.grabTextFrom({ css: '.io-ox-mail-compose .tt-dataset-0 .tt-suggestions .tt-suggestion:nth-child(' + (i + 1) + ') .participant-email' });
//        let participantName = await I.grabTextFrom({ css: '.io-ox-mail-compose .tt-dataset-0 .tt-suggestions .tt-suggestion:nth-child(' + (i + 1) + ') .participant-name' });
//        console.log(participantEmail);
//        console.log(participantName);
//        participants.push({
//            name: participantName,
//            mail: participantEmail
//        });
//    }
//    I.logout();
//});