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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/calendar/model',
        ['io.ox/calendar/api',
        'io.ox/backbone/modelFactory',
        'io.ox/core/extensions',
        'gettext!io.ox/calendar/calendar',
        'io.ox/backbone/validation',
        'io.ox/participants/model',
        'io.ox/core/date',
        'io.ox/core/api/folder',
        'io.ox/core/config'], function (api, ModelFactory, ext, gt, Validators, pModel, date, folderAPI, configAPI) {

    "use strict";

    var defStart = new date.Local();
    defStart.setMinutes(0);
    defStart.setHours(defStart.getHours() + 1);

    var RECURRENCE_FIELDS = "recurrence_type interval days day_in_month month until occurrences".split(" ");

    var factory = new ModelFactory({
        ref: 'io.ox/calendar/model',
        api: api,
        destroy: function (model) {
            var options = {
                id: model.id,
                folder: model.get('folder_id') || model.get('folder')
            };
            if (model.recurrence_position) {
                _.extend(options, {recurrence_position: model.get('recurrence_position')});
            }
            return api.remove(options);
        },
        model: {
            defaults: {
                start_date: defStart.getTime(),
                end_date: defStart.getTime() + date.HOUR,
                recurrence_type: 0,
                alarm: 15
            },
            init: function () {
                var self = this;
                this.on('create:fail update:fail', function (response) {
                    if (response.conflicts) {
                        self.trigger('conflicts', response.conflicts);
                    }
                });
            },
            getParticipants: function () {
                if (this._participants) {
                    return this._participants;
                }
                var self = this;
                var resetListUpdate = false;
                var changeParticipantsUpdate = false;
                var participants = this._participants = new pModel.Participants(this.get('participants'));
                participants.invoke('fetch');

                function resetList(participant) {
                    if (changeParticipantsUpdate) {
                        return;
                    }
                    resetListUpdate = true;
                    self.set('participants', participants.toJSON());
                    resetListUpdate = false;
                }

                participants.on('add remove reset', resetList);

                this.on('change:participants', function () {
                    if (resetListUpdate) {
                        return;
                    }
                    changeParticipantsUpdate = true;
                    participants.reset(self.get('participants'));
                    participants.invoke('fetch');
                    changeParticipantsUpdate = false;
                });

                return participants;
            }
        },

        getUpdatedAttributes: function (model) {
            var attributesToSave = model.changedSinceLoading();
            attributesToSave.id = model.id;
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

    ext.point("io.ox/calendar/model/validation").extend({
        id: 'start-date-before-end-date',
        validate: function (attributes) {
            if (attributes.start_date && attributes.end_date && attributes.end_date < attributes.start_date) {
                this.add('start_date', gt("The start date must be before the end date."));
                this.add('end_date', gt("The start date must be before the end date."));
            }
        }
    });

    Validators.validationFor('io.ox/calendar/model', {
        title: { format: 'string', mandatory: true},
        start_date : { format: 'date', mandatory: true},
        end_date: { format: 'date', mandatory: true}
    });

    // Recurrence

    // First, some constants
    // A series is of a certain recurrence type
    // daily, weekly, monhtly, yearly, no_recurrence
    var RECURRENCE_TYPES = {
        NO_RECURRENCE: 0,
        DAILY: 1,
        WEEKLY: 2,
        MONTHLY: 3,
        YEARLY: 4
    };

    // Sometimes we need to reference a certain day, so
    // here are the weekdays, bitmap-style

    var DAYS = {
        SUNDAY: 1,
        MONDAY: 2,
        TUESDAY: 4,
        WEDNESDAY: 8,
        THURSDAY: 16,
        FRIDAY: 32,
        SATURDAY: 64
    };

    DAYS.i18n = {
        SUNDAY: gt("Sunday"),
        MONDAY: gt("Monday"),
        TUESDAY: gt("Tuesday"),
        WEDNESDAY: gt("Wednesday"),
        THURSDAY: gt("Thursday"),
        FRIDAY: gt("Friday"),
        SATURDAY: gt("Saturday")
    };

    // Usage: DAYS.pack('monday', 'wednesday', 'friday') -> some bitmask
    DAYS.pack = function () {
        var result = 0;
        _(arguments).each(function (day) {
            var dayConst = DAYS[day.toUpperCase()];

            if (_.isUndefined(dayConst)) {
                throw "Invalid day: " + day;
            }
            result = result | dayConst;
        });
        return result;
    };

    // Usage: DAYS.unpack(bitmask) -> {'MONDAY': 1, 'WEDNESDAY': 1, 'FRIDAY': 1}
    DAYS.unpack = function (bitmask) {
        var days = {};
        _(DAYS.values).each(function (day) {
            var dayConst = DAYS[day];
            if (bitmask & dayConst) {
                days[day] = 1;
            } else {
                days[day] = 0;
            }
        });

        return days;
    };

    DAYS.values = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

    return {
        setDefaultParticipants: function (model) {
            return folderAPI.get({folder: model.get('folder_id')}).done(function (folder) {
                if (folderAPI.is('private', folder)) {
                    // it's a private folder for the current user, add him by default
                    // as participant
                    model.getParticipants().addUniquely({id: configAPI.get('identifier'), type: 1, ui_removable: false});

                } else if (folderAPI.is('public', folder)) {
                    // if public folder, current user will be added
                    model.getParticipants().addUniquely({id: configAPI.get('identifier'), type: 1});

                } else if (folderAPI.is('shared', folder)) {
                    // in a shared folder the owner (created_by) will be added by default
                    model.getParticipants().addUniquely({id: folder.created_by, type: 1});
                }

            });
        },
        applyAutoLengthMagic: function (model) {
            // End date automatically shifts with start date
            var length = model.get('end_date') - model.get('start_date');
            var updating = false;
            model.on('change:start_date', function () {
                if (length < 0) {
                    return;
                }
                updating = true;
                model.set('end_date', model.get('start_date') + length);
                updating = false;
            });

            model.on('change:end_date', function () {
                if (updating) {
                    return;
                }
                length = model.get('end_date') - model.get('start_date');
            });
        },
        fullTimeChangeBindings: function (model) {
            var _start = model.get('start_date');
            var _end = model.get('end_date');
            model.on('change:full_time', function () {
                var startDate = new date.Local(model.get('start_date')),
                    endDate = new date.Local(model.get('end_date'));
                if (model.get('full_time') === true) {

                    startDate.setHours(0, 0, 0, 0);
                    endDate.setDate(endDate.getDate() + 1).setHours(0, 0, 0, 0);

                    model.set('start_date',  date.Local.localTime(startDate.getTime()));
                    model.set('end_date', date.Local.localTime(endDate.getTime()));
                } else {
                    model.set('start_date', _start);
                    model.set('end_date', _end);
                }
            });
        },
        toLocalTime: function (model) {
            model.set('start_date', date.Local.localTime(model.get('start_date')));
            model.set('end_date', date.Local.localTime(model.get('end_date')));

        },
        factory: factory,
        Appointment: factory.model,
        Appointments: factory.collection,
        RECURRENCE_TYPES: RECURRENCE_TYPES,
        DAYS: DAYS
    };
});
