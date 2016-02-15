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
    'io.ox/presenter/localmodel',
    'io.ox/presenter/views/mainview',
    'io.ox/presenter/views/notification',
    'io.ox/core/tk/sessionrestore',
    'less!io.ox/presenter/style'
], function (FilesAPI, PageController, RTConnection, RTModel, LocalModel, MainView, Notification, SessionRestore) {

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

        'show-error-notification': function (app) {
            app.showErrorNotification = function (error, options) {
                var page = app.pages.getPage('presentationView');
                var notificationNode = Notification.createErrorNode(error, options);
                page.empty().append(notificationNode);
            };
        },

        'start-presentation': function (app) {

            app.startPresentation = function (file) {

                app.file = _.clone(file);

                // get file success handler
                function getFileSuccess(data) {
                    var title = data.filename || data.title;

                    app.setTitle(title);
                    app.fileModel = FilesAPI.pool.get('detail').get(_.cid(data));
                    app.offlineHandlerTriggered = false;

                    // init local model
                    app.localModel = new LocalModel();

                    // init RT connection
                    app.rtModel = new RTModel();
                    app.rtConnection = new RTConnection(app.fileModel.toJSON());
                    app.rtConnection.connect().then(rtConnectSuccess, rtConnectError);
                    app.rtConnection.on({
                        'update': rtUpdateHandler,
                        'online': rtOnlineHandler,
                        'offline': rtOfflineHandler,
                        'timeout reset error:notMember error:stanzaProcessingFailed error:joinFailed error:disposed': rtErrorHandler
                    });
                }

                // get file error handler
                function getFileError(error) {
                    console.warn('File Error', error);
                    app.showErrorNotification(error, { category: 'drive' });
                }

                // RT connection update event handler
                function rtUpdateHandler(event, data) {
                    //console.info('Presenter - rtUpdateHandler()', data);
                    app.rtModel.set(app.rtModel.parse(data));
                }

                // RT connect success handler
                function rtConnectSuccess(response) {
                    var page = app.pages.getPage('presentationView');
                    var lastState = SessionRestore.state('presenter~' + app.file.id);

                    app.rtModel.set(app.rtModel.parse(response));
                    app.mainView = new MainView({ model: app.fileModel, app: app });
                    page.append(app.mainView.render().$el);
                    // restore state before the browser reload
                    if (lastState && lastState.isPresenter) {
                        app.rtConnection.startPresentation({ activeSlide: lastState.slideId || 0 });
                    }
                    // join a runnig presentation if Presenter was started from a deep link
                    if (app.deepLink && app.rtModel.canJoin()) {
                        Notification.notifyPresentationJoin(app.rtModel, app.rtConnection);
                        app.mainView.joinPresentation();
                    }
                }

                // RT connect error handler
                function rtConnectError(response) {
                    console.warn('RT Connect Error', response);
                    app.showErrorNotification(response, { category: 'rt' });
                }

                // RT error handler
                function rtErrorHandler(event) {
                    Notification.notifyRealtimeError(event && event.type);
                }

                // RT online handler
                function rtOnlineHandler() {
                    if (app.offlineHandlerTriggered) {
                        app.offlineHandlerTriggered = false;
                        Notification.notifyRealtimeOnline();
                    }
                }

                // RT offline handler
                function rtOfflineHandler() {
                    app.offlineHandlerTriggered = true;
                    Notification.notifyRealtimeOffline();
                }

                // get file model
                FilesAPI.get(file).then(getFileSuccess, getFileError);
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
                app.deepLink = false;
                app.setState({ folder: obj.folder_id, id: obj.id });
                app.startPresentation(obj);
                return;
            }

            // deep-link
            obj = app.getState();
            app.deepLink = true;
            app.startPresentation(obj);
        });
    }

    return {
        getApp: createInstance
    };

});
