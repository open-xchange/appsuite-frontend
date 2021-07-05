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

define('io.ox/mail/actions/addToPortal', [
    'io.ox/core/notifications',
    'io.ox/portal/widgets',
    'gettext!io.ox/mail'
], function (notifications, widgets, gt) {

    'use strict';

    return function (baton) {
        var data = baton.first();
        // using baton.data.parent if previewing during compose (forward mail as attachment)
        widgets.add('stickymail', {
            plugin: 'mail',
            props: $.extend({
                id: data.id,
                folder_id: data.folder_id,
                title: data.subject ? data.subject : gt('No subject')
            }, data.parent || {})
        });
        notifications.yell('success', gt('This email has been added to the portal'));
    };
});
