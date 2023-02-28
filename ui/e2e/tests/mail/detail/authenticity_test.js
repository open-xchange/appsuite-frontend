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

Feature('Mail > Detail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

// TODO: configure e2e test server for authenticity
Scenario.skip('Authenticity', async ({ I }) => {

    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'media/mails/C244757-hasNoDMARC_hasFailedSPF_hasFailedDKIM_noDomainMatch.eml'
    });

    await I.haveSetting('io.ox/mail//features/authenticity', 'fail_suspicious_neutral_trusted');
    await I.haveSetting('io.ox/mail//authenticity/level', 'all');
    await I.haveSetting('io.ox/mail//showContactPictures', true);

    I.login('app=io.ox/mail');
    // wait for first email
    var firstItem = '.list-view .list-item';
    I.waitForElement(firstItem);
    I.click(firstItem);
    I.waitForVisible('.thread-view.list-view .list-item');

    // list view
    I.waitForText('!', undefined, '.list-item-content .contact-picture');

    // detail view
    I.waitForElement('.mail-detail .authenticity-icon-suspicious');
    I.waitForText('!', undefined, '.detail-view-header .contact-picture');
    I.waitForElement('.mail-detail .message.suspicious');
    I.waitForElement('.mail-detail .disabled-links');

    // detail content
    await within({ frame: '.mail-detail-frame' }, async () => {
        I.retry().waitForVisible({ css: 'a[disabled="disabled"]' });
        I.wait(1);
    });

});
