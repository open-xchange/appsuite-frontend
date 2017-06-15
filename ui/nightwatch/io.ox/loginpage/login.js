/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 **/

describe('App Suite Loginpage', function () {

    // https://testrail.open-xchange.com/index.php?/cases/view/7382
    it('should show up without warning', function (client) {

        client
            .loginpage()
            .assert.elementNotPresent('#io-ox-login-feedback .alert');
    });

    it('shows a warning when using an unsupported browser', function (client) {
        client
            .loginpage({ userAgent: 'Mozilla Gecko 123 something totally unknown' })
            .assert.elementPresent('#io-ox-login-feedback .alert');
        client.assert.attributeContains('.alert > div', 'data-error', 'outdated-browser');
    });

    it('shows a warning for an unsupported browser/platform combination like Chrome on iOS', function (client) {
        client
            .windowSize(client.windowHandle(), 320, 480)
            .loginpage({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1' })
            .assert.elementPresent('#io-ox-login-feedback .alert');
        client.assert.attributeContains('.alert > div', 'data-error', 'unknown-combination');
    });

    it('shows a warning for an unsupported browser/platform combination like FF on Android', function (client) {
        client
            .windowSize(client.windowHandle(), 320, 480)
            .loginpage({ userAgent: 'Mozilla/5.0 (Android 5.0.1; Mobile; rv:52.0) Gecko/52.0 Firefox/52.0' })
            .assert.elementPresent('#io-ox-login-feedback .alert');
        client.assert.attributeContains('.alert > div', 'data-error', 'unknown-combination');
    });

    it('shows a warning for an unsupported browser/platform combination like FF on iOS', function (client) {
        client
            .windowSize(client.windowHandle(), 320, 480)
            .loginpage({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4' })
            .assert.elementPresent('#io-ox-login-feedback .alert');
        client.assert.attributeContains('.alert > div', 'data-error', 'unknown-combination');
    });

    it('shows a warning for an outdated iOS version 8.0', function (client) {
        client
            .windowSize(client.windowHandle(), 320, 480)
            .loginpage({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/8.0 Mobile/13B143 Safari/601.1' })
            .assert.elementPresent('#io-ox-login-feedback .alert');
        client.assert.attributeContains('.alert > div', 'data-error', 'outdated-platform');
    });

    it('shows a warning for an outdated Android version 4.3', function (client) {
        client
            .windowSize(client.windowHandle(), 320, 480)
            .loginpage({ userAgent: 'Mozilla/5.0 (Linux; Android 4.3; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Mobile Safari/537.36' })
            .assert.elementPresent('#io-ox-login-feedback .alert');
        client.assert.attributeContains('.alert > div', 'data-error', 'outdated-platform');
    });

});
