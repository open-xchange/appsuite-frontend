/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/mail/compose/util', [
    'io.ox/mail/compose/api',
    'io.ox/mail/compose/resize',
    'settings!io.ox/mail',
    'settings!io.ox/files'
], function (composeAPI, resize, settings, fileSettings) {

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

            function initPendingUploadingAttachments() {
                model.pendingUploadingAttachments = model.pendingUploadingAttachments.catch(_.constant()).then((function () {
                    var def = new $.Deferred();
                    attachment.once('upload:complete', def.resolve);
                    attachment.once('upload:aborted', def.resolve);
                    attachment.once('upload:failed', def.reject);
                    return _.constant(def);
                })());
            }

            function process() {
                if (!data) return;
                if (instantAttachmentUpload === false) return;

                initPendingUploadingAttachments();

                def = composeAPI.space.attachments[attachment.has('id') ? 'update' : 'add'](space, data, contentDisposition, attachment.get('id'));
                data = undefined;

                attachment.set('uploaded', 0);

                return def.progress(function (e) {
                    attachment.set('uploaded', Math.min(e.loaded / e.total, 0.999));
                }).then(function success(data) {
                    if (attachment.destroyed) {
                        var attachmentDef = composeAPI.space.attachments.remove(model.id, data.id);
                        model.pendingDeletedAttachments = model.pendingDeletedAttachments.catch(_.constant()).then(function () {
                            return attachmentDef;
                        });
                    }
                    data = _({ group: 'mail', space: space, uploaded: 1 }).extend(data);
                    attachment.set(data);
                    // trigger is important, extensionpoint cascade on save needs it to resolve or fail correctly.
                    attachment.trigger('upload:complete', data);
                }, function fail(error) {
                    if (error.error === 'abort') return attachment.trigger('upload:aborted');
                    // trigger is important, extensionpoint cascade on save needs it to resolve or fail correctly.
                    attachment.trigger('upload:failed', error);
                    // yell error, magically disappearing attachments are bad ux (some quota errors can even be solved by users)
                    require(['io.ox/core/yell'], function (yell) {
                        yell(error);
                    });
                    attachment.destroy();
                }).always(function () {
                    delete attachment.done;
                    process();
                });
            }

            // is handled either when user removes the attachment or composition space is discarded
            attachment.on('destroy', function () {
                data = undefined;
                this.destroyed = true;
                if (def && def.state() === 'pending' && !fileSettings.get('uploadSpooling')) def.abort();
                else if (!def) attachment.trigger('upload:aborted');
            });
            attachment.done = def;

            if (data.file && contentDisposition === 'attachment') {
                attachment.set({
                    group: 'localFile',
                    originalFile: data.file
                });
                var isResizableImage = resize.matches('type', data.file) &&
                    resize.matches('size', data.file) &&
                    instantAttachmentUpload !== false;

                if (isResizableImage) {
                    attachment.set('uploaded', 0);

                    attachment.on('image:resized', function (image) {
                        // only abort when uploaded is less than 0.998. Otherwise, the MW might not receive the abort signal in time
                        if (def && def.state() === 'pending' && attachment.get('uploaded') < 0.998) def.abort();

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
        },

        infoLine: function (opt) {
            return $('<div class="info-line">').append(
                opt.icon ? $('<i class="fa" aria-hidden="true">').addClass(opt.icon) : $(),
                $('<span class="text">').append(
                    $.txt(opt.text)
                )
            );
        }
    };

});
