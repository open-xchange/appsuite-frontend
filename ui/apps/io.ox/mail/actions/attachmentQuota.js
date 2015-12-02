/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/mail/actions/attachmentQuota', [
    'io.ox/core/tk/dialogs',
    'io.ox/core/notifications',
    'io.ox/core/strings',
    'settings!io.ox/core',
    'gettext!io.ox/mail'
], function (dialogs, notifications, strings, coreSettings, gt) {

    'use strict';

    function checkQuota(file, accumulatedSize) {
        var list = file,
            properties = coreSettings.get('properties'),
            total = accumulatedSize || 0,
            maxFileSize,
            quota,
            usage,
            autoPublish = require('io.ox/core/capabilities').has('publish_mail_attachments'),
            result = {};

        if (!list.length) return;

        maxFileSize = autoPublish ? -1 : properties.attachmentQuotaPerFile;
        quota = autoPublish ? -1 : properties.attachmentQuota;
        usage = 0;

        _.find(list, function (item) {
            var fileTitle = item.filename || item.name || item.subject,
                fileSize = item.file_size || item.size;

            if (fileSize) {
                total += fileSize;

                if (quota > 0 && total > quota) {
                    result.error = gt('The file "%1$s" cannot be uploaded because it exceeds the maximum file size of %2$s', fileTitle, strings.fileSize(quota));
                    result.reason = 'filesize';
                    return true;
                }

                if (maxFileSize > 0 && fileSize > maxFileSize) {
                    result.error = gt('The file "%1$s" cannot be uploaded because it exceeds the maximum file size of %2$s', fileTitle, strings.fileSize(maxFileSize));
                    result.reason = 'filesize';
                    return true;
                }
                if (autoPublish) {
                    if (properties.infostoreMaxUploadSize > 0 && fileSize > properties.infostoreMaxUploadSize) {
                        result.error = gt('The file "%1$s" cannot be uploaded because it exceeds the attachment publication maximum file size of %2$s', fileTitle, strings.fileSize(properties.infostoreMaxUploadSize));
                        result.reason = 'filesizeAutoPublish';
                        return true;
                    }
                    if (properties.infostoreQuota > 0 && (total > (properties.infostoreQuota - properties.infostoreUsage))) {
                        result.error = gt('The file "%1$s" cannot be uploaded because it exceeds the infostore quota limit of %2$s', fileTitle, strings.fileSize(properties.infostoreQuota));
                        result.reason = 'quotaAutoPublish';
                        return true;
                    }
                }
            }
        });

        if (result.error) {
            notifications.yell('error', result.error);
            return false;
        }
        return true;
    }

    function attachmentsExceedQuota(files) {
        var allAttachmentsSizes = [].concat(files).map(function (m) { return m.size || 0; }),
            quota = coreSettings.get('properties/attachmentQuota', 0),
            accumulatedSize = allAttachmentsSizes
                .reduce(function (acc, size) {
                    return acc + size;
                }, 0),
            singleFileExceedsQuota = allAttachmentsSizes
                .reduce(function (acc, size) {
                    var quotaPerFile = coreSettings.get('properties/attachmentQuotaPerFile', 0);
                    return acc || (quotaPerFile > 0 && size > quotaPerFile);
                }, false);
        return singleFileExceedsQuota || (quota > 0 && accumulatedSize > quota);
    }

    function publishMailAttachmentsNotification(files) {
        var def = new $.Deferred();
        if (require('io.ox/core/capabilities').has('publish_mail_attachments') && attachmentsExceedQuota(files)) {
            notifications.yell({
                type: 'info',
                message: gt(
                    'One or more attached files exceed the size limit per email. ' +
                    'Therefore, the files are not sent as attachments but kept on the server. ' +
                    'The email you have sent just contains links to download these files.'
                ),
                duration: 30000
            });
        }
        def.resolve();
        return def;
    }

    return {
        publishMailAttachmentsNotification: publishMailAttachmentsNotification,
        checkQuota: checkQuota
    };
});
