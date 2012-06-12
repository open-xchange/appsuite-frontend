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
      ['io.ox/calendar/api',
       'io.ox/core/date',
       'gettext!io.ox/calendar/edit/main'], function (CalendarAPI, dateAPI, gt) {

    'use strict';

    var defStart = new dateAPI.Local();
    var defEnd = new dateAPI.Local();
    defStart.setMinutes(0);
    defStart.setHours(defStart.getHours() + 1);
    defEnd.setMinutes(0);
    defEnd.setHours(defEnd.getHours() + 2);


    var AppointmentModel = Backbone.Model.extend({
        validation: {
            title: {
                required: true,
                msg: gt('You must specify a title')
            },
            start_date: [{
                required: true,
                pattern: 'number',
                msg: gt('You must enter a valid date/time.')
            }, {
                smallerThan: 'end_date',
                msg: gt('Start date must be  than end-date.')
            }],
            end_date: [{
                required: true,
                pattern: 'number',
                msg: gt('You must enter a valid date/time.')
            }, {
                greaterThan: 'start_date',
                msg: gt('End date must be greater than start-date')
            }]
        },
        defaults: {
            start_date: dateAPI.Local.localTime(defStart.getTime()),
            end_date: dateAPI.Local.localTime(defEnd.getTime()),
            recurrence_type: 0
        },
        initialize: function () {
            this.toSync = {}; //no proto?
            this.on('change', _.bind(this.onChange, this));
        },

        save: function () {
            var self = this,
                df = new $.Deferred();

            self.validate();

            if (self.isDirty() && !self.isNew() && self.isValid()) {
                return self._update();
            } else if (self.isDirty() && self.isNew() && self.isValid()) {
                return self._create();
            } else if (!self.isValid()) {
                df.reject('Please correct your inputs');
                return df;
            } else {
                df.reject('Nothing to save');
                return df;
            }
        },
        _update: function () {
            var self = this,
                o = {},
                df = new $.Deferred();

            o = self.toSync;
            o = self.attributes; //TODO: just everything over the air, fix that

            // set recurrence_type if it was set
            if (self.get('recurrence_type')) {
                o.recurrence_type = self.get('recurrence_type');

                // none recurrence
                if (o.recurrence_type === 0) {
                    delete o.recurrence_id;
                    self.unset('recurrence_id');
                }
            }

            CalendarAPI.update(o)
                .done(function (data) {
                    self._resetDirty();
                    self.attributes = data;
                    df.resolve(data);

                })
                .fail(function () {
                    df.reject('error on update model on server');
                });

            return df;
        },

        _create: function () {
            var self = this,
                o = {},
                df = new $.Deferred();

            o = self.attributes;
            CalendarAPI.create(o)
                .done(function (data) {
                    self._resetDirty();
                    self.attributes = data;
                    df.resolve(data);
                })
                .fail(function (err) {
                    df.reject(err);
                });

            return df;
        },
        // Backbone API for deleting objects on server
        destroy: function () {
            var self = this,
                o = {},
                df = new $.Deferred();

            o.data = self.attributes;

            // set recurrence_type if it was set
            if (self.get('recurrence_type')) {
                o.data.recurrence_type = self.get('recurrence_type');
                // none recurrenc
                if (o.data.recurrence_type === 0) {
                    delete o.data.recurrence_id;
                    self.unset('recurrence_id');
                }
            }

            o.data.folder = self.get('folder_id');

            CalendarAPI.remove(o)
                .done(function () {
                    self._resetDirty();
                    df.resolve(true);
                })
                .fail(function (err) {
                    df.reject('error on creating model');
                });

            return df;
        },
        onChange: function (model, source) {
            var self = this;

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
