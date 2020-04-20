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
    'io.ox/mail/compose/resize',
    'settings!io.ox/mail'
], function (composeAPI, resize, settings) {

    'use strict';

    return {

        getGroup: function (data) {
            if (data.origin === 'drive') return 'file';
            return 'mail';
        },

        uploadAttachment: function (opt) {
            var model = opt.model,
                space = model.get('id'),
                contentDisposition = (opt.contentDisposition || 'attachment').toLowerCase(),
                attachment = opt.attachment,
                data = opt.origin,
                def,
                instantAttachmentUpload = settings.get('features/instantAttachmentUpload', true) || contentDisposition === 'inline';

            function process() {
                if (!data) return;
                if (instantAttachmentUpload === false) return;

                def = composeAPI.space.attachments[attachment.has('id') ? 'update' : 'add'](space, data, contentDisposition, attachment.get('id'));
                data = undefined;

                attachment.set('uploaded', 0);

                return def.progress(function (e) {
                    attachment.set('uploaded', Math.min(e.loaded / e.total, 0.999));
                }).then(function success(data) {
                    data = _({ group: 'mail', space: space, uploaded: 1 }).extend(data);
                    attachment.set(data);
                    // trigger is important, extensionpoint cascade on save needs it to resolve or fail correctly.
                    attachment.trigger('upload:complete', data);
                }, function fail(error) {
                    if (error.error === 'abort') return;
                    // trigger is important, extensionpoint cascade on save needs it to resolve or fail correctly.
                    attachment.trigger('upload:failed', error);
                    // yell error, magically disappearing attachments are bad ux (some quota errors can even be solved by users)
                    require(['io.ox/core/yell'], function (yell) {
                        yell(error);
                    });
                    attachment.destroy();
                }).always(process);
            }


            if (data.file && contentDisposition === 'attachment') {
                attachment.set({
                    group: 'localFile',
                    originalFile: data.file
                });
                var isResizableImage = resize.matches('type', data.file) &&
                    resize.matches('size', data.file) &&
                    instantAttachmentUpload !== false;

                attachment.on('destroy', function () {
                    data = undefined;
                    if (def && def.state() === 'pending') def.abort();
                });

                if (isResizableImage) {
                    attachment.set('uploaded', 0);

                    attachment.on('image:resized', function (image) {
                        // only abort when uploaded is less than 1. Otherwise, the MW might not receive the abort signal in time
                        if (def && def.state() === 'pending' && attachment.get('uploaded') < 1) def.abort();

                        data = { file: image };
                        if (!def) return;

                        def.always(function () {
                            _.defer(process);
                        });
                    });

                    attachment.on('force:upload', process);

                    return _.delay(process, 5000);
                }
            }

            return _.defer(process);
        }

    };

});
