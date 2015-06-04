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
 */

define('io.ox/presenter/main', [
    'io.ox/files/api',
    'io.ox/core/page-controller',
    'gettext!io.ox/presenter'
], function (FilesAPI, PageController, gt) {

    'use strict';

    var NAME = 'io.ox/presenter';

    ox.ui.App.mediator(NAME, {

        'start-presentation': function (app) {

            app.startPresentation = function (file) {

                app.file = _.clone(file);

                FilesAPI.get(file).done(function (data) {

                    var label = gt('Presenter'),
                        title = data.filename || data.title;

                    app.getWindowNode().addClass('detail-view-app').append(
                        $('<div class="f6-target detail-view-container">').attr({
                            'tabindex': 1,
                            'role': 'complementary',
                            'aria-label': label
                        })
                        .append(
                            $('<div>Will be replaced by the Presenter App soon!</div>')
                            .attr({
                                'role': 'complementary',
                                'aria-label': gt('Presenter')
                            })
                        )
                    );

                    app.setTitle(title);

                    FilesAPI.one('delete:' + _.ecid(data), function () {
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
