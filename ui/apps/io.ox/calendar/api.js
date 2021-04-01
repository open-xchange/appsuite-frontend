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

define('io.ox/calendar/api', [
    'io.ox/core/http',
    'io.ox/core/api/collection-pool',
    'io.ox/core/api/collection-loader',
    'io.ox/core/folder/api',
    'io.ox/calendar/util',
    'io.ox/calendar/model',
    'io.ox/core/capabilities',
    'settings!io.ox/calendar'
], function (http, Pool, CollectionLoader, folderApi, util, models, capabilities, settings) {

    'use strict';

    var isRecurrenceMaster = function (data) {
            // do not add model to pool if it is a master model of a recurring event
            if (data.rrule && !data.recurrenceId) return true;
            return false;
        },
        removeFromPool = function (event) {
            // cannot find event when it is recurrence master
            var events = api.pool.getModel(util.cid(event));
            if (events) events = [events];
            else events = api.pool.findRecurrenceModels(event);
            events.forEach(function (evt) {
                evt.collection.remove(evt);
                api.trigger('delete', evt.attributes);
                api.trigger('delete:' + util.cid(evt), evt.attributes);
            });
        },
        // updates pool based on writing operations response (create update delete etc)
        processResponse = function (response, options) {
            if (!response) return;

            // post request responses are arrays with data and timestamp
            response = response.data || response;

            _(response.created).each(function (event) {
                if (!isRecurrenceMaster(event)) api.pool.propagateAdd(event);
                api.trigger('process:create', event);
                api.trigger('process:create:' + util.cid(event), event);
            });

            _(response.deleted).each(removeFromPool);

            _(response.updated).each(function (event) {
                if (isRecurrenceMaster(event)) {
                    var events = api.pool.findRecurrenceModels(event),
                        updates = _(event).pick('attendees', 'alarms', 'flags', 'timestamp');
                    events.forEach(function (evt) {
                        // exclude exceptions here, would result in wrong cache data (declined appointments suddenly looking accepted etc)
                        if (evt.hasFlag('overridden')) return;
                        evt.set(updates);
                        api.trigger('update', evt.attributes);
                        api.trigger('update:' + util.cid(evt), evt.attributes, { updateData: { showRecurrenceInfo: options && options.showRecurrenceInfo } });
                    });

                } else {
                    // first we must remove the unused attributes (don't use clear method as that kills the id and we cannot override the model again with add)
                    // otherwise attributes that no longer exists are still present after merging (happens if an event has no attachments anymore for example)
                    var model = api.pool.getModel(util.cid(event)),
                        removeAttributes;

                    if (model) {
                        removeAttributes = _.difference(_(model.attributes).keys(), _(event).keys(), ['index', 'cid']);
                        removeAttributes.forEach(function (attr) {
                            event[attr] = undefined;
                        });
                    }

                    api.pool.propagateUpdate(event);
                }
                api.trigger('update', event);
                api.trigger('update:' + util.cid(event), event, { updateData: { showRecurrenceInfo: options && options.showRecurrenceInfo } });
            });


            var errors = (response.failed || []).concat(response.error);
            _(errors).each(function (error) {
                require(['io.ox/core/notifications'], function (notifications) {
                    notifications.yell(error);
                });
            });

            return response;
        },

        defaultFields = ['lastModified', 'color', 'createdBy', 'endDate', 'flags', 'folder', 'id', 'location', 'recurrenceId', 'rrule', 'seriesId', 'startDate', 'summary', 'timestamp', 'transp'].join(','),

        api = {
            // used externally by itip updates in mail invites
            updatePoolData: processResponse,

            // convenience function
            cid: util.cid,

            defaultFields: defaultFields,

            request: (function () {
                function getParams(opt, start, end) {
                    opt = _.clone(opt);
                    opt.params = _.extend({}, opt.params, {
                        rangeStart: start.format(util.ZULU_FORMAT),
                        rangeEnd: end.format(util.ZULU_FORMAT)
                    });
                    return opt;
                }
                function merge(data1, data2) {
                    return _(data1)
                        .chain()
                        .union(data2)
                        .uniq(function (event) { return util.cid(event); })
                        .compact()
                        .value();
                }
                return function request(opt, method) {
                    method = method || 'GET';
                    return http[method](opt).then(function (result) {
                        if (_.isArray(result)) {
                            var error;
                            result.forEach(function (r) {
                                if (r.error) {
                                    ox.trigger('http:error:' + r.error.code, r.error);
                                    error = r.error;
                                }
                            });
                            // only throw that specific error too many appointments error because otherwise this error might only affect a few folders
                            if (error && error.code === 'CAL-5072') throw error;
                        }
                        return result;
                    }).catch(function (err) {
                        if (err.code !== 'CAL-5072') throw err;
                        var start = moment(opt.params.rangeStart).utc(),
                            end = moment(opt.params.rangeEnd).utc(),
                            diff = end.diff(start, 'ms'),
                            middle = moment(start).add(diff / 2, 'ms');
                        // stop requests when timeframe is smaller than an hour, see Bug 68641
                        if (diff <= 3600000) {
                            throw err;
                        }

                        // use multiple to speed this up
                        http.pause();
                        var def = $.when(request(getParams(opt, start, middle), method), request(getParams(opt, middle, end), method)).then(function (data1, data2) {
                            if (!_.isArray(data1)) return merge(data1, data2);
                            data1.forEach(function (d, index) {
                                d.events = merge(d.events, data2[index].events);
                            });
                            return data1;
                        });
                        http.resume();

                        return def;
                    });
                };
            }()),

            get: function (obj, useCache) {

                obj = obj instanceof Backbone.Model ? obj.attributes : obj;

                if (useCache !== false) {
                    var model = api.pool.getModel(util.cid(obj));
                    if (model && model.get('attendees')) return $.when(model);
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
                        folder: obj.folder,
                        extendedEntities: true
                    }
                }).then(function (data) {
                    if (data.id !== obj.id) {
                        // something's wrong, probably an exception was created by another client.
                        // real error vs just a new exception
                        if (data.seriesId !== obj.id) {
                            // to help in debugging if needed
                            console.error('calendar error: id ' + obj.id + ' was requested, but id ' + data.id + ' was returned', obj, data);
                        }
                    }
                    if (isRecurrenceMaster(data)) return api.pool.get('detail').add(data);
                    api.pool.propagateAdd(data);
                    return api.pool.getModel(data);
                });
            },

            resolve: function (id, useCache) {
                var sequence;
                if (_.isObject(id)) {
                    sequence = id.sequence;
                    id = id.id;
                }
                if (useCache !== false) {
                    var collections = api.pool.getCollections(), model;
                    _(collections).find(function (data) {
                        var collection = data.collection;
                        model = collection.find(function (m) {
                            return m.get('id') === id && !m.has('recurrenceId') && (sequence === undefined || m.get('sequence') === sequence);
                        });
                        return !!model;
                    });
                    if (model) return $.when(model);
                }

                var params = {
                    action: 'resolve',
                    id: id,
                    fields: api.defaultFields
                };
                if (sequence !== undefined) params.sequence = sequence;

                return http.GET({
                    module: 'chronos',
                    params: params
                }).then(function (data) {
                    if (isRecurrenceMaster(data)) return api.pool.get('detail').add(data);
                    api.pool.propagateAdd(data);
                    return api.pool.getModel(data);
                });
            },

            getList: (function () {
                function requestList(list) {
                    return http.PUT({
                        module: 'chronos',
                        params: {
                            action: 'list',
                            fields: defaultFields
                        },
                        data: list
                    }).catch(function (err) {
                        if (err.code !== 'CAL-5072') throw err;
                        // split list in half if error code suggested a too large list
                        var list1 = _(list).first(Math.ceil(list.length / 2)),
                            list2 = _(list).last(Math.floor(list.length / 2));
                        return requestList(list1).then(function (data1) {
                            return requestList(list2).then(function (data2) {
                                return [].concat(data1).concat(data2);
                            });
                        });
                    });
                }
                return function (list, useCache) {

                    var alarms = [];
                    list = _(list).map(function (obj) {
                        // if an alarm object was used to get the associated event we need to use the eventId not the alarm Id
                        if (obj.eventId) {
                            alarms.push(obj);
                            return { id: obj.eventId, folder: obj.folder, recurrenceId: obj.recurrenceId };
                        }
                        return obj;
                    });

                    var def, reqList = list;

                    if (useCache !== false) {
                        reqList = list.filter(function (obj) {
                            var model = api.pool.getModel(util.cid(obj));
                            // since we are using a list request even models without attendees are fine
                            return !model;
                        });
                    }

                    if (reqList.length > 0) def = requestList(reqList);
                    else def = $.when();

                    return def.then(function (data) {
                        if (data) {
                            data.forEach(function (obj, index) {
                                if (obj === null) {
                                    var alarm = { eventId: reqList[index].id, folder: reqList[index].folder };
                                    if (reqList[index].recurrenceId) alarm.recurrenceId = reqList[index].recurrenceId;
                                    api.trigger('failedToFetchEvent', _(alarms).findWhere(alarm));
                                    api.trigger('delete:appointment', reqList[index]);
                                    // null means the event was deleted, clean up the caches
                                    processResponse({
                                        deleted: [reqList[index]]
                                    });
                                    return;
                                }
                                if (isRecurrenceMaster(obj)) return;

                                var model = api.pool.getModel(util.cid(obj));
                                // do not overwrite cache data that has attendees and the same or newer lastModified timestamp
                                if (model && model.get('attendees') && (model.get('lastModified') >= obj.lastModified)) {
                                    return;
                                }
                                api.pool.propagateAdd(obj);
                            });
                        }

                        return list.map(function (obj) {
                            // if we have full data use the full data, in list data recurrence ids might be missing
                            // you can request exceptions without recurrence id because they have own ids, but in the reponse they still have a recurrence id, which is needed for the correct cid
                            if (data) {
                                // find correct index
                                var index = _(reqList).findIndex(function (req) {
                                    return req.id === obj.id && req.folder === obj.folder && (!req.recurrenceId || req.recurrenceId === obj.recurrenceId);
                                });
                                if (index !== -1 && data[index]) {
                                    obj = data[index];
                                } else if (index !== -1 && data[index] === null) {
                                    // null is returned when the event was deleted meanwhile
                                    return null;
                                }
                            }

                            if (isRecurrenceMaster(obj)) {
                                return api.pool.get('detail').add(obj);
                            }
                            var cid = util.cid(obj);
                            // in case of caching issues still return the request results. no one wants empty reminders
                            return api.pool.getModel(cid) || obj;
                        });
                    });
                };
            }()),

            create: function (obj, options) {
                options = options || {};

                obj = obj instanceof Backbone.Model ? obj.attributes : obj;
                obj = _(obj).pick(function (value) {
                    return value !== '' && value !== undefined && value !== null;
                });

                var params = {
                        action: 'new',
                        folder: obj.folder,
                        // convert to true boolean
                        checkConflicts: !!options.checkConflicts,
                        sendInternalNotifications: true,
                        fields: api.defaultFields
                    },
                    def;

                if (ox.socketConnectionId) params.pushToken = ox.socketConnectionId;

                if (options.expand) {
                    params.expand = true;
                    params.rangeStart = options.rangeStart;
                    params.rangeEnd = options.rangeEnd;
                }

                // backend uses this to calculate the usecount of groups (frontend resolves them that's why we tell the backend manually which groups were used)
                if (options.usedGroups) {
                    params.usedGroups = _(options.usedGroups).isArray() ? options.usedGroups.join(',') : options.usedGroups;
                }

                if (options.attachments && options.attachments.length) {
                    var formData = new FormData();

                    formData.append('json_0', JSON.stringify(obj));
                    for (var i = 0; i < options.attachments.length; i++) {
                        // the attachment data is given via the options parameter
                        formData.append('file_' + options.attachments[i].cid, options.attachments[i].file);
                    }
                    def = http.UPLOAD({
                        module: 'chronos',
                        params: params,
                        data: formData,
                        fixPost: true
                    });
                } else {
                    def = http.PUT({
                        module: 'chronos',
                        params: params,
                        data: obj
                    });
                }
                return def.then(processResponse)
                .then(function (data) {
                    // post request responses are arrays with data and timestamp
                    data = data.data || data;
                    api.getAlarms();
                    // return conflicts or new model
                    if (data.conflicts) {
                        return data;
                    }

                    if (data.created.length > 0) api.trigger('create', data.created[0]);
                    if (data.created.length > 0 && isRecurrenceMaster(data.created[0])) return api.pool.get('detail').add(data);
                    if (data.created.length > 0) return api.pool.getModel(data.created[0]);
                });
            },

            update: function (obj, options) {
                options = options || {};

                obj = obj instanceof Backbone.Model ? obj.attributes : obj;
                obj = _(obj).mapObject(function (value) {
                    if (value === '') return null;
                    return value;
                });

                var def,
                    params = {
                        action: 'update',
                        folder: obj.folder,
                        id: obj.id,
                        timestamp: _.then(),
                        // convert to true boolean
                        checkConflicts: !!options.checkConflicts,
                        sendInternalNotifications: true,
                        recurrenceRange: options.recurrenceRange,
                        fields: api.defaultFields
                    };

                if (ox.socketConnectionId) params.pushToken = ox.socketConnectionId;

                if (obj.recurrenceId) params.recurrenceId = obj.recurrenceId;

                if (options.expand) {
                    params.expand = true;
                    params.rangeStart = options.rangeStart;
                    params.rangeEnd = options.rangeEnd;
                }

                // backend uses this to calculate the usecount of groups (frontend resolves them that's why we tell the backend manually which groups were used)
                if (options.usedGroups) {
                    params.usedGroups = _(options.usedGroups).isArray() ? options.usedGroups.join(',') : options.usedGroups;
                }

                var data = {
                    event: obj
                };

                if (options.comment) data.comment = options.comment;

                if (options.attachments && options.attachments.length) {
                    var formData = new FormData();

                    formData.append('json_0', JSON.stringify(data));
                    for (var i = 0; i < options.attachments.length; i++) {
                        // the attachment data is given via the options parameter
                        formData.append('file_' + options.attachments[i].cid, options.attachments[i].file);
                    }
                    def = http.UPLOAD({
                        module: 'chronos',
                        params: params,
                        data: formData,
                        fixPost: true
                    });
                } else {
                    def = http.PUT({
                        module: 'chronos',
                        params: params,
                        data: data
                    });
                }
                return def.then(function (response) {
                    processResponse(response, options);
                    return response;
                }).then(function (data) {
                    // post request responses are arrays with data and timestamp
                    data = data.data || data;

                    api.getAlarms();
                    // return conflicts or new model
                    if (data.conflicts) {
                        return data;
                    }

                    var updated = data.updated ? data.updated[0] : undefined;
                    if (!updated) return api.pool.getModel(util.cid(obj));
                    if (isRecurrenceMaster(updated)) return api.pool.get('detail').add(data);
                    return api.pool.getModel(updated);
                });
            },

            remove: function (list, options) {
                options = _.extend({}, options);
                api.trigger('beforedelete', list);
                list = _.isArray(list) ? list : [list];

                var params = {
                        action: 'delete',
                        timestamp: _.then(),
                        fields: api.defaultFields
                    },
                    data = {
                        events: _(list).map(function (obj) {
                            obj = obj instanceof Backbone.Model ? obj.attributes : obj;
                            var params = {
                                id: obj.id,
                                folder: obj.folder
                            };
                            if (obj.recurrenceId) params.recurrenceId = obj.recurrenceId;
                            if (obj.recurrenceRange) params.recurrenceRange = obj.recurrenceRange;
                            return params;
                        })
                    };

                if (ox.socketConnectionId) params.pushToken = ox.socketConnectionId;

                if (options.expand) {
                    params.expand = true;
                    params.rangeStart = options.rangeStart;
                    params.rangeEnd = options.rangeEnd;
                }

                if (options.comment) data.comment = options.comment;

                return http.PUT({
                    module: 'chronos',
                    params: params,
                    data: data
                })
                .then(function (data) {
                    data.forEach(processResponse);
                    return data;
                })
                .then(function (data) {
                    api.getAlarms();
                    return data;
                });
            },

            confirm: function (obj, options) {
                options = options || {};
                // no empty string comments (clutters database)
                // if comment should be deleted, send null. Just like in settings
                if (obj.attendee.comment === '') delete obj.attendee.comment;

                // make sure alarms are explicitly set to null when declining, otherwise the user is reminded of declined appointments, we don't want that
                // do this in api to catch all cases (shortcut buttons, full dialogs, mail invitations etc)
                if (obj.attendee.partStat === 'DECLINED') obj.alarms = null;

                var params = {
                        action: 'updateAttendee',
                        id: obj.id,
                        folder: obj.folder,
                        checkConflicts: options.checkConflicts,
                        sendInternalNotifications: true,
                        timestamp: _.then(),
                        fields: api.defaultFields
                    },
                    data = {
                        attendee: obj.attendee
                    };

                if (ox.socketConnectionId) params.pushToken = ox.socketConnectionId;

                if (obj.recurrenceId) {
                    params.recurrenceId = obj.recurrenceId;
                }
                // null means remove alarms
                if (obj.alarms || obj.alarms === null) {
                    data.alarms = obj.alarms;
                }
                if (options.expand) {
                    params.expand = true;
                    params.rangeStart = options.rangeStart;
                    params.rangeEnd = options.rangeEnd;
                }

                return http.PUT({
                    module: 'chronos',
                    params: params,
                    data: data
                })
                .then(processResponse)
                .then(function (response) {
                    if (!response.conflicts) {
                        if (response.updated && response.updated.length) {
                            // updates notification area for example
                            // don't use api.pool.getModel as this returns undefined if the recurrence master was updated
                            api.trigger('mark:invite:confirmed', response.updated[0]);
                        } else if (response.updated && response.updated.length === 0) {
                            // updates where possibly out of range, get new invites to remove invites and update data
                            api.getInvites();
                        }
                    }

                    return response;
                });
            },

            updateAlarms: function (obj, options) {

                var params = {
                    action: 'updateAlarms',
                    id: obj.id,
                    folder: obj.folder,
                    timestamp: _.now(),
                    fields: api.defaultFields + ',alarms,rrule'
                };

                if (obj.recurrenceId) {
                    params.recurrenceId = obj.recurrenceId;
                }

                if (options.expand) {
                    params.expand = true;
                    params.rangeStart = options.rangeStart;
                    params.rangeEnd = options.rangeEnd;
                }

                return http.PUT({
                    module: 'chronos/alarm',
                    params: params,
                    data: obj.alarms
                })
                .then(function (data) {
                    // somehow the backend misses the alarms property when alarms are set to 0
                    if (obj.alarms.length === 0 && !obj.recurrenceId) {
                        data.updated[0].alarms = [];
                    }
                    processResponse(data);
                });
            },

            // returns freebusy data
            freebusy: function (list, options) {
                if (list.length === 0) {
                    return $.Deferred().resolve([]);
                }

                options = _.extend({
                    from: moment().startOf('day').utc().format(util.ZULU_FORMAT),
                    until: moment().startOf('day').utc().add(1, 'day').format(util.ZULU_FORMAT)
                }, options);

                // only use uri. entity only works for internal users/resources, which can also appear as external in some cases, causing ugly issues
                var order = _(list).map(function (attendee) { return attendee.uri; }),
                    def = $.Deferred();

                http.PUT({
                    module: 'chronos',
                    params: {
                        action: 'freeBusy',
                        from: options.from,
                        until: options.until
                    },
                    data: { attendees: list }
                }).then(function (items) {
                    // response order might not be the same as in the request. Fix that.
                    items.sort(function (a, b) {
                        return order.indexOf(a.attendee.uri) - order.indexOf(b.attendee.uri);
                    });
                    def.resolve(items);
                },
                function (err) {
                    // to many events
                    if (err.code !== 'CAL-5072') def.reject(err);
                    // split request and send as multiple instead
                    http.pause();
                    _(list).each(function (attendee) {
                        http.PUT({
                            module: 'chronos',
                            params: {
                                action: 'freeBusy',
                                from: options.from,
                                until: options.until
                            },
                            data: { attendees: [attendee] }
                        });
                    });
                    http.resume().then(function (result) {
                        // change errors to empty arrays. If theres an error with one attendee we can still show the rest
                        result = result.map(function (singleResult) {
                            return singleResult.error ? { freeBusyTime: [] } : singleResult.data[0];
                        });
                        def.resolve(result);
                    });
                });

                return def;
            },

            reduce: function (obj) {
                obj = obj instanceof Backbone.Model ? obj : _(obj);
                return obj.pick('id', 'folder', 'recurrenceId');
            },

            move: function (list, targetFolderId, options) {
                options = options || {};
                list = [].concat(list);
                var models = _(list).map(function (obj) {
                    var cid = util.cid(obj),
                        collection = api.pool.getCollectionsByModel(obj)[0],
                        model = collection.get(cid);
                    collection.remove(model);
                    return model;
                });

                http.pause();
                _(models).map(function (model) {
                    var params = {
                        action: 'move',
                        id: model.get('id'),
                        folder: model.get('folder'),
                        targetFolder: targetFolderId,
                        recurrenceId: model.get('recurrenceId'),
                        sendInternalNotifications: true,
                        timestamp: _.then(),
                        fields: api.defaultFields
                    };

                    if (ox.socketConnectionId) params.pushToken = ox.socketConnectionId;

                    if (options.expand) {
                        params.expand = true;
                        params.rangeStart = options.rangeStart;
                        params.rangeEnd = options.rangeEnd;
                    }
                    return http.PUT({
                        module: 'chronos',
                        params: params
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
                }).then(function (data) {
                    data.forEach(processResponse);
                    return data;
                }).done(function (list) {
                    _(list).each(function (obj) {
                        api.trigger('move:' + util.cid(obj), targetFolderId);
                        api.trigger('move', obj.data.created[0]);
                    });
                    api.trigger('refresh.all');
                });
            },

            getInvites: function () {
                return http.GET({
                    module: 'chronos',
                    params: {
                        action: 'needsAction',
                        folder: folderApi.getDefaultFolder('calendar'),
                        rangeStart: moment().subtract(2, 'hours').utc().format(util.ZULU_FORMAT),
                        rangeEnd: moment().add(1, 'years').utc().format(util.ZULU_FORMAT),
                        fields: 'folder,id,recurrenceId,organizer,endDate,startDate,summary,location,rrule',
                        sort: 'startDate'
                    }
                }).then(function (data) {
                    // even if empty array is given it needs to be triggered to remove
                    // notifications that does not exist anymore (already handled in ox6 etc)
                    // no filtering needed because of new needsAction request
                    api.trigger('new-invites', data);
                    return data;
                });
            },

            getAlarms: function () {
                var params = {
                    action: 'pending',
                    rangeEnd: moment.utc().add(10, 'hours').format(util.ZULU_FORMAT),
                    actions: 'DISPLAY,AUDIO'
                };

                if (!settings.get('showPastReminders', true)) {
                    // longest reminder time is 4 weeks before the appointment start. So 30 days should work just fine to reduce the ammount of possible reminders
                    params.rangeStart = moment.utc().startOf('day').subtract(30, 'days').format(util.ZULU_FORMAT);
                }

                return http.GET({
                    module: 'chronos/alarm',
                    params: params
                })
                .then(function (data) {
                    // only one alarm per event per type, keep the newest one
                    data = _(data).chain().groupBy('action').map(function (alarms) {
                        var alarmsPerEvent = _(alarms).groupBy(function (alarm) { return util.cid({ id: alarm.eventId, folder: alarm.folder, recurrenceId: alarm.recurrenceId }); });

                        alarmsPerEvent = _(alarmsPerEvent).map(function (eventAlarms) {
                            var alarmsToAcknowledge = 0;
                            // yes length -1 is correct we want to keep at least one
                            for (; alarmsToAcknowledge < eventAlarms.length - 1; alarmsToAcknowledge++) {
                                // current alarm is already in the future or next alarm is in the future
                                if (moment(eventAlarms[alarmsToAcknowledge].time).valueOf() > _.now() ||
                                    (moment(eventAlarms[alarmsToAcknowledge].time).valueOf() < _.now() && moment(eventAlarms[alarmsToAcknowledge + 1].time).valueOf() > _.now())) {
                                    // we want to keep the newest alarm that is ready to show if there is one
                                    break;
                                }
                            }
                            // acknowledge old alarms
                            api.acknowledgeAlarm(eventAlarms.slice(0, alarmsToAcknowledge));
                            // slice acknowledged alarms
                            eventAlarms = eventAlarms.slice(alarmsToAcknowledge);

                            return eventAlarms;
                        });

                        return alarmsPerEvent;
                    }).flatten().value();

                    // add alarmId as id (makes it easier to use in backbone collections)
                    data = _(data).map(function (obj) {
                        obj.id = obj.alarmId;
                        obj.appointmentCid = util.cid({ id: obj.eventId, folder: obj.folder, recurrenceId: obj.recurrenceId });
                        return obj;
                    });

                    // no filtering active
                    if (settings.get('showPastReminders', true)) {
                        api.trigger('resetChronosAlarms', data);
                        return;
                    }

                    api.getList(data).done(function (models) {
                        data = _(data).filter(function (alarm) {
                            var model = _(models).findWhere({ cid: alarm.appointmentCid });
                            // Show only alarms with matching recurrenceId
                            if (!model) return false;
                            // if alarm is scheduled after the appointments end we will show it
                            if (model.getMoment('endDate').valueOf() < moment(alarm.time).valueOf()) return true;

                            // if the appointment is over we will not show any alarm for it
                            return model.getMoment('endDate').valueOf() > _.now();
                        });
                        api.trigger('resetChronosAlarms', data);
                    });
                });
            },

            acknowledgeAlarm: function (obj) {

                if (!obj) return $.Deferred().reject();
                if (_(obj).isArray()) {
                    if (obj.length === 0) return $.when();
                    http.pause();
                    _(obj).each(function (alarm) {
                        api.acknowledgeAlarm(alarm);
                    });
                    return http.resume();
                }
                var params = {
                    action: 'ack',
                    folder: obj.folder,
                    id: obj.eventId,
                    alarmId: obj.alarmId,
                    fields: api.defaultFields
                };

                if (ox.socketConnectionId) params.pushToken = ox.socketConnectionId;

                return http.PUT({
                    module: 'chronos/alarm',
                    params: params
                })
                .then(function (data) {
                    api.trigger('acknowledgedAlarm', obj);
                    processResponse(data);
                    return data;
                });
            },

            remindMeAgain: function (obj) {
                if (!obj) return $.Deferred().reject();

                var params = {
                    action: 'snooze',
                    folder: obj.folder,
                    id: obj.eventId,
                    alarmId: obj.alarmId,
                    snoozeTime: obj.time || 300000,
                    fields: api.defaultFields
                };

                if (ox.socketConnectionId) params.pushToken = ox.socketConnectionId;

                return http.PUT({
                    module: 'chronos/alarm',
                    params: params
                })
                .then(processResponse);
            },

            changeOrganizer: function (obj, options) {
                options = options || {};

                obj = obj instanceof Backbone.Model ? obj.attributes : obj;

                var params = {
                    action: 'changeOrganizer',
                    folder: obj.folder,
                    id: obj.id,
                    timestamp: _.then(),
                    fields: api.defaultFields
                };

                if (options.recurrenceRange) params.recurrenceRange = options.recurrenceRange;

                if (ox.socketConnectionId) params.pushToken = ox.socketConnectionId;

                if (obj.recurrenceId) params.recurrenceId = obj.recurrenceId;

                if (options.expand) {
                    params.expand = true;
                    params.rangeStart = options.rangeStart;
                    params.rangeEnd = options.rangeEnd;
                }

                var data = {
                    organizer: obj.organizer
                };

                if (options.comment) data.comment = options.comment;

                return http.PUT({
                    module: 'chronos',
                    params: params,
                    data: data
                })
                .then(processResponse)
                .then(function (data) {

                    var updated = data.updated ? data.updated[0] : undefined;
                    if (!updated) return api.pool.getModel(util.cid(obj));
                    if (isRecurrenceMaster(updated)) return api.pool.get('detail').add(data);
                    return api.pool.getModel(updated);
                });
            },

            refresh: function () {
                // check capabilities
                if (capabilities.has('calendar')) {
                    api.getInvites();
                    api.getAlarms();
                    api.trigger('refresh.all');
                }
            },

            refreshCalendar: function (folder) {
                var self = this;
                return http.GET({
                    module: 'chronos',
                    params: {
                        action: 'all',
                        rangeStart: moment(_.now()).format(util.ZULU_FORMAT),
                        rangeEnd: moment(_.now() + 1).format(util.ZULU_FORMAT),
                        fields: ['folder', 'id'],
                        updateCache: true,
                        folder: folder
                    }
                }).then(function () {
                    self.trigger('refresh.all');
                });
            },

            removeRecurrenceInformation: function (model) {
                var data = model instanceof Backbone.Model ? model.toJSON() : _(model).clone();
                delete data.rrule;
                delete data.recurrenceId;
                delete data.seriesId;
                if (model instanceof Backbone.Model) return new models.Model(data);
                return data;
            },

            getCollection: function (obj) {
                // TODO expand start/end to start/end of week if range is less than a week
                var cid = _(obj).map(function (val, key) {
                        val = _.isString(val) ? val : JSON.stringify(val);
                        return key + '=' + val;
                    }).join('&'),
                    collection = api.pool.get(cid);
                collection.setOptions(obj);
                return collection;
            }
        };

    // if the setting for past appointment reminders changes, we must get fresh ones , might be less or more alarms now
    settings.on('change:showPastReminders', api.getAlarms);

    ox.on('refresh^', function () {
        api.refresh();
    });

    // sync caches if backend sends push update notice
    // also get fresh alarms
    ox.on('socket:calendar:updates', function (data) {
        _(data.folders).each(function (folder) {
            _(api.pool.getByFolder(folder)).each(function (collection) {
                collection.expired = true;
                collection.sync();
            });
        });
        api.getAlarms();
    });

    api.pool = Pool.create('chronos', {
        Collection: models.Collection
    });

    function urlToHash(url) {
        var hash = {},
            s = url.split('&');
        s.forEach(function (str) {
            var t = str.split('=');
            hash[t[0]] = t[1];
        });
        return hash;
    }

    api.pool.get = _.wrap(api.pool.get, function (get, cid) {
        var hasCollection = !!this.getCollections()[cid],
            hash = urlToHash(cid),
            collection = get.call(this, cid);
        if (hasCollection || cid === 'detail' || !hash.folders || hash.folders.length === 0) {
            // remove comparator in case of search
            if (cid.indexOf('search/') === 0) collection.comparator = null;
            return collection;
        }
        // find models which should be in this collection
        var list = this.grep('start=' + hash.start, 'end=' + hash.end),
            models = _(list)
                .chain()
                .pluck('models')
                .flatten()
                .uniq(function (model) {
                    return model.cid;
                })
                .filter(function (model) {
                    return hash.folders.indexOf(model.get('folder')) >= 0;
                })
                .invoke('toJSON')
                .value();

        collection.add(models, { silent: true });
        if (collection.length > 0) collection.expired = true;

        return collection;
    });

    _.extend(api.pool, {

        map: function (data) {
            data.cid = util.cid(data);
            return data;
        },

        getByFolder: function (folder) {
            var regex = new RegExp('(folders=[^&]*' + folder + '|folder=' + folder + '&)');
            return _(this.getCollections())
                .chain()
                .filter(function (entry, id) {
                    return regex.test(id);
                })
                .pluck('collection')
                .value();
        },

        getCollectionsByCID: function (cid) {
            var folder = util.cid(cid).folder,
                collections = this.getByFolder(folder).filter(function (collection) {
                    return !!collection.get(cid);
                });
            // if this is a cid from a public folder we need to check the allPublic collections too
            var folderData = folderApi.pool.getModel(folder);
            if (folderData && folderData.is('public')) {
                collections.push.apply(
                    collections,
                    this.getByFolder('cal://0/allPublic').filter(function (collection) {
                        return !!collection.get(cid);
                    })
                );
            }
            if (collections.length === 0) return [this.get('detail')];
            return collections;
        },

        getCollectionsByModel: (function () {
            function filter(collection) {
                var params = urlToHash(collection.cid),
                    start = params.start,
                    end = params.end;
                if (params.view === 'list') {
                    start = moment().startOf('day').valueOf();
                    end = moment().startOf('day').add(collection.range, 'month').valueOf();
                }
                if (this.getTimestamp('endDate') <= start) return false;
                if (this.getTimestamp('startDate') >= end) return false;
                return true;
            }
            return function (data) {
                var model = data instanceof Backbone.Model ? data : new models.Model(data),
                    collections = this.getByFolder(model.get('folder')).filter(filter.bind(model)),
                    folder = folderApi.pool.getModel(model.get('folder'));
                if (folder && folder.is('public') && model.hasFlag('attendee')) {
                    collections.push.apply(
                        collections,
                        this.getByFolder('cal://0/allPublic').filter(filter.bind(model))
                    );
                }
                if (collections.length === 0) return [this.get('detail')];
                return collections;
            };
        }()),

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
            if (!model || (_.isEqual(data.startDate, model.get('startDate'))
                && _.isEqual(data.endDate, model.get('endDate')) && data.folder === model.get('folder'))) return this.propagateAdd(data);
            var oldCollections = this.getCollectionsByModel(model),
                newCollections = this.getCollectionsByModel(data);
            // collections which formerly contained that model but won't contain it in the future
            _.difference(oldCollections, newCollections).forEach(function (collection) {
                collection.remove(cid);
            });
            newCollections.forEach(function (collection) {
                api.pool.add(collection.cid, data);
            });
        },

        getModel: function (data) {
            var cid = data;
            if (!_.isString(data)) cid = util.cid(data);
            var collections = api.pool.getCollectionsByCID(cid);
            if (collections.length === 0) return;
            var model = collections[0].get(cid);
            if (!model && _.isObject(data)) model = collections[0].add(data);
            return model;
        },

        findRecurrenceModels: function (event) {
            event = event instanceof Backbone.Model ? event.attributes : event;
            var collections = api.pool.getByFolder(event.folder),
                exceptions = _([].concat(event.changeExceptionDates).concat(event.deleteExceptionDates)).compact(),
                filterRecurrences = function (model) {
                    if (model.get('seriesId') !== event.id) return false;
                    if (exceptions.indexOf(model.get('recurrenceId')) >= 0) return false;
                    return true;
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

    api.collectionLoader = {
        PRIMARY_SEARCH_PAGE_SIZE: 100,
        SECONDARY_SEARCH_PAGE_SIZE: 200,
        getDefaultCollection: function () {
            return new models.Collection();
        },
        load: function (params) {
            params = params || {};
            var collection = this.collection = api.getCollection(params);
            collection.originalStart = collection.originalStart || moment().startOf('day');
            collection.range = collection.range || 1;
            collection.setOptions({
                start: collection.originalStart.valueOf() + 1,
                end: collection.originalStart.clone().add(collection.range, 'months').valueOf(),
                folders: params.folders || []
            });
            collection.sync().then(function (data) {
                // trigger reset when data comes from cache
                if (!data || data.length === 0) collection.trigger('reset');
            });
            return collection;
        },
        reload: function (params) {
            var collection = this.collection = api.getCollection(params);
            collection.expired = true;
            collection.setOptions({
                start: collection.originalStart.valueOf() + 1,
                end: collection.originalStart.clone().add(collection.range, 'months').valueOf(),
                folders: params.folders || []
            });
            collection.sync();
            return collection;
        },
        paginate: function () {
            var collection = this.collection;
            if (!collection) return;
            collection.range++;
            collection.expired = true;
            collection.setOptions({
                start: collection.originalStart.clone().add(collection.range - 1, 'months').valueOf() + 1,
                end: collection.originalStart.clone().add(collection.range, 'months').valueOf(),
                folders: collection.folders || []
            });
            collection.sync({ paginate: true });
            return collection;
        }
    };

    _.extend(api, Backbone.Events);

    return api;
});
