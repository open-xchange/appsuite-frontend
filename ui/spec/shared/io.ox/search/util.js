/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('spec/shared/io.ox/search/util', [
    'fixture!io.ox/search/autocomplete.json',
    'fixture!io.ox/search/query.json',
    'spec/shared/capabilities',
    'waitsFor'
], function (autocompleteFixture, queryFixture, caputil, waitsFor) {

    // inject logger function for test object
    // var log = function (test) {
    //     test.logdata = [{
    //         label: 'start',
    //         time: new Date().getTime()
    //     }];
    //     test.log = function (id) {
    //         var tmp = {};
    //         this.logdata.push({
    //             label: (id || 'step'),
    //             time: new Date().getTime() - (_.last(this.logdata).time)
    //         });
    //     }
    // };

    var setupFakeServer = function () {
        var server = this.server;
        server.respondWith('PUT', /api\/find\?action=autocomplete/, function (xhr) {
            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                JSON.stringify({ timestamp: 1378223251586, data: autocompleteFixture.data })
            );
        });
        server.respondWith('PUT', /api\/find\?action=query/, function (xhr) {
            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                JSON.stringify({ timestamp: 1378223251586, data: queryFixture.data })
            );
        });
    };

    // async setup loads app and and add some variables to test context
    // should be called with 'beforeEachEnsure'
    var startApp = function () {
        var def = $.Deferred(),
            self = this;
        // disabled: timeout
        // setCaps = caputil.preset('common').init('io.ox/mail/main', main).apply;
        // setCaps()
        require(['io.ox/mail/main'], function (main) {
            main.getApp().launch().done(function () {
                var win = main.getApp().getWindow();
                self.vars = {
                    win: win,
                    nodes: win.nodes.facetedsearch,
                    api: win.facetedsearch
                };
                win.on('search:loaded', function () {
                    self.vars.view = self.vars.api.view;
                    self.vars.model = self.vars.api.view.model;
                    def.resolve();
                });

                var container = $(win.nodes.facetedsearch.container),
                    toolbar = $(win.nodes.facetedsearch.toolbar);
                // append window-container to dom
                $(document.body).append(
                    container.closest('.window-container').addClass('search-tmp')
                );
                // trigger lazy load
                toolbar.find('.search-field').focus();

            });
        });
        return def;
    };

    // DOM helpers

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
        // var def = $.Deferred(),
        //     self = this;
        // in case already opened
        // if ($('.autocomplete-popup>.scrollable-pane').children().length)
        //     return def.resolve();

        // trigger autocomplete request
        var field = this.vars.nodes.toolbar.find('.search-field');
        field.val('t');
        field.trigger(
            $.Event('keyup', { keyCode: 80 })
        );

        //done.call(this);
        return dropdownLoaded().done(done);
    };

    var closeDropdown = function () {
        $().find('.search-field')
        .trigger(
            $.Event('keydown', { which: 27, keyCode: 27 })
        );
    };

    var selectFilter = function () {
        var dropdown = $('.autocomplete-popup>.scrollable-pane').children();
        dropdown.first().trigger('click');
    };

    return {
        startApp: startApp,
        setupFakeServer: setupFakeServer,
        dropdownLoaded: dropdownLoaded,
        searchLoaded: searchLoaded,
        openDropdown: openDropdown,
        closeDropdown: closeDropdown,
        selectFilter: selectFilter
    };

});
