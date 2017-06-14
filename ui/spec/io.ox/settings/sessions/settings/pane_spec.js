/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
define([
    'io.ox/settings/sessions/settings/pane',
    'gettext!io.ox/core',
    'settings!io.ox/core'
], function (session, gt, settings) {

    describe('Session settings', function () {

        describe('Model displayName', function () {

            it('should recognize a desktop device with useragent', function () {
                var model = new session.Model({
                    client: 'open-xchange-appsuite',
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
                });
                model.get('displayName').should.equal(gt('Chrome %1$s on %2$s', 58, 'MacOS'));
                model.get('platform').should.equal('desktop');
            });

            it('should recognize a mobile device with useragent', function () {
                var model = new session.Model({
                    client: 'open-xchange-appsuite',
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
                });
                model.get('displayName').should.equal(gt('Safari %1$s on %2$s', '9', 'iOS'));
                model.get('platform').should.equal('smartphone');
            });

            it('should recognize a mobile device of the mail app with useragent', function () {
                var model = new session.Model({
                    client: 'open-xchange-mobile-api-facade',
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
                });
                model.get('displayName').should.equal(gt('%1$s on %2$s', settings.get('productname/mailapp'), 'iOS'));
                model.get('platform').should.equal('smartphone');
            });

            it('should recognize a EAS device', function () {
                var model = new session.Model({
                    client: 'USM-EAS'
                });
                model.get('displayName').should.equal(gt('Exchange Active Sync'));
                model.get('platform').should.equal('other');
            });

        });

    });

});
