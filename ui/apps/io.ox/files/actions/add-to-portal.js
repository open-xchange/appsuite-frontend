/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/actions/add-to-portal', [
    'io.ox/portal/widgets',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (widgets, notifications, gt) {

    'use strict';

    var message = gt('This file has been added to the portal');

    return function (data) {
        widgets.add('stickyfile', {
            plugin: 'files',
            props: {
                id: data.id,
                folder_id: data.folder_id,
                title: data.filename || data.title
            }
        });
        notifications.yell('success', message);
    };
});
