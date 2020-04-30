/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2020 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Christoph Kopp <christoph.kopp@open-xchange.com>
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mail');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C114337] Flag an E-Mail as Flagged/Starred (flaggedOnly)', async function (I, users, mail) {
    const [user] = users;

    await Promise.all([
        I.haveMail({
            attachments: [{
                content: 'Lorem ipsum',
                content_type: 'text/html',
                disp: 'inline'
            }],
            from: [[user.get('display_name'), user.get('primaryEmail')]],
            subject: 'Testcase C114337',
            to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
        }),
        I.haveSetting({ 'io.ox/mail': { messageFormat: 'text' } })
    ]);

    I.login('app=io.ox/mail');
    mail.waitForApp();

    I.waitForText('Testcase C114337');
    I.click('Testcase C114337');

    mail.setColor('Red');

    I.waitForElement('.selected .color-flag.fa-bookmark.flag_1');
    I.logout();

    user.hasConfig('com.openexchange.mail.flagging.mode', 'flaggedOnly');

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.waitForText('Testcase C114337', '.list-view-control');
    I.waitForElement('.list-view.complete');
    I.see('Testcase C114337');

    I.dontSee('~Set color');

    I.wait(1);

    within('.classic-toolbar[aria-label="Mail toolbar. Use cursor keys to navigate."]', () => {
        I.waitForElement('[data-action="io.ox/mail/actions/flag"]');
        I.click('[data-action="io.ox/mail/actions/flag"]');
    });

    I.waitForElement('.list-item [title="Flagged"]');

});
