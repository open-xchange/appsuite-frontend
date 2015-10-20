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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/files/upload/dropzone', [
    'io.ox/core/extensions',
    'io.ox/core/dropzone',
    'gettext!io.ox/files'
], function (ext, dropzone, gt) {

    'use strict';

    ext.point('io.ox/files/mediator').extend({
        id: 'files-dropzone',
        index: 1000000000000,
        setup: function (app) {

            // desktop only
            if (!_.device('desktop')) return;

            var zone = new dropzone.Inplace({
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

            app.getWindowNode().find('.list-view-control').append(
                zone.render().$el.addClass('abs')
            );
        }
    });
});
