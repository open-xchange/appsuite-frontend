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

define('io.ox/calendar/chronos-api', [
    'io.ox/core/http',
    'io.ox/core/api/collection-pool',
    'io.ox/core/api/collection-loader',
    'io.ox/core/folder/api',
    'io.ox/calendar/chronos-util',
    'io.ox/calendar/chronos-model',
    'io.ox/core/capabilities'
], function (http, Pool, CollectionLoader, folderApi, util, models, capabilities) {

    'use strict';

    // updates pool based on writing operations response (create update delete etc)
    var filter = function (data) {
            // do not add model to pool if
            if (data.rrule && !data.recurrenceId) return false;
            return true;
        },
        processResponse = function (response) {
            if (!response) return;

            _(response.created).each(function (event) {
                if (filter(event)) api.pool.add(event.folder, event);
                api.trigger('create', event);
                api.trigger('create:' + util.ecid(event), event);
            });

            _(response.deleted).each(function (event) {
                // if there is a recurrence rule but no recurrenceId this means the whole series was deleted (recurrence master has no recurrenceId)
                if (event.rrule && !event.recurrenceId) {
                    var cid = util.ecid(event),
                        events = api.pool.get(event.folder).filter(function (evt) {
                            // check if it starts with cid (don't use startsWith because of IE)
                            return evt.cid.indexOf(cid) === 0;
                        });
                    api.pool.get(event.folder).remove(events);
                    _(events).each(function (evt) {
                        api.trigger('delete', evt);
                        api.trigger('delete:' + util.ecid(evt), evt);
                    });
                } else {
                    api.pool.get(event.folder).remove(util.cid(event));
                    api.trigger('delete', event);
                    api.trigger('delete:' + util.ecid(event), event);
                }
            });

            _(response.updated).each(function (event) {
                if (filter(event)) {
                    // first we must clear the attributes (don't use clear method as that kills the id and we cannot override the model again with add)
                    // otherwise attributes that no longer exists are still present after merging (happens if an event has no attachments anymore for example)
                    api.pool.get(event.folder).get(util.cid(event)).attributes = {};
                    api.pool.add(event.folder, event);
                }
                api.trigger('update', event);
                api.trigger('update:' + util.ecid(event), event);
            });

            return response;
        },
        api = {
            // convenience function
            cid: util.cid,
            getAll: function (obj, useCache) {
                obj = _.extend({
                    start: _.now(),
                    end: moment().add(28, 'days').valueOf(),
                    order: 'asc'
                }, obj || {});
                obj.useCache = obj.useCache !== false && useCache !== false;
                var collection = api.pool.get(obj.folder),
                    ranges = collection.getRanges(obj);
                http.pause();
                _(ranges).each(function (range) {
                    http.GET({
                        module: 'chronos',
                        params: {
                            action: 'all',
                            folder: obj.folder,
                            rangeStart: moment(range.start).utc().format('YYYYMMDD[T]HHMMss[Z]'),
                            rangeEnd: moment(range.end).utc().format('YYYYMMDD[T]HHMMss[Z]'),
                            order: obj.order,
                            expand: true
                        }
                    });
                });
                return http.resume().then(function (data) {
                    var error = _(data).find(function (res) {
                        return !!res.error;
                    });
                    if (error) throw error;
                    return data;
                }).then(function (data) {
                    data = _(data).chain().pluck('data').flatten().compact().value();
                    if (data.length > 0) api.pool.add(obj.folder, data);
                    return api.pool.get(obj.folder).filter(util.rangeFilter(obj.start, obj.end));
                }).then(function (list) {
                    // sort is necessary for listview. may be removed if real pagination (with sorting) is enabled
                    return _(list).sortBy(function (model) {
                        return model.getTimestamp('startDate');
                    });
                });
            },

            get: function (obj, useCache) {

                obj = obj instanceof Backbone.Model ? obj.attributes : obj;

                if (useCache !== false) {
                    var model = api.pool.get(obj.folder).get(util.cid(obj));
                    if (model) return $.when(model);
                }
                // if an alarm object was used to get the associated event we need to use the eventId not the alarm Id
                if (obj.eventId) {
                    obj.id = obj.eventId;
                }
                return http.GET({
                    module: 'chronos',
                    params: {
                        action: 'get',
                        id: obj.id,
                        recurrenceId: obj.recurrenceId,
                        folder: obj.folder
                    }
                }).then(function (data) {
                    if (!filter(data)) return new models.Model(data);
                    api.pool.add(obj.folder, data);
                    return api.pool.get(obj.folder).get(util.cid(obj));
                });
            },

            getList: function (list, useCache) {
                var def, reqList = list;
                if (useCache !== false) {
                    reqList = list.filter(function (obj) {
                        return !api.pool.get(obj.folder).get(util.cid(obj));
                    });
                }
                if (reqList.length > 0) {
                    def = http.PUT({
                        module: 'chronos',
                        params: {
                            action: 'list'
                        },
                        data: reqList
                    });
                } else {
                    def = $.when();
                }
                return def.then(function (data) {
                    if (data) {
                        data.filter(filter).forEach(function (obj) {
                            api.pool.get(obj.folder).add(obj.folder, obj);
                        });
                    }
                    return list.map(function (obj) {
                        if (!filter(obj)) return new models.Model(obj);
                        var cid = util.cid(obj);
                        return api.pool.get(obj.folder).get(cid);
                    });
                });
            },

            create: function (obj, options) {

                options = options || {};

                obj = obj instanceof Backbone.Model ? obj.attributes : obj;

                var attachmentHandlingNeeded = obj.tempAttachmentIndicator;
                delete obj.tempAttachmentIndicator;

                return http.PUT({
                    module: 'chronos',
                    params: {
                        action: 'new',
                        folder: obj.folder,
                        // convert to true boolean
                        ignore_conflicts: !!options.ignore_conflicts
                    },
                    data: obj
                }).then(function (data) {
                    if (!data.conflicts && attachmentHandlingNeeded) {
                        //to make the detailview show the busy animation
                        api.addToUploadList(util.cid(data.updated[0]));
                    }
                    return data;
                })
                .then(processResponse)
                .then(function (data) {
                    api.getAlarms();
                    // return conflicts or new model
                    if (data.conflicts) {
                        return data;
                    }

                    return api.pool.get(obj.folder).findWhere(data.created[0]);
                });
            },

            update: function (obj) {

                obj = obj instanceof Backbone.Model ? obj.attributes : obj;

                var attachmentHandlingNeeded = obj.tempAttachmentIndicator;
                delete obj.tempAttachmentIndicator;

                var params = {
                    action: 'update',
                    folder: obj.folder,
                    id: obj.id,
                    timestamp: obj.timestamp
                };

                if (obj.recurrenceId) params.recurrenceId = obj.recurrenceId;

                return http.PUT({
                    module: 'chronos',
                    params: params,
                    data: obj
                }).then(function (data) {
                    if (!data.conflicts && attachmentHandlingNeeded) {
                        //to make the detailview show the busy animation
                        api.addToUploadList(util.cid(data.updated[0]));
                    }
                    return data;
                })
                .then(processResponse)
                .then(function (data) {
                    api.getAlarms();
                    // return conflicts or new model
                    if (data.conflicts) {
                        return data;
                    }

                    return api.pool.get(obj.folder).findWhere(data.updated[0]);
                });
            },

            //TODO see if that needs reworking after attachmenthandling is not done via attachment api

            uploadCache: {},

            /**
             * used to cleanup Cache and trigger refresh after attachmentHandling
             * @param  {object} o (appointment object)
             * @fires  api#update (data)
             * @return { deferred }
             */
            attachmentCallback: function (o) {
                return api.get(o, !api.uploadInProgress(util.cid(o)))
                    .then(function (data) {
                        //to make the detailview remove the busy animation
                        api.removeFromUploadList(util.cid(o));
                        api.trigger('update', data.toJSON());
                        api.trigger('update:' + util.cid(o), data.toJSON());
                        return data;
                    });
            },

            /**
             * ask if this appointment has attachments uploading at the moment (busy animation in detail View)
             * @param  {string} key (task id)
             * @return { boolean }
             */
            uploadInProgress: function (key) {
                // return true boolean
                return this.uploadCache[key] || false;
            },

            /**
             * add appointment to the list
             * @param {string} key (task id)
             * @return { undefined }
             */
            addToUploadList: function (key) {
                this.uploadCache[key] = true;
            },

            /**
             * remove appointment from the list
             * @param  {string} key (task id)
             * @fires  api#update: + key
             * @return { undefined }
             */
            removeFromUploadList: function (key) {
                delete this.uploadCache[key];
            },

            remove: function (list) {
                api.trigger('beforedelete', list);
                list = _.isArray(list) ? list : [list];

                return http.PUT({
                    module: 'chronos',
                    params: {
                        action: 'delete',
                        timestamp: _.now()
                    },
                    data: _(list).map(function (obj) {
                        obj = obj instanceof Backbone.Model ? obj.attributes : obj;
                        return {
                            id: obj.id,
                            recurrenceId: obj.recurrenceId,
                            folderId: obj.folder
                        };
                    })
                })
                .then(processResponse)
                .then(function (data) {
                    api.getAlarms();
                    return data;
                });
            },

            confirm: function (obj, options) {
                options = options || {};
                var params = {
                        action: 'updateAttendee',
                        id: obj.id,
                        folder: obj.folder,
                        ignore_conflicts: options.ignore_conflicts,
                        timestamp: _.now()
                    },
                    data = {
                        attendee: obj.attendee
                    };

                if (obj.recurrenceId) {
                    params.recurrenceId = obj.recurrenceId;
                }
                if (obj.alarms) {
                    data.alarms = obj.alarms;
                }

                return http.PUT({
                    module: 'chronos',
                    params: params,
                    data: data
                })
                .then(processResponse)
                .then(function (response) {
                    if (!response.conflicts) {
                        // updates notification area for example
                        api.trigger('mark:invite:confirmed', api.pool.get(obj.folder).findWhere(data.updated[0]));
                    }
                });
            },

            // returns events for a list of attendees, using the freebusy api
            freebusyEvents: function (list, options) {
                if (list.length === 0) {
                    return $.Deferred().resolve([]);
                }

                options = _.extend({
                    from: moment().startOf('day').format('YYYYMMDD[T]HHmmss[Z]'),
                    until: moment().startOf('day').add(1, 'day').format('YYYYMMDD[T]HHmmss[Z]')
                }, options);

                return http.GET({
                    module: 'chronos/freebusy',
                    params: {
                        action: 'events',
                        from: options.from,
                        until: options.until,
                        attendees: list
                    }
                });
            },

            reduce: function (obj) {
                obj = obj instanceof Backbone.Model ? obj : _(obj);
                return obj.pick('id', 'folder', 'recurrenceId');
            },

            move: function (list, targetFolderId) {
                var folders = [String(targetFolderId)];
                list = [].concat(list);
                models = _(list).map(function (obj) {
                    var cid = util.cid(obj),
                        collection = api.pool.get(obj.folder),
                        model = collection.get(cid);
                    collection.remove(model);
                    return model;
                });

                http.pause();
                _(models).map(function (model) {
                    folders.push(model.get('folder'));
                    return http.PUT({
                        module: 'chronos',
                        params: {
                            action: 'move',
                            id: model.get('id'),
                            folder: targetFolderId,
                            recurrenceId: model.get('recurrenceId'),
                            timestamp: model.get('lastModified')
                        }
                    });
                });
                return http.resume().then(function (data) {
                    var def = $.Deferred(),
                        error = _(data).find(function (res) {
                            return !!res.error;
                        });
                    if (error) {
                        def.reject(error.error);
                        // reset models
                        _(models).each(function (model) {
                            api.pool.add(model.get('folder'), model.toJSON());
                        });
                    } else {
                        def.resolve(data);
                    }
                    return def;
                }).then(processResponse).done(function (list) {
                    _(list).each(function (obj) {
                        api.trigger('move:' + util.ecid(obj), targetFolderId);
                    });
                    api.trigger('refresh.all');
                });
            },

            // store last time we checked for invites
            getInvitesSince: 0,

            getInvites: function () {
                var now = moment().valueOf();

                return http.GET({
                    module: 'chronos',
                    params: {
                        action: 'updates',
                        folder: 'cal://0/' + folderApi.getDefaultFolder('calendar'),
                        timestamp: api.getInvitesSince || moment().subtract(5, 'years').valueOf(),
                        rangeStart: moment().subtract(2, 'hours').format('YYYYMMDD[T]HHmmss[Z]'),
                        until: moment().add(2, 'years').format('YYYYMMDD[T]HHmmss[Z]')
                    }
                })
                .then(function (data) {
                    // sort by startDate & look for unconfirmed appointments
                    // exclude appointments that already ended
                    var invites = _(data.newAndModified)
                        .filter(function (item) {

                            var isOver = moment.tz(item.endDate.value, item.endDate.tzid).valueOf() < now,
                                isRecurring = !!item.recurrenceId;

                            if (!isRecurring && isOver) {
                                return false;
                            }

                            return _(item.attendees).any(function (user) {
                                return user.entity === ox.user_id && user.partStat === 'NEEDS-ACTION';
                            });
                        });
                    api.getInvitesSince = now;
                    // even if empty array is given it needs to be triggered to remove
                    // notifications that does not exist anymore (already handled in ox6 etc)
                    api.trigger('new-invites', { invitesToAdd: invites, invitesToRemove: data.deleted });
                    return invites;
                });
            },

            getAlarms: function () {
                return http.GET({
                    module: 'chronos/alarm',
                    params: {
                        action: 'until',
                        // 3 days should be enough for the oldest reminder
                        rangeStart: moment.utc().subtract(3, 'days').format('YYYYMMDD[T]HHmmss[Z]'),
                        rangeEnd: moment.utc().add(10, 'hours').format('YYYYMMDD[T]HHmmss[Z]'),
                        actions: 'DISPLAY,AUDIO'
                    }
                })
                .then(function (data) {
                    // add alarmId as id (makes it easier to use in backbone collections)
                    data = _(data).map(function (obj) {
                        obj.id = obj.alarmId;
                        return obj;
                    });
                    var ids = _.uniq(_(data).map(function (obj) {
                        return { folder: obj.folder, folderId: obj.folder, id: obj.eventId };
                    }), function (item) { return util.cid(item); });

                    // ugly workaround for now
                    // todo remove once backend sends us acknowledge times in the until response
                    api.getList(ids).then(function (evts) {
                        data = _(data).filter(function (obj) {
                            var event = _(evts).findWhere({ cid: util.cid({ folder: obj.folder, id: obj.eventId }) });
                            if (!event) return false;
                            var alarm = _(event.get('alarms')).findWhere({ id: obj.alarmId });
                            if (!alarm) return false;
                            if (!alarm.acknowledged) return true;
                            obj.acknowledged = alarm.acknowledged;
                            return moment(obj.time).valueOf() > alarm.acknowledged;
                        });
                        api.trigger('resetChronosAlarms', data);
                    });
                });
            },

            acknowledgeAlarm: function (obj) {
                if (!obj) return $.Deferred().reject();
                if (_(obj).isArray()) {
                    http.pause();
                    _(obj).each(function (alarm) {
                        api.acknowledgeAlarm(alarm);
                    });
                    return http.resume();
                }
                return http.PUT({
                    module: 'chronos/alarm',
                    params: {
                        action: 'ack',
                        folder: obj.folder,
                        id: obj.eventId,
                        alarmId: obj.alarmId
                    }
                })
                .then(processResponse);
            },

            remindMeAgain: function (obj) {
                if (!obj) return $.Deferred().reject();

                return http.PUT({
                    module: 'chronos/alarm',
                    params: {
                        action: 'snooze',
                        folder: obj.folder,
                        id: obj.eventId,
                        alarmId: obj.alarmId,
                        snoozeTime: obj.time || 300000
                    }
                })
                .then(processResponse);
            },

            refresh: function () {
                // check capabilities
                if (capabilities.has('calendar')) {
                    api.getInvites();
                    api.getAlarms();
                    api.trigger('refresh.all');
                }
            },

            removeRecurrenceInformation: function (model) {
                var data = model.toJSON();
                delete data.rrule;
                return new models.Model(data);
            }
        };

    ox.on('refresh^', function () {
        api.refresh();
    });

    api.pool = Pool.create('chronos', {
        Collection: models.Collection
    });

    api.pool.map = function (data) {
        data.cid = util.cid(data);
        return data;
    };

    _.extend(api, Backbone.Events);

    return api;
});
