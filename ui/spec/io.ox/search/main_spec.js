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
define(['io.ox/mail/main',
        'fixture!io.ox/core/settings.json',
        'fixture!io.ox/search/autocomplete.json',
        'fixture!io.ox/search/query.json',
        'spec/shared/capabilities',
        'settings!io.ox/mail',
        'settings!io.ox/core',
        'beforeEachEnsure',
        'waitsFor'], function (main, settingsFixture, autocompleteFixture, queryFixture, caputil,  mailSettings, settings, beforeEachEnsure, waitsFor) {


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
    function setup (context) {
        var def = $.Deferred(),
            self = this,
            setCaps =  caputil.preset('common').init('io.ox/mail/main', main).apply;
        setCaps()
            .done(function () {
                main.getApp().launch().done(function () {
                    //console.warn('%c' + 'getAppDone', 'color: green; background-color: black');
                    var win = main.getApp().getWindow();
                    self.vars = {
                        win: win,
                        nodes: win.nodes.facetedsearch,
                        api: win.facetedsearch
                    };
                    win.on('search:loaded', function () {
                        //console.log('%c' + 'search:loaded', 'color: red; background-color: black');
                        self.vars.view = self.vars.api.view;
                        self.vars.model = self.vars.api.view.model;
                        def.resolve();
                    });
                });
            });
        return def;
    }

    var dropdownLoaded = function (done) {
        return waitsFor(function () {
            var items = $('.autocomplete-popup>.scrollable-pane').children();
            return items.length !== 0;
        }).done(done);
    };

    var searchLoaded = function (done) {
        return waitsFor(function () {
            var active = $('.search-container>.default>.search-facets').children();
            return active.length !== 0;
        }).done(done);
    };

    var openDropdown = function (done) {
        var def = $.Deferred(),
            self = this;
        // in case already opened
        // if ($('.autocomplete-popup>.scrollable-pane').children().length)
        //     return def.resolve();

        // trigger autocomplete request
        var field = this.vars.nodes.toolbar.find('.search-field');
        field.val('t');
        field.trigger(
            $.Event('keyup', { keyCode: 80})
        );

        //done.call(this);
        return dropdownLoaded().done(done);
    };

    var selectFilter = function () {
        var dropdown = $('.autocomplete-popup>.scrollable-pane').children();
        dropdown.first().trigger('click');
    };

    describe.skip('in-app search:', function () {
        //ensure setup is finished
        beforeEachEnsure(setup);
        beforeEach(setupFakeServer);

        describe('has a view with', function () {

            describe('a search field section that', function () {

                var getField = function (data) {
                    return data.vars.nodes.toolbar.find('.search-field');
                };

                it('exists', function () {
                    expect(this.vars.nodes.toolbar).to.not.be.empty;

                });
                describe('contains an input field that', function () {
                    it('exists', function () {
                        expect(getField(this).length).to.equal(1);
                    });

                    describe('shows autocomplete popup when at least one char was entered and', function () {

                        beforeEach(function () {
                            $('.autocomplete-popup>.scrollable-pane').empty();
                        });

                        it('key was pressed', function (done) {
                            var field = getField(this);
                            field.val('test');
                            field.trigger(
                                $.Event('keyup', { keyCode: 80})
                            );
                            dropdownLoaded(done);
                        });
                        it('input is clicked', function (done) {
                            var field = getField(this);
                            field.val('test');
                            field.trigger($.Event('mousedown'));
                            field.trigger($.Event('click'));
                            dropdownLoaded(done);
                        });
                    });

                });
            });

            describe('a container for active facets that', function () {

                //beforeEach(openDropdown);

                function getDropdown ()  {
                    return $('.autocomplete-popup>.scrollable-pane').children();
                }

                it('exists', function () {
                    expect(!!this.vars.nodes.container).to.equal(true);
                });
                it('contains active default facets', function (done) {
                    selectFilter();
                    searchLoaded(done);
                });
                it('contains active default facets', function (done) {
                    selectFilter();
                    console.log('%c' + '!!!', 'color: white; background-color: grey');
                    searchLoaded(done).done(function () {
                        console.log('%c' + '!!!', 'color: white; background-color: grey');
                    });
                });
                it('contains active default facets', function (done) {
                    selectFilter();
                    searchLoaded()
                        .then(function () {
                        }, function () {
                        })
                        .then(openDropdown)
                        .then(function () {
                        })
                        .then(selectFilter)
                        .then(function () {
                        })
                        .then(searchLoaded.done(function () {
                            expect($('.search-container>.default>.search-facets').children().length).to.equal(2);
                        }));
                });

            });

        });

    });
});
