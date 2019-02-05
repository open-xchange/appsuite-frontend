/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/mail/compose/util', [
    'io.ox/mail/compose/api',
    'io.ox/mail/compose/resize'
], function (composeAPI, resize) {

    'use strict';

    return {

        getGroup: function (origin) {
            if (origin.origin === 'drive') return 'file';
            return 'mail';
        },

        uploadAttachment: function (opt) {
            var model = opt.model,
                space = model.get('id'),
                origin = opt.origin,
                contentDisposition = (opt.contentDisposition || 'attachment').toLowerCase(),
                attachment = opt.attachment,
                throttled = _.throttle(upload, 5000, { leading: false }),
                def;

            function upload(origin) {
                // reset debouncedupload to upload to not postpone any future execution
                throttled = upload;

                // if attachment is not in a collection, it has been removed before it has been uploaded
                if (!attachment.collection) return;

                attachment.set('uploaded', 0);

                // need exactly this deferred to be able to abort
                def = composeAPI.space.attachments[attachment.has('id') ? 'update' : 'add'](space, origin, contentDisposition, attachment.get('id'));
                def.progress(function (e) {
                    attachment.set('uploaded', e.loaded / e.total);
                }).then(function success(data) {
                    data = _({ group: 'mail', space: space }).extend(data);
                    attachment.set(data);
                    attachment.trigger('upload:complete', data);
                }, function fail(error) {
                    if (error.error === 'abort') return;
                    attachment.destroy();
                });
                return def;
            }

            if (origin.file && contentDisposition === 'attachment') {
                attachment.set({
                    group: 'localFile',
                    originalFile: origin.file
                });
                if (resize.isResizableImage(origin.file)) {
                    attachment.set('uploaded', 0);

                    attachment.on('image:resized', function (image) {
                        if (def && def.state() === 'pending') def.abort();

                        origin = { file: image };
                        throttled(origin);
                    });

                    attachment.on('force:upload', function () {
                        // only trigger immediate upload
                        if (def) return;
                        throttled.cancel();
                        upload(origin);
                    });

                    attachment.on('abort:upload', function () {
                        if (throttled.cancel) throttled.cancel();
                        if (def && def.state() === 'pending') def.abort();
                    });

                    return throttled(origin);
                }
            }

            return _.defer(upload, origin);
        }

    };

});
