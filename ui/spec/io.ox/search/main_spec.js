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
        'spec/shared/capabilities',
        'settings!io.ox/mail',
        'settings!io.ox/core',
        'beforeEachEnsure',
        'waitsFor'], function (settingsFixture, autocompleteFixture, queryFixture, caputil,  mailSettings, settings, beforeEachEnsure, waitsFor) {


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
    var setup = function (context) {
        var def = $.Deferred(),
            self = this;

        // load mail app
        require(['io.ox/mail/main'], function (main) {
            // set search capability
            var capabilities = caputil.preset('common').init('io.ox/mail/main', main);
            capabilities.enable('search');
            // start mail app
            main.getApp().launch().done(function () {
                var win = this.getWindow(),
                    api = win.facetedsearch;
                win.on('search:loaded', function () {
                    self.vars = {
                        win: win,
                        nodes: win.nodes.facetedsearch,
                        api: api,
                        view: api.view,
                        model: api.view.modelm
                    };
                    // show
                    // api.toggle();
                    // TOOD: why is this hack necessary?
                    $('.launcher-dropdown ul').find('li[data-app-name="io.ox/mail"]').trigger('click');
                    def.resolve();
                });
            });
        });
        return def;
    };

    var dropdownLoaded = function (done) {
        return waitsFor(function () {
            var items = $('.autocomplete-popup>.scrollable-pane').children();
            return items.length !== 0;
        }).done(done);
    };

    // var openDropdown = function (done) {
    //     var def = $.Deferred();
    //     // in case already opened
    //     // if ($('.autocomplete-popup>.scrollable-pane').children().length)
    //     //     return def.resolve();

    //     // trigger autocomplete request
    //     var field = this.vars.nodes.toolbar.find('.search-field');
    //     field.val('t');
    //     field.trigger(
    //         $.Event('keyup', { keyCode: 80})
    //     );

    //     done.call(this);
    //     dropdownLoaded.done(function () {
    //         debugger;
    //     });
    //     return dropdownLoaded.done(done);
    // };


    describe('in-app search:', function () {
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
                            //
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
                            field.val('t');
                            field.trigger($.Event('mousedown'));
                            field.trigger($.Event('click'));
                            dropdownLoaded(done);
                        });
                    });

                });
            });

            describe('a container for active facets that', function () {

                function getDropdown ()  {
                    return $('.autocomplete-popup>.scrollable-pane').children();
                }

                //beforeEach(openDropdown);

                it('exists', function () {
                    expect(!!this.vars.nodes.container).to.equal(true);
                });
                // it('exists', function () {
                //     var dropdown = getDropdown();
                //     dropdown.first().trigger('click');
                //     debugger;
                //     expect(this.vars.nodes.container.length).to.equal(1);
                // });

            });

        });

    });
});
