/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
