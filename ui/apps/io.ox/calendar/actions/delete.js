/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/calendar/actions/delete', [
    'io.ox/calendar/api',
    'io.ox/core/notifications',
    'gettext!io.ox/calendar'
], function (api, notifications, gt) {

    'use strict';

    return function (list) {

        var apiCalls = [];

        // build array with full identifier for an appointment and collect API get calls
        _(list).each(function (obj) {
            var o = {
                id: obj.id,
                folder: obj.folder_id
            };
            if (!!obj.recurrence_position) {
                o.recurrence_position = obj.recurrence_position;
            }

            apiCalls.push(api.get(o));
        });

        $.when.apply($, apiCalls)
            .pipe(function () {
                return _.chain(arguments)
                    .flatten(true)
                    .filter(function (app) {
                        return _.isObject(app);
                    }).value();
            })
            .then(function (appList) {

                // check if appointment list contains recurring appointments
                var hasRec = _(appList).some(function (app) {
                    return app.recurrence_type > 0;
                });

                ox.load(['io.ox/core/tk/dialogs']).done(function (dialogs) {

                    var cont = function (series) {
                        var data = _(appList).chain().map(function (obj) {
                            var options = {
                                id: obj.id,
                                folder: obj.folder_id || obj.folder
                            };
                            if (!series && obj.recurrence_position) {
                                _.extend(options, { recurrence_position: obj.recurrence_position });
                            }
                            return options;
                        }).uniq(function (obj) {
                            return JSON.stringify(obj);
                        }).value();
                        api.remove(data).fail(notifications.yell);
                    };

                    // different warnings especially for events with
                    // recurrence_type > 0 should handled here
                    if (hasRec) {
                        new dialogs.ModalDialog()
                            .text(gt('Do you want to delete the whole series or just one appointment within the series?'))
                            .addPrimaryButton('appointment', gt('Delete appointment'), 'appointment', { tabIndex: 1 })
                            .addPrimaryButton('series', gt('Delete whole series'), 'series', { tabIndex: 1 })
                            .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                            .show()
                            .done(function (action) {
                                if (action === 'cancel') {
                                    return;
                                }
                                cont(action === 'series');
                            });
                    } else {
                        new dialogs.ModalDialog()
                            .text(gt('Do you want to delete this appointment?'))
                            .addPrimaryButton('ok', gt('Delete'), 'ok', { tabIndex: 1 })
                            .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                            .show()
                            .done(function (action) {
                                if (action === 'cancel') {
                                    return;
                                }
                                cont();
                            });
                    }
                });
            });
    };

});
