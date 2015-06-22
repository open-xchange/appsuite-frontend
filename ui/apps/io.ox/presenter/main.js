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
    'io.ox/presenter/views/mainview',
    'less!io.ox/presenter/style'
], function (FilesAPI, PageController, RTConnection, MainView) {

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
                        page = app.pages.getPage('presentationView');

                    // RT connect success handler
                    function rtConnectSuccess(response) {
                        console.info('ConnectSuccess()', response);
                        var view = new MainView({ model: fileModel, app: app });
                        page.append(view.render().$el);
                    }

                    // RT connect error handler
                    function rtConnectError(response) {
                        console.warn('ConnectError', response);
                    }

                    // init RT connection
                    app.rtConnection = new RTConnection(fileModel.toJSON());
                    app.rtConnection.connect().then(rtConnectSuccess, rtConnectError);

                    app.setTitle(title);

                    FilesAPI.once('delete:' + _.ecid(data), function () {
                        app.quit();
                    });
                });

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
        },

        'on-app-quit': function (app) {
            app.on('quit', function () {
                if (app.rtConnection) {
                    // dispose RT connection instance
                    app.rtConnection.dispose();
                    app.rtConnection = null;
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
            id: NAME,
            title: ''
        });

        // launcher
        return app.setLauncher(function (options) {

            var win = ox.ui.createWindow({
                chromeless: true,
                name: NAME,
                toolbar: false
            });

            app.setWindow(win);
            app.mediate();
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
