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

define('io.ox/mail/compose/util', [
    'io.ox/mail/compose/api',
    'io.ox/mail/compose/resize',
    'io.ox/core/api/quota',
    'io.ox/core/capabilities',
    'io.ox/core/yell',
    'settings!io.ox/mail',
    'settings!io.ox/files',
    'gettext!io.ox/mail'
], function (composeAPI, resize, quotaAPI, capabilities, yell, settings, fileSettings, gt) {

    'use strict';

    var accumulate = function (list) {
        return list.reduce(function (memo, item) {
            if (!item) return memo;
            // duck check
            var model = typeof item.get === 'function' ? item : undefined;
            if (!model) return memo + (item.file_size >= 0 ? item.file_size : 0);
            if (model.get('contentDisposition') === 'INLINE') return memo;
            if (model.get('origin') === 'VCARD') return memo;
            return memo + model.getSize();
        }, 0);
    };

    var util = {

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
                        // only abort when uploaded is less than 1. Otherwise, the MW might not receive the abort signal in time
                        if (def && def.state() === 'pending' && attachment.get('uploaded') < 1 && attachment.id) def.abort();

                        data = { file: image };
                        if (!def) return;

                        def.always(function () {
                            _.defer(process);
                        });
                    });

                    attachment.on('force:upload', process);

                    initPendingUploadingAttachments();
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
        },

        handleExceedingLimits: function (model, attachments, files) {
            var result = {};
            var sharedAttachments = model.get('sharedAttachments') || {};
            var isSharingEnabled = !_.device('smartphone') && settings.get('compose/shareAttachments/enabled', false) && capabilities.has('infostore');
            var needsAction = isSharingEnabled && (util.exceedsMailQuota(attachments, files) || util.exceedsThreshold(attachments));

            if (!needsAction || sharedAttachments.enabled) return;

            // #. %1$s is usually "Drive Mail" (product name; might be customized)
            result.error = gt('Mail quota limit reached. You have to use %1$s or reduce the mail size in some other way.', settings.get('compose/shareAttachments/name'));

            if (isSharingEnabled && needsAction && !sharedAttachments.enabled) {
                model.set('sharedAttachments', _.extend({}, sharedAttachments, { enabled: true }));
            }
            yell('info', result.error);
        },

        exceedsMailQuota: function (attachments, files) {
            var actualAttachmentSize = (accumulate([].concat(attachments, files))) * 2;
            var mailQuota = quotaAPI.mailQuota.get('quota');
            var use = quotaAPI.mailQuota.get('use');
            if (mailQuota === -1 || mailQuota === -1024) return false;
            return actualAttachmentSize > mailQuota - use;
        },

        exceedsThreshold: function (attachments) {
            var threshold = settings.get('compose/shareAttachments/threshold', 0);
            if (threshold <= 0) return false;
            var actualAttachmentSize = accumulate([].concat(attachments));
            return actualAttachmentSize > threshold;
        }
    };
    return util;
});
