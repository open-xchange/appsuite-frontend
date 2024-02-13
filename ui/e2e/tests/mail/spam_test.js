/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

/// <reference path="../../steps.d.ts" />

Feature('Mail > Spam');

Before(async function ({ users }) {
    const user = users.getRandom();
    user.gui_spam_filter_enabled = true;
    await users.create(user);
});

After(async function ({ users }) {
    await users.removeAll();
});

// TODO: skip can be removed as soon as https://gitlab.open-xchange.com/frontend/codecept-helpers/merge_requests/72 is released
Scenario.skip('Mark mail in spam folder as not spam and move to inbox', async function ({ I, users }) {
    let [user] = users,
        subject = 'test subject';

    await user.hasCapability('spam');

    await I.haveMail({
        from: user,
        to: user,
        subject: subject
    });

    I.login('app=io.ox/mail');

    I.waitForVisible('.io-ox-mail-window');
    I.waitForVisible(locate('span').withAttr({ 'title': subject }));
    I.rightClick(subject, '.list-item');
    I.click('Mark as spam', '.smart-dropdown-container');
    I.selectFolder('Spam');
    I.waitForVisible(locate('span').withAttr({ 'title': subject }));
    I.rightClick(subject, '.list-item');
    I.click('Not spam', '.smart-dropdown-container');
    I.selectFolder('Inbox');
    I.waitForVisible(locate('span').withAttr({ 'title': subject }));
});

Scenario('[C114951] Disabled links in spam mail folders', async function ({ I, users, mail }) {

    users[0].hasConfig('com.openexchange.mail.maliciousFolders.listing', '$Spam, default0/INBOX/Phishing');

    await I.haveMail({
        folder: 'default0/INBOX/Spam',
        path: 'media/mails/C114951.eml'
    });

    const defaultFolder = await I.grabDefaultFolder('mail');

    await I.haveFolder({
        title: 'Phishing',
        module: 'mail',
        parent: defaultFolder
    });

    await I.haveMail({
        folder: 'default0/INBOX/Phishing',
        path: 'media/mails/C114951.eml'
    });

    I.login(['app=io.ox/mail']);
    mail.waitForApp();
    I.waitForVisible('.io-ox-mail-window');
    I.waitForText('Spam', 5, '.folder-tree');
    I.selectFolder('Spam');
    I.waitForText('Rudolf rockt die Kinderkollektion', 10, '.list-view li.list-item');
    mail.selectMail('Rudolf rockt die Kinderkollektion');
    I.waitForElement('.mail-detail-frame');

    await within({ frame: '.mail-detail-frame' }, async function () {
        //Checking attribute "disabled" on specific link
        I.waitForElement(locate('.customer-ribbon-link')
            .withAttr({ 'disabled': 'disabled' })
            .withText('Hello Member - Melde dich an & nutze deine Member-Angebote! Noch kein Member? Jetzt anmelden.')
        );
    });

    I.selectFolder('Phishing');
    mail.selectMail('Rudolf rockt die Kinderkollektion!');
    I.waitForElement('.mail-detail-frame');

    await within({ frame: '.mail-detail-frame' }, async function () {
        //Checking attribute "disabled" on specific link
        I.waitForElement(locate('.customer-ribbon-link')
            .withAttr({ 'aria-disabled': 'true' })
            .withText('Hello Member - Melde dich an & nutze deine Member-Angebote! Noch kein Member? Jetzt anmelden.')
        );
    });
});
