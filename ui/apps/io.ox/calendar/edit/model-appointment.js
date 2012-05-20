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

define('io.ox/calendar/edit/model-appointment',
      ['io.ox/calendar/edit/deps/Backbone',
       'io.ox/calendar/api'], function (Backbone, CalendarAPI) {

    'use strict';

    var AppointmentModel = Backbone.Model.extend({
        toSync: {},
        defaults: {
            start_date: new Date().getTime(),
            end_date: new Date().getTime(),
            recurrence_type: 0
        },
        initialize: function () {
            this.on('change', _.bind(this.onChange, this));
        },
        save: function () {
            var self = this;
            if (self.isDirty() && !self.isNew()) {
                return self._update();
            } else if (self.isDirty() && self.isNew()) {
                return self._create();
            }
        },
        _update: function () {
            var self = this,
                o = {},
                df = new $.Deferred();

            o.data = self.toSync;
            o.data = self.attributes; //TODO: just everything over the air

            o.data.ignore_conflicts = true; //just for debug

            // set recurrence_type if it was set
            if (self.get('recurrence_type')) {
                o.data.recurrence_type = self.get('recurrence_type');

                // none recurrenc
                if (o.data.recurrence_type === 0) {
                    delete o.data.recurrence_id;
                    self.unset('recurrence_id');
                }
            }

            // TODO: recurrence position should be handled
            o.id = self.get('id');
            o.folder = self.get('folder_id');
            o.timestamp = _.now();

            CalendarAPI.update(o)
                .done(function () {
                    console.log('ok');
                    console.log(arguments);
                    self._resetDirty();
                    df.resolve(true);

                })
                .fail(function () {
                    console.log('not ok');
                    console.log(arguments);
                    df.reject('error on update model on server');
                });

            return df;
        },

        _create: function () {
            var self = this,
                o = {},
                df = new $.Deferred();

            o.data = self.attributes;
            o.data.ignore_conflicts = true; //just for debug

            o.folder = self.get('folder_id');
            o.timestamp = _.now();

            CalendarAPI.create(o)
                .done(function () {
                    self._resetDirty();
                    console.log('ok');
                    df.resolve(true);
                })
                .fail(function (err) {
                    console.log('not ok');
                    console.log(err);
                    df.reject('error on creating model');
                });

            return df;
        },
        onChange: function (model, source) {
            var self = this;
            console.log('model changed');

            // silent business logic, modifing attributes and source
            // especially for recurrency
            if (self.get('recurrence_type') > 0) {
                source.changes.interval = true; //just to send this over the air everytime
            }

            if (self.get('recurrence_type') > 1) {
                source.changes.days = true; //pff
            }

            if (self.get('recurrence_type') >= 3) {
                source.changes.day_in_month = true;
            }

            _.each(source.changes, function (change, key) {
                self.toSync[key] = self.get(key);
            });
            console.log(arguments);
        },
        isDirty: function () {
            return _(this.toSync).size() > 0;
        },
        _resetDirty: function () {
            this.toSync = {};
        }
    });

    return AppointmentModel;
});
