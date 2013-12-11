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
                    expect(this.window.search.getQuery()).toBe('foo');
                });

                it('should trim trailing whitespace by default', function () {
                    this.window.search.open();
                    this.window.search.setQuery('foo ');
                    expect(this.window.search.getQuery()).toBe('foo');
                });
            });
        });

        describe('provides the App API which', function () {
            beforeEach(function () {
                this.app = new ox.ui.App({
                    name: 'io.ox/testApp'
                });

                ox.manifests.apps['io.ox/testApp/main'] = {};
            });

            afterEach(function () {
                //clean up
                ox.ui.apps.each(function (app) {
                    app.quit();
                });
            });

            it('should define global ox.ui.App object', function () {
                expect(ox.ui.App).toBeDefined();
            });

            it('should launch a test app', function () {
                var app = this.app;

                expect(app.get('state')).toBe('ready');
                app.launch();
                waitsFor(function () {
                    return app.launch().state() !== 'pending';
                }, 'could not launch app', 1000);

                expect(ox.ui.apps).toContain(app);
                expect(app.get('state')).toBe('running');
            });

            it('should not launch an unregistered app', function () {
                var app = this.app,
                    def;
                ox.manifests.disabled['io.ox/testApp/main'] = true;

                def = app.launch();

                ox.manifests.disabled = {};
                expect(ox.ui.apps).not.toContain(app);
                expect(def.state()).toBe('rejected');
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
                    runs(function () {
                        expect(this.callback).toHaveBeenCalledTwice();
                    });
                });

                it('during initialization', function () {
                    var app = new ox.ui.App({
                            name: 'io.ox/testApp',
                            launch: launcher
                        }),
                        callback = this.callback,
                        def;

                    expect(app.get('state')).toBe('ready');
                    def = app.launch({callback: callback}).done(function () {
                        expect(ox.ui.apps).toContain(app);
                        expect(app.get('state')).toBe('running');
                        callback();
                    });
                    expect(app.get('state')).toBe('initializing');

                    waitsFor(function () {
                        return def.state() === 'resolved';
                    }, 'could not launch app', 1000);
                });

                it('after initialization', function () {
                    var app = this.app,
                        callback = this.callback,
                        def;

                    app.setLauncher(launcher);
                    def = app.launch({callback: callback}).done(function () {
                        callback();
                    });

                    waitsFor(function () {
                        return def.state() === 'resolved';
                    }, 'could not launch app', 1000);
                });
            });
        });
    });
});
