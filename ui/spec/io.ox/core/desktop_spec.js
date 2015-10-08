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

define(['io.ox/core/desktop'], function (desktop) {
    'use strict';

    describe('Core', function () {
        describe('AppSuite desktop', function () {

            describe('provides the Window API which', function () {
            });

            describe('provides the App API which', function () {
                var app;

                afterEach(function (done) {
                    //clean up
                    if (app && app.get('state') === 'running') {
                        app.quit().done(done);
                    } else {
                        done();
                    }
                });

                describe('has simple applications', function () {
                    beforeEach(function () {
                        app = new ox.ui.App({
                            name: 'io.ox/testApp'
                        });

                        ox.manifests.apps['io.ox/testApp/main'] = {
                            path: 'spec/io.ox/testApp',
                            category: 'tests'
                        };
                    });
                    it('should define global ox.ui.App object', function () {
                        expect(ox.ui.App).to.exist;
                    });

                    it('should launch a test app', function (done) {
                        expect(app.get('state')).to.equal('ready');
                        app.launch().then(function () {
                            expect(ox.ui.apps.models).to.contain(app);
                            expect(app.get('state')).to.equal('running');
                            done();
                        });
                    });

                    it('should not launch an unregistered app', function () {
                        var def;
                        ox.manifests.disabled['io.ox/testApp/main'] = true;

                        def = app.launch();

                        ox.manifests.disabled = {};
                        expect(ox.ui.apps.models).not.to.contain(app);
                        expect(def.state()).to.equal('rejected');
                    });
                });

                describe('should allow to customize the launch method', function () {
                    var launcher = function (options) {
                        var def = $.Deferred();

                        options.callback();
                        _.defer(function () {
                            def.resolve();
                        });
                        return def;
                    }, callback;

                    beforeEach(function () {
                        app = new ox.ui.App({
                            name: 'io.ox/testApp',
                            launch: launcher
                        });
                        callback = sinon.spy();
                    });
                    afterEach(function () {
                        expect(callback.calledTwice, 'callback has been called twice').to.be.true;
                    });

                    it('during initialization', function (done) {

                        expect(app.get('state')).to.equal('ready');
                        app.launch({ callback: callback }).done(function () {
                            expect(ox.ui.apps.models).to.contain(app);
                            expect(app.get('state')).to.equal('running');
                            callback();
                            done();
                        });
                        expect(app.get('state')).to.equal('initializing');
                    });

                    it('after initialization', function (done) {
                        app.setLauncher(launcher);
                        app.launch({ callback: callback }).done(function () {
                            callback();
                            done();
                        });
                    });
                });
            });
        });
    });
});
