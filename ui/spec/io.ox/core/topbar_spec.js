/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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
    'io.ox/core/extensions'
], function (ext) {
    describe.skip('Core: Topbar extensions', function () {
        describe('right dropdown', function () {
            describe('provides an app specific help', function () {
                var node = $('<div>');
                beforeEach(function () {
                    ext.point('io.ox/core/appcontrol/right/account').get('app-specific-help', function (e) {
                        e.invoke('extend', node.empty());
                        expect(node.children()).to.have.length.above(0);
                    });
                });

                it('should open app specific help for mail app', function () {
                    ox.manifests.apps['io.ox/mail'] = {
                        'help': { 'target': 'ox.appsuite.user.chap.email.html' }
                    };
                    var openStub = sinon.stub(window, 'open'),
                        currentAppStub = sinon.stub(ox.ui.App, 'getCurrentApp').callsFake(function () {
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
                        currentAppStub = sinon.stub(ox.ui.App, 'getCurrentApp').callsFake(function () {
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
