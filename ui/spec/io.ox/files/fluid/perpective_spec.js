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
        'waitsFor',
        'fixture!io.ox/files/api-all.json'], function (main, api, waitsFor, all) {

    describe('files app', function () {
        var loadapp = $.Deferred(),
            suite = {},
            //init app only once
            setup = function () {
                    //load app
                    suite.app = main.getApp();
                    suite.app.launch().then(function () {
                        //load perspective
                        return ox.ui.Perspective.show(this, 'fluid:list');
                    }).done(function (perspective) {
                        suite.pers = perspective;
                        suite.sel = perspective.selection;
                        //load data
                        perspective.selection.on('update', function () {
                            loadapp.resolve();
                        });
                    });
                };

        //store data
        suite.data = _.uniq(all.data, function (item) {
                return item[0];
            });

        beforeEach(function (done) {
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

            loadapp.done(done);
        });

        it('should have a launch function', function () {
            chai.expect(suite.app.launch).to.be.a('function');
        });

        describe('has a perspective', function () {
            it('that is defined', function () {
                expect(suite.pers.selection).to.exist;
            });
            it('that is named correctly', function () {
                expect(suite.pers.name).to.equal('fluid');
            });
            it('that filters duplicates', function () {
                //hint: fake servers all response contains a dublette
                var triggered;

                //check inital handling
                expect(suite.pers.baton.allIds).to.have.length(suite.data.length);

                //check refresh handling
                suite.pers.selection.on('update', function () {
                    triggered = true;
                });
                api.trigger('refresh.all');
                return waitsFor(function () {
                    return triggered;
                }).done(function () {
                    expect(suite.pers.baton.allIds.length).to.equal(suite.data.length);
                });
            });
            it('that should have a view mode', function () {
                expect(suite.pers.baton.options.mode).not.to.be.empty;
            });
            it('that should start in list view mode', function () {
                expect(suite.pers.baton.options.mode).to.equal('list');
            });

        });

        describe('should have a selection', function () {
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
                expect(suite.pers.selection).to.exist;
                expect(suite.app.selection).to.exist;
                expect(suite.sel).to.exist;
            });
            it('that is valid', function () {
                chai.expect(suite.pers.selection.get).to.be.a('function');
                chai.expect(suite.app.selection.get).to.be.a('function');
                chai.expect(suite.sel.get).to.be.a('function');
            });
            it('that selects at least one file on startup', function () {
                expect(suite.sel.get().length, 'selection length').be.above(0);
            });

            it('that has access to all files in the folder', function () {
                suite.sel.selectAll();
                expect(suite.sel.get()).to.have.length(suite.data.length);
            });

        });

    });
});
