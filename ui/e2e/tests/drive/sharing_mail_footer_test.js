/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <Daniel.Dickhaus@open-xchange.com>
 * @author Jorin Laatsch <Jorin.Laatsch@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('General > Inline help');

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[f4892e52-ab57-450f-a865-60a7bf803d67][C96959] Sharing mail footer', async function (I, drive, users, dialogs, mail) {
    I.login('app=io.ox/files');
    drive.waitForApp();
    drive.shareItem('Invite people');
    I.fillField('.modal-dialog .form-control.tt-input', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    dialogs.clickButton('Share');
    I.waitForInvisible('.modal-dialog');
    I.logout();
    I.login('app=io.ox/mail', { user:users[1] });
    mail.waitForApp();
    mail.selectMail('User ' + users[0].userdata.sur_name + ' has shared the folder')
    I.waitForElement('.mail-detail-frame');
    I.dontSee('attachment');
    I.switchTo('.mail-detail-frame');
    I.waitForElement('#signature_image');
});