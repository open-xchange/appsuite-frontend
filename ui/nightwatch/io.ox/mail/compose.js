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
 */

describe('Mail compose', function () {

    it('opens mail compose', function (client) {
        client
            .login('app=io.ox/mail')
            .waitForElementVisible('*[data-app-name="io.ox/mail"]', 20000)
            .assert.containsText('*[data-app-name="io.ox/mail"]', 'Mail');

        client
            .waitForElementVisible('.io-ox-mail-window .window-body > .classic-toolbar-container', 20000)
            .assert.containsText('.io-ox-mail-window .window-body > .classic-toolbar-container a[data-action=compose]', 'Compose')

        client
            .require(['settings!io.ox/mail'], function (settings) {
                settings.set('messageFormat', 'text');
            })
            .click('.io-ox-mail-window .window-body > .classic-toolbar-container a[data-action=compose]');

        client.waitForElementVisible('.io-ox-mail-compose textarea.plain-text', 20000)
            .pause(1000)
            .assert.title('App Suite. Compose');

        client.logout();
    });

});
