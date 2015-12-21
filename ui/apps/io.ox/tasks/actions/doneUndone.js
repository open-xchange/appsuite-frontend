/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/actions/doneUndone', [
    'gettext!io.ox/tasks',
    'io.ox/core/notifications'
], function (gt, notifications) {

    'use strict';

    return function (baton, state) {
        var mods,
            message,
            data = baton.data;

        if (state === 3) {
            mods = {
                status: 1,
                percent_completed: 0,
                date_completed: null
            };
            message = gt.ngettext('Task marked as undone',
                                  'Tasks marked as undone', data.length || 1);
        } else {
            mods = {
                status: 3,
                percent_completed: 100,
                date_completed: _.now()
            };
            message = gt.ngettext('Task marked as done',
                                  'Tasks marked as done', data.length || 1);
        }
        require(['io.ox/tasks/api'], function (api) {
            if (data.length > 1) {
                api.updateMultiple(data, mods)
                    .done(function () {
                        _(data).each(function (item) {
                            //update detailview
                            api.trigger('update:' + _.ecid(item));
                        });

                        notifications.yell('success', message);
                    })
                    .fail(function (result) {
                        notifications.yell('error', gt.noI18n(result));
                    });
            } else {
                if (_.isArray(data)) data = data[0];
                mods.id = data.id;
                mods.folder_id = data.folder_id || data.folder;
                api.update(mods)
                    .done(function () {
                        notifications.yell('success', message);
                    })
                    .fail(function (result) {
                        var errorMsg = gt('A severe error occurred!');
                        if (result.code === 'TSK-0007') {
                            //task was modified before
                            errorMsg = gt('Task was modified before, please reload');
                        }
                        notifications.yell('error', errorMsg);
                    });
            }
        });
    };
});
