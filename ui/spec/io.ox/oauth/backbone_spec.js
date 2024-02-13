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

define(['io.ox/oauth/backbone'], function (OAuth) {

    describe('OAuth', function () {
        describe('Account Model', function () {
            var Model = OAuth.Account.Model;

            it('should be a Backbone Model', function () {
                var m = new Model();
                expect(m).to.exist;
            });

            it('should have a way to query enabled scopes', function () {
                var m = new Model({
                    enabledScopes: ['drive', 'mail']
                });
                expect(m.hasScopes).to.be.a('function');
                expect(m.hasScopes('drive')).to.be.true;
                expect(m.hasScopes('mail')).to.be.true;
                expect(m.hasScopes('not existing')).to.be.false;
            });

            it('should have a way to query multiple enabled scopes', function () {
                var m = new Model({
                    enabledScopes: ['contacts', 'contacts_ro', 'drive', 'mail']
                });
                expect(m.hasScopes).to.be.a('function');
                expect(m.hasScopes(['contacts'])).to.be.true;
                expect(m.hasScopes(['contacts_ro'])).to.be.true;
                expect(m.hasScopes(['contacts', 'contacts_ro'])).to.be.true;
            });

            it('should have a way to query multiple enabled scopes which are partially enabled', function () {
                var m = new Model({
                    enabledScopes: ['contacts', 'drive', 'mail']
                });
                expect(m.hasScopes).to.be.a('function');
                expect(m.hasScopes(['contacts', 'contacts_ro'])).to.be.true;
            });

            describe.skip('reauthorization workflow', function () {
                it('should allow to force reauthorization', function () {
                    var m = new Model(),
                        server = ox.fakeServer.create(),
                        globalCallbackSpy = sinon.spy(),
                        windowOpen = sinon.stub(window, 'open').callsFake(function () {
                            return {
                                focus: _.noop,
                                close: _.noop
                            };
                        });

                    server.autoRespond = true;
                    server.respondWith('GET', /api\/oauth\/accounts\?action=init/, function (xhr) {
                        xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{ "data": true }');
                        var cb = xhr.url.match(/cb=(\w*)&/)[1];
                        globalCallbackSpy();
                        window['callback_' + cb]();
                    });
                    return m.reauthorize({ force: false }).then(function () {
                        expect(globalCallbackSpy.called).to.be.false;
                        return m.reauthorize({ force: true });
                    }).then(function () {
                        expect(globalCallbackSpy.called).to.be.true;
                        server.restore();
                        windowOpen.restore();
                    });
                });
            });
        });
    });
});
