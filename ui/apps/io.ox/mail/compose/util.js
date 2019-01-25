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
    'io.ox/core/attachments/backbone',
    'io.ox/mail/compose/api'
], function (Attachments, composeAPI) {

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
                def;

            function upload(origin) {
                attachment.set('uploaded', 0);

                // need exactly this deferred to be able to abort
                def = composeAPI.space.attachments.add(space, origin, contentDisposition);
                def.progress(function (e) {
                    attachment.set('uploaded', e.loaded / e.total);
                }).then(function success(data) {
                    data = _({ group: 'mail', space: space }).extend(data);
                    attachment.set(data);
                    attachment.trigger('upload:complete');
                }, function fail(error) {
                    if (error.error === 'abort') return;
                    attachment.destroy();
                });
                return def;
            }

            if (origin.file && contentDisposition !== 'inline') {
                attachment.set('originalFile', origin.file);
                attachment.on('image:resized', function (image) {
                    if (def.state() === 'pending') def.abort();
                    else composeAPI.space.attachments.remove(model.get('id'), attachment.get('id'));

                    def = upload({ file: image });
                });
            }

            return upload(origin);
        }

    };

});
