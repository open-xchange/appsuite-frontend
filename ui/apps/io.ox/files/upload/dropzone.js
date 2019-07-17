/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/files/upload/dropzone', [
    'io.ox/core/extensions',
    'io.ox/core/dropzone',
    'io.ox/core/folder/api',
    'gettext!io.ox/files'
], function (ext, dropzone, api, gt) {

    'use strict';

    ext.point('io.ox/files/dropzone').extend({
        id: 'default',
        index: 100,
        getDropZones: function (baton) {
            var app = baton.app,
                zone = new dropzone.Inplace({
                    caption: gt('Drop files here to upload')
                });

            zone.on({
                'show': function () {
                    app.listView.$el.stop().hide();
                },
                'hide': function () {
                    app.listView.$el.fadeIn('fast');
                },
                'drop': function (files) {
                    require(['io.ox/files/upload/main'], function (fileUpload) {
                        fileUpload.setWindowNode(app.getWindowNode());
                        fileUpload.create.offer(files, { folder: app.folder.get() });
                    });
                }
            });

            baton.dropZones.push(zone);
        }
    });

    ext.point('io.ox/files/mediator').extend({
        id: 'files-dropzone',
        index: 1000000000000,
        setup: function (app) {

            // desktop only
            if (!_.device('desktop')) return;

            var baton = new ext.Baton({
                app: app,
                dropZones: []
            });
            ext.point('io.ox/files/dropzone').invoke('getDropZones', this, baton);

            var size = 100 / baton.dropZones.length;
            app.getWindowNode().find('.list-view-control').append(
                baton.dropZones.map(function (zone, index) {
                    // check folder grants first
                    if (!_.isFunction(zone.isEnabled)) {
                        zone.isEnabled = function () {
                            var id = app.folder.get();
                            return api.pool.getModel(id).can('create');
                        };
                    }

                    return zone.render().$el
                        .addClass('abs')
                        .css({
                            top: index * size + '%',
                            height: size + '%'
                        });
                })
            );
        }
    });
});
