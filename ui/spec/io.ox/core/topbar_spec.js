/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define([
    'io.ox/core/extensions'
], function (ext) {
    describe('Core: Topbar extensions', function () {
        describe('right dropdown', function () {
            describe('provides an app specific help', function () {
                var node = $('<div>');
                beforeEach(function () {
                    ext.point('io.ox/core/topbar/right/dropdown').get('app-specific-help', function (e) {
                        e.invoke('draw', node.empty());
                        expect(node.children()).to.have.length.above(0);
                    });
                });

                it('should open app specific help for mail app', function () {
                    ox.manifests.apps['io.ox/mail'] = {
                        'help': { 'target': 'ox.appsuite.user.chap.email.html' }
                    };
                    var openStub = sinon.stub(window, 'open'),
                        currentAppStub = sinon.stub(ox.ui.App, 'getCurrentApp', function () {
                            return { getName: function () { return 'io.ox/mail'; } };
                        });

                    node.find('a').trigger('click');
                    expect(openStub.calledOnce, 'window.open called').to.be.true;
                    expect(openStub.getCall(0).args[0]).to.contain('ox.appsuite.user.chap.email.html');
                    openStub.restore();
                    currentAppStub.restore();
                });

                it('should not fail without currentApp', function () {
                    var openStub = sinon.stub(window, 'open'),
                        currentAppStub = sinon.stub(ox.ui.App, 'getCurrentApp', function () {
                            return null;
                        });

                    node.find('a').trigger('click');
                    expect(openStub.calledOnce, 'window.open called once').to.be.true;
                    expect(openStub.getCall(0).args[0]).to.contain('index.html');
                    openStub.restore();
                    currentAppStub.restore();
                });
            });
        });
    });
});
