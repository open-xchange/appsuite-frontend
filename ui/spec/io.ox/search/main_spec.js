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

define([
    'io.ox/mail/main',
    'spec/shared/io.ox/search/util',
    'beforeEachEnsure'
], function (main, util, beforeEachEnsure) {
    'use strict';

    describe('Search', function () {

        //this.timeout(10000);
        describe.skip('in-app search:', function () {
            //ensure setup is finished
            beforeEachEnsure(util.startApp);
            beforeEach(util.setupFakeServer);

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
                            afterEach(util.closeDropdown);

                            it('key was pressed', function (done) {
                                var field = getField(this);
                                field.val('test');
                                field.trigger(
                                    $.Event('keyup', { keyCode: 80 })
                                );
                                util.dropdownLoaded(done);
                            });
                            it('input is clicked', function (done) {
                                var field = getField(this);
                                field.val('test');
                                field.trigger($.Event('mousedown'));
                                field.trigger($.Event('click'));
                                util.dropdownLoaded(done);
                            });
                        });
                    });
                });

                // Hint depends on test run before
                describe('a container for active facets that', function () {

                    //beforeEach(util.openDropdown);

                    function getDropdown () {
                        return $('.autocomplete-popup>.scrollable-pane').children();
                    }

                    it('is referenced', function () {
                        debugger;
                        expect(!!this.vars.nodes.container).to.equal(true);
                    });
                    it('is part of the dom', function () {
                        expect($('.search-container').length).to.equal(1);
                    });
                    it('is initially hidden', function () {
                        expect($('.search-container').is(':visible')).to.equal(false);
                    });

                    //
                    describe('', function () {

                        // it('contains active default facets', function (done) {
                        //     util.selectFilter();
                        //     util.searchLoaded(done);
                        // });
                        // it('contains active default facets', function (done) {
                        //     util.selectFilter();
                        //     util.searchLoaded(done).done(function () {
                        //         debugger;
                        //     });
                        // });

                        // it('contains active default facets', function (done) {
                        //     var self = this;
                        //     util.selectFilter();
                        //     util.searchLoaded()
                        //         .then(function () {
                        //             console.log('%c' + 'a', 'color: white; background-color: grey');
                        //             return util.openDropdown.call(self);
                        //         })
                        //         .then(util.selectFilter)
                        //         .then(function () {
                        //         })
                        //         .then(util.searchLoaded.done(function () {
                        //             expect($('.search-container>.default>.search-facets').children().length).to.equal(2);
                        //         }));
                        // });
                    });

                });

            });

        });
    });
});
