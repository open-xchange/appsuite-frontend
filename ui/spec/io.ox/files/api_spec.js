/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define([
    'io.ox/files/api',
    'settings!io.ox/core'
], function (api, coreSettings) {
    'use strict';

    describe.only('files API', function () {
        it('should exist', function () {
            expect(api).to.exist;
        });

        var testFiles = [
            { id: '1337', folder_id: '4711', title: 'three', locked_until: 1337 },
            { id: '1338', folder_id: '4711', title: 'four', locked_until: 1337 },
            { id: '1339', folder_id: '4711', title: 'five' }
        ];

        beforeEach(function () {
            api.pool.get('detail').reset();
            this.server.respondWith('GET', /api\/files\?action=all/, function (xhr) {
                expect(xhr.url).to.contain('folder=4711');
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                    timestamp: 1368791630910,
                    data: testFiles
                }));
            });

            this.server.respondWith('GET', /api\/files\?action=versions/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                    timestamp: 1368791630910,
                    data: [
                        { id: '1337' },
                        { id: '1337' }
                    ]
                }));
            });

            this.server.respondWith('GET', /api\/files\?action=get/, function (xhr) {
                var res = xhr.url.match(/id=(\d+).*folder=(\d+)/);
                var data = testFiles.filter(function (item) {
                    return String(item.id) === res[1] && String(item.folder_id) === res[2];
                })[0];
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                    timestamp: 1368791630910,
                    data: data
                }));
            });
        });

        describe('Collection Loader', function () {

            it('uses the files module', function () {
                expect(api.collectionLoader.module).to.equal('files');
            });

            it('loads the default folder', function (done) {
                //set default folder for files app
                coreSettings.set('folder/infostore', '4711');
                var c = api.collectionLoader.load();
                c.on('load', function (m) {
                    expect(c).to.have.length(3);
                    done();
                });
            });

            it('serves a collection for a folder', function (done) {
                var c = api.collectionLoader.load({
                    id: '1337',
                    folder: '4711'
                });
                c.on('load', function (m) {
                    expect(c).to.have.length(3);
                    done();
                });
            });
        });

        describe('versions of files', function () {
            it('should be a list for each file', function () {
                var server = this.server;
                return api.versions({
                    id: '1337'
                }).then(function (versions) {
                    expect(versions).to.be.an('array');
                    expect(versions).to.have.length(2);
                    expect(server.requests.filter(function (xhr) {
                        return xhr.url.indexOf('action=versions') >= 0;
                    })).to.have.length(1);
                });
            });
            it('should cache versions', function () {
                var server = this.server;
                return api.versions({
                    id: '1337'
                }).then(function () {
                    return api.versions({
                        id: '1337'
                    });
                }).then(function (versions) {
                    expect(versions).to.be.an('array');
                    expect(versions).to.have.length(2);
                    expect(server.requests.filter(function (xhr) {
                        return xhr.url.indexOf('action=versions') >= 0;
                    })).to.have.length(1);
                });
            });
        });

        describe('locking', function () {
            var def1337, def1338, stub;

            beforeEach(function () {
                def1337 = $.Deferred();
                def1338 = $.Deferred();

                return api.get({
                    id: '1338',
                    folder: '4711'
                }).then(function (m) {
                    m.set(testFiles[1]);
                    m.on('change:locked_until', def1338.resolve);
                    return api.get({
                        id: '1337',
                        folder: '4711'
                    });
                }).then(function (m) {
                    m.set(testFiles[0]);
                    m.on('change:locked_until', def1337.resolve);
                });
            });

            afterEach(function () {
                if (stub) stub.restore();
                stub = null;
            });

            it('should trigger "change:locked_until" when locking a single file', function () {
                stub = sinon.stub(api.collectionLoader, 'reload', function () {
                    this.collection.get('4711.1337').set('locked_until', 1730130259255);
                });
                api.lock({
                    id: '1337',
                    folder: '4711'
                });

                return def1337.done(function (model, val) {
                    expect(val).to.be.a('number').and.above(0);
                });
            });
            it('should trigger "change:locked_until" when locking a list of files', function () {
                stub = sinon.stub(api.collectionLoader, 'reload', function () {
                    this.collection.get('4711.1337').set('locked_until', 1730130259255);
                    this.collection.get('4711.1338').set('locked_until', 1730130259255);
                });
                api.lock([{
                    id: '1337',
                    folder: '4711'
                },
                {
                    id: '1338',
                    folder: '4711'
                }]);

                return $.when(def1337, def1338).done(function (val1337, val1338) {
                    expect(val1337[1]).to.be.a('number').and.eq(1730130259255);
                    expect(val1338[1]).to.be.a('number').and.eq(1730130259255);
                });
            });
            it('should trigger "change:locked_until" when unlocking a single file', function () {
                api.unlock({
                    id: '1337',
                    folder: '4711'
                });

                return def1337.done(function (model, val) {
                    expect(val).to.be.a('number').and.eq(0);
                });
            });
            it('should trigger "change:locked_until" when unlocking a list of files', function () {
                api.unlock([{
                    id: '1337',
                    folder: '4711'
                },
                {
                    id: '1338',
                    folder: '4711'
                }]);

                return $.when(def1337, def1338).done(function (val1337, val1338) {
                    expect(val1337[1]).to.be.a('number').and.eq(0);
                    expect(val1338[1]).to.be.a('number').and.eq(0);
                });
            });
        });
    });
});
