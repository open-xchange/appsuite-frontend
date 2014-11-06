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
    'io.ox/files/legacy_api',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (api, notifications, gt) {

    'use strict';

    function getMessages (type) {
        var plural = (type === 'multiple');
        return {
            lockSuccess: gt.ngettext(
                'This file has been locked',
                'These files have been locked',
                plural
            ),
            lockFail: gt.ngettext(
                'This file has not been locked',
                'These files have not been locked',
                plural
            ),
            unlockSuccess: gt.ngettext(
                'This file has been unlocked',
                'These files have been unlocked',
                plural
            ),
            unlockFail: gt.ngettext(
                'This file has not been unlocked',
                'These files have not been unlocked',
                plural
            )
        };
    }

    // store labels once
    var single = getMessages('single'),
        multiple = getMessages('multiple');

    return {
        lock: function (list) {
            var messages = list.length ? single : multiple;
            api.lock(list).done(function () {
                notifications.yell('success', messages.lockSuccess );
            }).fail(function () {
                notifications.yell('error', messages.lockFail);
            });
        },
        unlock: function (list) {
            var messages = list.length ? single : multiple;
            api.unlock(list).done(function () {
                notifications.yell('success', messages.unlockSuccess);
            }).fail(function () {
                notifications.yell('error', messages.unlockFail);
            });
        }
    };
});
