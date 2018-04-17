define([
    'io.ox/core/api/apps',
    'io.ox/core/main/appcontrol',
    'settings!io.ox/core'
], function (apps, appcontrol, coreSettings) {
    describe('Apps', function () {
        describe('defining App for launcher', function () {
            let app;
            beforeEach(function () {
                app = new ox.ui.App({
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
                const app2 = new ox.ui.App({
                    id: 'io.ox/test2',
                    name: 'io.ox/test2',
                    title: 'Testanwendung 2'
                });
                const app3 = new ox.ui.App({
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
                const app2 = new ox.ui.App({
                    id: 'io.ox/test2',
                    name: 'io.ox/test2',
                    title: 'Testanwendung 2'
                });
                const app3 = new ox.ui.App({
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
        });

        describe('launchers view', function () {
            it('should draw launcher items for apps', function () {
                var stub = sinon.stub(apps, 'forLauncher');
                stub.returns([
                    new ox.ui.App({ id: 'io.ox/test', name: 'test', title: 'Testanwendung' }),
                    new ox.ui.App({ id: 'io.ox/test2', name: 'test2', title: 'Testanwendung 2' }),
                    new ox.ui.App({ id: 'io.ox/test3', name: 'test3', title: 'Testanwendung 3' })
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
                    app = new ox.ui.App({ id: 'io.ox/test', name: 'test', title: 'Testanwendung' }),
                    new ox.ui.App({ id: 'io.ox/test2', name: 'test2', title: 'Testanwendung 2' }),
                    new ox.ui.App({ id: 'io.ox/test3', name: 'test3', title: 'Testanwendung 3' })
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
        });
    });
});
