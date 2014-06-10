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
        'settings!io.ox/mail',
        'settings!io.ox/core',
        'beforeEachEnsure'], function (settingsFixture, mailSettings, settings, beforeEachEnsure) {

    //aync setup loads app and and add some variables to test context
    function setup () {
        var def = $.Deferred(),
            self = this;
        //apply relevant setting fixtures
        mailSettings.set('folder', settingsFixture['io.ox/mail'].folder);
        settings.set('folder', settingsFixture['io.ox/core'].folder);
        settings.set('search', settingsFixture['io.ox/core'].search);
        _.each(settings.get('search/modules'), function (module) {
            var id = 'io.ox/' + module + '/main';
            ox.manifests.apps[id] = {title: module};
        });

        //load app
        require(['io.ox/search/main'], function (main) {
            main.init();
            var app = main.run();
            self.vars = {
                app: app,
                model: app.getModel(),
                node: $(document.body, '.io-ox-search-window').find('.window-content')
            };
            def.resolve();
        });
        return def;
    }


    describe('Search app:', function () {
        //ensure setup is finished
        beforeEachEnsure(setup);

        describe('has a view that', function () {

            describe('has a row for applications that', function () {

                var getApps = function (data) {
                    return data.vars.node.find('.row.applications>ul').children();
                };

                it('exists', function () {
                    var row = this.vars.node.find('.row.applications');
                    expect(row).to.not.be.empty;
                });
                it('contains a list element for each available application', function () {
                    var apps = getApps(this);
                    expect(apps.length).to.equal(4);
                });
                it('contains exactly one active list element', function () {
                    var apps = getApps(this);
                    expect(apps.find('.btn-primary').length).to.equal(1);
                });
                it('reflects module changes', function () {
                    var apps = getApps(this),
                        id = apps.find('.btn-primary').attr('data-app'),
                        self = this;

                    this.vars.app.view.on('redraw', function () {
                        var apps = getApps(self),
                            idnext = apps.find('.btn-primary').attr('data-app');
                        expect(id).to.not.be.equal(idnext);
                        expect(idnext).to.be.equal('io.ox/tasks');
                    });
                    this.vars.model.setModule('io.ox/tasks');
                });
            });

            describe('has a row for search field that', function () {

                var getField = function (data) {
                    return data.vars.node.find('.search-field');
                };

                it('exists', function () {
                    expect(getField(this)).to.not.be.empty;

                });
                describe('contains a focued input field that', function () {
                    it('exists', function () {
                        expect(getField(this).length).to.equal(1);
                    });
                    it.skip('has focus', function () {
                        var field = getField(this),
                            focused = document.activeElement;
                    });
                    describe('calls autocomplete action api when', function () {
                        it('clicked', function () {
                            var field = getField(this);
                            field.trigger($.Event('click'));
                        });
                        it.skip('focused via tab', function () {
                            var field = getField(this);
                            field.trigger($.Event('click'));
                        });
                        it.skip('key was pressed', function () {
                            var field = getField(this);
                            field.trigger($.Event('click'));
                        });
                    });

                });
            });

        });

    });
});
