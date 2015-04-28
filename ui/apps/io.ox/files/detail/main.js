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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/files/detail/main', [
    'io.ox/files/api',
    'gettext!io.ox/files',
    'io.ox/files/actions'
], function (api, gt) {

    'use strict';

    var NAME = 'io.ox/files/detail';

    ox.ui.App.mediator(NAME, {
        'show-file': function (app) {
            app.showFile = function (file) {

                api.get(file).done(function (data) {

                    var label = gt('File Details'),
                        title = data.filename || data.title;

                    app.getWindowNode().addClass('detail-view-app').append(
                        $('<div class="f6-target detail-view-container">').attr({
                            'tabindex': 1,
                            'role': 'complementary',
                            'aria-label': label
                        }));

                    require(['io.ox/core/viewer/main'], function (Viewer) {
                        Viewer.launch({ files: [data], app: app });
                    });

                    app.setTitle(title);

                    api.one('delete:' + _.ecid(data), function () {
                        app.quit();
                    });
                });

            };
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
                app.showFile(obj);
                return;
            }

            // deep-link
            obj = app.getState();

            if (obj.folder && obj.id) {
                app.showFile(obj);
            }
        });
    }

    return {
        getApp: createInstance
    };
});
