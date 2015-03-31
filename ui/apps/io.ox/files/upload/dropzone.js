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
            if (_.device('!desktop')) return;

            var zone = new dropzone.Inplace({
                caption: gt('Drop files here for import')
            });

            zone.on({
                'drop': function (files) {
                    require(['io.ox/files/upload/main'], function (fileUpload) {
                        fileUpload.setWindowNode(app.getWindowNode());
                        fileUpload.create.offer(files, { folder: app.folder.get() });
                    });
                }
            });

            app.getWindowNode().append(
                zone.render().$el.addClass('abs')
            );
        }
    });
});
