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
 */


/// <reference path="../../steps.d.ts" />

Feature('Mail > Drive Mail');

Before(async (users) => {
    await users.create();
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C85691] Cloud icon is used for drive-mail', async function (I, users) {
    I.login('app=io.ox/mail');
    I.waitForElement('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForElement('.io-ox-mail-compose .contenteditable-editor');

    I.waitForFocus('input[placeholder="To"]');
    I.fillField('To', users[1].get('primaryEmail'));
    I.fillField('Subject', 'Git Gud');

    I.attachFile('.io-ox-mail-compose-window input[type="file"]', 'e2e/media/files/generic/testdocument.rtf');

    I.click('Use Drive Mail');
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');

    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.waitForElement('.io-ox-mail-window');
    I.see('Git Gud');
    I.seeElement('.fa-cloud-download.is-shared-attachement');
});
