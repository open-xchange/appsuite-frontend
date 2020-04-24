/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Detail');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[Bug 63470] Encoding wrong in plain text mails', async (I, users, mail) => {


    var currentUser = users[0].userdata.email1;

    await I.haveMail({
        attachments: [{
            content: 'test&quottest test&timestamp=12.23',
            content_type: 'text/plain',
            disp: 'inline'
        }],
        from: [['Mich selbst', currentUser]],
        subject: 'Awesome encoding',
        to: [['Mich selbst', currentUser]]
    });

    I.login('app=io.ox/mail');
    mail.waitForApp();

    // check mail
    I.waitForText('Awesome encoding');
    I.click('.list-view .list-item');
    I.waitForVisible('.thread-view.list-view .list-item .mail-detail-frame');
    await within({ frame: '.mail-detail-frame' }, async () => {
        I.waitForText('test&quottest test&timestamp=12.23');
        I.dontSee('test"test test×tamp=12.23');
    });
});
