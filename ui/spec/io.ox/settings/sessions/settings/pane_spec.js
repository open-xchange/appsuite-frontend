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

define([
    'io.ox/settings/security/sessions/settings/pane',
    'gettext!io.ox/core',
    'settings!io.ox/core'
], function (session, gt, settings) {

    describe.skip('Session settings', function () {

        describe('Model displayName', function () {

            it('should recognize a desktop device with useragent', function () {
                var model = new session.Model({
                    client: 'open-xchange-appsuite',
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
                });
                model.get('operatingSystem').should.equal(gt('Mac'));
                model.get('application').should.equal(gt('Chrome'));
            });

            it('should recognize a mobile device with useragent', function () {
                var model = new session.Model({
                    client: 'open-xchange-appsuite',
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
                });
                model.get('operatingSystem').should.equal(gt('iOS'));
                model.get('application').should.equal(gt('Safari'));
            });

            it('should recognize a mobile device of the mail app with useragent', function () {
                var model = new session.Model({
                    client: 'open-xchange-mobile-api-facade',
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
                });
                model.get('operatingSystem').should.equal(gt('iOS'));
                model.get('application').should.equal(settings.get('productname/mailapp') || 'OX Mail');
            });

            it('should recognize a EAS device', function () {
                var model = new session.Model({
                    client: 'USM-EAS'
                });
                expect(model.get('operatingSystem')).to.be.undefined;
                model.get('application').should.equal(gt('CalDav/CardDav'));
            });

        });

    });

});
