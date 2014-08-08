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
       'io.ox/core/folder/api',
       'io.ox/core/http',
       'io.ox/core/extensions',
       'io.ox/core/notifications'], function (sharedExamplesFor, api, http, ext, notifications) {

    var fakeFolders = {},
        setupFakeServer = function (server) {
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
                },
                data = _.extend({
                    id: sendObject.id,
                    folder_id: parentFolderIDs[sendObject.id]
                }, fakeFolders[sendObject.id] || {});

            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                JSON.stringify({timestamp: 1378223251586, data: data})
            );
        });

        //sends a list of subfolders
        server.respondWith('GET', /api\/folders\?action=list/, function (xhr) {
            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
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
            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                JSON.stringify({
                    'timestamp': 9223372036854775807,
                    'data': [
                        ['3', 0, 0, 0, 0, 0, '2', null, 'Subfolder', 'infostore', 2, true, 0, null, null, true, 2, null, null, null, null, true, true, 8, null, false, false, 'Name'],
                        ['2', 0, 0, 0, 0, 0, '1', null, 'Folder', 'infostore', 2, true, 0, null, null, true, 2, null, null, null, null, true, true, 8, null, false, false, 'Name'],
                        ['1', 0, 0, 0, 0, 0, '0', null, 'Root', 'infostore', 2, true, 0, null, null, true, 2, null, null, null, null, true, true, 8, null, false, false, 'Name']
                    ]
                })
            );
        });

        //sends the created folder
        server.respondWith('PUT', /api\/folders\?action=(new|delete)/, function (xhr) {
            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                JSON.stringify({timestamp: 1378223251586, data: '21'})
            );
        });

        //responds with empty message to allVisible calls
        server.respondWith(/api\/folders\?action=allVisible/, function (xhr) {
            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                JSON.stringify({timestamp: 1378223251586, data: []})
            );
        });
    };

    return xdescribe('folder API', function () {
        var options = {
                markedPending: {
                    'folder API a basic API class has some get methods should define a getAll method.': true,
                    'folder API a basic API class has some get methods should return a deferred object for getAll.': true,
                    'folder API a basic API class has some get methods should define a getList method.': true,
                    'folder API a basic API class has some get methods should return a deferred object for getList.': true
                }
            };
        sharedExamplesFor(api, options);

        describe.skip('default folders', function () {
            it('should provide the mail folder as default', function () {
                var folder_id = api.getDefaultFolder();
                expect(folder_id).to.equal('default0/INBOX');
            });

            it('should know about the mail folder', function () {
                var folder_id = api.getDefaultFolder('mail');
                expect(folder_id).to.equal('default0/INBOX');
            });
        });

        describe('requests some folders from the server', function () {
            beforeEach(function (done) {
                //TODO: clear global cache (must also be possible in phantomJS)
                api.unfetch('0');
                //make fake server only respond on demand
                this.server.autoRespond = false;
                setupFakeServer(this.server);
                done();
            });

            it('should return a folder with correct id', function (done) {
                var result = api.get('2', { cache: false });

                result.done(function (data) {
                    expect(data.id).to.equal('2');
                    done();
                });

                expect(result.state()).to.equal('pending');
                this.server.respond();
            });

            it('should return a list of subfolders with correct parent ids', function (done) {
                var result = api.list('2');

                result.done(function (data) {
                    _(data).each(function (folder) {
                        expect(folder.folder_id).to.equal('2');
                    });
                    done();
                });

                expect(result.state()).to.equal('pending');

                this.server.respondUntilResolved(result);
            });

            it('should return a path of a folder with getPath', function (done) {
                var result = api.path('3', { cache: true }),
                    parentID = '1';

                result.done(function (data) {
                    _(data).each(function (folder) {
                        expect(folder.folder_id).to.equal(parentID);
                        parentID = folder.id;
                    });

                    expect(_(data).first().id).not.to.equal('0');
                    done();
                });

                expect(result.state()).to.equal('pending');

                this.server.respondUntilResolved(result);
            });

            it.skip('should trigger a create event', function () {
                expect(api).toTrigger('create');
                var result = api.create('2');

                //deferred should be pending
                expect(result.state()).to.equal('pending');

                this.server.respondUntilResolved(result);
            });

            it('should create a folder', function (done) {
                var spy = sinon.spy(http, 'PUT'),
                    result = api.create('2'),
                    param;

                //deferred should be pending
                expect(result.state()).to.equal('pending');

                //make server respond
                this.server.respondUntilResolved(result);

                result.done(function () {
                    //server response should resolve deferred
                    expect(result.state()).to.equal('resolved');
                    expect(spy).to.have.been.calledOnce;

                    //the http request should containt corrent values
                    param = spy.getCall(0).args[0];
                    expect(param.module).to.equal('folders');
                    expect(param.params.action).to.equal('new');
                    expect(param.params.folder_id).to.equal('2');

                    //restore http.PUT
                    http.PUT.restore();
                    done();
                });
            });

            it.skip('should trigger a delete event', function () {
                expect(api).toTrigger('delete');
                var result = api.remove('2');

                //deferred should be pending
                expect(result.state()).to.equal('pending');

                this.server.respondUntilResolved(result);
            });

            it('should remove a folder', function (done) {
                var spy = sinon.spy(http, 'PUT'),
                    result = api.remove('2'),
                    param;

                //deferred should be pending
                expect(result.state()).to.equal('pending');

                //make server respond
                this.server.respondUntilResolved(result);

                result.done(function () {
                    //server response should resolve deferred
                    expect(result.state()).to.equal('resolved');
                    expect(spy).to.have.been.calledOnce;

                    //the http request should containt corrent values
                    param = spy.getCall(0).args[0];
                    expect(param.module).to.equal('folders');
                    expect(param.params.action).to.equal('delete');
                    expect(param.params.folder_id).to.equal('2');

                    //restore http.PUT
                    http.PUT.restore();
                    done();
                });
            });

            describe('to find out, if a folder', function () {
                it('can read', function () {
                    expect(api.can('read', {own_rights: 128})).to.be.true;
                    expect(api.can('read', {own_rights: 127})).to.befalse;
                });

                it('can create', function () {
                    expect(api.can('create', {own_rights: 2})).to.be.true;
                    expect(api.can('create', {own_rights: 1})).to.be.false;
                });

                it('can write', function () {
                    expect(api.can('write', {own_rights: 20000})).to.be.true;
                    expect(api.can('write', {own_rights: 0})).to.be.false;
                });

                it('can delete', function () {
                    expect(api.can('delete', {own_rights: 5000000})).to.be.true;
                    expect(api.can('delete', {own_rights: 0})).to.be.false;
                });

                it('can rename', function () {
                    expect(api.can('rename', {own_rights: 0x50000000})).to.be.true;
                    expect(api.can('rename', {own_rights: 0})).to.be.false;
                });

                it('can create folder', function () {
                    expect(api.can('createFolder', {own_rights: 0x10000000})).to.be.true;
                    expect(api.can('createFolder', {own_rights: 0, permissions: 0})).to.be.false;
                });

                it('can delete folder', function () {
                    expect(api.can('deleteFolder', {own_rights: 0x10000000})).to.be.true;
                    expect(api.can('deleteFolder', {own_rights: 0})).to.be.false;
                });
            });
        });

        describe('shortens the folder title', function () {
            it('from "this is a test title" to "this\u2026title"', function () {
                expect(api.getFolderTitle('this is a test title', 10)).to.equal('this\u2026title');
            });

            it('from "this is a test title" to "t\u2026e"', function () {
                expect(api.getFolderTitle('this is a test title', 5)).to.equal('t\u2026e');
            });

            it('from "this is a test title" to "this is a test title"', function () {
                expect(api.getFolderTitle('this is a test title', 20)).to.equal('this is a test title');
            });

            it('from "this is a test title" to "this is\u2026test title"', function () {
                expect(api.getFolderTitle('this is a test title', 19)).to.equal('this is\u2026test title');
            });

            it('from "_this is a test title" to "_this is\u2026test title"', function () {
                expect(api.getFolderTitle('_this is a test title', 19)).to.equal('_this is\u2026test title');
            });

            it('from "this is a test title_" to "this is\u2026test title_"', function () {
                expect(api.getFolderTitle('this is a test title_', 19)).to.equal('this is\u2026test title_');
            });
        });

        describe('hidden objects', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/folders\?action=list/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
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
                it('should show folders starting with a dot', function (done) {
                    require([
                        'settings!io.ox/core',
                        'settings!io.ox/files'
                    ]).then(function (settings, fileSettings) {
                        settings.set('folder/blacklist');
                        fileSettings.set('showHidden', true);
                        return api.unfetch('0');
                    }).then(function () {
                        return api.list('hidden/test');
                    }).done(function (f) {
                        expect(_(f).pluck('title')).to.contain('.hidden');
                        expect(_(f).pluck('title')).to.contain('visible');
                        expect(_(f).pluck('title')).to.contain('.drive');
                        done();
                    });
                });

                it('should show files starting with a dot', function () {
                });
            });

            describe('with "show hidden files" option disabled (default)', function () {

                describe('when naming folders with filtered names', function () {
                    beforeEach(function () {
                        this.server.responses = _(this.server.responses).reject(function (response) {
                            return 'api/folders?action=get'.search(response.url) === 0;
                        });
                        setupFakeServer(this.server);
                        fakeFolders['31337'] = {
                            id: '31337',
                            folder_id: '13',
                            title: 'secret'
                        };
                    });

                    afterEach(function () {
                        this.server.restore();
                    });

                    it.skip('should trigger "warn:hidden" event during create', function (done) {
                        fakeFolders['21'] = {
                            id: '21',
                            folder_id: '13',
                            title: '.secret'
                        };
                        require([
                            'settings!io.ox/core',
                            'settings!io.ox/files'
                        ]).then(function (settings, fileSettings) {
                            settings.set('folder/blacklist');
                            fileSettings.set('showHidden');
                            return api.unfetch('0');
                        }).then(function () {
                            expect(api).toTrigger('warn:hidden');
                            return api.create('13', { title: '.secret' });
                        }).done(function () {
                            done();
                        });
                    });

                    it.skip('should trigger "warn:hidden" event during update', function (done) {
                        this.server.respondWith('PUT', /api\/folders\?action=update/, function (xhr) {
                            var idPos = xhr.url.indexOf('&id='),
                                id = xhr.url.slice(idPos + 4, xhr.url.indexOf('&', idPos + 1)),
                                oldData = fakeFolders[id];

                            fakeFolders[id] = _.extend(oldData, JSON.parse(xhr.requestBody));
                            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                                JSON.stringify({'timestamp': 1386862269412, 'data': id})
                            );
                        });
                        require([
                            'settings!io.ox/core',
                            'settings!io.ox/files'
                        ]).then(function (settings, fileSettings) {
                            settings.set('folder/blacklist');
                            fileSettings.set('showHidden');
                            return api.unfetch('0');
                        }).then(function () {
                            expect(api).toTrigger('warn:hidden');
                            return api.update('31337', { title: '.secret' });
                        }).done(function () {
                            done();
                        });
                    });

                    it('should warn the user that files will be hidden', function () {
                        var spy = sinon.spy(notifications, 'yell');

                        api.trigger('warn:hidden', {title: '.secret'});
                        //expect to contain the folder name in the message
                        expect(spy.calledWithMatch('info', /\.secret/)).to.be.ok;
                        spy.restore();
                    });
                });

                it('should hide folders starting with a dot', function (done) {
                    require([
                        'settings!io.ox/core',
                        'settings!io.ox/files'
                    ]).then(function (settings, fileSettings) {
                        settings.set('folder/blacklist');
                        fileSettings.set('showHidden');
                        return api.unfetch('0');
                    }).then(function () {
                        return api.list('hidden/test');
                    }).then(function (f) {
                        expect(_(f).pluck('title')).not.to.contain('.hidden');
                        expect(_(f).pluck('title')).to.contain('visible');
                        expect(_(f).pluck('title')).not.to.contain('.drive');
                        done();
                    });
                });

                it('should hide files starting with a dot', function () {
                });
            });

            describe('defined by blacklist', function () {
                it('should not filter without blacklist', function (done) {
                    require([
                        'settings!io.ox/core',
                        'settings!io.ox/files'
                    ]).then(function (settings, fileSettings) {
                        settings.set('folder/blacklist');
                        fileSettings.set('showHidden', true);
                        return api.unfetch('0');
                    }).then(function () {
                        return api.list('hidden/test');
                    })
                    .done(function (f) {
                        expect(_(f).pluck('title')).to.contain('.hidden');
                        expect(_(f).pluck('title')).to.contain('visible');
                        expect(_(f).pluck('title')).to.contain('.drive');
                        done();
                    });
                });

                it('should not show objects from blacklist', function (done) {
                    require([
                        'settings!io.ox/core',
                        'settings!io.ox/files'
                    ]).then(function (settings, fileSettings) {
                        settings.set('folder/blacklist', {'4': true});
                        fileSettings.set('showHidden', false);
                        return api.unfetch('0');
                    }).then(function () {
                        return api.list('hidden/test');
                    })
                    .done(function (f) {
                        expect(_(f).pluck('title')).not.to.contain('.hidden');
                        expect(_(f).pluck('title')).not.to.contain('visible');
                        expect(_(f).pluck('title')).not.to.contain('.drive');
                        done();
                    });
                });

                it('should not be effected by "show hidden files" option', function (done) {
                    require([
                        'settings!io.ox/core',
                        'settings!io.ox/files'
                    ]).then(function (settings, fileSettings) {
                        settings.set('folder/blacklist', {'4': true});
                        fileSettings.set('showHidden', true);
                        return api.unfetch('0');
                    }).then(function () {
                        return api.list('hidden/test');
                    })
                    .done(function (f) {
                        expect(_(f).pluck('title')).to.contain('.hidden');
                        expect(_(f).pluck('title')).not.to.contain('visible');
                        expect(_(f).pluck('title')).to.contain('.drive');
                        done();
                    });
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

                it('should apply extension point isVisible method', function (done) {
                    ext.point('io.ox/folder/filter').replace({
                        id: 'custom_filter',
                        isVisible: function (folder) {
                            var title = (folder.data ? folder.data.title : folder.title) || '';
                            return title !== 'customHidden';
                        }
                    });
                    require([
                        'settings!io.ox/core',
                        'settings!io.ox/files'
                    ]).then(function (settings, fileSettings) {
                        settings.set('folder/blacklist', {});
                        fileSettings.set('showHidden', true);
                        return api.unfetch('0');
                    }).then(function () {
                        return api.list('hidden/test');
                    })
                    .done(function (f) {
                        expect(_(f).pluck('title')).to.contain('.hidden');
                        expect(_(f).pluck('title')).to.contain('visible');
                        expect(_(f).pluck('title')).to.contain('.drive');
                        expect(_(f).pluck('title')).not.to.contain('customHidden');
                        done();
                    });
                });
                it('should disable if isEnabled evaluates to false', function (done) {
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
                    require([
                        'settings!io.ox/core',
                        'settings!io.ox/files'
                    ]).then(function (settings, fileSettings) {
                        settings.set('folder/blacklist', {});
                        fileSettings.set('showHidden', true);
                        return api.unfetch('0');
                    }).then(function () {
                        return api.list('hidden/test');
                    })
                    .done(function (f) {
                        expect(_(f).pluck('title')).to.contain('.hidden');
                        expect(_(f).pluck('title')).to.contain('visible');
                        expect(_(f).pluck('title')).to.contain('.drive');
                        expect(_(f).pluck('title')).to.contain('customHidden');
                        done();
                    });
                });
            });
        });
    });
});
