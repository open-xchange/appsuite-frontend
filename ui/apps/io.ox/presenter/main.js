/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */

define('io.ox/presenter/main', [
    'io.ox/files/api',
    'io.ox/core/page-controller',
    'io.ox/presenter/rtconnection',
    'io.ox/presenter/rtmodel',
    'io.ox/presenter/views/mainview',
    'io.ox/core/tk/sessionrestore',
    'less!io.ox/presenter/style'
], function (FilesAPI, PageController, RTConnection, RTModel, MainView, SessionRestore) {

    'use strict';

    var NAME = 'io.ox/presenter';

    ox.ui.App.mediator(NAME, {

        'pages-desktop': function (app) {

            // add page controller
            app.pages = new PageController(app);

            app.pages.addPage({
                name: 'presentationView',
                container: app.getWindow().nodes.main
            });

            app.pages.setCurrentPage('presentationView');
        },

        'start-presentation': function (app) {

            app.startPresentation = function (file) {

                app.file = _.clone(file);

                FilesAPI.get(file).done(function (data) {

                    var title = data.filename || data.title,
                        fileModel = FilesAPI.pool.get('detail').get(_.cid(data)),
                        page = app.pages.getPage('presentationView'),
                        lastState = SessionRestore.state('presenter~' + app.file.id);

                    // RT connect success handler
                    function rtConnectSuccess(response) {
                        app.rtModel.set(app.rtModel.parse(response));
                        app.mainView = new MainView({ model: fileModel, app: app });
                        page.append(app.mainView.render().$el);
                        // restore state before the browser reload
                        if (lastState && lastState.isPresenter) {
                            app.rtConnection.startPresentation({ activeSlide: lastState.slideId || 0 });
                        }
                    }

                    // RT connect error handler
                    function rtConnectError(response) {
                        console.warn('ConnectError', response);
                    }

                    // Handler update events of the RT connection
                    function rtUpdateHandler(event, data) {
                        //console.info('Presenter - rtUpdateHandler()', data);
                        app.rtModel.set(app.rtModel.parse(data));
                    }

                    // init RT connection
                    app.rtModel = new RTModel();
                    app.rtConnection = new RTConnection(fileModel.toJSON());
                    app.rtConnection.connect().then(rtConnectSuccess, rtConnectError);
                    app.rtConnection.on({ 'update': rtUpdateHandler });

                    app.setTitle(title);

                    FilesAPI.once('delete:' + _.ecid(data), function () {
                        app.quit();
                    });
                });

            };
        },

        'dispose-rt-connection': function (app) {
            // dispose RT connection instance
            app.disposeRTConnection = function () {
                if (app.rtConnection) {
                    app.rtConnection.close();
                    app.rtConnection.off();
                    app.rtConnection.dispose();
                    app.rtConnection = null;
                }
            };
        },

        'on-app-window-show': function (app) {
            app.getWindow().on('show', function () {
                var id = app.file && app.file.id,
                    folder_id = app.file && (app.file.folder || app.file.folder_id);

                if (id && folder_id) {
                    app.setState({ id: id, folder: folder_id });
                }
            });
        }

    });

    // multi instance pattern
    function createInstance() {

        // application object
        var app = ox.ui.createApp({
            closable: true,
            name: NAME,
            title: ''
        });

        function beforeUnloadHandler() {
            var state = SessionRestore.state('presenter~' + app.file.id);
            if (state) {
                state.slideId = app.mainView.getActiveSlideIndex();
                SessionRestore.state('presenter~' + app.file.id, state);
            }

            app.disposeRTConnection();
        }

        // launcher
        return app.setLauncher(function (options) {

            var win = ox.ui.createWindow({
                chromeless: true,
                name: NAME,
                toolbar: false
            });

            app.setWindow(win);
            app.mediate();

            ox.on('beforeunload', beforeUnloadHandler);

            app.on('quit', function () {
                ox.off('beforeunload', beforeUnloadHandler);
                app.disposeRTConnection();
                SessionRestore.state('presenter~' + app.file.id, null);
            });

            win.show();

            var cid = options.cid, obj;
            if (cid !== undefined) {
                // called from files app
                obj = _.cid(cid);
                app.setState({ folder: obj.folder_id, id: obj.id });
                app.startPresentation(obj);
                return;
            }

            // deep-link
            obj = app.getState();

            if (obj.folder && obj.id) {
                app.startPresentation(obj);
            }
        });
    }

    return {
        getApp: createInstance
    };

});
