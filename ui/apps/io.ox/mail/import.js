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

define('io.ox/mail/import', [
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'io.ox/core/api/account',
    'io.ox/core/tk/upload',
    'io.ox/core/dropzone',
    'io.ox/core/notifications',
    'gettext!io.ox/mail'
], function (ext, api, accountAPI, upload, dropzone, notifications, gt) {

    'use strict';

    ext.point('io.ox/mail/mediator').extend({
        id: 'import-eml',
        index: 1000000000000,
        setup: function (app) {

            if (app.settings.get('features/importEML') === false) return;

            var win = app.getWindow();

            app.queues = {
                'importEML': upload.createQueue({
                    start: function () {
                        win.busy();
                    },
                    progress: function (item) {
                        return api.importEML({ file: item.file, folder: item.options.folder })
                            .done(function (data) {
                                var first = _(data.data || []).first() || {};
                                // add response for external listeners
                                item.response = first;
                                // no clue if upper-case is correct here and if errors wind up here
                                if ('Error' in first) {
                                    notifications.yell('error', first.Error);
                                } else {
                                    notifications.yell('success', gt('Mail has been imported'));
                                }
                            })
                            // we need a fail handler für server-side errors (as well)
                            .fail(notifications.yell);
                    },
                    stop: function () {
                        win.idle();
                    },
                    type: 'importEML'
                })
            };
            var Zone = dropzone.Inplace.extend({
                    isSupported: function () {
                        return !accountAPI.isUnifiedFolder(app.folder.get());
                    }
                }),
                zone = new Zone({
                    caption: gt('Drop EML file here for import'),
                    filter: /\.eml$/i
                });

            zone.on({
                'show': function () {
                    app.right.removeClass('preview-visible');
                    app.listControl.$el.stop().hide();
                },
                'hide': function () {
                    app.listControl.$el.fadeIn('fast');
                },
                'drop': function (files) {
                    app.queues.importEML.offer(files, { folder: app.folder.get() });
                },
                'invalid': function () {
                    notifications.yell('error', gt('Mail was not imported. Only .eml files are supported.'));
                }
            });

            app.left.append(
                zone.render().$el.addClass('abs')
            );
        }
    });
});
