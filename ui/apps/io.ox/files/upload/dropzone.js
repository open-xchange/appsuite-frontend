/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/files/upload/dropzone', [
    'io.ox/core/extensions',
    'io.ox/core/dropzone',
    'io.ox/core/folder/api',
    'io.ox/files/upload/file-folder',
    'gettext!io.ox/files'
], function (ext, dropzone, api, fileFolderUpload, gt) {

    'use strict';

    ext.point('io.ox/files/dropzone').extend({
        id: 'default',
        index: 100,
        getDropZones: function (baton) {
            var app = baton.app,
                zone = new dropzone.Inplace({
                    folderSupport: true,
                    caption: gt('Drop files or folders here to upload')
                });

            zone.on({
                'show': function () {
                    app.listView.$el.stop().hide();
                },
                'hide': function () {
                    app.listView.$el.fadeIn('fast');
                },
                'drop': function (fileObjArray) {
                    var targetFolder = app.folder.get();
                    fileFolderUpload.upload(fileObjArray, targetFolder, app);
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

            // Resize visible dropzones based on those enabled
            var resize = _.debounce(function doResize(baton) {
                if (baton.dropZones.length <= 1) return; // ntd
                var enabled = baton.dropZones.filter(function (zone) { return zone.isEnabled(); });
                var size = 100 / enabled.length;
                enabled.map(function (zone, position) {
                    zone.$el
                        .css({
                            top: position * size + '%',
                            height: size + '%'
                        });
                });
            }, 200, baton);

            ext.point('io.ox/files/dropzone').invoke('getDropZones', this, baton);

            var size = 100 / baton.dropZones.length;
            app.getWindowNode().find('.list-view-control').append(
                baton.dropZones.map(function (zone, index) {
                    // check folder grants first
                    if (!_.isFunction(zone.isEnabled)) {
                        zone.isEnabled = function () {
                            var id = app.folder.get();
                            var model = api.pool.getModel(id);
                            var isTrash = model ? api.is('trash', model.toJSON()) : false;

                            if (isTrash) {
                                return false;
                            }

                            return model.can('create');

                        };
                    }
                    zone.on('show', function () {
                        resize(baton);
                    });
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
