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

    describe('The appsuite desktop', function () {

        describe('provides the Window API which', function () {

            describe('has a search object that', function () {
                beforeEach(function () {
                    this.window = ox.ui.createWindow({
                        search: true
                    });
                });

                it('should provide the query string through a getQuery method', function () {
                    this.window.search.open();
                    this.window.search.setQuery('foo');
                    expect(this.window.search.getQuery()).to.equal('foo');
                });

                it('should not trim trailing whitespace', function () {
                    this.window.search.open();
                    this.window.search.setQuery('foo ');
                    expect(this.window.search.getQuery({trim: false})).to.equal('foo ');
                });
            });
        });

        describe('provides the App API which', function () {
            beforeEach(function () {
                this.app = new ox.ui.App({
                    name: 'io.ox/testApp'
                });

                ox.manifests.apps['io.ox/testApp/main'] = {
                    path: 'spec/io.ox/testApp',
                    category: 'tests'
                };
            });

            afterEach(function () {
                //clean up
                ox.ui.apps.each(function (app) {
                    app.quit();
                });
            });

            it('should define global ox.ui.App object', function () {
                expect(ox.ui.App).to.exist;
            });

            it('should launch a test app', function (done) {
                var app = this.app;

                expect(app.get('state')).to.equal('ready');
                app.launch().then(function () {
                    expect(ox.ui.apps.models).to.contain(app);
                    expect(app.get('state')).to.equal('running');
                    done();
                });
            });

            it('should not launch an unregistered app', function () {
                var app = this.app,
                    def;
                ox.manifests.disabled['io.ox/testApp/main'] = true;

                def = app.launch();

                ox.manifests.disabled = {};
                expect(ox.ui.apps.models).not.to.contain(app);
                expect(def.state()).to.equal('rejected');
            });

            describe('should allow to customize the launch method', function () {
                var launcher = function (options) {
                    var def = $.Deferred();

                    options.callback();
                    _.defer(function () {
                        def.resolve();
                    });
                    return def;
                };

                beforeEach(function () {
                    this.callback = sinon.spy();
                });
                afterEach(function () {
                    expect(this.callback).to.have.been.calledTwice;
                });

                it('during initialization', function (done) {
                    var app = new ox.ui.App({
                            name: 'io.ox/testApp',
                            launch: launcher
                        }),
                        callback = this.callback,
                        def;

                    expect(app.get('state')).to.equal('ready');
                    def = app.launch({callback: callback}).done(function () {
                        expect(ox.ui.apps.models).to.contain(app);
                        expect(app.get('state')).to.equal('running');
                        callback();
                        done();
                    });
                    expect(app.get('state')).to.equal('initializing');
                });

                it('after initialization', function (done) {
                    var app = this.app,
                        callback = this.callback;

                    app.setLauncher(launcher);
                    app.launch({callback: callback}).done(function () {
                        callback();
                        done();
                    });
                });
            });
        });
    });
});
