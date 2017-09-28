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

    var filter = function (data) {
            // do not add model to pool if it is a master model of a recurring event
            if (data.rrule && !data.recurrenceId) return false;
            return true;
        },
        // updates pool based on writing operations response (create update delete etc)
        processResponse = function (response) {
            if (!response) return;

            _(response.created).each(function (event) {
                if (filter(event)) api.pool.propagateAdd(event);
                cache.clear(event.folder);
                api.trigger('create', event);
                api.trigger('create:' + util.cid(event), event);
            });

            _(response.deleted).each(function (event) {
                // if there is a recurrence rule but no recurrenceId this means the whole series was deleted (recurrence master has no recurrenceId)
                if (event.rrule && !event.recurrenceId) {
                    var events = api.pool.findRecurrenceModels(event);
                    _(events).each(function (evt) {
                        evt.collection.remove(evt);
                        cache.clear(evt.folder);
                        api.trigger('delete', evt);
                        api.trigger('delete:' + util.cid(evt), evt);
                    });
                } else {
                    var model = api.pool.getModel(util.cid(event));
                    if (model) model.collection.remove(model);
                    cache.clear(event.folder);
                    api.trigger('delete', event);
                    api.trigger('delete:' + util.cid(event), event);
                }
            });

            _(response.updated).each(function (event) {
                if (filter(event)) {
                    // first we must remove the unused attributes (don't use clear method as that kills the id and we cannot override the model again with add)
                    // otherwise attributes that no longer exists are still present after merging (happens if an event has no attachments anymore for example)
                    var model = api.pool.getModel(util.cid(event)),
                        removeAttributes = _.difference(_(model.attributes).keys(), _(event).keys(), ['index', 'cid']);
                    removeAttributes.forEach(function (attr) {
                        event[attr] = undefined;
                    });
                    api.pool.propagateUpdate(event);
                }
                cache.clear(event.folder);
                api.trigger('update', event);
                api.trigger('update:' + util.cid(event), event);
            });

            return response;
        },
        cache = {
            hash: {},
            get: function (cid) {
                return this.hash[cid];
            },
            put: function (cid, value) {
                this.hash[cid] = value;
            },
            clear: function (folder) {
                if (folder) {
                    var self = this;
                    _(this.hash).each(function (value, key) {
                        if (key.indexOf('folder=' + folder + '&') >= 0) delete self.hash[key];
                    });
                    return;
                }
                this.hash = {};
            }
        },
        api = {
            // convenience function
            cid: util.cid,
            getAll: (function () {
                function get(params, opt) {
                    var paramsString = api.collectionLoader.cid(params);
                    if (opt.useCache && cache.get(paramsString)) {
                        var data = _(cache.get(paramsString)).filter(util.rangeFilter(opt.start, opt.end));
                        return $.when(data);
                    }

                    return http.GET({
                        module: 'chronos',
                        params: {
                            action: 'all',
                            folder: params.folder,
                            rangeStart: params.start.utc().format('YYYYMMDD[T]HHMMss[Z]'),
                            rangeEnd: params.end.utc().format('YYYYMMDD[T]HHMMss[Z]'),
                            order: 'asc',
                            expand: true
                        }
                    }).then(function (data) {
                        cache.put(paramsString, data);
                        return _(data).filter(util.rangeFilter(opt.start, opt.end));
                    });
                }

                return function (opt, useCache) {
                    var params = _.extend({
                        start: _.now(),
                        end: _.now()
                    }, opt || {});
                    opt.useCache = opt.useCache !== false && useCache !== false;
                    // round start and end to start and end of month
                    params.start = moment(params.start).startOf('month');
                    params.end = moment(params.end).endOf('month');

                    http.pause();
                    var start, limit = params.end.valueOf(), reqs = [];
                    for (start = params.start.clone(); start.valueOf() < limit; start.add(1, 'month')) {
                        reqs.push(get({
                            start: start.clone(),
                            end: start.clone().endOf('month'),
                            folder: params.folder
                        }, opt));
                    }
                    return http.resume().then(function () {
                        return $.when.apply($, reqs);
                    }).then(function () {
                        return _(arguments)
                            .chain()
                            .flatten()
                            .uniq(function (event) {
                                return util.cid(event);
                            })
                            .value();
                    });
                };
            }()),

            get: function (obj, useCache) {

                obj = obj instanceof Backbone.Model ? obj.attributes : obj;

                if (useCache !== false) {
                    var model = api.pool.getModel(util.cid(obj));
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
                    api.pool.propagateAdd(data);
                    return api.pool.getModel(data);
                });
            },

            getList: function (list, useCache) {
                var def, reqList = list;
                if (useCache !== false) {
                    reqList = list.filter(function (obj) {
                        return !api.pool.getModel(util.cid(obj));
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
                            api.pool.propagateAdd(obj);
                        });
                    }
                    return list.map(function (obj) {
                        if (!filter(obj)) return new models.Model(obj);
                        var cid = util.cid(obj);
                        return api.pool.getModel(cid);
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
                    if (!data.conflicts && attachmentHandlingNeeded && data.updated.length > 0) {
                        //to make the detailview show the busy animation
                        api.addToUploadList(util.cid(data.created[0]));
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

                    if (data.created.length > 0 && !filter(data.created[0])) return new models.Model(data);
                    return api.pool.getModel(data.created[0]);
                });
            },

            update: function (obj, options) {
                options = options || {};

                obj = obj instanceof Backbone.Model ? obj.attributes : obj;

                var attachmentHandlingNeeded = obj.tempAttachmentIndicator;
                delete obj.tempAttachmentIndicator;

                var params = {
                    action: 'update',
                    folder: obj.folder,
                    id: obj.id,
                    timestamp: obj.timestamp,
                    // convert to true boolean
                    ignore_conflicts: !!options.ignore_conflicts
                };

                if (obj.recurrenceId) params.recurrenceId = obj.recurrenceId;

                return http.PUT({
                    module: 'chronos',
                    params: params,
                    data: obj
                }).then(function (data) {
                    if (!data.conflicts && attachmentHandlingNeeded && data.updated.length > 0) {
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

                    if (data.updated.length > 0 && !filter(data.updated[0])) return new models.Model(data);
                    if (data.updated.length > 0) return api.pool.getModel(data.updated[0]);
                    return api.pool.getModel(util.cid(obj));
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
                    // TODO check if updated[0] exists
                    if (!response.conflicts) {
                        // updates notification area for example
                        // don't use api.pool.getModel as this returns undefined if the recurrence master was updated
                        api.trigger('mark:invite:confirmed', response.updated[0]);
                    }
                    return response;
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
                        collection = api.pool.getCollectionsByModel(obj)[0],
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
                            api.pool.propagateAdd(model.toJSON());
                        });
                    } else {
                        def.resolve(data);
                    }
                    return def;
                }).then(processResponse).done(function (list) {
                    _(list).each(function (obj) {
                        api.trigger('move:' + util.cid(obj), targetFolderId);
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
                        timestamp: api.getInvitesSince || moment().subtract(1, 'years').valueOf(),
                        rangeStart: moment().subtract(2, 'hours').format('YYYYMMDD[T]HHmmss[Z]'),
                        until: moment().add(2, 'years').format('YYYYMMDD[T]HHmmss[Z]')
                    }
                })
                .then(function (data) {

                    // exclude appointments that already ended
                    // only use the next recurrence for recurring appointments
                    var recurrences = {},
                        invites = _(data.newAndModified)
                        .filter(function (item) {

                            var isOver = moment.tz(item.endDate.value, item.endDate.tzid || moment.defaultZone.name).valueOf() < now,
                                isRecurring = !!item.recurrenceId;

                            if (isOver) {
                                return false;
                            }

                            if (isRecurring) {
                                // yes use _.ecid here not the util.cid function
                                // this way we get the id of the recurrence master
                                if (recurrences[_.ecid(item)]) {
                                    return false;
                                }
                                recurrences[_.ecid(item)] = true;
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

                    api.trigger('resetChronosAlarms', data);
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
                var data = model instanceof Backbone.Model ? model.toJSON() : _(model).clone();
                delete data.rrule;
                delete data.recurrenceId;
                delete data.seriesId;
                if (model instanceof Backbone.Model) return new models.Model(data);
                return data;
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

    api.pool.getCollectionsByCID = function (cid) {
        var folder = util.cid(cid).folder,
            collections = this.getByFolder(folder).filter(function (collection) {
                return !!collection.get(cid);
            });
        if (collections.length === 0) return [this.get('detail')];
        return collections;
    };

    function getByRegex(regex, cid) {
        var result = regex.exec(cid);
        if (result && result.length >= 2) return result[1];
    }

    _.extend(api.pool, {

        getCollectionsByModel: function (data) {
            var model = data instanceof Backbone.Model ? data : new models.Model(data),
                collections = this.getByFolder(model.get('folder')).filter(function (collection) {
                    var start = getByRegex(/start=([^&]*)/, collection.cid),
                        end = getByRegex(/end=([^&]*)/, collection.cid);
                    // sepcial handling for list-view collection
                    if (!start || !end) {
                        start = moment().startOf('day').valueOf();
                        end = moment().startOf('day').add(collection.offset || 1, 'month').valueOf();
                    }
                    if (model.getTimestamp('endDate') < start) return false;
                    if (model.getTimestamp('startDate') > end) return false;
                    return true;
                });
            if (collections.length === 0) return [this.get('detail')];
            return collections;
        },

        propagateAdd: function (data) {
            data.cid = util.cid(data);
            var collections = api.pool.getCollectionsByModel(data);
            collections.forEach(function (collection) {
                api.pool.add(collection.cid, data);
            });
        },

        propagateUpdate: function (data) {
            var cid = _.cid(data),
                model = this.getModel(cid);
            if (_.isEqual(data.startDate, model.get('startDate'))
                && _.isEqual(data.endDate, model.get('endDate'))) return this.propagateAdd(data);
            var oldCollections = this.getCollectionsByModel(model),
                newCollections = this.getCollectionsByModel(data);
            // collections which formerly contain that model but won't contain it in the future
            _.difference(oldCollections, newCollections).forEach(function (collection) {
                collection.remove(cid);
            });
            newCollections.forEach(function (collection) {
                api.pool.add(collection.cid, data);
            });
        },

        getModel: function (data) {
            var collections, cid;
            if (_.isString(data)) {
                cid = data;
                collections = api.pool.getCollectionsByCID(cid);
            } else {
                cid = util.cid(data);
                collections = api.pool.getCollectionsByModel(data);
            }
            if (collections.length === 0) return;
            return collections[0].get(cid);
        },

        findRecurrenceModels: function (event) {
            event = event instanceof Backbone.Model ? event.attributes : event;
            var cid = util.cid({ folder: event.folder, id: event.cid }),
                collections = api.pool.getByFolder(event.folder),
                filterRecurrences = function (model) {
                    return model.cid.indexOf(cid) === 0;
                },
                models = collections.map(function (collection) {
                    return collection.filter(filterRecurrences);
                });
            return _(models)
                .chain()
                .flatten()
                .uniq(function (model) {
                    return model.cid;
                })
                .value();
        }

    });

    api.collectionLoader = new CollectionLoader({
        module: 'chronos',
        paginateCompare: false,
        getQueryParams: function (params) {
            return params;
        },
        httpGet: function (module, params) {
            // special handling for requests of listview
            if (params.view === 'list') {
                var offset = this.collection.offset || 1, start, end;
                // detect pagination
                if (params.limit.split(',')[0] === '0') {
                    start = 0;
                    end = offset;
                } else {
                    start = offset;
                    end = offset + 1;
                    this.collection.offset = end;
                }
                params.start = moment().startOf('day').add(start, 'month').valueOf();
                params.end = moment().startOf('day').add(end, 'month').valueOf();
            }
            return api.getAll(params, !this.collection.expired).then(function (data) {
                data.forEach(function (obj) {
                    obj.cid = util.cid(obj);
                });
                return data;
            });
        },
        fail: function (error) {
            if (error && error.code !== 'APP-0013') {
                require(['io.ox/core/notifications', 'gettext!io.ox/calendar'], function (notifications, gt) {
                    notifications.yell('error', gt('An error occurred. Please try again.'));
                });
            }
        }
    });

    _.extend(api, Backbone.Events);

    return api;
});
