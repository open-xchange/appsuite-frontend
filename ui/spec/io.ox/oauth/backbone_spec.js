/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
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
                expect(m.hasScope).to.be.a('function');
                expect(m.hasScope('drive')).to.be.true;
                expect(m.hasScope('mail')).to.be.true;
                expect(m.hasScope('not existing')).to.be.false;
            });

            describe('reauthorization workflow', function () {
                it('should allow to force reauthorization', function () {
                    var m = new Model(),
                        server = ox.fakeServer.create(),
                        globalCallbackSpy = sinon.spy(),
                        windowOpen = sinon.stub(window, 'open', function () {
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
                    return m.reauthorize({ force: false })
                        .then(function () {
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
