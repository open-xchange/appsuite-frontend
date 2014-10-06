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
    'io.ox/search/util',
    'fixture!io.ox/core/settings.json',
    'spec/shared/capabilities',
    'settings!io.ox/mail',
    'settings!io.ox/core',
    'io.ox/mail/main',
    'spec/shared/io.ox/search/util',
    'beforeEachEnsure'
], function (util, settingsFixture, caputil, mailSettings, settings, main, testutil, beforeEachEnsure) {
    'use strict';

    function isPromise(def) {
        return (!def.reject && !!def.done);
    }

    function failed() {
        expect(false).to.be.true;
    }

    describe.skip('Search', function () {

        describe('Utilities for search:', function () {
            beforeEachEnsure(testutil.startApp);

            describe('getFolders', function () {
                it('should always return a promise', function () {
                    var def = util.getFolders(this.vars.model);
                    expect(isPromise(def)).to.be.true;
                });

                describe('returned promise', function () {
                    it('should resolve with an object', function () {
                        var def = util.getFolders(this.vars.model);
                        def.then(function (data) {
                            expect(_.isObject(data)).to.be.true;
                        }, failed);
                    });
                    it('should always resolve with an object', function () {
                        var def = util.getFolders(this.vars.model);
                        def.then(function (data) {
                            expect(_.isObject(data)).to.be.true;
                        }, failed);
                    });
                    it('should always resolve with at least the default account', function () {
                        var def = util.getFolders(this.vars.model);
                        def.then(function (data) {
                            expect(data).to.have.property('0').that.is.an('object');
                        }, failed);
                    });
                    it('should always resolve with minimal account data', function () {
                        var def = util.getFolders(this.vars.model);
                        def.then(function (data) {
                            expect(data[0]).to.have.property('list').that.is.an('array');
                            expect(data[0].list).to.not.be.empty;
                        }, failed);
                    });
                });
            });

            describe('getFirstChoice', function () {
                it('should always return a promise', function () {
                    var def = util.getFirstChoice(this.vars.model);
                    expect(isPromise(def)).to.be.true;
                });
                describe('returned promise', function (done) {
                    it('should always resolve with an object', function () {
                        var def = util.getFirstChoice(this.vars.model);
                        def.then(function (data) {
                            expect(_.isObject(data)).to.be.true;
                        }, failed)
                        .always(done);
                    });

                    it('should always resolve with custom and display_name', function (done) {
                        var def = util.getFirstChoice(this.vars.model);
                        def.then(function (data) {
                            expect(data).to.be.an('object');
                        }, failed)
                        .always(done);
                    });
                });
            });

        });

    });
});
