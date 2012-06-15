/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/edit/model-conflict',
      ['io.ox/calendar/edit/model-appointment',
       'io.ox/calendar/edit/collection-participants',
       'io.ox/calendar/api',
       'gettext!io.ox/calendar/edit/main'], function (AppointmentModel, ParticipantsCollection, CalendarAPI, gt) {

    'use strict';

    var ConflictModel = AppointmentModel.extend({
        initialize: function () {
            var self = this,
                conflicting_participants = new ParticipantsCollection(self.get('participants'));
            self.set('conflicting_participants', conflicting_participants);
        },
        fetch: function (options) {
            var self = this,
                df = new $.Deferred();

            CalendarAPI.get(options)
                .done(function (data) {
                    if (data.data) {
                        data.data.conflicting_participants = self.get('conflicting_participants');
                        self.set(data.data);
                        df.resolve(self, data);
                    } else if (data.error) {
                        if (data.error.categories === 'PERMISSION_DENIED') {
                            self.set('title', gt('Unknown'));
                            self.set('location', gt('No read permission!'));
                            df.resolve(self, data);
                            //self.set('additional_info', [gt('Permission denied, this appointment is private.')]);
                        }
                    }
                })
                .fail(function (err) {
                    df.reject(self, err);
                });

            return df;
        }
    });

    return ConflictModel;
});
