/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define(function () {
    describe('require static files', function () {
        var fakeServer;

        function mkModule(name) {
            return 'define("' + name.replace(/\.js$/, '') + '", function() { return true; });';
        }

        it('should fetch static files via apps/load api', function () {
            var recordAppsLoad = sinon.spy();
            fakeServer = sinon.fakeServer.create();
            fakeServer.autoRespond = true;
            sinon.FakeXMLHttpRequest.useFilters = false;
            fakeServer.respondWith('GET', /api\/apps\/load/, function (xhr) {
                var modules = xhr.url.split(',');
                modules.shift();
                recordAppsLoad();
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, modules.map(mkModule).join('\n/*:oxsep:*/\n'));
            });

            return require(['file/doesnt/exist']).then(function () {
                sinon.FakeXMLHttpRequest.useFilters = true;
                fakeServer.restore();
                expect(recordAppsLoad.calledOnce, 'apps/load called once').to.be.true;
            });
        });

        describe('respects url limits', function () {
            var testModules;
            it('should split requests larger than the limit', function () {
                var recordAppsLoad = sinon.spy();
                fakeServer = sinon.fakeServer.create();
                fakeServer.autoRespond = true;
                sinon.FakeXMLHttpRequest.useFilters = false;
                fakeServer.respondWith('GET', /api\/apps\/load/, function (xhr) {
                    var modules = xhr.url.split(',');
                    modules.shift();
                    recordAppsLoad(modules.length);
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, modules.map(mkModule).join('\n/*:oxsep:*/\n'));
                });

                ox.serverConfig.limitRequestLine = 115;
                testModules = ['tests/longList1', 'tests/longList2', 'tests/longList3'];
                testModules.push('tests/longList4', 'tests/longList5');

                return ox.clearFileCache().then(function () {
                    return require(testModules);
                }).then(function () {
                    sinon.FakeXMLHttpRequest.useFilters = true;
                    fakeServer.restore();
                    delete ox.serverConfig.limitRequestLine;

                    expect(recordAppsLoad.firstCall.calledWith(3), 'Loaded 2 modules').to.be.true;
                    expect(recordAppsLoad.secondCall.calledWith(2), 'Loaded 3 modules').to.be.true;
                    expect(recordAppsLoad.callCount, 'apps/load called two times').to.equal(2);
                });
            });
        });

        describe('caching', function () {
            it('should fetch uncached files async', function () {
                require.undef('io.ox/core/session');
                var cb = sinon.spy(),
                    def = require(['io.ox/core/session'], cb);
                expect(cb).not.to.have.been.called;
                return def.then(function () {
                    expect(cb).to.have.been.calledOnce;
                });
            });

            it('should have sync cache hits using cb style', function () {
                //make sure the file is in require registry
                require('io.ox/core/session');
                var cb = sinon.spy(),
                    def = require(['io.ox/core/session'], cb);
                expect(cb).to.have.been.calledOnce;
                return def;
            });

            it('should have sync cache hits using done style', function () {
                //make sure the file is in require registry
                require('io.ox/core/session');
                var cb = sinon.spy(),
                    def = require(['io.ox/core/session']).done(cb);
                expect(cb).to.have.been.calledOnce;
                return def;
            });

            it('should resolve for multiple modules', function () {
                //make sure the file is in require registry
                require('io.ox/core/session');
                require('io.ox/core/api/account');
                var cb = sinon.spy(),
                    def = require(['io.ox/core/session', 'io.ox/core/api/account']).done(cb);
                expect(cb).to.have.been.calledOnce;
                return def.then(function () {
                    expect(arguments).to.have.length(2);
                });
            });
        });

        describe('with fixture plugin', function () {
            it('should load JSON data as objects', function (done) {
                require(['fixture!test/data.json'], function (data) {
                    expect(data.test).to.equal('bar');
                    done();
                });
            });

            it('should load require modules', function (done) {
                require(['fixture!test/module.js'], function (data) {
                    expect(data.someMethod).to.be.a('function');
                    done();
                });
            });
        });
    });
});
