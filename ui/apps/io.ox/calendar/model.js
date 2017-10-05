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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/calendar/model', [
    'io.ox/calendar/chronos-api',
    'io.ox/core/extensions',
    'io.ox/backbone/extendedModel',
    'gettext!io.ox/calendar',
    'io.ox/backbone/validation',
    'io.ox/core/folder/api',
    'io.ox/core/strings',
    'settings!io.ox/calendar',
    'settings!io.ox/core'
], function (api, ext, extendedModel, gt, Validators, folderAPI, strings, settings, coreSettings) {

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
                startDate: defStart,
                endDate: defEnd
            }, this.attributes);

            // End date automatically shifts with start date
            var length = this.get('endDate') - this.get('startDate');

            // internal storage for last timestamps
            this.cache = {
                start: this.get('allDay') ? defStart : this.get('startDate'),
                end: this.get('allDay') ? defEnd : this.get('endDate')
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

                'change:startDate': function (model, startDate) {
                    if (length < 0) return;
                    if (startDate && _.isNumber(length)) {
                        model.set('endDate', startDate + length, { validate: true });
                    }
                },

                // 'change:endDate': function (model, endDate) { },
                //
                // We DO NOT anything else if the length gets negative
                //
                // Actually you have three major optons
                // 1. shift the startDate to keep the current length
                // 2. shift the startDate for example 1 hour before the new end date (OX6)
                // 3. do nothing so that the user recognizes that the start date has also changed
                //
                // We could show a hint right away but this is here is still rocket science
                // and triggering a simple validation seems impossible.
                // Therefore TODO: completely rewrite this whole model-validaten-magic!

                'change:allDay': function (model, fulltime) {
                    // handle shown as
                    if (settings.get('markFulltimeAppointmentsAsFree', false)) {
                        model.set('shown_as', fulltime ? 4 : 1, { validate: true });
                    }

                    var startDate, endDate;

                    if (fulltime === true) {
                        // save to cache, convert to UTC and save
                        startDate = moment(this.cache.start = model.get('startDate')).startOf('day').utc(true).valueOf();
                        endDate = moment(this.cache.end = model.get('endDate')).startOf('day').add(1, 'day').utc(true).valueOf();
                    } else {
                        var oldStart = moment(this.cache.start),
                            oldEnd = moment(this.cache.end);

                        // save to cache
                        this.cache.start = moment.utc(model.get('startDate')).local(true).valueOf();
                        this.cache.end = moment.utc(model.get('endDate')).local(true).valueOf();

                        // handle time
                        startDate = moment(this.cache.start).startOf('day').hours(oldStart.hours()).minutes(oldStart.minutes()).valueOf();
                        endDate = moment(this.cache.end).startOf('day').hours(oldEnd.hours()).minutes(oldEnd.minutes()).subtract(1, 'day').valueOf();
                    }
                    // save
                    length = endDate - startDate;
                    model.set('startDate', startDate, { validate: true });
                    model.set('endDate', endDate, { validate: true });
                }
            });
        },

        // special get function for datepicker
        getDate: function (attr, options) {
            var time = this.get.apply(this, arguments);
            options = options || {};
            // use this.get('fulltime') only as a backup, some datepickers have ignore fulltime enabled which would not be honored this way
            options.fulltime = _.isBoolean(options.fulltime) ? options.fulltime : this.get('allDay');
            if (options.fulltime) {
                time = moment.utc(time).local(true);
                // fake end date for datepicker
                if (attr === 'endDate') {
                    time.subtract(1, 'day');
                }
                time = time.valueOf();
            }
            return time;
        },

        // special set function for datepicker
        setDate: function (attr, time, options) {
            options = options || {};
            // use this.get('fulltime') only as a backup, some datepickers have ignore fulltime enabled which would not be honored this way
            options.fulltime = _.isBoolean(options.fulltime) ? options.fulltime : this.get('allDay');
            if (options.fulltime) {
                time = moment(time);
                // fix fake end date for model
                if (attr === 'endDate') {
                    time.add(1, 'day');
                }
                arguments[1] = time.utc(true).valueOf();
            }
            return this.set.apply(this, arguments);
        },

        getParticipants: function () {
            if (this._participants) return this._participants;
            var self = this,
                resetListUpdate = false,
                changeParticipantsUpdate = false;

            this._participants = new Backbone.Collection(this.get('attendees'), { silent: false });

            this._participants.on('add remove reset', function () {
                if (changeParticipantsUpdate) return;
                resetListUpdate = true;
                self.set('attendees', this.toJSON(), { validate: true });
                resetListUpdate = false;
            });

            this.on('change:attendees', function () {
                if (resetListUpdate) return;
                changeParticipantsUpdate = true;
                self._participants.reset(self.get('attendees'));
                changeParticipantsUpdate = false;
            });
            return this._participants;
        },

        setDefaultParticipants: function (options) {
            return folderAPI.get(this.get('folder')).then(function (folder) {
                if (!options.create) return;
                var isPrivate = folderAPI.is('private', folder),
                    isShared = folderAPI.is('shared', folder);
                // if public / shared folder owner (created_by) will be added by default
                if (isPrivate) this.set('organizerId', ox.user_id);
                // set participants first before participant collection is created (getParticipants())
                this.set('participants', _(this.get('participants')).concat([{
                    field: 'email1',
                    // BossyAppointmentHandling
                    id: isShared ? folder.created_by : ox.user_id,
                    type: 1
                }]));
                // first call of getParticipants creates participant collection
                this.getParticipants();
            }.bind(this));
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
                attributesToSave.startDate = this.get('startDate');
                attributesToSave.endDate = this.get('endDate');
            }

            if (!attributesToSave.folder) {
                attributesToSave.folder = this.get('folder');
            }

            if (this.get('ignoreConflicts')) {
                attributesToSave.ignoreConflicts = this.get('ignoreConflicts');
            }

            return attributesToSave;
        }
    });

    ext.point('io.ox/calendar/model/validation').extend({
        id: 'start-date-before-end-date',
        validate: function (attributes) {
            if (attributes.startDate && attributes.endDate && attributes.endDate < attributes.startDate) {
                this.add('endDate', gt('The end date must be after the start date.'));
            }
        }
    });

    ext.point('io.ox/calendar/model/validation').extend({
        id: 'upload-quota',
        validate: function (attributes) {
            if (attributes.quotaExceeded) {
                //#. %1$s is an upload limit like for example 10mb
                this.add('quota_exceeded', gt('Files can not be uploaded, because upload limit of %1$s is exceeded.', strings.fileSize(attributes.quotaExceeded.attachmentMaxUploadSize, 2)));
            }
        }
    });

    Validators.validationFor('io.ox/calendar/model', {
        title: { format: 'string', mandatory: true },
        startDate: { format: 'date', mandatory: true },
        endDate: { format: 'date', mandatory: true }
    });

    return model;
});
