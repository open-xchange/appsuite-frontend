/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/mail/actions/attachmentQuota', [
    'io.ox/core/notifications',
    'io.ox/core/strings',
    'settings!io.ox/core',
    'gettext!io.ox/mail'
], function (notifications, strings, coreSettings, gt) {

    'use strict';

    function checkQuota(file, accumulatedSize) {
        var list = file,
            properties = coreSettings.get('properties'),
            total = accumulatedSize || 0,
            maxFileSize,
            quota,
            autoPublish = require('io.ox/core/capabilities').has('publish_mail_attachments'),
            result = {};

        if (!list.length) return;

        maxFileSize = autoPublish ? -1 : properties.attachmentQuotaPerFile;
        quota = autoPublish ? -1 : properties.attachmentQuota;

        _.find(list, function (item) {
            var fileTitle = item.filename || item.name || item.subject,
                fileSize = item.file_size || item.size;
            if (fileSize) {
                total += fileSize;

                if (quota > 0 && total > quota) {
                    result.error = gt('The file "%1$s" cannot be uploaded because it exceeds the total attachment size limit of %2$s', fileTitle, strings.fileSize(quota));
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

    return {
        checkQuota: checkQuota
    };
});
