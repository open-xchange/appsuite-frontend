/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Detail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C101618] Link with position: fixed; should not cover the whole UI', async ({ I, mail }) => {

    const DESCRIPTION = 'Link with position: fixed; should not cover the whole UI';

    await Promise.all([
        I.haveSetting('io.ox/mail//features/registerProtocolHandler', false),
        I.haveSetting('io.ox/mail//allowHtmlImages', true),
        I.haveMail({
            folder: 'default0/INBOX',
            path: 'e2e/media/mails/c101618.eml'
        })
    ]);

    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.selectMail(DESCRIPTION);

    I.waitForElement('.mail-detail-frame');
    await within({ frame: '.mail-detail-frame' }, async () => {
        const SELECTOR = '.mail-detail-content a';
        I.waitForElement(SELECTOR);
        // click-jacking-element overlaps this one
        I.see('Click will be highjacked');
        //I.click('Click will be highjacked');
    });

    // we use a workaround here by trying to click an element outside of mail-detail-content
    // in case the click-jacking-element would receive the click an error would be thrown:
    // 'Other element would receive the click...'
    I.see('Reply');
    I.click('Reply');
});
