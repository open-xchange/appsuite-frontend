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

define('io.ox/files/actions/lock-unlock', [
    'io.ox/files/api',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (api, notifications, gt) {

    'use strict';

    return {
        lock: function (list) {
            api.lock(list).done(function () {
                notifications.yell('success', gt.ngettext(
                    'This file has been locked',
                    'These files have been locked',
                    list.length
                ));
            }).fail(function () {
                notifications.yell('error', gt.ngettext(
                    'This file has not been locked',
                    'These files have not been locked',
                    list.length
                ));
            });
        },
        unlock: function (list) {
            api.unlock(list).done(function () {
                notifications.yell('success', gt.ngettext(
                    'This file has been unlocked',
                    'These files have been unlocked',
                    list.length
                ));
            }).fail(function () {
                notifications.yell('error', gt.ngettext(
                    'This file has not been unlocked',
                    'These files have not been unlocked',
                    list.length
                ));
            });
        }
    };
});
