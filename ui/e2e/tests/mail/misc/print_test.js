/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Print');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C44997] Print a E-Mail', async ({ I, mail }) => {
    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/c44997.eml' });

    // 1. Go to Mail -> Compose
    I.login('app=io.ox/mail');

    // 1. Select the E-Mail
    mail.selectMail('Testsubject');

    // 2. Click "Print"
    I.click('~More actions');
    I.click('Print', '.dropdown.open .dropdown-menu');

    // 3. The printed mail matches the selected mail
    // need to wait here until the browser closed the print window. 5 might be too long but is also super safe
    I.wait(5);
    I.retry(5).switchToNextTab();
    I.waitForText('Testsubject');
    I.see('Lorem ipsum dolor sit amet');
    I.see('4/21/2020 3:53 PM');
    I.see('Jane\u00A0Doe\u00A0<jane@doe.com>');
    I.see('To John\u00A0Doe\u00A0<john@doe.com>');
});
