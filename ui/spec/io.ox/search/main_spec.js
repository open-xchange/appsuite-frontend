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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(['fixture!io.ox/core/settings.json',
        'fixture!io.ox/search/autocomplete.json',
        'fixture!io.ox/search/query.json',
        'settings!io.ox/mail',
        'settings!io.ox/core',
        'beforeEachEnsure',
        'waitsFor'], function (settingsFixture, autocompleteFixture, queryFixture, mailSettings, settings, beforeEachEnsure, waitsFor) {

    var setupFakeServer = function () {
        var server = this.server;
        server.respondWith('PUT', /api\/find\?action=autocomplete/, function (xhr) {
            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                JSON.stringify({timestamp: 1378223251586, data: autocompleteFixture.data})
            );
        });

        server.respondWith('PUT', /api\/find\?action=query/, function (xhr) {
            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                JSON.stringify({timestamp: 1378223251586, data: queryFixture.data})
            );
        });
    };

    //aync setup loads app and and add some variables to test context
    function setup () {
        var def = $.Deferred(),
            self = this;
        //apply relevant setting fixtures
        mailSettings.set('folder', settingsFixture['io.ox/mail'].folder);
        settings.set('folder', settingsFixture['io.ox/core'].folder);
        settings.set('search', settingsFixture['io.ox/core'].search);
        _.each(settings.get('search/modules'), function (module) {
            var id = 'io.ox/' + module + '/main';
            ox.manifests.apps[id] = {title: module};
        });

        //load app
        require(['io.ox/search/main'], function (main) {
            main.init();
            var app = main.run();
            self.vars = {
                app: app,
                model: app.getModel(),
                node: $(document.body, '.io-ox-search-window').find('.window-content')
            };
            def.resolve();
        });
        return def;
    }


    describe.only('Search app:', function () {
        //ensure setup is finished
        beforeEachEnsure(setup);

        describe('has a view that', function () {

            describe('has applications row that', function () {

                var getApps = function (data) {
                    return data.vars.node.find('.row.applications>ul').children();
                };

                it('exists', function () {
                    var row = this.vars.node.find('.row.applications');
                    expect(row).to.not.be.empty;
                });
                it('contains a list element for each available application', function () {
                    var apps = getApps(this);
                    expect(apps.length).to.equal(4);
                });
                it('contains exactly one active list element', function () {
                    var apps = getApps(this);
                    expect(apps.find('.btn-primary').length).to.equal(1);
                });
                it('reflects module changes', function () {
                    var apps = getApps(this),
                        id = apps.find('.btn-primary').attr('data-app'),
                        self = this;

                    this.vars.app.view.on('redraw', function () {
                        var apps = getApps(self),
                            idnext = apps.find('.btn-primary').attr('data-app');
                        expect(id).to.not.be.equal(idnext);
                        expect(idnext).to.be.equal('io.ox/tasks');
                    });
                    this.vars.model.setModule('io.ox/tasks');
                });
            });

            describe('has a search field row that', function () {

                var getField = function (data) {
                    return data.vars.node.find('.search-field');
                };

                it('exists', function () {
                    expect(getField(this)).to.not.be.empty;

                });
                describe('contains an input field that', function () {
                    it('exists', function () {
                        expect(getField(this).length).to.equal(1);
                    });
                    it('has focus', function (done) {
                        var self = this;
                        return waitsFor(function () {
                            var field = getField(self),
                                focused = document.activeElement;

                            return $(document.activeElement).hasClass('search-field');
                        }).done(done);
                    });
                    describe('calls autocomplete action when', function () {

                        beforeEach(setupFakeServer);

                        afterEach(function () {
                            $('.autocomplete-popup').empty();
                        });

                        var expectsDropdown = function (done) {
                            waitsFor(function () {
                                var items = $('.autocomplete-popup>.scrollable-pane').children();
                                return items.length !== 0;
                            }).done(done);
                        };

                        it('clicked', function () {
                            var field = getField(this);
                            field.trigger($.Event('click'));
                            expectsDropdown();
                        });
                        it.skip('key was pressed', function (done) {
                            var field = getField(this);
                            field.trigger(
                                $.Event('keydown', { keyCode: 80})
                            );
                            expectsDropdown();
                        });
                        it.skip('focused via tab', function () {
                            var field = getField(this);
                            field.trigger($.Event('click'));
                            expectsDropdown();
                        });
                    });

                });
            });

        });

    });
});
