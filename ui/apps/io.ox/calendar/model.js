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
    'io.ox/core/strings',
    'io.ox/participants/model'
], function (ext, util, folderAPI, gt, BasicModel, Validators, strings, pModel) {

    'use strict';

    // list of error codes where a folder should be removed from the selection
    var removeList = [
        'FLD-1004', // folder storage service no longer available
        'FLD-0008', // folder not found
        'FLD-0003', // permission denied
        'CAL-4060', // folder is not supported
        'CAL-4030', // permission denied
        'CAL-4044'  // account not found
    ];

    var // be careful with the add method. If the option resolveGroups is present it changes from synchronous to asynchronous (must get the proper user data first)
        AttendeeCollection = Backbone.Collection.extend({
            // if an email is present distinguish the attendees by email address (provides support for attendee with multiple mail addresses).
            // Some attendee types don't have an email address (groups and resources), but have entity numbers. Use those as id to prevent duplicates
            modelId: function (attrs) {
                return attrs.email || attrs.entity;
            },
            initialize: function (models, options) {
                this.options = options || {};
                if (this.options.resolveGroups) {
                    this.oldAdd = this.add;
                    this.add = this.addAsync;
                    // array to track unresolved calls to the add function, usefull if you need to wait for requests requests to finish before saving etc
                    this.toBeResolved = [];
                }
            },

            resolveDistList: function (list) {
                var models = [], defs = [],
                    def = $.Deferred();
                _([].concat(list)).each(function (data) {
                    // check if model
                    var mod = new pModel.Participant(data);
                    models.push(mod);
                    // wait for fetch, then add to collection
                    defs.push(mod.loading);
                });

                $.when.apply($, defs).then(function () {
                    def.resolve(_(models).sortBy(function (obj) { return obj.get('last_name'); }));

                });
                return def;
            },

            // special add function that allows resolving of groups
            addAsync: function (models, options) {
                var usersToResolve  = [],
                    groupsToResolve = [],
                    groups = [],
                    modelsToAdd = [],
                    self = this,
                    // as this is an async add, we need to make sure the reset event is triggered after adding
                    isReset = options && options.previousModels !== undefined,
                    def = $.Deferred();

                this.toBeResolved.push(def);

                models = [].concat(models);
                _(models).each(function (model) {

                    // try to resolve groups if possible
                    if (!self.options.noInitialResolve && model.cuType === 'GROUP' || (model.get && model.get('cuType') === 'GROUP')) {
                        var users = model instanceof Backbone.Model ? model.get('members') : model.members,
                            entity = model instanceof Backbone.Model ? model.get('entity') : model.entity;

                        // make sure id 0 works
                        if (entity !== undefined) {
                            self.usedGroups = _.uniq((self.usedGroups || []).concat(entity));
                        }

                        if (users) {
                            // we have user ids
                            usersToResolve = _.uniq(usersToResolve.concat(users));
                        } else if (entity) {
                            // we don't have user ids but it's an internal group
                            groupsToResolve = _.uniq(groupsToResolve.concat({ id: entity }));
                            groups.push(model);
                        } else {
                            // we cannot resolve this group, so we just add it to the collection
                            modelsToAdd.push(model);
                        }
                    } else {
                        modelsToAdd.push(model);
                    }
                });
                require(['io.ox/core/api/user', 'io.ox/core/api/group'], function (userAPI, groupAPI) {
                    groupAPI.getList(groupsToResolve).then(function (data) {
                        // add to user list
                        usersToResolve = _.uniq(usersToResolve.concat(_(_(data).pluck('members')).flatten()));
                    }, function () {
                        // something went wrong, just add the group as a whole
                        modelsToAdd = modelsToAdd.concat(groups);
                    }).always(function () {
                        self.options.noInitialResolve = false;
                        // no need to resolve users that are already attendees
                        usersToResolve = _(usersToResolve).reject(function (user) {
                            return _(modelsToAdd).findWhere({ entity: user });
                        });
                        userAPI.getList(usersToResolve).done(function (users) {
                            modelsToAdd = _.compact(_.uniq(_.union(modelsToAdd, _(users).map(function (user) {
                                // remove broken users without mail address to be robust see bug 58370
                                if (!user.email1) return;
                                return util.createAttendee(user);
                            }))));
                            // no merge here or we would overwrite the confirm status
                            def.resolve(self.oldAdd(modelsToAdd, options));
                            if (isReset) self.trigger('reset');
                        }).fail(def.reject)
                        .always(function () {
                            self.toBeResolved = _(self.toBeResolved).without(def);
                        });
                    });
                });

                return def;
            }
        });

    var RRuleMapModel = Backbone.Model.extend({

        days: ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'],

        initialize: function () {
            this.model = this.get('model');
            this.set('timezone', (this.model.get('startDate') && this.model.get('startDate').tzid) ? this.model.get('startDate').tzid : moment().tz());
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
                        var pos = this.get('day_in_month');
                        args.push('BYSETPOS=' + (pos === 5 ? -1 : pos));
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
            // when this is an allday appointment the util part of an rrule must not have a Time
            if (this.get('until')) args.push(util.isAllday(this.model) ? 'UNTIL=' + moment(this.get('until')).format('YYYYMMDD') : 'UNTIL=' + moment(this.get('until')).endOf('day').utc().format(util.ZULU_FORMAT));
            if (this.get('occurrences')) args.push('COUNT=' + this.get('occurrences'));
            if (args.length > 0) this.model.set('rrule', args.join(';'));
            else this.model.set('rrule', null);
        },

        splitRule: function () {
            var str = this.model.get('rrule'),
                attributes = str.split(';'),
                rrule = {};

            _(attributes).each(function (attr) {
                attr = attr.split('=');
                var name = attr[0],
                    value = attr[1].split(',');
                if (value.length === 1) value = value[0];
                rrule[name] = value;
                rrule[name.toLowerCase()] = _.isArray(value) ? attr[1].toLowerCase().split(',') : value.toLowerCase();
            });

            // todo, figure out which rrules we want to support and rework this
            if (!rrule.bysetpos && rrule.byday && !_.isArray(rrule.byday) && rrule.byday.length > 2) {
                rrule.bysetpos = rrule.byday.substr(0, rrule.byday.length - 2);
                rrule.byday = rrule.byday.substr(rrule.byday.length - 2);
            }

            return rrule;
        },

        deserialize: function () {
            var changes = {};
            changes.startDate = _.clone(this.model.get('startDate'));
            changes.endDate = _.clone(this.model.get('endDate'));
            if (!this.model.get('rrule')) return this.set(changes);
            var self = this,
                rrule = this.splitRule(),
                date = this.model.getMoment('startDate');

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
                        var pos = rrule.bysetpos;
                        if (pos === -1) pos = 5;
                        changes.day_in_month = parseInt(pos, 10) || 0;
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
            if (rrule.count) {
                changes.occurrences = parseInt(rrule.count, 10) || 1;
            } else {
                // we need to remove old and now invalid data too (might happen during series updates etc)
                this.unset('occurrences');
            }

            if (rrule.UNTIL) {
                changes.until = moment(rrule.UNTIL).subtract(date.hour(), 'hours').valueOf() || 0;
            } else {
                // we need to remove old and now invalid data too (might happen during series updates etc)
                this.unset('until');
            }
            changes.interval = parseInt(rrule.interval, 10) || 1;
            this.set(changes);
        }

    });

    var Model = BasicModel.extend({
        idAttribute: 'cid',
        ref: 'io.ox/chronos/model/',
        init: function () {
            // models in create view do not have an id yet. avoid undefined.undefined cids
            if (this.attributes.folder && this.attributes.id) {
                this.cid = this.attributes.cid = util.cid(this.attributes);
            }
            this.onChangeFlags();
            this.on({
                'change:startDate': this.onChangeStartDate,
                'change:endDate': this.onChangeEndDate,
                'change:flags': this.onChangeFlags
            });
        },
        onChangeStartDate: function () {
            if (!this.adjustEndDate) return;
            if (this.changedAttributes().endDate) return;
            if (!this.has('endDate')) return;
            var prevStartDate = util.getMoment(this.previous('startDate')), endDate = this.getMoment('endDate');
            endDate = this.getMoment('startDate').tz(endDate.tz()).add(endDate.diff(prevStartDate, 'ms'), 'ms');
            this.set('endDate', util.isAllday(this) ? { value: endDate.format('YYYYMMDD') } : { value: endDate.format('YYYYMMDD[T]HHmmss'), tzid: endDate.tz() });
        },
        onChangeEndDate: function () {
            if (this.changedAttributes().startDate) return;
            if (!this.has('startDate')) return;
            // treat same date as still valid in model(not valid on save but creates better UX in the edit dialogs, especially when dealing with allday appointments (the edit view subtracts a day to not confuse users))
            if (this.getMoment('startDate').isSameOrBefore(this.getMoment('endDate'))) return;
            var startDate = this.getMoment('startDate'), prevEndDate = util.getMoment(this.previous('endDate'));
            startDate = this.getMoment('endDate').tz(startDate.tz()).add(startDate.diff(prevEndDate, 'ms'), 'ms');
            this.adjustEndDate = false;
            this.set('startDate', util.isAllday(this) ? { value: startDate.format('YYYYMMDD') } : { value: startDate.format('YYYYMMDD[T]HHmmss'), tzid: startDate.tz() });
            this.adjustEndDate = true;
        },
        onChangeFlags: function () {
            this.flags = _.object(this.get('flags'), this.get('flags'));
        },
        getAttendees: function () {
            if (this._attendees) return this._attendees;

            var self = this,
                resetListUpdate = false,
                attendees = this.get('attendees') || [],
                changeAttendeesUpdate = false;

            // you want to skip resolving groups when first creating the attendeeCollection. Otherwise the model would be dirty without any change
            this._attendees = new AttendeeCollection(attendees, { resolveGroups: true, silent: false, noInitialResolve: attendees.length > 1 });

            this._attendees.on('add remove reset', function () {
                if (changeAttendeesUpdate) return;
                resetListUpdate = true;
                self.set('attendees', this.toJSON(), { validate: true });
                resetListUpdate = false;
            });

            this.on({
                'change:attendees': function () {
                    if (resetListUpdate) return;
                    changeAttendeesUpdate = true;
                    self._attendees.reset(self.get('attendees') || []);
                    changeAttendeesUpdate = false;
                }
            });
            return this._attendees;
        },

        setDefaultAttendees: function (options) {
            if (!options.create) return $.when();
            var self = this;
            return folderAPI.get(this.get('folder')).then(function (folder) {
                return getOwnerData(folder).then(function (organizer) {
                    self.set('organizer', organizer);
                    var newAttendee = util.createAttendee(organizer, { partStat: 'ACCEPTED' }),
                        id = newAttendee.email ? { email:  newAttendee.email } : { entity: newAttendee.entity };

                    if (options.resetStates) {
                        self.getAttendees().each(function (model) {
                            model.set('partStat', 'NEEDS-ACTION');
                        });
                    }
                    // Merge attributes or add
                    if (_(self.get('attendees')).findWhere(id)) {
                        _(self.get('attendees')).findWhere(id).partStat = 'ACCEPTED';
                        // trigger add manually to make sure the attendee attribute and collection are synced correctly -> see follow up events action
                        self.trigger('change:attendees');
                    } else {
                        self.getAttendees().add(newAttendee);
                    }
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
            if (res.folder && res.id) res.cid = res.cid = util.cid(res);
            // if there was a change to the model in the meantime, clear all attributes that are not in the response
            // if we don't do this we get models with 2 states mixed into one (current but incomplete all request data vs complete but outdated get request data)
            // this can lead to flags not matching up with the rest of the model for example
            if (res.lastModified && this.get('lastModified') && res.lastModified !== this.get('lastModified')) {
                for (var attr in this.attributes) {
                    if (!_.has(res, attr)) this.unset(attr, { silent: true });
                }
            }
            return res;
        },
        getRruleMapModel: function () {
            if (this.rruleModel) return this.rruleModel;
            this.rruleModel = new RRuleMapModel({ model: this });
            return this.rruleModel;
        },
        hasFlag: function (flag) {
            return !!this.flags[flag];
        },
        // compares startDate with recurrence rule to check if the rule is correct (startDate wednesday, rrule says repeats on mondays)
        checkRecurrenceRule: function () {
            if (!this.get('rrule')) return true;
            // Monday is 1 Sunday is 7, we subtract 1 so we can use it as an index
            var startDateIndex = this.getMoment('startDate').isoWeekday() - 1,
                days = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'],
                rrule = this.getRruleMapModel().splitRule();

            if (_.isEmpty(rrule.byday)) return true;

            var usedDays = _([].concat(rrule.byday)).map(function (val) { return days.indexOf(val); });

            return usedDays.indexOf(startDateIndex) !== -1;
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

    ext.point('io.ox/chronos/model/validation').extend({
        id: 'upload-quota',
        validate: function (attributes) {
            if (attributes.quotaExceeded) {
                //#. %1$s is an upload limit like for example 10mb
                this.add('quota_exceeded', gt('Files can not be uploaded, because upload limit of %1$s is exceeded.', strings.fileSize(attributes.quotaExceeded.attachmentMaxUploadSize, 2)));
            }
        }
    });

    ext.point('io.ox/chronos/model/validation').extend({
        id: 'secret-used-with-resource',
        validate: function (attributes) {
            if (attributes.class === 'PRIVATE' && _(_(attributes.attendees).pluck('cuType')).contains('RESOURCE')) {
                //#. error text is displayed when an appointment is marked as secret but blocking a ressource (e.g. a conference room)
                this.add('class', gt('You cannot mark the appointment as secret, when blocking a ressource.'));
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
                var method = opt.paginate === true ? 'add' : 'reset';
                data = _(data)
                    .chain()
                    .map(function (data) {
                        // no folders defaults to all folder
                        if (!self.folders) return data;
                        if (data.events) return data.events;
                        if (!_(removeList).contains(data.error.code)) return;
                        api.trigger('all:fail', data.folder);
                    })
                    .compact()
                    .flatten()
                    .each(function (event) {
                        event.cid = util.cid(event);
                    })
                    .sortBy(function (event) {
                        return util.getMoment(event.startDate).valueOf();
                    })
                    .value();
                self[method](data, { parse: true });
                self.trigger('load');
                return data;
            }, function fail(err) {
                self.trigger('load:fail', err);
            });
        }

    });

    // helper to get userData about a folder owner, uses created_from if available with created_by as fallback
    function getOwnerData(folderData) {
        var isPublic = folderAPI.is('public', folderData);

        // shared and private folder use the folder creator as organizer, public uses the current user
        if (folderData.created_from && !isPublic && folderData.created_from.display_name && folderData.created_from.contact && folderData.created_from.contact.email1) {
            return $.when({
                cn: folderData.created_from.display_name,
                email: folderData.created_from.contact.email1,
                uri: 'mailto:' + folderData.created_from.contact.email1,
                entity: folderData.created_from.entity,
                contact: folderData.created_from.contact
            });
        }
        return require(['io.ox/core/api/user']).then(function (userAPI) {
            return userAPI.get({ id: !isPublic ? folderData.created_by : undefined }).then(function (user) {
                return {
                    cn: user.display_name,
                    email: user.email1,
                    uri: 'mailto:' + user.email1,
                    entity: user.id,
                    contact: user
                };

            });
        });
    }

    return {
        Model: Model,
        Collection: Collection,
        AttendeeCollection: AttendeeCollection
    };
});
