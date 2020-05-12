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
define(function () {
    describe.only('require static files', function () {
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
