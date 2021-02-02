define([
    'io.ox/core/desktop',
    'io.ox/core/api/apps',
    'io.ox/core/main/appcontrol',
    'settings!io.ox/core'
], function (ui, apps, appcontrol, coreSettings) {
    describe('Apps', function () {
        let oldApps;
        before(function () {
            oldApps = apps.models;
            apps.reset();
        });
        after(function () {
            apps.reset(oldApps);
        });
        describe('defining App for launcher', function () {
            let app;
            beforeEach(function () {
                app = new ui.App({
                    id: 'io.ox/test',
                    name: 'io.ox/test',
                    title: 'Testanwendung'
                });
                apps.add(app);
            });
            afterEach(function () {
                apps.remove(app);
                app = null;
            });

            it('should not contain apps not specified in jslob', function () {
                coreSettings.set('apps/list');
                apps.initialize();
                const launcherApps = apps.forLauncher();
                expect(launcherApps).to.have.length(0);
            });
            it('should contain apps specified in jslob', function () {
                coreSettings.set('apps/list', 'io.ox/test,io.ox/mail');
                apps.initialize();
                const launcherApps = apps.forLauncher();
                expect(launcherApps).to.have.length(1);
                expect(launcherApps[0]).to.equal(app);
            });
            it('should respect order defined in jslob', function () {
                coreSettings.set('apps/list', 'io.ox/test,io.ox/test3,io.ox/test2');
                apps.initialize();
                const app2 = new ui.App({
                    id: 'io.ox/test2',
                    name: 'io.ox/test2',
                    title: 'Testanwendung 2'
                });
                const app3 = new ui.App({
                    id: 'io.ox/test3',
                    name: 'io.ox/test3',
                    title: 'Testanwendung 3'
                });
                apps.add([app2, app3]);
                const launcherApps = apps.forLauncher();
                expect(launcherApps).to.have.length(3);
                expect(launcherApps[0], 'Testanwendung @ position 1').to.equal(app);
                expect(launcherApps[1], 'Testanwendung 3 @ position 2').to.equal(app3);
                expect(launcherApps[2], 'Testanwendung 2 @ position 3').to.equal(app2);
                apps.remove(app2);
                apps.remove(app3);
            });
            it('should create sort order independent of apps not in jslob list', function () {
                coreSettings.set('apps/list', 'io.ox/test3,io.ox/test');
                apps.initialize();
                const app2 = new ui.App({
                    id: 'io.ox/test2',
                    name: 'io.ox/test2',
                    title: 'Testanwendung 2'
                });
                const app3 = new ui.App({
                    id: 'io.ox/test3',
                    name: 'io.ox/test3',
                    title: 'Testanwendung 3'
                });
                apps.add([app2, app3]);
                const launcherApps = apps.forLauncher();
                expect(launcherApps).to.have.length(2);
                expect(launcherApps[0].id, 'Testanwendung 3 @ position 1').to.equal(app3.id);
                expect(launcherApps[1].id, 'Testanwendung @ position 2').to.equal(app.id);
                apps.remove(app2);
                apps.remove(app3);
            });

            it('should be possible to maintain a blacklist for the launcher', function () {
                coreSettings.set('apps/list', 'io.ox/test');
                coreSettings.set('apps/blacklist', 'io.ox/test');
                apps.initialize();
                const launcherApps = apps.forLauncher();
                expect(launcherApps).to.have.length(0);
            });

            it('should list app which added itself', function () {
                coreSettings.set('apps/list');
                coreSettings.set('apps/blacklist');
                apps.initialize();
                apps.launcher.add('io.ox/test');
                const launcherApps = apps.forLauncher();
                expect(launcherApps).to.have.length(1);
                expect(launcherApps[0].get('title'), 'title of the first app').to.equal('Testanwendung');
            });
        });

        describe('launchers view', function () {
            it('should draw launcher items for apps', function () {
                var stub = sinon.stub(apps, 'forLauncher');
                stub.returns([
                    new ui.App({ id: 'io.ox/test', name: 'test', title: 'Testanwendung' }),
                    new ui.App({ id: 'io.ox/test2', name: 'test2', title: 'Testanwendung 2' }),
                    new ui.App({ id: 'io.ox/test3', name: 'test3', title: 'Testanwendung 3' })
                ]);
                let view = new appcontrol.LaunchersView({
                    collection: apps
                });
                view.render();
                expect(view.$el.find('li')).to.have.length(3);
                expect(view.$el.find('li .title').text())
                    .to.equal(['Testanwendung', 'Testanwendung 2', 'Testanwendung 3'].join(''));
                stub.restore();
            });

            it('should redraw launcher on collection change', function () {
                var stub = sinon.stub(apps, 'forLauncher');
                const oldApps = apps.models;
                let app;
                apps.add([
                    app = new ui.App({ id: 'io.ox/test', name: 'test', title: 'Testanwendung' }),
                    new ui.App({ id: 'io.ox/test2', name: 'test2', title: 'Testanwendung 2' }),
                    new ui.App({ id: 'io.ox/test3', name: 'test3', title: 'Testanwendung 3' })
                ], { silent: true });
                stub.returns(apps.models);
                let view = new appcontrol.LaunchersView({
                    collection: apps
                });
                view.render();
                expect(view.$el.find('li')).to.have.length(3);
                expect(view.$el.find('li .title').text())
                    .to.equal(['Testanwendung', 'Testanwendung 2', 'Testanwendung 3'].join(''));

                apps.remove(app);
                expect(view.$el.find('li')).to.have.length(2);
                expect(view.$el.find('li .title').text())
                    .to.equal(['Testanwendung 2', 'Testanwendung 3'].join(''));

                apps.add(app);
                expect(view.$el.find('li')).to.have.length(3);
                expect(view.$el.find('li .title').text())
                        .to.equal(['Testanwendung 2', 'Testanwendung 3', 'Testanwendung'].join(''));

                apps.reset(oldApps, { silent: true });
                stub.restore();
            });

            it('should render app icons that look like html', function () {
                const model = new ui.App({
                    id: 'io.ox/test',
                    name: 'test',
                    title: 'Testanwendung',
                    icon: '<img src="test.png" />'
                });
                const view = new appcontrol.LauncherView({
                    model
                });
                const el = view.render().$el;
                expect(el.find('.icon img').attr('src')).to.equal('test.png');
            });

            it('should render fallback icon', function () {
                const model = new ui.App({
                    id: 'io.ox/test',
                    name: 'test',
                    title: 'Testanwendung',
                    icon: 'something broken that we don\'t want to show'
                });
                const view = new appcontrol.LauncherView({
                    model
                });
                const el = view.render().$el;
                expect($(el.find('.icon svg text')).text(), 'text of font-awesome questionmark icons').to.equal('\uf128');
            });

            it('should call ox.launch for apps "path" attribute', function () {
                const model = new ui.App({
                    path: 'custom/module/apps/test/main',
                    title: 'Testanwendung'
                });
                const spy = sinon.spy(),
                    def = $.Deferred();
                model.on('launch', def.resolve);
                // eslint-disable-next-line requirejs/no-invalid-define
                define('custom/module/apps/test/main', function () {
                    return {
                        getApp() {
                            spy();
                            return model;
                        }
                    };
                });
                expect(spy.called).to.equal(false);
                const view = new appcontrol.LauncherView({
                    model
                });
                const el = view.render().$el;
                el.click();
                return def.then(function () {
                    expect(spy.called).to.equal(true);
                    requirejs.undef('custom/module/apps/test/main');
                });
            });
        });

        describe('Models', function () {
            it('should be Backbone models', function () {
                const app = new ui.App({
                    name: 'io.ox/test'
                });
                expect(app.get).to.be.a('function');
                expect(app.set).to.be.a('function');
            });
            it('should automatically generate an id', function () {
                const app = new ui.App({
                    name: 'io.ox/test'
                });
                expect(app.id).to.match(/^app-\d+/);
            });
            it('should automatically generate the path to the main module', function () {
                const app = new ui.App({
                    name: 'io.ox/test'
                });
                expect(app.get('path')).to.equal('io.ox/test/main');
            });
            it('should not override specified path to the main module', function () {
                const app = new ui.App({
                    name: 'io.ox/test',
                    path: 'custom/path'
                });
                expect(app.get('path')).to.equal('custom/path');
            });
            it('should be possible to provide a custom launcher function', function () {
                const app = new ui.App({ name: 'io.ox/test' });
                const spy = sinon.spy();
                app.setLauncher(spy);
                return app.launch().then(function () {
                    expect(spy.calledOnce).to.equal(true);
                });
            });

            describe('state management', function () {
                it('should start in "ready" state', function () {
                    const app = new ui.App({
                        name: 'io.ox/test'
                    });
                    expect(app.get('state')).to.equal('ready');
                });
                it('should change state during launch process', function () {
                    const app = new ui.App({ name: 'io.ox/test' });
                    expect(app.get('state')).to.equal('ready');
                    const def = app.launch();
                    expect(app.get('state')).to.equal('initializing');
                    return def.then(function () {
                        expect(app.get('state')).to.equal('running');
                    });
                });
            });
        });
    });
});
