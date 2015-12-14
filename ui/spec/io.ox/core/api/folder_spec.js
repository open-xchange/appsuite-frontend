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
    'shared/examples/for/api',
    'io.ox/core/folder/api',
    'io.ox/core/http',
    'io.ox/core/extensions',
    'io.ox/core/notifications'
], function (sharedExamplesFor, api, http, ext, notifications) {
    'use strict';

    var fakeFolders = {};

    var setupFakeServer = function (server) {

        server.respondWith('GET', /api\/folders\?action=get.+id=2&/,
            [200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                timestamp: 1368791630910,
                data: { id: '2', folder_id: '1', module: 'infostore', title: 'two' }
            })]
        );

        server.respondWith('GET', /api\/folders\?action=get.+id=21&/,
            [200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                timestamp: 1368791630910,
                data: { id: '21', folder_id: '2', module: 'infostore', title: '.twenty-one' }
            })]
        );

        server.respondWith('GET', /api\/folders\?action=get.+id=13&/,
            [200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                timestamp: 1368791630910,
                data: { id: '13', folder_id: '2', module: 'infostore', title: '.thirteen' }
            })]
        );

        //sends a list of subfolders
        server.respondWith('GET', /api\/folders\?action=list.+parent=2&/,
            [200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                timestamp: 1368791630910,
                data: [
                    { id: '3', folder_id: '2', title: 'three' },
                    { id: '4', folder_id: '2', title: 'four' },
                    { id: '5', folder_id: '2', title: 'five' }
                ]
            })]
        );

        server.respondWith('GET', /api\/folders\?action=list.+parent=13&/,
            [200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                timestamp: 1368791630910,
                data: []
            })]
        );

        //sends a path from a folder
        server.respondWith('GET', /api\/folders\?action=path/, function (xhr) {
            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
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
            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                JSON.stringify({ timestamp: 1378223251586, data: '21' })
            );
        });

        //responds with empty message to allVisible calls
        server.respondWith(/api\/folders\?action=allVisible/, function (xhr) {
            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                JSON.stringify({ timestamp: 1378223251586, data: [] })
            );
        });
    };

    describe('folder API', function () {

        var options = {
                markedPending: {
                    'folder API a basic API class has some get methods should define a getAll method.': true,
                    'folder API a basic API class has some get methods should return a deferred object for getAll.': true,
                    'folder API a basic API class has some get methods should define a getList method.': true,
                    'folder API a basic API class has some get methods should return a deferred object for getList.': true
                }
            };

        describe('default folders', function () {

            it('should provide the mail folder as default', function () {
                require('settings!io.ox/mail').set('folder/inbox', 'default0/INBOX');
                var folder_id = api.getDefaultFolder();
                expect(folder_id).to.equal('default0/INBOX');
            });

            it('should know about the mail folder', function () {
                require('settings!io.ox/mail').set('folder/inbox', 'default0/INBOX');
                var folder_id = api.getDefaultFolder('mail');
                expect(folder_id).to.equal('default0/INBOX');
            });

            it('should get default folder for specific type from settings', function () {
                require('settings!io.ox/core').set('folder/myType', 'testFolder');
                var folder_id = api.getDefaultFolder('myType');
                expect(folder_id).to.equal('testFolder');
            });
        });

        describe('requests some folders from the server', function () {

            beforeEach(function () {
                // reset pool
                // api.pool.unfetch();
                setupFakeServer(this.server);
            });

            it('should return a folder with correct id', function (done) {

                api.get('2').done(function (data) {
                    expect(data.id).to.equal('2');
                    done();
                });
            });

            it('should return a list of subfolders with correct parent ids', function (done) {

                api.list('2', { cache: false }).done(function (data) {
                    expect(data).to.be.an('array');
                    _(data).each(function (folder) {
                        expect(folder.folder_id).to.equal('2');
                    });
                    done();
                });
            });

            it('should return a path of a folder with getPath', function (done) {

                var parentID = '1';

                api.path('3').done(function (data) {
                    _(data).each(function (folder) {
                        expect(folder.folder_id).to.equal(parentID);
                        parentID = folder.id;
                    });
                    expect(_(data).first().id).not.to.equal('0');
                    done();
                });
            });

            it('should trigger a create event', function (done) {

                var spy = sinon.spy();
                api.on('create', spy);

                var result = api.create('2').done(function () {
                    expect(spy.called).to.be.true;
                    done();
                });
            });

            it('should create a folder', function (done) {

                var spy = sinon.spy(http, 'PUT');

                api.create('2').done(function () {
                    //server response should resolve deferred
                    expect(spy).to.have.been.calledOnce;

                    //the http request should containt corrent values
                    var param = spy.getCall(0).args[0];
                    expect(param.module).to.equal('folders');
                    expect(param.params.action).to.equal('new');
                    expect(param.params.folder_id).to.equal('2');

                    //restore http.PUT
                    http.PUT.restore();
                    done();
                });
            });

            it('should trigger a remove event', function (done) {

                var spy = sinon.spy();
                api.on('remove', spy);

                api.remove('2').done(function () {
                    expect(spy.called).to.be.true;
                    done();
                });
            });

            it('should remove a folder', function (done) {

                var spy = sinon.spy(http, 'PUT');

                api.remove('2').done(function () {

                    //server response should resolve deferred
                    expect(spy).to.have.been.calledOnce;

                    //the http request should contain correct values
                    var param = spy.getCall(0).args[0];
                    expect(param.module).to.equal('folders');
                    expect(param.params.action).to.equal('delete');
                    expect(param.data).to.deep.equal(['2']);

                    //restore http.PUT
                    http.PUT.restore();
                    done();
                });
            });

            describe('to find out, if a folder', function () {

                it('can read', function () {
                    expect(api.can('read', { own_rights: 128 })).to.be.true;
                    expect(api.can('read', { own_rights: 127 })).to.befalse;
                });

                it('can create', function () {
                    expect(api.can('create', { own_rights: 2 })).to.be.true;
                    expect(api.can('create', { own_rights: 1 })).to.be.false;
                });

                it('can write', function () {
                    expect(api.can('write', { own_rights: 20000 })).to.be.true;
                    expect(api.can('write', { own_rights: 0 })).to.be.false;
                });

                it('can delete', function () {
                    expect(api.can('delete', { own_rights: 5000000 })).to.be.true;
                    expect(api.can('delete', { own_rights: 0 })).to.be.false;
                });

                it('can rename', function () {
                    expect(api.can('rename', { own_rights: 0x50000000 })).to.be.true;
                    expect(api.can('rename', { own_rights: 0 })).to.be.false;
                });

                it('can create folder', function () {
                    expect(api.can('create:folder', { own_rights: 64 })).to.be.true;
                    expect(api.can('create:folder', { own_rights: 4 })).to.be.true;
                    expect(api.can('create:folder', { own_rights: 68 })).to.be.true;
                    expect(api.can('create:folder', { own_rights: 0, permissions: 0 })).to.be.false;
                });

                it('can delete folder', function () {
                    expect(api.can('delete:folder', { own_rights: 0x10000000 })).to.be.true;
                    expect(api.can('delete:folder', { own_rights: 0 })).to.be.false;
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

                this.server.respondWith('GET', /api\/folders\?action=list.+parent=hidden/, function (xhr, wurst) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                        JSON.stringify({
                            timestamp: 1368791630910,
                            data: [
                                { id: '3',    folder_id: 'hidden/test', module: 'infostore', title: '.drive' },
                                { id: '4',    folder_id: 'hidden/test', module: 'infostore', title: 'visible' },
                                { id: '5',    folder_id: 'hidden/test', module: 'infostore', title: '.hidden' },
                                { id: '6',    folder_id: 'hidden/test', module: 'infostore', title: 'customHidden' },
                                { id: '0815', folder_id: 'hidden/test', module: 'infostore', title: 'for general files specs' }
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
                    ])
                    .done(function (settings, fileSettings) {
                        settings.set('folder/blacklist');
                        fileSettings.set('showHidden', true);
                        api.pool.unfetch();
                    })
                    .then(function () {
                        return api.list('hidden/test');
                    })
                    .done(function (data) {
                        var titles = _(data).pluck('title');
                        expect(titles).to.contain('.hidden');
                        expect(titles).to.contain('visible');
                        expect(titles).to.contain('.drive');
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
                            folder_id: '13',
                            id: '31337',
                            module: 'infostore',
                            title: 'secret'
                        };
                    });

                    it('should trigger "warn:hidden" event during create', function (done) {

                        var spy = sinon.spy();

                        require([
                            'settings!io.ox/core',
                            'settings!io.ox/files'
                        ])
                        .done(function (settings, fileSettings) {
                            settings.set('folder/blacklist');
                            fileSettings.set('showHidden', false);
                            api.pool.unfetch();
                        })
                        .then(function () {
                            api.on('warn:hidden', spy);
                            return api.create('13', { title: '.secret' });
                        })
                        .done(function () {
                            expect(spy.called).to.equal(true);
                            done();
                        });
                    });

                    it.skip('should trigger "warn:hidden" event during update', function (done) {

                        this.server.respondWith('PUT', /api\/folders\?action=update/, function (xhr) {
                            var idPos = xhr.url.indexOf('&id='),
                                id = xhr.url.slice(idPos + 4, xhr.url.indexOf('&', idPos + 1)),
                                oldData = fakeFolders[id];

                            fakeFolders[id] = _.extend(oldData, JSON.parse(xhr.requestBody));
                            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                                JSON.stringify({ 'timestamp': 1386862269412, 'data': id })
                            );
                        });

                        var spy = sinon.spy();

                        require([
                            'settings!io.ox/core',
                            'settings!io.ox/files'
                        ])
                        .done(function (settings, fileSettings) {
                            settings.set('folder/blacklist');
                            fileSettings.set('showHidden', false);
                            api.pool.unfetch();
                        })
                        .then(function () {
                            api.on('warn:hidden', spy);
                            return api.update('31337', { title: '.secret', module: 'infostore' });
                        })
                        .done(function () {
                            expect(spy.called).to.equal(true);
                            done();
                        });
                    });

                    it('should warn the user that files will be hidden', function () {
                        var spy = sinon.spy(notifications, 'yell');
                        api.trigger('warn:hidden', { title: '.secret' });
                        //expect to contain the folder name in the message
                        expect(spy.calledWithMatch('info', /\.secret/)).to.be.ok;
                        spy.restore();
                    });
                });

                it('should hide folders starting with a dot', function (done) {
                    require([
                        'settings!io.ox/core',
                        'settings!io.ox/files'
                    ])
                    .done(function (settings, fileSettings) {
                        settings.set('folder/blacklist');
                        fileSettings.set('showHidden');
                        api.pool.unfetch();
                    })
                    .then(function () {
                        return api.list('hidden/test');
                    })
                    .then(function (data) {
                        var titles = _(data).pluck('title');
                        expect(titles).not.to.contain('.hidden');
                        expect(titles).to.contain('visible');
                        expect(titles).not.to.contain('.drive');
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
                    ])
                    .done(function (settings, fileSettings) {
                        settings.set('folder/blacklist');
                        fileSettings.set('showHidden', true);
                        api.pool.unfetch();
                    })
                    .then(function () {
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
                    ])
                    .done(function (settings, fileSettings) {
                        settings.set('folder/blacklist', { '4': true });
                        fileSettings.set('showHidden', false);
                        return api.pool.unfetch();
                    })
                    .then(function () {
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
                    ])
                    .done(function (settings, fileSettings) {
                        settings.set('folder/blacklist', { '4': true });
                        fileSettings.set('showHidden', true);
                        api.pool.unfetch();
                    })
                    .then(function () {
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

                afterEach(function () {
                    ext.point('io.ox/folder/filter').disable('custom_filter');
                });

                it('should apply extension point "visible" method', function (done) {
                    ext.point('io.ox/core/folder/filter').extend({
                        id: 'custom_filter',
                        visible: function (baton) {
                            return baton.data.title !== 'customHidden';
                        }
                    });
                    require([
                        'settings!io.ox/core',
                        'settings!io.ox/files'
                    ])
                    .done(function (settings, fileSettings) {
                        settings.set('folder/blacklist', {});
                        fileSettings.set('showHidden', true);
                        api.pool.unfetch();
                    })
                    .then(function () {
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
            });
        });
    });
});
