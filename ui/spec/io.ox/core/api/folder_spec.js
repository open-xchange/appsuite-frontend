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
define(['shared/examples/for/api',
       'io.ox/core/api/folder',
       'io.ox/core/http',
       'io.ox/core/extensions'
], function (sharedExamplesFor, api, http, ext) {
    var setupFakeServer = function (server) {
        //sends a default folder for get calls
        server.respondWith('GET', /api\/folders\?action=get/, function (xhr) {
            var sendObject = JSON.parse('{"' + decodeURI(xhr.url)
                .replace('/api/folders?', '')
                .replace(/"/g, '\\"').replace(/&/g, '","')
                .replace(/=/g, '":"') + '"}'),
                parentFolderIDs = {'2': '1',
                    '3' : '2',
                    '4' : '2',
                    '5' : '2',
                    '21' : '2'
                };

            xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"},
                JSON.stringify({timestamp: 1378223251586, data: {id: sendObject.id, folder_id: parentFolderIDs[sendObject.id]}})
            );
        });

        //sends a list of subfolders
        server.respondWith('GET', /api\/folders\?action=list/, function (xhr) {
            xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"},
                JSON.stringify({
                    timestamp: 1368791630910,
                    data: [
                        {id: '3', folder_id: '2'},
                        {id: '4', folder_id: '2'},
                        {id: '5', folder_id: '2'}
                    ]
                })
            );
        });

        //sends a path from a folder
        server.respondWith('GET', /api\/folders\?action=path/, function (xhr) {
            xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"},
                JSON.stringify({"timestamp": 9223372036854775807,
                    "data": [
                        ["3", 0, 0, 0, 0, 0, "2", null, "Subfolder", "infostore", 2, true, 0, null, null, true, 2, null, null, null, null, true, true, 8, null, false, false, "Name"],
                        ["2", 0, 0, 0, 0, 0, "1", null, "Folder", "infostore", 2, true, 0, null, null, true, 2, null, null, null, null, true, true, 8, null, false, false, "Name"],
                        ["1", 0, 0, 0, 0, 0, "0", null, "Root", "infostore", 2, true, 0, null, null, true, 2, null, null, null, null, true, true, 8, null, false, false, "Name"]]})
            );
        });

        //sends the created folder
        server.respondWith('PUT', /api\/folders\?action=(new|delete)/, function (xhr) {
            xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"},
                JSON.stringify({timestamp: 1378223251586, data: '21'})
            );
        });

        //responds with empty message to allVisible calls
        server.respondWith(/api\/folders\?action=allVisible/, function (xhr) {
            xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"},
                JSON.stringify({timestamp: 1378223251586, data: []})
            );
        });
    };

    return describe('folder API', function () {
        var options = {
                markedPending: {
                    'folder API a basic API class has some get methods should define a getAll method.': true,
                    'folder API a basic API class has some get methods should return a deferred object for getAll.': true,
                    'folder API a basic API class has some get methods should define a getList method.': true,
                    'folder API a basic API class has some get methods should return a deferred object for getList.': true,
                    'folder API default folders should know about the mail folder.': true,
                    'folder API default folders should provide the mail folder as default.': true
                }
            };
        sharedExamplesFor(api, options);

        describe('default folders', function () {
            it('should provide the mail folder as default', function () {
                var folder_id = api.getDefaultFolder();
                expect(folder_id).toEqual('default0/INBOX');
            });

            it('should know about the mail folder', function () {
                var folder_id = api.getDefaultFolder('mail');
                expect(folder_id).toEqual('default0/INBOX');
            });
        });

        describe('requests some folders from the server', function () {
            beforeEach(function () {
                //TODO: clear global cache (must also be possible in phantomJS)
                var def = api.clearCaches();

                //wait for caches to be clear, then procceed
                waitsFor(function () {
                    return def.state() === 'resolved';
                }, 'cache clear takes too long', 1000);
                runs(function () {
                    //make fake server only respond on demand
                    this.server.autoRespond = false;
                    setupFakeServer(this.server);
                });
            });

            it('should return a folder with correct id', function () {
                var result = api.get({folder: '2', cache: false});

                result.done(function (data) {
                    expect(data.id).toBe('2');
                });

                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');
                this.server.respond();
                expect(result).toResolve();
            });

            it('should return a list of subfolders with correct parent ids', function () {
                var result = api.getSubFolders({folder: '2'});

                result.done(function (data) {
                    _(data).each(function (folder) {
                        expect(folder.folder_id).toBe('2');
                    });
                });

                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');

                expect(this.server).toRespondUntilResolved(result);
            });

            it('should return a path of a folder with getPath', function () {
                var result = api.getPath({folder: '3', cache: true}),
                    parentID = '1';

                result.done(function (data) {
                    _(data).each(function (folder) {
                        expect(folder.folder_id).toBe(parentID);
                        parentID = folder.id;
                    });

                    expect(_(data).first().id).not.toBe('0');
                });

                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');

                expect(this.server).toRespondUntilResolved(result);
            });

            it('should trigger a create event', function () {
                expect(api).toTrigger('create');
                var result = api.create({folder: '2'});

                //deferred should be pending
                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');

                expect(this.server).toRespondUntilResolved(result);
            });

            it('should create a folder', function () {
                var spy = sinon.spy(http, 'PUT'),
                    result = api.create({folder: '2'}),
                    param;

                //deferred should be pending
                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');

                //make server respond
                expect(this.server).toRespondUntilResolved(result);

                result.done(function () {
                    //server response should resolve deferred
                    expect(result.state()).toBe('resolved');
                    expect(spy).toHaveBeenCalledOnce();

                    //the http request should containt corrent values
                    param = spy.getCall(0).args[0];
                    expect(param.module).toBe('folders');
                    expect(param.params.action).toBe('new');
                    expect(param.params.folder_id).toBe('2');

                    //restore http.PUT
                    http.PUT.restore();
                });
            });

            it('should trigger a delete event', function () {
                expect(api).toTrigger('delete');
                var result = api.remove({folder: '2'});

                //deferred should be pending
                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');

                expect(this.server).toRespondUntilResolved(result);
            });

            it('should remove a folder', function () {
                var spy = sinon.spy(http, 'PUT'),
                    result = api.remove({folder: '2'}),
                    param;

                //deferred should be pending
                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');

                //make server respond
                expect(this.server).toRespondUntilResolved(result);

                result.done(function () {
                    //server response should resolve deferred
                    expect(result.state()).toBe('resolved');
                    expect(spy).toHaveBeenCalledOnce();

                    //the http request should containt corrent values
                    param = spy.getCall(0).args[0];
                    expect(param.module).toBe('folders');
                    expect(param.params.action).toBe('delete');
                    expect(param.params.folder_id).toBe('2');

                    //restore http.PUT
                    http.PUT.restore();
                });
            });

            describe('to find out, if a folder', function () {
                it('can read', function () {
                    expect(api.can('read', {own_rights: 128})).toBe(true);
                    expect(api.can('read', {own_rights: 127})).toBe(false);
                });

                it('can create', function () {
                    expect(api.can('create', {own_rights: 2})).toBe(true);
                    expect(api.can('create', {own_rights: 1})).toBe(false);
                });

                it('can write', function () {
                    expect(api.can('write', {own_rights: 20000})).toBe(true);
                    expect(api.can('write', {own_rights: 0})).toBe(false);
                });

                it('can delete', function () {
                    expect(api.can('delete', {own_rights: 5000000})).toBe(true);
                    expect(api.can('delete', {own_rights: 0})).toBe(false);
                });

                it('can rename', function () {
                    expect(api.can('rename', {own_rights: 0x50000000})).toBe(true);
                    expect(api.can('rename', {own_rights: 0})).toBe(false);
                });

                it('can create folder', function () {
                    expect(api.can('createFolder', {own_rights: 0x10000000})).toBe(true);
                    expect(api.can('createFolder', {own_rights: 0, permissions: 0})).toBe(false);
                });

                it('can delete folder', function () {
                    expect(api.can('deleteFolder', {own_rights: 0x10000000})).toBe(true);
                    expect(api.can('deleteFolder', {own_rights: 0})).toBe(false);
                });
            });
        });

        describe('shortens the folder title', function () {
            it('from "this is a test title" to "this\u2026title"', function () {
                expect(api.getFolderTitle('this is a test title', 10)).toBe('this\u2026title');
            });

            it('from "this is a test title" to "t\u2026e"', function () {
                expect(api.getFolderTitle('this is a test title', 5)).toBe('t\u2026e');
            });

            it('from "this is a test title" to "this is a test title"', function () {
                expect(api.getFolderTitle('this is a test title', 20)).toBe('this is a test title');
            });

            it('from "this is a test title" to "this is\u2026test title"', function () {
                expect(api.getFolderTitle('this is a test title', 19)).toBe('this is\u2026test title');
            });

            it('from "_this is a test title" to "_this is\u2026test title"', function () {
                expect(api.getFolderTitle('_this is a test title', 19)).toBe('_this is\u2026test title');
            });
        });

        describe('hidden objects', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/folders\?action=list/, function (xhr) {
                    xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"},
                                JSON.stringify({
                                    timestamp: 1368791630910,
                                    data: [
                                        {id: '3', folder_id: 'hidden/test', title: '.drive'},
                                        {id: '4', folder_id: 'hidden/test', title: 'visible'},
                                        {id: '5', folder_id: 'hidden/test', title: '.hidden'},
                                        {id: '6', folder_id: 'hidden/test', title: 'customHidden'},
                                        {id: '0815', folder_id: 'hidden/test', title: 'for general files specs'}
                                    ]
                                })
                    );
                });
            });
            describe('with "show hidden files" option enabled', function () {
                it('should show folders starting with a dot', function () {
                    var def = require([
                            'settings!io.ox/core',
                            'settings!io.ox/files'
                        ]).then(function (settings, fileSettings) {
                            settings.set('folder/blacklist');
                            fileSettings.set('showHidden', true);
                            return api.clearCaches();
                        }).then(function () {
                            return api.getSubFolders({folder: 'hidden/test'});
                        }).done(function (f) {
                            expect(_(f).pluck('title')).toContain('.hidden');
                            expect(_(f).pluck('title')).toContain('visible');
                            expect(_(f).pluck('title')).toContain('.drive');
                        });

                    expect(def).toResolve();
                });

                it('should show files starting with a dot', function () {
                });
            });

            describe('with "show hidden files" option disabled (default)', function () {
                it('should hide folders starting with a dot', function () {
                    var def = require([
                            'settings!io.ox/core',
                            'settings!io.ox/files'
                        ]).then(function (settings, fileSettings) {
                            settings.set('folder/blacklist');
                            fileSettings.set('showHidden');
                            return api.clearCaches();
                        }).then(function () {
                            return api.getSubFolders({folder: 'hidden/test'});
                        }).then(function (f) {
                            expect(_(f).pluck('title')).not.toContain('.hidden');
                            expect(_(f).pluck('title')).toContain('visible');
                            expect(_(f).pluck('title')).not.toContain('.drive');
                        });

                    expect(def).toResolve();
                });

                it('should hide files starting with a dot', function () {
                });
            });

            describe('defined by blacklist', function () {
                it('should not filter without blacklist', function () {
                    var def = require([
                            'settings!io.ox/core',
                            'settings!io.ox/files'
                        ]).then(function (settings, fileSettings) {
                            settings.set('folder/blacklist');
                            fileSettings.set('showHidden', true);
                            return api.clearCaches();
                        }).then(function () {
                            return api.getSubFolders({folder: 'hidden/test'});
                        })
                        .done(function (f) {
                            expect(_(f).pluck('title')).toContain('.hidden');
                            expect(_(f).pluck('title')).toContain('visible');
                            expect(_(f).pluck('title')).toContain('.drive');
                        });

                    expect(def).toResolve();
                });

                it('should not show objects from blacklist', function () {
                    var def = require([
                            'settings!io.ox/core',
                            'settings!io.ox/files'
                        ]).then(function (settings, fileSettings) {
                            settings.set('folder/blacklist', {'4': true});
                            fileSettings.set('showHidden', false);
                            return api.clearCaches();
                        }).then(function () {
                            return api.getSubFolders({folder: 'hidden/test'});
                        })
                        .done(function (f) {
                            expect(_(f).pluck('title')).not.toContain('.hidden');
                            expect(_(f).pluck('title')).not.toContain('visible');
                            expect(_(f).pluck('title')).not.toContain('.drive');
                        });

                    expect(def).toResolve();
                });

                it('should not be effected by "show hidden files" option', function () {
                    var def = require([
                            'settings!io.ox/core',
                            'settings!io.ox/files'
                        ]).then(function (settings, fileSettings) {
                            settings.set('folder/blacklist', {'4': true});
                            fileSettings.set('showHidden', true);
                            return api.clearCaches();
                        }).then(function () {
                            return api.getSubFolders({folder: 'hidden/test'});
                        })
                        .done(function (f) {
                            expect(_(f).pluck('title')).toContain('.hidden');
                            expect(_(f).pluck('title')).not.toContain('visible');
                            expect(_(f).pluck('title')).toContain('.drive');
                        });

                    expect(def).toResolve();
                });
            });

            describe('defined by extension point "io.ox/folders/filter"', function () {

                beforeEach(function () {
                    ext.point('io.ox/folder/filter').extend({
                        id: 'custom_filter',
                        isVisible: function (folder) {
                            var title = (folder.data ? folder.data.title : folder.title) || '';
                            return title !== 'customHidden';
                        }
                    });
                    ext.point('io.ox/folder/filter').enable('custom_filter');
                });

                afterEach(function () {
                    ext.point('io.ox/folder/filter').disable('custom_filter');
                });

                it('should apply extension point isVisible method', function () {
                    ext.point('io.ox/folder/filter').replace({
                        id: 'custom_filter',
                        isVisible: function (folder) {
                            var title = (folder.data ? folder.data.title : folder.title) || '';
                            return title !== 'customHidden';
                        }
                    });
                    var def = require([
                            'settings!io.ox/core',
                            'settings!io.ox/files'
                        ]).then(function (settings, fileSettings) {
                            settings.set('folder/blacklist', {});
                            fileSettings.set('showHidden', true);
                            return api.clearCaches();
                        }).then(function () {
                            return api.getSubFolders({folder: 'hidden/test'});
                        })
                        .done(function (f) {
                            expect(_(f).pluck('title')).toContain('.hidden');
                            expect(_(f).pluck('title')).toContain('visible');
                            expect(_(f).pluck('title')).toContain('.drive');
                            expect(_(f).pluck('title')).not.toContain('customHidden');
                        });

                    expect(def).toResolve();
                });
                it('should disable if isEnabled evaluates to false', function () {
                    ext.point('io.ox/folder/filter').replace({
                        id: 'custom_filter',
                        isEnabled: function (folder) {
                            folder = ext.Baton.ensure(folder);
                            return folder.data.folder_id !== 'hidden/test';
                        },
                        isVisible: function (folder) {
                            var title = (folder.data ? folder.data.title : folder.title) || '';
                            return title !== 'customHidden';
                        }
                    });
                    var def = require([
                            'settings!io.ox/core',
                            'settings!io.ox/files'
                        ]).then(function (settings, fileSettings) {
                            settings.set('folder/blacklist', {});
                            fileSettings.set('showHidden', true);
                            return api.clearCaches();
                        }).then(function () {
                            return api.getSubFolders({folder: 'hidden/test'});
                        })
                        .done(function (f) {
                            expect(_(f).pluck('title')).toContain('.hidden');
                            expect(_(f).pluck('title')).toContain('visible');
                            expect(_(f).pluck('title')).toContain('.drive');
                            expect(_(f).pluck('title')).toContain('customHidden');
                        });

                    expect(def).toResolve();
                });
            });
        });
    });
});
