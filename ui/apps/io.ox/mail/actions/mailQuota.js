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

define('io.ox/mail/actions/mailQuota', [
    'io.ox/core/notifications',
    'settings!io.ox/mail',
    'io.ox/core/capabilities',
    'gettext!io.ox/mail'
], function (notifications, settings, capabilities, gt) {

    'use strict';

    function handleExceedingLimits(model, files) {
        var result = {},
            sharedAttachments = model.get('sharedAttachments') || {},
            isSharingEnabled = !_.device('smartphone') && settings.get('compose/shareAttachments/enabled', false) && capabilities.has('infostore'),
            needsAction = isSharingEnabled && (model.exceedsMailQuota(files) || model.exceedsThreshold());

        if (!needsAction || sharedAttachments.enabled) return;

        //#. %1$s is usually "Drive Mail" (product name; might be customized)
        result.error = gt('Mail quota limit reached. You have to use %1$s or reduce the mail size in some other way.', settings.get('compose/shareAttachments/name'));

        if (isSharingEnabled && needsAction && !sharedAttachments.enabled) {
            model.set('sharedAttachments', _.extend({}, sharedAttachments, { enabled: true }));
        }
        notifications.yell('info', result.error);
    }

    return {
        handleExceedingLimits: handleExceedingLimits
    };
});
