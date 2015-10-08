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

    describe('files API', function () {
        it('should exist', function () {
            expect(api).to.exist;
        });

        var testFiles = [
            { id: '1337', folder_id: '4711', title: 'three', locked_until: 1337 },
            { id: '1338', folder_id: '4711', title: 'four', locked_until: 1337 },
            { id: '1339', folder_id: '4711', title: 'five' }
        ];

        var testVersions = [
            { id: '1337', folder_id: '4711', version: 1 },
            { id: '1337', folder_id: '4711', version: 2 }
        ];

        beforeEach(function () {
            api.pool.get('detail').reset();
            this.server.respondWith('GET', /api\/folders\?action=list/, function (xhr) {
                expect(xhr.url).to.contain('parent=4711');
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                    timestamp: 1368791630910,
                    data: []
                }));
            });
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
                    data: testVersions
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
                ox.fakeServer.instance = this.server;
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
            beforeEach(function () {
                return api.get({
                    id: '1337',
                    folder: '4711'
                });
            });

            it('should be a list for each file', function () {
                var server = this.server;
                console.log(api.pool.get(_.cid({ id: '1337', folder_id: '4711' })));
                return api.versions.load({
                    id: '1337',
                    folder: '4711'
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
                return api.versions.load({
                    id: '1337',
                    folder: '4711'
                }).then(function () {
                    return api.versions.load({
                        id: '1337',
                        folder: '4711'
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
            var def1337, def1338;

            beforeEach(function () {
                def1337 = $.Deferred();
                def1338 = $.Deferred();

                return api.get({
                    id: '1338',
                    folder: '4711'
                }).then(function (data) {
                    var m = api.pool.get('detail').get(_.cid(data));
                    m.set(testFiles[1]);
                    m.on('change:locked_until', def1338.resolve);
                    return api.get({
                        id: '1337',
                        folder: '4711'
                    });
                }).then(function (data) {
                    var m = api.pool.get('detail').get(_.cid(data));
                    m.set(testFiles[0]);
                    m.on('change:locked_until', def1337.resolve);
                });
            });

            it('should trigger "change:locked_until" when locking a single file', function () {
                api.lock({
                    id: '1337',
                    folder: '4711'
                });

                return def1337.done(function (model, val) {
                    expect(val).to.be.a('number').and.above(0);
                });
            });
            it('should trigger "change:locked_until" when locking a list of files', function () {
                api.lock([{
                    id: '1337',
                    folder: '4711'
                },
                {
                    id: '1338',
                    folder: '4711'
                }]);

                return $.when(def1337, def1338).done(function (val1337, val1338) {
                    expect(val1337[1]).to.be.a('number').and.above(0);
                    expect(val1338[1]).to.be.a('number').and.above(0);
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

        describe('clear folder', function () {
            var clearSpy, def, folderReload;
            beforeEach(function () {
                clearSpy = sinon.spy(function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                        timestamp: 1368791630910,
                        data: []
                    }));
                });
                def = $.Deferred();
                folderReload = $.Deferred();

                api.pool.getByFolder('4711').forEach(function (c) {
                    c.on('reset', def.resolve);
                });

                this.server.respondWith('PUT', /api\/folders\?action=clear/, function (xhr) {
                    clearSpy(xhr);
                });
                this.server.responses = this.server.responses.filter(function (r) {
                    return !r.url.test('api/folders?action=get');
                });
                this.server.respondWith(/api\/folders\?action=get/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                        timestamp: 1368791630910,
                        data: {
                            id: '4711',
                            folder_id: '1'
                        }
                    }));
                    folderReload.resolve();
                });
            });
            it('should trigger reset event for folder collection', function () {
                api.clear('4711').fail(function () {
                    throw 'api.clear failed';
                });
                return def.then(function (c) {
                    expect(c).to.have.length(0);
                });
            });

            it('should reload the folder', function () {
                api.clear('4711').fail(function () {
                    throw 'api.clear failed';
                });
                return folderReload;
            });

            it('should send action=clear to folder module', function () {
                return api.clear('4711').fail(function () {
                    throw 'api.clear failed';
                }).done(function () {
                    expect(clearSpy.called, 'folder clear action sent to server').to.be.true;
                });
            });
        });

        describe('detach versions', function () {
            it('should remove a single version', function () {
                this.server.respondWith('PUT', /api\/files\?action=detach/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                        timestamp: 1368791630910,
                        data: []
                    }));
                });
                var file, removedVersion;
                return api.get({ id: '1337', folder_id: '4711' }).then(function (data) {
                    file = data;
                    var m = api.pool.get('detail').get(_.cid(file));
                    var def = $.Deferred();
                    m.on('change:versions', def.resolve);
                    api.versions.load(data);
                    return def;
                }).then(function () {
                    var m = api.pool.get('detail').get(_.cid(file));
                    expect(m.get('versions')).to.have.length(2);
                    //temporarily remove the version from the fakeserver response
                    removedVersion = testVersions.pop();
                    return api.versions.remove({
                        id: '1337',
                        folder_id: '4711',
                        version: 1
                    });
                }).then(function () {
                    testVersions.push(removedVersion);
                    var m = api.pool.get('detail').get(_.cid(file));
                    expect(m.get('versions')).to.have.length(1);
                }, function () {
                    throw 'api.detach failed';
                });
            });
        });
    });
});
