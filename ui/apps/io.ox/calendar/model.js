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
    'io.ox/backbone/modelFactory',
    'io.ox/core/extensions',
    'gettext!io.ox/calendar',
    'io.ox/backbone/validation',
    'io.ox/participants/model',
    'io.ox/core/folder/api',
    'settings!io.ox/calendar',
    'settings!io.ox/core'
], function (api, ModelFactory, ext, gt, Validators, pModel, folderAPI, settings, coreSettings) {

    'use strict';

    var RECURRENCE_FIELDS = 'recurrence_type interval days day_in_month month until occurrences'.split(' ');

    var factory = new ModelFactory({
        ref: 'io.ox/calendar/model',
        api: api,
        toUniqueId: _.ecid,
        destroy: function (model) {
            var options = {
                id: model.id,
                folder: model.get('folder_id') || model.get('folder')
            };
            if (model.attributes.recurrence_position) {
                _.extend(options, { recurrence_position: model.get('recurrence_position') });
            }
            return api.remove(options);
        },
        model: {

            idAttribute: 'id',

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

                // bind events
                this.on({
                    'create:fail update:fail': function (response) {
                        if (response.conflicts) {
                            this.trigger('conflicts', response.conflicts);
                        }
                    },
                    'change:start_date': function (model, startDate) {
                        if (length < 0) {
                            return;
                        }
                        if (startDate && _.isNumber(length)) {
                            model.set('end_date', startDate + length, { validate: true });
                        }
                    },
                    'change:end_date': function (model, endDate) {
                        var tmpLength = endDate - model.get('start_date');
                        if (tmpLength < 0) {
                            if (endDate && _.isNumber(length)) {
                                model.set('start_date', endDate - length, { validate: true });
                            }
                        } else {
                            length = tmpLength;
                        }
                    },
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

                this._participants = new pModel.Participants(this.get('participants'));

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
                    self._participants.invoke('fetch');
                    changeParticipantsUpdate = false;
                });

                return this._participants;
            },

            setDefaultParticipants: function (options) {
                var self = this;
                return folderAPI.get(self.get('folder_id')).done(function (folder) {
                    var userID = ox.user_id;
                    if (folderAPI.is('private', folder)) {
                        if (options.create) {
                            // it's a private folder for the current user, add him by default
                            // as participant
                            self.getParticipants().add({ id: userID, type: 1 });
                            self.set('organizerId', userID);
                            // use a new, custom and unused property in his model to specify that he can't be removed
                            self.getParticipants().get(userID).set('ui_removable', false, { validate: true });
                        } else {
                            if (self.get('organizerId') === userID) {
                                self.getParticipants().get(userID).set('ui_removable', false, { validate: true });
                            }
                        }
                    } else if (folderAPI.is('public', folder)) {
                        if (options.create) {
                            // if public folder, current user will be added
                            self.getParticipants().add({ id: userID, type: 1 });
                        }
                    } else if (folderAPI.is('shared', folder)) {
                        // in a shared folder the owner (created_by) will be added by default
                        self.getParticipants().add({ id: folder.created_by, type: 1 });
                    }

                });
            }
        },
        getUpdatedAttributes: function (model) {
            var attributesToSave = model.changedSinceLoading();
            attributesToSave.id = model.id;

            if (model.get('recurrence_type') > 0) {
                attributesToSave.start_date = model.get('start_date');
                attributesToSave.end_date = model.get('end_date');
            }

            if (!attributesToSave.folder) {
                attributesToSave.folder = model.get('folder') || model.get('folder_id');
            }

            var anyRecurrenceFieldChanged = _(RECURRENCE_FIELDS).any(function (attribute) {
                return !_.isUndefined(attributesToSave[attribute]);
            });

            if (anyRecurrenceFieldChanged) {
                _(RECURRENCE_FIELDS).each(function (attribute) {
                    var value = model.get(attribute);
                    if (!_.isUndefined(value)) {
                        attributesToSave[attribute] = value;
                    }
                });
            }
            return attributesToSave;
        }
    });

    ext.point('io.ox/calendar/model/validation').extend({
        id: 'start-date-before-end-date',
        validate: function (attributes) {
            if (attributes.start_date && attributes.end_date && attributes.end_date < attributes.start_date) {
                this.add('start_date', gt('The start date must be before the end date.'));
                this.add('end_date', gt('The start date must be before the end date.'));
            }
        }
    });

    Validators.validationFor('io.ox/calendar/model', {
        title: { format: 'string', mandatory: true },
        start_date: { format: 'date', mandatory: true },
        end_date: { format: 'date', mandatory: true }
    });

    return factory;
});
