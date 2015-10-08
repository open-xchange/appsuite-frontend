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
 */

define('io.ox/mail/import', [
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'io.ox/core/tk/upload',
    'io.ox/core/dropzone',
    'io.ox/core/notifications',
    'gettext!io.ox/mail'
], function (ext, api, upload, dropzone, notifications, gt) {

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
                        return api.importEML({ file: item.file, folder: item.options.folder }).done(function (data) {
                            var first = _(data.data || []).first() || {};
                            if ('Error' in first) {
                                notifications.yell('error', first.Error);
                            } else {
                                notifications.yell('success', gt('Mail has been imported'));
                            }
                        });
                    },
                    stop: function () {
                        win.idle();
                    },
                    type: 'importEML'
                })
            };

            var zone = new dropzone.Inplace({
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
