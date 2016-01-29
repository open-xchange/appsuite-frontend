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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/calendar/model', [
    'io.ox/calendar/api',
    'io.ox/core/extensions',
    'io.ox/backbone/extendedModel',
    'gettext!io.ox/calendar',
    'io.ox/backbone/validation',
    'io.ox/participants/model',
    'io.ox/core/folder/api',
    'settings!io.ox/calendar',
    'settings!io.ox/core'
], function (api, ext, extendedModel, gt, Validators, pModel, folderAPI, settings, coreSettings) {

    'use strict';

    var RECURRENCE_FIELDS = 'recurrence_type interval days day_in_month month until occurrences'.split(' ');

    var model = extendedModel.extend({

        idAttribute: 'id',
        ref: 'io.ox/calendar/model/',
        api: api,
        defaults: {
            recurrence_type: 0,
            notification: true,
            shown_as: 1,
            timezone: coreSettings.get('timezone'),
            endTimezone: coreSettings.get('timezone')
        },

        init: function () {

            var m = moment().startOf('hour').add(1, 'hours'),
                defStart = m.valueOf(),
                defEnd = m.add(1, 'hours').valueOf();

            // set default time
            this.attributes = _.extend({
                start_date: defStart,
                end_date: defEnd
            }, this.attributes);

            // End date automatically shifts with start date
            var length = this.get('end_date') - this.get('start_date');

            // internal storage for last timestamps
            this.cache = {
                start: this.get('full_time') ? defStart : this.get('start_date'),
                end: this.get('full_time') ? defEnd : this.get('end_date')
            };

            // overwrites model.cid with our _.cid
            this.cid = this.attributes.cid = _.cid(this.attributes);

            // bind events
            this.on({

                'create:fail update:fail': function (response) {
                    if (response.conflicts) {
                        this.trigger('conflicts', response.conflicts);
                    }
                },

                'change:start_date': function (model, startDate) {
                    if (length < 0) return;
                    if (startDate && _.isNumber(length)) {
                        model.set('end_date', startDate + length, { validate: true });
                    }
                },

                // 'change:end_date': function (model, endDate) { },
                //
                // We DO NOT anything else if the length gets negative
                //
                // Actually you have three major optons
                // 1. shift the start_date to keep the current length
                // 2. shift the start_date for example 1 hour before the new end date (OX6)
                // 3. do nothing so that the user recognizes that the start date has also changed
                //
                // We could show a hint right away but this is here is still rocket science
                // and triggering a simple validation seems impossible.
                // Therefore TODO: completely rewrite this whole model-validaten-magic!

                'change:full_time': function (model, fulltime) {
                    // handle shown as
                    if (settings.get('markFulltimeAppointmentsAsFree', false)) {
                        model.set('shown_as', fulltime ? 4 : 1, { validate: true });
                    }

                    var startDate, endDate;

                    if (fulltime === true) {
                        // save to cache, convert to UTC and save
                        startDate = moment(this.cache.start = model.get('start_date')).startOf('day').utc(true).valueOf();
                        endDate = moment(this.cache.end = model.get('end_date')).startOf('day').add(1, 'day').utc(true).valueOf();
                    } else {
                        var oldStart = moment(this.cache.start),
                            oldEnd = moment(this.cache.end);

                        // save to cache
                        this.cache.start = moment.utc(model.get('start_date')).local(true).valueOf();
                        this.cache.end = moment.utc(model.get('end_date')).local(true).valueOf();

                        // handle time
                        startDate = moment(this.cache.start).startOf('day').hours(oldStart.hours()).minutes(oldStart.minutes()).valueOf();
                        endDate = moment(this.cache.end).startOf('day').hours(oldEnd.hours()).minutes(oldEnd.minutes()).subtract(1, 'day').valueOf();
                    }
                    // save
                    length = endDate - startDate;
                    model.set('start_date', startDate, { validate: true });
                    model.set('end_date', endDate, { validate: true });
                }
            });
        },

        // special get function for datepicker
        getDate: function (attr) {
            var time = this.get.apply(this, arguments);
            if (this.get('full_time')) {
                time = moment.utc(time).local(true);
                // fake end date for datepicker
                if (attr === 'end_date') {
                    time.subtract(1, 'day');
                }
                time = time.valueOf();
            }
            return time;
        },

        // special set function for datepicker
        setDate: function (attr, time) {
            if (this.get('full_time')) {
                time = moment(time);
                // fix fake end date for model
                if (attr === 'end_date') {
                    time.add(1, 'day');
                }
                arguments[1] = time.utc(true).valueOf();
            }
            return this.set.apply(this, arguments);
        },

        getParticipants: function () {
            if (this._participants) {
                return this._participants;
            }
            var self = this,
                resetListUpdate = false,
                changeParticipantsUpdate = false;

            this._participants = new pModel.Participants(this.get('participants'), { silent: false });

            this._participants.on('add remove reset', function () {
                if (changeParticipantsUpdate) {
                    return;
                }
                resetListUpdate = true;
                self.set('participants', this.getAPIData(), { validate: true });
                resetListUpdate = false;
            });

            this.on('change:participants', function () {
                if (resetListUpdate) {
                    return;
                }
                changeParticipantsUpdate = true;
                self._participants.reset(self.get('participants'));
                changeParticipantsUpdate = false;
            });
            return this._participants;
        },

        setDefaultParticipants: function (options) {
            var self = this;
            return folderAPI.get(this.get('folder_id')).then(function (folder) {
                if (folderAPI.is('private', folder)) {
                    if (options.create) {
                        // if private folder, current user will be the organizer
                        self.set('organizerId', ox.user_id);
                        self.getParticipants().add({ id: ox.user_id, type: 1 });
                    }
                } else if (folderAPI.is('public', folder)) {
                    // if public folder, current user will be added
                    if (options.create) self.getParticipants().add({ id: ox.user_id, type: 1 });
                } else if (folderAPI.is('shared', folder)) {
                    // in a shared folder the owner (created_by) will be added by default
                    self.getParticipants().add({ id: folder.created_by, type: 1 });
                }
            });
        },
        getUpdatedAttributes: function () {
            var attributesToSave = this.changedSinceLoading();
            attributesToSave.id = this.id;

            if (this.mode === 'series') {
                // fields for recurrences
                var x = 0,
                    fields = [
                        'recurrence_date_position',
                        'change_exceptions',
                        'delete_exceptions',
                        'recurrence_type',
                        'days',
                        'day_in_month',
                        'month',
                        'interval',
                        'until',
                        'occurrences'
                    ];

                // ensure theses fields will be send to backend to edit the whole series
                for (; x < fields.length; x++) {
                    attributesToSave[fields[x]] = this.get(fields[x]);
                }
            } else {
                if (this.mode === 'appointment') {
                    attributesToSave.recurrence_position = this.get('recurrence_position');
                }

                var anyRecurrenceFieldChanged = _(RECURRENCE_FIELDS).any(function (attribute) {
                    return !_.isUndefined(attributesToSave[attribute]);
                });

                if (anyRecurrenceFieldChanged) {
                    var self = this;
                    _(RECURRENCE_FIELDS).each(function (attribute) {
                        var value = self.get(attribute);
                        if (!_.isUndefined(value)) {
                            attributesToSave[attribute] = value;
                        }
                    });
                }
            }

            if (this.get('recurrence_type') > 0) {
                attributesToSave.start_date = this.get('start_date');
                attributesToSave.end_date = this.get('end_date');
            }

            if (!attributesToSave.folder) {
                attributesToSave.folder = this.get('folder') || this.get('folder_id');
            }

            return attributesToSave;
        }
    });

    ext.point('io.ox/calendar/model/validation').extend({
        id: 'start-date-before-end-date',
        validate: function (attributes) {
            if (attributes.start_date && attributes.end_date && attributes.end_date < attributes.start_date) {
                this.add('end_date', gt('The end date must be after the start date.'));
            }
        }
    });

    ext.point('io.ox/calendar/model/validation').extend({
        id: 'upload-quota',
        validate: function (attributes) {
            if (attributes.quotaExceeded) {
                this.add('quota_exceeded', gt('Files can not be uploaded, because quota exceeded.'));
            }
        }
    });

    Validators.validationFor('io.ox/calendar/model', {
        title: { format: 'string', mandatory: true },
        start_date: { format: 'date', mandatory: true },
        end_date: { format: 'date', mandatory: true }
    });

    return model;
});
