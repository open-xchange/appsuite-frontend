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

define('io.ox/calendar/actions/delete', [
    'io.ox/calendar/api',
    'io.ox/core/notifications',
    'gettext!io.ox/calendar'
], function (api, notifications, gt) {

    'use strict';

    return function (list) {
        ox.load(['io.ox/core/tk/dialogs']).done(function (dialogs) {

            var cont = function (series) {

                list = _(list).chain().map(function (obj) {
                    obj = obj instanceof Backbone.Model ? obj.attributes() : obj;
                    var options = {
                        id: obj.id,
                        folder: obj.folder
                    };
                    // if the whole series should be deleted, don't send the recurrenceId.
                    if (!series && obj.recurrenceId) {
                        options.recurrenceId = obj.recurrenceId;
                    }
                    return options;
                })
                .uniq(function (obj) {
                    return JSON.stringify(obj);
                }).value();

                api.remove(list).fail(notifications.yell);
            };

            var hasSeries = _(list).some(function (app) {
                app = app instanceof Backbone.Model ? app.attributes : app;
                return app.recurrenceId && app.id === app.seriesId;
            });
            if (hasSeries) {
                new dialogs.ModalDialog()
                    .text(gt('Do you want to delete the whole series or just one appointment within the series?'))
                    .addPrimaryButton('series', gt('Series'), 'series')
                    .addButton('appointment', gt('Appointment'), 'appointment')
                    .addButton('cancel', gt('Cancel'), 'cancel')
                    .show()
                    .done(function (action) {
                        if (action === 'cancel') return;
                        cont(action === 'series');
                    });
            } else {
                new dialogs.ModalDialog()
                    .text(gt('Do you want to delete this appointment?'))
                    .addPrimaryButton('ok', gt('Delete'), 'ok')
                    .addButton('cancel', gt('Cancel'), 'cancel')
                    .show()
                    .done(function (action) {
                        if (action === 'cancel') return;
                        cont();
                    });
            }
        });
    };

});
