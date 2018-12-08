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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/actions/doneUndone', [
    'io.ox/tasks/api',
    'gettext!io.ox/tasks',
    'io.ox/core/notifications'
], function (api, gt, notifications) {

    'use strict';

    return function (data, state) {

        var mods, message;

        if (state === 3) {
            mods = {
                status: 1,
                percent_completed: 0,
                date_completed: null
            };
            message = gt.ngettext('Task marked as undone', 'Tasks marked as undone', data.length);
        } else {
            mods = {
                status: 3,
                percent_completed: 100,
                date_completed: _.now()
            };
            message = gt.ngettext('Task marked as done', 'Tasks marked as done', data.length);
        }

        api.updateMultiple(data, mods).then(
            function () {
                _(data).each(function (item) {
                    api.trigger('update:' + _.ecid(item));
                });
                notifications.yell('success', message);
            },
            function (result) {
                notifications.yell('error', result);
            }
        );
    };
});
