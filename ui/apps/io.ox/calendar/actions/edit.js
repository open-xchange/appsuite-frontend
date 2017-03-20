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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/calendar/actions/edit', [
    'io.ox/calendar/edit/main',
    'io.ox/calendar/api',
    'io.ox/core/notifications',
    'io.ox/calendar/util'
], function (m, api, notifications, util) {

    'use strict';

    return function (baton) {
        var params = baton.data,
            o = {
                id: params.id,
                folder: params.folder_id
            };

        if (!!params.recurrence_position) {
            o.recurrence_position = params.recurrence_position;
        }

        if (params.recurrence_type > 0 || params.recurrence_position) {
            util.getRecurrenceEditDialog()
                .show()
                .done(function (action) {

                    if (action === 'cancel') {
                        return;
                    }
                    if (action === 'series') {
                        // edit the series, discard recurrence position
                        if (params.recurrence_id) {
                            o.id = params.recurrence_id;
                        }
                        delete o.recurrence_position;
                    }

                    // disable cache with second param
                    api.get(o, false).then(
                        function (data) {
                            if (m.reuse('edit', data, { action: action })) return;
                            m.getApp().launch().done(function () {
                                if (action === 'appointment') {
                                    data = api.removeRecurrenceInformation(data);
                                }
                                this.edit(data, { action: action });
                            });
                        },
                        notifications.yell
                    );
                });

        } else {
            api.get(o, false).then(
                function (data) {
                    if (m.reuse('edit', data)) return;
                    m.getApp().launch().done(function () {
                        this.edit(data);
                    });
                },
                notifications.yell
            );
        }
    };

});
