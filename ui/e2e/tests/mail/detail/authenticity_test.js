/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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
        path: 'e2e/media/mails/C244757-hasNoDMARC_hasFailedSPF_hasFailedDKIM_noDomainMatch.eml'
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
