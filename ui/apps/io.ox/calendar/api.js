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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/calendar/api',
    ['io.ox/core/http',
     'io.ox/core/event',
     'settings!io.ox/core',
     'io.ox/core/notifications',
     'io.ox/core/date',
     'io.ox/core/api/factory',
     'io.ox/core/capabilities'
    ], function (http, Events, coreConfig, notifications, date, factory, capabilities) {

    'use strict';

    var api = {

        MINUTE: date.MINUTE,
        HOUR: date.HOUR,
        DAY: date.DAY,
        WEEK: date.WEEK,

        // fluent caches
        caches: {
            freebusy: {},
            all: {},
            get: {},
            // object to store appointments, that have attachments uploading atm
            upload: {}
        },

        reduce: factory.reduce,

        get: function (o, useCache) {

            o = o || {};
            useCache = useCache === undefined ? true : !!useCache;
            var params = {
                action: 'get',
                id: o.id,
                folder: o.folder || o.folder_id,
                timezone: 'UTC'
            };

            if (o.recurrence_position !== null) {
                params.recurrence_position = o.recurrence_position;
            }

            var key = (o.folder || o.folder_id) + '.' + o.id + '.' + (o.recurrence_position || 0);

            if (api.caches.get[key] === undefined || !useCache) {
                return http.GET({
                        module: 'calendar',
                        params: params
                    })
                    .done(function (data) {
                        api.caches.get[key] = data;
                    });
            } else {
                return $.Deferred().resolve(api.caches.get[key]);
            }
        },

        getAll: function (o, useCache) {

            o = $.extend({
                start: _.now(),
                end: _.now() + (28 * date.DAY),
                order: 'asc'
            }, o || {});
            useCache = useCache === undefined ? true : !!useCache;
            var key = (o.folder || o.folder_id) + '.' + o.start + '.' + o.end + '.' + o.order,
                params = {
                    action: 'all',
                    // id, folder_id, private_flag, recurrence_id, recurrence_position, start_date,
                    // title, end_date, location, full_time, shown_as, users, organizer, organizerId, created_by,
                    // participants, recurrence_type, days, day_in_month, month, interval, until, occurrences
                    columns: '1,20,101,206,207,201,200,202,400,401,402,221,224,227,2,209,212,213,214,215,222,216,220',
                    start: o.start,
                    end: o.end,
                    showPrivate: true,
                    recurrence_master: false,
                    sort: '201',
                    order: o.order,
                    timezone: 'UTC'
                };

            if (o.folder !== undefined) {
                params.folder = o.folder;
            }
            if (api.caches.all[key] === undefined || !useCache) {
                return http.GET({
                        module: 'calendar',
                        params: params
                    })
                    .done(function (data) {
                        api.caches.all[key] = JSON.stringify(data);
                    });
            } else {
                return $.Deferred().resolve(JSON.parse(api.caches.all[key]));
            }
        },

        getList: function (ids) {
            return http.fixList(ids,
                http.PUT({
                    module: 'calendar',
                    params: {
                        action: 'list',
                        timezone: 'UTC'
                    },
                    data: http.simplify(ids)
                })
            );
        },

        getUpdates: function (o) {
            o = $.extend({
                start: _.now(),
                end: _.now() + 28 * 1 * date.DAY,
                timestamp:  _.now() - (2 * date.DAY),
                ignore: 'deleted',
                recurrence_master: false
            }, o || {});

            var key = (o.folder || o.folder_id) + '.' + o.start + '.' + o.end,
                params = {
                    action: 'updates',
                    // id, folder_id, private_flag, recurrence_id, recurrence_position, start_date,
                    // title, end_date, location, full_time, shown_as, users, organizer, organizerId, created_by, recurrence_type
                    columns: '1,20,101,206,207,201,200,202,400,401,402,221,224,227,2,209,212,213,214,215,222,216,220',
                    start: o.start,
                    end: o.end,
                    showPrivate: true,
                    recurrence_master: o.recurrence_master,
                    timestamp: o.timestamp,
                    ignore: o.ignore,
                    sort: '201',
                    order: 'asc',
                    timezone: 'UTC'
                };

            if (o.folder !== 'all') {
                params.folder = o.folder || coreConfig.get('folder/calendar');
            }

            // do not know if cache is a good idea
            if (api.caches.all[key] === undefined) {
                return http.GET({
                        module: 'calendar',
                        params: params
                    })
                    .done(function (data) {
                        api.caches.all[key] = JSON.stringify(data);
                    });
            } else {
                return $.Deferred().resolve(JSON.parse(api.caches.all[key]));
            }
        },

        search: function (query) {
            return http.PUT({
                    module: 'calendar',
                    params: {
                        action: 'search',
                        sort: '201',
                        // top-down makes more sense
                        order: 'desc',
                        timezone: 'UTC'
                    },
                    data: {
                        pattern: query
                    }
                });
        },

        needsRefresh: function (folder) {
            // has entries in 'all' cache for specific folder
            return api.caches.all[folder] !== undefined;
        },

        /**
         * update appointment
         * @param  {object} o (id, folder and changed attributes/values)
         * @fires  api#update (data)
         * @fires  api#update: + cid
         * @return {deferred} returns current appointment object
         */
        update: function (o) {
            var folder_id = o.folder_id || o.folder,
                key = folder_id + '.' + o.id + '.' + (o.recurrence_position || 0),
                attachmentHandlingNeeded = o.tempAttachmentIndicator;

            delete o.tempAttachmentIndicator;

            if (_.isEmpty(o)) {
                return $.when();
            } else {
                return http.PUT({
                    module: 'calendar',
                    params: {
                        action: 'update',
                        id: o.id,
                        folder: folder_id,
                        timestamp: o.timestamp || _.then(),
                        timezone: 'UTC'
                    },
                    data: o,
                    appendColumns: false
                })
                .then(function (obj) {
                    // check for conflicts
                    if (!_.isUndefined(obj.conflicts)) {
                        return $.Deferred().reject(obj);
                    }

                    checkForNotification(o);

                    var getObj = {
                        id: obj.id || o.id,
                        folder: folder_id
                    };

                    if (o.recurrence_position && o.recurrence_position !== null && obj.id === o.id) {
                        getObj.recurrence_position = o.recurrence_position;
                    }

                    // clear caches
                    api.caches.all = {};
                    delete api.caches.get[key];
                    // if master, delete all appointments from cache
                    if (o.recurrence_type > 0 && !o.recurrence_position) {
                        var deleteKey = folder_id + '.' + o.id;
                        for ( var i in api.caches.get ) {
                            if (i.indexOf(deleteKey) === 0) delete api.caches.get[i];
                        }
                    }

                    return api.get(getObj)
                        .then(function (data) {
                            if (attachmentHandlingNeeded) {
                                //to make the detailview show the busy animation
                                api.addToUploadList(_.ecid(data));
                            }
                            api.trigger('update', data);
                            api.trigger('update:' + _.ecid(o), data);
                            return data;
                        });
                }, function (error) {
                    api.caches.all = {};
                    api.trigger('delete', o);
                    return error;
                });
            }
        },

        /**
         * used to cleanup Cache and trigger refresh after attachmentHandling
         * @param  {object} o (appointment object)
         * @fires  api#update (data)
         * @return {deferred}
         */
        attachmentCallback: function (o) {
            var doCallback = api.uploadInProgress(_.ecid(o)),
                folder_id = o.folder_id || o.folder,
                key = folder_id + '.' + o.id + '.' + (o.recurrence_position || 0);

            // clear caches
            if (doCallback) {
                // clear caches
                api.caches.all = {};
                delete api.caches.get[key];
                // if master, delete all appointments from cache
                if (o.recurrence_type > 0 && !o.recurrence_position) {
                    var deleteKey = folder_id + '.' + o.id;
                    for ( var i in api.caches.get ) {
                        if (i.indexOf(deleteKey) === 0) delete api.caches.get[i];
                    }
                }
            }

            return api.get(o, !doCallback)
                .then(function (data) {
                    api.trigger('update', data);
                    api.trigger('update:' + _.ecid(o), data);
                    //to make the detailview remove the busy animation
                    api.removeFromUploadList(_.ecid(data));
                    return data;
                });
        },

        /**
         * create appointment
         * @param  {object} o
         * @fires  api#create (data)
         * @fires  api#update: + cid
         * @return {deferred} returns appointment
         */
        create: function (o) {
            var attachmentHandlingNeeded = o.tempAttachmentIndicator;
            delete o.tempAttachmentIndicator;
            return http.PUT({
                module: 'calendar',
                params: {
                    action: 'new',
                    timezone: 'UTC'
                },
                data: o,
                appendColumns: false
            })
            .then(function (obj) {
                if (!_.isUndefined(obj.conflicts)) {
                    return $.Deferred().reject(obj);
                }

                checkForNotification(o);

                var getObj = {
                    id: obj.id,
                    folder: o.folder_id
                };
                api.caches.all = {};

                if (o.recurrence_position && o.recurrence_position !== null) {
                    getObj.recurrence_position = o.recurrence_position;
                }

                return api.get(getObj)
                        .then(function (data) {
                            if (attachmentHandlingNeeded) {
                                //to make the detailview show the busy animation
                                api.addToUploadList(_.ecid(data));
                            }
                            api.trigger('create', data);
                            api.trigger('update:' + _.ecid(data), data);
                            return data;
                        });
            });
        },

        // delete is a reserved word :( - but this will delete the
        // appointment on the server
        remove: function (o) {
            var keys = [];

            o = _.isArray(o) ? o : [o];

            // pause http layer
            http.pause();

            api.trigger('beforedelete', o);

            _(o).each(function (obj) {
                keys.push((obj.folder_id || obj.folder) + '.' + obj.id + '.' + (obj.recurrence_position || 0));
                return http.PUT({
                    module: 'calendar',
                    params: {
                        action: 'delete',
                        timestamp: _.then()
                    },
                    data: obj,
                    appendColumns: false
                })
                .done(function () {
                    api.caches.all = {};
                    _(keys).each(function (key) {
                        delete api.caches.get[key];
                    });
                    api.trigger('delete', obj);
                    api.trigger('delete:' + _.ecid(obj), obj);
                    //remove Reminders in Notification Area
                    checkForNotification(obj, true);
                }).fail(function () {
                    api.caches.all = {};
                    api.trigger('delete');
                });
            });

            return http.resume().then(function () {
                api.trigger('refresh.all');
            });
        },

        /**
         * move appointments to a folder
         * @param  {array} list
         * @param  {string} targetFolderId
         * @return {deferred}
         */
        move: function (list, targetFolderId) {
            return copymove(list, 'update', targetFolderId);
        },

        /**
         * copy appointments to a folder
         * @param  {array} list
         * @param  {string} targetFolderId
         * @return {deferred}
         */
        copy: function (list, targetFolderId) {
            return copymove(list, 'copy', targetFolderId);
        },
        /**
         * check if you have appointments confirmed that conflict with the given appointment and returns them
         * @param  {object} appointment
         * @return {deferred}
         */
        checkConflicts: function (appointment) {
            var data = appointment,
                //conflicts with appointments in the past are of no interest
                start = Math.max(_.now() , appointment.start_date);

            return http.GET({
                module: 'calendar',
                params: {
                    action: 'all',
                    // id, created_by, folder_id, private_flag, title, start_date, end_date,users, location, shown_as
                    columns: '1,2,20,101,200,201,202,221,400,402',
                    start: start,
                    end: appointment.end_date,
                    showPrivate: true,
                    recurrence_master: false,
                    sort: '201',
                    order: 'asc',
                    timezone: 'UTC'
                }
            }).then(function (items) {
                var conflicts = [],
                    //maximum number of conflicts to return (to reduce calculations and prevent cases with really high numbers of appointments)
                    max = 50;

                for (var i = 0; i < items.length && conflicts.length < max; i++) {
                    if (items[i].id !== data.id) {
                        //no conflict with itself
                        if (items[i].shown_as !== 4) {
                            //4 = free
                            var found = false;
                            for (var a = 0; a < items[i].users.length && !found; a++) {
                                if (items[i].users[a].id === ox.user_id && (items[i].users[a].confirmation === 1 || items[i].users[a].confirmation === 3)) {
                                    //confirmed or tentative
                                    conflicts.push(items[i]);
                                }
                            }
                        }
                    }
                }

                return conflicts;
            });
        },

        /**
         * change confirmation status
         * @param  {object} o (properties: id, folder, data, occurrence)
         * @fires  api#mark:invite:confirmed (o)
         * @fires  api#update (data)
         * @fires  api#update: + cid
         * @return {deferred}
         */
        confirm: function (o) {

            var folder_id = o.folder_id || o.folder,
                key = folder_id + '.' + o.id + '.' + (o.occurrence || 0),
                alarm = -1,
                params = {
                    action: 'confirm',
                    folder: folder_id,
                    id: o.id,
                    timestamp: _.now(),
                    timezone: 'UTC'
                };

            // contains alarm?
            if ('alarm' in o.data) {
                alarm = o.data.alarm;
                delete o.data.alarm;
            }

            // occurrence
            if (o.occurrence) {
                params.occurrence = o.occurrence;
            }

            return http.PUT({
                module: 'calendar',
                params: params,
                data: o.data,
                appendColumns: false
            })
            .then(function (resp, timestamp) {
                if (alarm === -1) return;
                return api.update({
                    folder: o.folder,
                    id: o.id,
                    // ie gets conflict error so manual timestamp is needed here
                    timestamp: timestamp,
                    alarm: alarm
                });
            })
            .then(function () {
                api.caches.get = {};
                api.caches.all = {};
                // redraw detailview to be responsive and remove invites
                api.trigger('mark:invite:confirmed', o);
                delete api.caches.get[key];
                return api.get(o).then(function (data) {
                    api.trigger('update', data);
                    api.trigger('update:' + _.ecid(data), data);
                    return data;
                });
            });
        },

        /**
         * removes recurrence information
         * @param  {object} obj (appointment object)
         * @return {object} reduced copy of appointment object
         */
        removeRecurrenceInformation: function (obj) {
            var recAttr = ['change_exceptions', 'delete_exceptions', 'days',
                'day_in_month', 'month', 'interval', 'until', 'occurrences'],
                ret = _.clone(obj);
            for (var i = 0; i < recAttr.length; i++) {
                if (ret[recAttr[i]]) {
                    delete ret[recAttr[i]];
                }
            }
            ret.recurrence_type = 0;
            return ret;
        },

         /**
         * get invites
         * @fires  api#new-invites (invites)
         * @return {deferred} returns sorted array of appointments
         */
        getInvites: function () {

            var now = _.now(),
                start = now - 2 * date.HOUR,
                end = new date.Local().addYears(5).getTime();

            return this.getUpdates({
                folder: 'all',
                start: start,
                // 5 years like OX6
                end: end,
                timestamp: 0,
                recurrence_master: true
            })
            .then(function (list) {
                // sort by start_date & look for unconfirmed appointments
                // exclude appointments that already ended
                var invites = _.chain(list)
                    .filter(function (item) {

                        var isOver = item.end_date < now,
                            isRecurring = !!item.recurrence_type;

                        if (!isRecurring && isOver) {
                            return false;
                        }

                        return _(item.users).any(function (user) {
                            return user.id === ox.user_id && user.confirmation === 0;
                        });
                    })
                    .sortBy('start_date')
                    .value();
                // even if empty array is given it needs to be triggered to remove
                // notifications that does not exist anymore (already handled in ox6 etc)
                api.trigger('new-invites', invites);
                return invites;
            });
        },

        /**
         * get participants appointments
         * @param  {array} list  (participants)
         * @param  {object} options
         * @param  {boolean} useCache [optional]
         * @return {deferred} returns a nested array with participants and their appointments
         */
         freebusy: function (list, options, useCache) {
            list = [].concat(list);
            useCache = useCache === undefined ? true : !!useCache;

            if (list.length === 0) {
                return $.Deferred().resolve([]);
            }

            options = _.extend({
                start: _.now(),
                end: _.now() + date.DAY
            }, options);

            var result = [], requests = [];

            _(list).each(function (obj) {
                // freebusy only supports internal users and resources
                if (obj.type === 1 || obj.type === 3) {
                    var key = [obj.type, obj.id, options.start, options.end].join('-');
                    // in cache?
                    if (key in api.caches.freebusy && useCache) {
                        result.push(api.caches.freebusy[key]);
                    } else {
                        result.push(key);
                        requests.push({
                            module: 'calendar',
                            action: 'freebusy',
                            id: obj.id,
                            type: obj.type,
                            start: options.start,
                            end: options.end,
                            timezone: 'UTC'
                        });
                    }
                } else {
                    result.push({data: []});
                }
            });

            if (requests.length === 0) {
                return $.Deferred().resolve(result);
            }

            return http.PUT({
                module: 'multiple',
                data: requests,
                appendColumns: false,
                'continue': true
            })
            .then(function (response) {
                return _(result).map(function (obj) {
                    if (_.isString(obj)) {
                        // use fresh server data
                        return (api.caches.freebusy[obj] = response.shift());
                    } else {
                        // use cached data
                        return obj;
                    }
                });
            });
        },

        /**
         * ask if this appointment has attachments uploading at the moment (busy animation in detail View)
         * @param  {string} key (task id)
         * @return {boolean}
         */
        uploadInProgress: function (key) {
            // return true boolean
            return this.caches.upload[key] || false;
        },

        /**
         * add appointment to the list
         * @param {string} key (task id)
         * @return {undefined}
         */
        addToUploadList: function (key) {
            this.caches.upload[key] = true;
        },

        /**
         * remove appointment from the list
         * @param  {string} key (task id)
         * @fires  api#update: + key
         * @return {undefined}
         */
        removeFromUploadList: function (key) {
            delete this.caches.upload[key];
            //trigger refresh
            api.trigger('update:' + key);
        },

        /**
         * bind to global refresh; clears caches and trigger refresh.all
         * @fires  api#refresh.all
         * @return {promise}
         */
        refresh: function () {
            // check capabilities
            if (capabilities.has('calendar')) {
                api.getInvites().done(function () {
                    // clear caches
                    api.caches.all = {};
                    api.caches.get = {};
                    // trigger local refresh
                    api.trigger('refresh.all');
                });
            }
        }

    };

    Events.extend(api);

    var copymove = function (list, action, targetFolderId) {
        // allow single object and arrays
        list = _.isArray(list) ? list : [list];
        // pause http layer
        http.pause();
        // process all updates
        _(list).map(function (o) {
            return http.PUT({
                module: 'calendar',
                params: {
                    action: action || 'update',
                    id: o.id,
                    folder: o.folder_id || o.folder,
                    // mandatory for 'update'
                    timestamp: o.timestamp || _.now()
                },
                data: { folder_id: targetFolderId },
                appendColumns: false
            });
        });
        // resume & trigger refresh
        return http.resume()
            .then(function (result) {

                var def = $.Deferred();

                _(result).each(function (val) {
                    if (val.error) { notifications.yell(val.error); def.reject(val.error); }
                });

                if (def.state() === 'rejected') {
                    return def;
                }

                return def.resolve();
            })
            .done(function () {
                // clear cache and trigger local refresh
                api.caches.all = {};
                api.caches.get = {};
                _(list).each(function (obj) {
                    api.trigger('move:' + _.ecid(obj), targetFolderId);
                });
                api.trigger('refresh.all');
            });
    };

    var checkForNotification = function (obj, removeAction) {
        if (removeAction) {
            api.trigger('delete:appointment', obj);
        } else if (obj.alarm !== '-1' && obj.end_date > _.now()) {
            //new appointments
            require(['io.ox/core/api/reminder'], function (reminderAPI) {
                reminderAPI.getReminders();
            });
        } else if (obj.alarm || obj.end_date || obj.start_date) {
            //if one of this has changed during update action
            require(['io.ox/core/api/reminder'], function (reminderAPI) {
                reminderAPI.getReminders();
            });
        }
    };

    ox.on('refresh^', function () {
        api.refresh();
    });

    return api;
});
