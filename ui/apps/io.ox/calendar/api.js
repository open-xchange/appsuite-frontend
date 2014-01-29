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

    // really stupid caching for speed
    var all_cache = {},
        get_cache = {},
        participant_cache = {},
        HOUR = 60000 * 60,
        DAY = HOUR * 24;
    // object to store appointments, that have attachments uploading atm
    var uploadInProgress = {},
        //grepRemove equivalent
        grepRemove = function (pattern, cache) {
            var keys = Object.keys(cache),
                cache = cache || {};

            if (typeof pattern === 'string') {
                pattern = new RegExp(_.escapeRegExp(pattern));
            }

            if (_.isRegExp(pattern)) {
                _.each(keys, function (key) {
                    if (pattern.test(key)) {
                        delete cache[key];
                    }
                });
            }
        },

        checkForNotification = function (obj, removeAction) {
            if (removeAction) {
                api.trigger('delete:appointment', obj);
            } else if (obj.alarm !== '-1' && obj.end_date > _.now()) {//new appointments
                require(['io.ox/core/api/reminder'], function (reminderAPI) {
                    reminderAPI.getReminders();
                });
            } else if (obj.alarm || obj.end_date || obj.start_date) {//if one of this has changed during update action
                require(['io.ox/core/api/reminder'], function (reminderAPI) {
                    reminderAPI.getReminders();
                });
            }
        },

        getUpdates = function (o) {
            o = $.extend({
                start: _.now(),
                end: _.now() + 28 * 1 * DAY,
                timestamp:  _.now() - (2 * DAY),
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
            if (all_cache[key] === undefined) {
                return http.GET({
                        module: 'calendar',
                        params: params
                    })
                    .done(function (data) {
                        all_cache[key] = JSON.stringify(data);
                    });
            } else {
                return $.Deferred().resolve(JSON.parse(all_cache[key]));
            }
        };

    var api = {

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

            if (get_cache[key] === undefined || !useCache) {
                return http.GET({
                        module: 'calendar',
                        params: params
                    })
                    .done(function (data) {
                        get_cache[key] = data;
                    });
            } else {
                return $.Deferred().resolve(get_cache[key]);
            }
        },

        getAll: function (o, useCache) {

            o = $.extend({
                start: _.now(),
                end: _.now() + (28 * DAY),
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

            if (all_cache[key] === undefined || !useCache) {
                return http.GET({
                        module: 'calendar',
                        params: params
                    })
                    .done(function (data) {
                        all_cache[key] = JSON.stringify(data);
                    });
            } else {
                return $.Deferred().resolve(JSON.parse(all_cache[key]));
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

        search: function (query) {
            return http.PUT({
                    module: 'calendar',
                    params: {
                        action: 'search',
                        sort: '201',
                        order: 'desc', // top-down makes more sense
                        timezone: 'UTC'
                    },
                    data: {
                        pattern: query
                    }
                });
        },

        needsRefresh: function (folder) {
            // has entries in 'all' cache for specific folder
            return all_cache[folder] !== undefined;
        },

        /**
         * update appointment
         * @param  {object} o (id, folder and changed attributes/values)
         * @fires  api#update (data)
         * @fires  api#update: + cid
         * @return {deferred} returns current appointment object
         */
        update: function (o) {
            var folder_id = o.folder_id || o.folder, pattern,
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
                    all_cache = {};
                    delete get_cache[key];

                    return api.get(getObj)
                        .then(function (data) {
                            if (attachmentHandlingNeeded) {
                                //to make the detailview show the busy animation
                                api.addToUploadList(_.ecid(data));
                            }
                            //series master changed?
                            if (data.recurrence_type > 0 && !data.recurrence_position) {
                                //id without specified recurrence_position
                                pattern = (o.folder || o.folder_id) + '.' + o.id + '.';
                                grepRemove(pattern, get_cache);
                                api.trigger('update:series:' + _.ecid(pattern), data);
                            }
                            api.trigger('update', data);
                            api.trigger('update:' + _.ecid(o), data);
                            return data;
                        });
                }, function (error) {
                    all_cache = {};
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
            var doCallback = api.uploadInProgress(_.ecid(o));

            // clear caches
            if (doCallback) {
                all_cache = {};
                delete get_cache[_.ecid(o)];
            }

            return api.get(o, !doCallback)
                .then(function (data) {
                    api.trigger('update', data);
                    //to make the detailview remove the busy animation
                    api.removeFromUploadList(_.ecid(data));
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
                all_cache = {};

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
                    all_cache = {};
                    _(keys).each(function (key) {
                        delete get_cache[key];
                    });
                    api.trigger('delete', obj);
                    api.trigger('delete:' + _.ecid(obj), obj);
                    //remove Reminders in Notification Area
                    checkForNotification(obj, true);
                }).fail(function () {
                    all_cache = {};
                    api.trigger('delete');
                });
            });

            return http.resume().then(function () {
                api.trigger('refresh.all');
            });
        },

        /**
         * change confirmation status
         * @param  {object} o (properties: id, folder, data)
         * @fires  api#mark:invite:confirmed (o)
         * @fires  api#update (data)
         * @fires  api#update: + cid
         * @return {deferred}
         */
        confirm: function (o) {

            var folder_id = o.folder_id || o.folder,
                key = folder_id + '.' + o.id + '.' + (o.recurrence_position || 0),
                alarm = -1;

            // contains alarm?
            if ('alarm' in o.data) {
                alarm = o.data.alarm;
                delete o.data.alarm;
            }

            return http.PUT({
                module: 'calendar',
                params: {
                    action: 'confirm',
                    folder: o.folder,
                    id: o.id,
                    timestamp: _.now(),
                    timezone: 'UTC'
                },
                data: o.data,
                appendColumns: false
            })
            .then(function (resp, timestamp) {
                if (alarm === -1) return;
                return api.update({
                    folder: o.folder,
                    id: o.id,
                    timestamp: timestamp,//ie gets conflict error so manual timestamp is needed here
                    alarm: alarm
                });
            })
            .then(function () {
                get_cache = {};
                api.trigger('mark:invite:confirmed', o); //redraw detailview to be responsive and remove invites
                all_cache = {};
                delete get_cache[key];
                return api.get(o).then(function (data) {
                    api.trigger('update', data);
                    api.trigger('update:' + _.ecid(data), data);
                    return data;
                });
            });
        }
    };

    Events.extend(api);

    /**
     * removes recurrence information
     * @param  {object} obj (appointment object)
     * @return {object} appointment object
     */
    api.removeRecurrenceInformation = function (obj) {
        var recAttr = ['change_exceptions', 'delete_exceptions', 'days',
            'day_in_month', 'month', 'interval', 'until', 'occurrences'];
        for (var i = 0; i < recAttr.length; i++) {
            if (obj[recAttr[i]]) {
                delete obj[recAttr[i]];
            }
        }
        obj.recurrence_type = 0;
        return obj;
    };

    /**
     * get invites
     * @fires  api#new-invites (invites)
     * @return {deferred} returns sorted array of appointments
     */
    api.getInvites = function () {

        var now = _.now(),
            start = now - 2 * HOUR,
            end = new date.Local().addYears(5).getTime();

        return getUpdates({
            folder: 'all',
            start: start,
            end: end, // 5 years like OX6
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
    };

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
                    timestamp: o.timestamp || _.now() // mandatory for 'update'
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
                all_cache = {};
                get_cache = {};
                _(list).each(function (obj) {
                    api.trigger('move:' + _.ecid(obj), targetFolderId);
                });
                api.trigger('refresh.all');
            });
    };

    /**
     * move appointments to a folder
     * @param  {array} list
     * @param  {string} targetFolderId
     * @return {deferred}
     */
    api.move = function (list, targetFolderId) {
        return copymove(list, 'update', targetFolderId);
    };

    /**
     * copy appointments to a folder
     * @param  {array} list
     * @param  {string} targetFolderId
     * @return {deferred}
     */
    api.copy = function (list, targetFolderId) {
        return copymove(list, 'copy', targetFolderId);
    };

    api.MINUTE = 60000;
    api.HOUR = api.MINUTE * 60;
    api.DAY = api.HOUR * 24;
    api.WEEK = api.DAY * 7;

    // fluent caches
    api.caches = {
        freebusy: {}
    };

    /**
     * get participants appointments
     * @param  {array} list  (participants)
     * @param  {object} options
     * @param  {boolean} useCache [optional]
     * @return {deferred} returns a nested array with participants and their appointments
     */
    api.freebusy = function (list, options, useCache) {
        list = [].concat(list);
        useCache = useCache === undefined ? true : !!useCache;

        if (list.length === 0) {
            return $.Deferred().resolve([]);
        }

        options = _.extend({
            start: _.now(),
            end: _.now() + DAY
        }, options);

        var result = [], requests = [];

        _(list).each(function (obj) {
            if (obj.type === 1 || obj.type === 3) {//freebusy only supports internal users and resources
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
    };

    /**
     * ask if this appointment has attachments uploading at the moment (busy animation in detail View)
     * @param  {string} key (task id)
     * @return {boolean}
     */
    api.uploadInProgress = function (key) {
        return uploadInProgress[key] || false;//return true boolean
    };

    /**
     * add appointment to the list
     * @param {string} key (task id)
     * @return {undefined}
     */
    api.addToUploadList = function (key) {
        uploadInProgress[key] = true;
    };

    /**
     * remove appointment from the list
     * @param  {string} key (task id)
     * @fires  api#update: + key
     * @return {undefined}
     */
    api.removeFromUploadList = function (key) {
        delete uploadInProgress[key];
        //trigger refresh
        api.trigger('update:' + key);
    };

    api.reduce = factory.reduce;

    /**
     * bind to global refresh; clears caches and trigger refresh.all
     * @fires  api#refresh.all
     * @return {promise}
     */
    api.refresh = function () {
        // check capabilities
        if (capabilities.has('calendar')) {
            api.getInvites().done(function () {
                // clear caches
                all_cache = {};
                get_cache = {};
                participant_cache = {};
                // trigger local refresh
                api.trigger('refresh.all');
            });
        }
    };

    ox.on('refresh^', function () {
        api.refresh();
    });

    return api;
});
