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

define(['io.ox/files/main',
        'io.ox/files/api',
        'fixture!io.ox/files/api-all.json'], function (main, api, all) {


    describe('files app', function () {
        var loadapp = $.Deferred(),
            suite = {},
            //init app only once
            setup = _.once(
                function () {
                    //load app
                    main.getApp().launch().done(function () {
                        suite.app = this;
                        //load perspective
                        ox.ui.Perspective.show(this, 'fluid:list')
                            .done(function (perspective) {
                                suite.pers = perspective;
                                suite.sel = perspective.selection;
                                //load data
                                perspective.selection.on('update', function () {
                                    loadapp.resolve();
                                });
                            });
                    });
                }
            );
        //store data
        suite.data = _.uniq(all.data, function (item) {
                return item[0];
            });

        beforeEach(function () {
            //
            setup();

            //all request with a doublete
            var allDoublettes = _.clone(all);
            allDoublettes.data = allDoublettes.data.concat([all.data[0]]);

            //load fake server
            this.server.respondWith('GET', /api\/files\?action=all/, function (xhr) {
                xhr.respond(200, {
                    'Content-Type': 'text/javascript;charset=UTF-8'
                }, JSON.stringify(allDoublettes));
            });

            waitsFor(function () {
                return loadapp.state() === 'resolved';
            }, 'files app did not start', ox.TestTimeout);

        });

        it('should has a launch function', function () {
            chai.expect(suite.app.launch).to.be.a('function');
        });

        describe('has a perspective', function () {
            it('that is defined', function () {
                expect(suite.pers.selection).toBeTruthy();
            });
            it('that is named correctly', function () {
                expect(suite.pers.name).toBe('fluid');
            });
            it('that filters duplicates', function () {
                //hint: fake servers all response contains a dublette
                //var triggered;

                //check inital handling
                expect(suite.pers.baton.allIds.length).toBe(suite.data.length);

                //FIXME: handler in perspectiv isn't executed?!
                //check refresh handling
                // suite.pers.selection.on('update', function () {
                //     triggered = true;
                // });
                // api.trigger('refresh.all');
                // waitsFor(function () {
                //     return triggered;
                // });
                // runs(function () {
                //     expect(suite.pers.baton.allIds.length).toBe(suite.data.length);
                // });
            });
            it('that should has a view mode', function () {
                expect(suite.pers.baton.options.mode).not.toBe('');
            });
            it('that should start in list view mode', function () {
                expect(suite.pers.baton.options.mode).toBe('list');
            });

        });

        describe('should has a selection', function () {
            var current;
            beforeEach(function () {
                current = suite.sel.get();
            });
            afterEach(function () {
                suite.sel.clear();
                _.each(current, function (obj) {
                    suite.sel.select(obj);
                });
            });

            it('that is reachable via app and perspective', function () {
                expect(suite.pers.selection).toBeTruthy();
                expect(suite.app.selection).toBeTruthy();
                expect(suite.sel).toBeTruthy();
            });
            it('that is valid', function () {
                chai.expect(suite.pers.selection.get).to.be.a('function');
                chai.expect(suite.app.selection.get).to.be.a('function');
                chai.expect(suite.sel.get).to.be.a('function');
            });
            it('that selects at least one file on startup', function () {
                expect(suite.sel.get().length).toBeGreaterThan(0);
            });

            it('that has access to all files in the folder', function () {
                suite.sel.selectAll();
                expect(suite.sel.get().length).toBe(suite.data.length);
            });

        });

    });
});
