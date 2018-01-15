/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 *
 */

define('io.ox/calendar/model', [
    'io.ox/core/extensions',
    'io.ox/calendar/util',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar',
    'io.ox/backbone/basicModel',
    'io.ox/backbone/validation',
    'io.ox/core/strings'
], function (ext, util, folderAPI, gt, BasicModel, Validators, strings) {

    'use strict';

    var // be careful with the add method. If the option resolveGroups is present it changes from synchronous to asynchronous (must get the proper user data first)
        AttendeeCollection = Backbone.Collection.extend({
            // if an email is present distinguisch the attendees by email address (provides support for attendee with multiple mail addresses).
            // Some attendee types don't have an email address (groups and resources), but have entity numbers. Use those as id to prevent duplicates
            modelId: function (attrs) {
                return attrs.email || attrs.entity;
            },
            initialize: function (models, options) {
                this.options = options || {};
                if (this.options.resolveGroups) {
                    this.oldAdd = this.add;
                    this.add = this.addAsync;
                }
            },
            // special add function that allows resolving of groups
            // is used when option resolveGroups is active (used by scheduling view)
            addAsync: function (models, options) {
                var usersToResolve  = [],
                    modelsToAdd = [],
                    self = this,
                    def = $.Deferred();
                models = [].concat(models);
                _(models).each(function (model) {
                    if (model.cuType === 'GROUP' || (model.get && model.get('cuType') === 'GROUP')) {
                        usersToResolve = _.uniq(usersToResolve.concat(model instanceof Backbone.Model ? model.get('members') : model.members));
                    } else {
                        modelsToAdd.push(model);
                    }
                });
                require(['io.ox/core/api/user'], function (userAPI) {
                    userAPI.getList(usersToResolve).done(function (users) {
                        modelsToAdd = _.uniq(_.union(modelsToAdd, _(users).map(function (user) {
                            return util.createAttendee(user);
                        })));
                        // no merge here or we would overwrite the confirm status
                        def.resolve(self.oldAdd(modelsToAdd, options));
                    }).fail(def.reject);
                });

                return def;
            }
        });

    var RRuleMapModel = Backbone.Model.extend({

        days: ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'],

        initialize: function () {
            this.model = this.get('model');
            this.unset('model');
            this.listenTo(this.model, 'change', this.deserialize);
            this.deserialize();
            this.on('change', this.serialize);
        },

        serialize: function () {
            var self = this,
                args = [],
                days = _(this.days).chain().map(function (day, index) {
                    if ((self.get('days') & (1 << index)) !== 0) return day.toUpperCase();
                }).compact().value().join(',');
            switch (this.get('recurrence_type')) {
                case 1:
                    args.push('FREQ=DAILY');
                    break;
                case 2:
                    args.push('FREQ=WEEKLY');
                    args.push('BYDAY=' + days);
                    break;
                case 3:
                    args.push('FREQ=MONTHLY');
                    if (self.get('days')) {
                        args.push('BYDAY=' + days);
                        args.push('BYSETPOS=' + this.get('day_in_month'));
                    } else {
                        args.push('BYMONTHDAY=' + this.get('day_in_month'));
                    }
                    break;
                case 4:
                    args.push('FREQ=YEARLY');
                    if (self.get('days')) {
                        args.push('BYMONTH=' + (this.get('month') + 1));
                        args.push('BYDAY=' + days);
                        args.push('BYSETPOS=' + this.get('day_in_month'));
                    } else {
                        args.push('BYMONTH=' + (this.get('month') + 1));
                        args.push('BYMONTHDAY=' + this.get('day_in_month'));
                    }
                    break;
                default:
            }
            if (this.get('interval') > 1) args.push('INTERVAL=' + this.get('interval'));
            if (this.get('until')) args.push('UNTIL=' + moment(this.get('until')).utc().format(util.ZULU_FORMAT));
            if (this.get('occurrences')) args.push('COUNT=' + this.get('occurrences'));
            if (args.length > 0) this.model.set('rrule', args.join(';'));
            else this.model.unset('rrule');
        },

        deserialize: function () {
            var changes = {};
            changes.start_date = this.model.getTimestamp('startDate');
            if (!this.model.get('rrule')) return this.set(changes);
            var self = this,
                str = this.model.get('rrule'),
                attributes = str.split(';'),
                rrule = {},
                date = this.model.getMoment('startDate');
            _(attributes).each(function (attr) {
                attr = attr.split('=');
                var name = attr[0],
                    value = attr[1].split(',');
                if (value.length === 1) value = value[0];
                rrule[name] = value;
                rrule[name.toLowerCase()] = _.isArray(value) ? attr[1].toLowerCase().split(',') : value.toLowerCase();
            });
            switch (rrule.freq) {
                case 'daily':
                    changes.recurrence_type = 1;
                    break;
                case 'weekly':
                    changes.recurrence_type = 2;
                    changes.days = _([].concat(rrule.byday)).reduce(function (memo, day) {
                        return memo + (1 << self.days.indexOf(day));
                    }, 0);
                    break;
                case 'monthly':
                    changes.recurrence_type = 3;
                    if (rrule.bymonthday) {
                        changes.day_in_month = parseInt(rrule.bymonthday, 10) || 0;
                    } else if (rrule.byday) {
                        changes.day_in_month = parseInt(rrule.bysetpos, 10) || 0;
                        changes.days = 1 << this.days.indexOf(rrule.byday);
                    } else {
                        changes.day_in_month = date.date();
                    }
                    break;
                case 'yearly':
                    changes.recurrence_type = 4;
                    if (rrule.bymonthday) {
                        changes.month = (parseInt(rrule.bymonth, 10) || 0) - 1;
                        changes.day_in_month = parseInt(rrule.bymonthday, 10) || 0;
                    } else if (rrule.byday) {
                        changes.month = (parseInt(rrule.bymonth, 10) || 0) - 1;
                        changes.day_in_month = parseInt(rrule.bysetpos, 10) || 0;
                        changes.days = 1 << this.days.indexOf(rrule.byday);
                    } else {
                        changes.month = date.month();
                        changes.day_in_month = date.date();
                    }
                    break;
                default:
                    changes.recurrence_type = 0;
            }
            if (rrule.count) changes.occurrences = parseInt(rrule.count, 10) || 1;
            if (rrule.UNTIL) changes.until = moment(rrule.UNTIL).valueOf() || 0;
            changes.interval = parseInt(rrule.interval, 10) || 1;
            this.set(changes);
        }

    });

    var Model = BasicModel.extend({
        idAttribute: 'cid',
        ref: 'io.ox/chronos/model/',
        // use function here, so defaults are not overwritten by accident
        defaults: function () {
            return {
                class: 'PUBLIC'
            };
        },
        init: function () {
            // models in create view do not have an id yet. avoid undefined.undefined cids
            if (this.attributes.folder && this.attributes.id) {
                this.cid = this.attributes.cid = util.cid(this.attributes);
            }
            this.flags = _.object(this.get('flags'), this.get('flags'));
        },
        getAttendees: function () {
            if (this._attendees) return this._attendees;
            var self = this,
                resetListUpdate = false,
                changeAttendeesUpdate = false;

            this._attendees = new AttendeeCollection(this.get('attendees'), { resolveGroups: true, silent: false });

            this._attendees.on('add remove reset', function () {
                if (changeAttendeesUpdate) return;
                resetListUpdate = true;
                self.set('attendees', this.toJSON(), { validate: true });
                resetListUpdate = false;
            });

            this.on({
                'change:startDate': function () {
                    var prevStartDate = this.previous('startDate'), endDate = this.getMoment('endDate');
                    prevStartDate = util.getMoment(prevStartDate);
                    endDate = this.getMoment('startDate').tz(endDate.tz()).add(endDate.diff(prevStartDate, 'ms'), 'ms');
                    this.set('endDate', { value: endDate.format('YYYYMMDD[T]HHmmss'), tzid: endDate.tz() });
                },

                'change:attendees': function () {
                    if (resetListUpdate) return;
                    changeAttendeesUpdate = true;
                    self._attendees.reset(self.get('attendees'));
                    changeAttendeesUpdate = false;
                }
            });
            return this._attendees;
        },

        setDefaultAttendees: function (options) {
            var self = this;
            return folderAPI.get(this.get('folder')).then(function (folder) {
                if (!options.create) return;
                var isPrivate = folderAPI.is('private', folder),
                    isShared = folderAPI.is('shared', folder);
                return require(['io.ox/core/api/user']).then(function (userAPI) {
                    return userAPI.get({ id: isShared ? folder.created_by : undefined });
                }).then(function (user) {
                    if (isPrivate) {
                        self.set('organizer', {
                            cn: user.display_name,
                            email: user.email1,
                            uri: 'mailto:' + user.email1,
                            entity: ox.user_id
                        });
                    }
                    self.getAttendees().add(util.createAttendee(user, { partStat: 'ACCEPTED' }));
                });
            });
        },
        getMoment: function (name) {
            if (!this.has(name)) return;
            return util.getMoment(this.get(name));
        },
        getTimestamp: function (name) {
            if (!this.get(name)) return;
            return this.getMoment(name).valueOf();
        },
        parse: function (res) {
            return res;
        },
        getRruleMapModel: function () {
            return new RRuleMapModel({ model: this });
        },
        hasFlag: function (flag) {
            return !!this.flags[flag];
        }
    });

    ext.point('io.ox/chronos/model/validation').extend({
        id: 'start-date-before-end-date',
        validate: function (attr, err, model) {
            if (model.getTimestamp('endDate') < model.getTimestamp('startDate')) {
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

    Validators.validationFor('io.ox/chronos/model', {
        summary: { format: 'string', mandatory: true }
    });

    var Collection = Backbone.Collection.extend({

        model: Model,

        setOptions: function (opt) {
            this.folders = opt.folders;
            this.start = opt.start;
            this.end = opt.end;
        },

        comparator: function (model) {
            return model.getTimestamp('startDate');
        },

        sync: function (opt) {
            var self = this;
            opt = opt || {};
            if ((!this.expired && this.length > 0) || (this.folders && this.folders.length === 0)) {
                _.defer(self.trigger.bind(self, 'load'));
                return $.when();
            }

            var api = require('io.ox/calendar/api'), // require directly because of circular dependency
                params = {
                    action: 'all',
                    rangeStart: moment(this.start).utc().format(util.ZULU_FORMAT),
                    rangeEnd: moment(this.end).utc().format(util.ZULU_FORMAT),
                    fields: api.defaultFields,
                    order: 'asc',
                    sort: 'startDate',
                    expand: true
                };

            this.expired = false;
            _.defer(this.trigger.bind(this, 'before:load'));

            return api.request({
                module: 'chronos',
                params: params,
                data: { folders: this.folders }
            }, this.folders ? 'PUT' : 'GET').then(function success(data) {
                var method = opt.paginate === true ? 'add' : 'set';
                data = _(data)
                    .chain()
                    .each(function (event) {
                        event.cid = util.cid(event);
                    })
                    .sortBy(function (event) {
                        return util.getMoment(event.startDate).valueOf();
                    })
                    .value();
                self[method](data);
                self.trigger('load');
                return data;
            }, function fail(err) {
                self.trigger('load:fail', err);
            });
        }

    });

    return {
        Model: Model,
        Collection: Collection,
        AttendeeCollection: AttendeeCollection
    };
});
