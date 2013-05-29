/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/calendar/api',
    ['io.ox/core/http',
     'io.ox/core/event',
     'io.ox/core/config',
     'io.ox/core/notifications',
     'io.ox/core/api/factory'], function (http, Events, config, notifications, factory) {

    'use strict';

    // really stupid caching for speed
    var all_cache = {},
        get_cache = {},
        participant_cache = {},
        HOUR = 60000 * 60,
        DAY = HOUR * 24;
    // object to store appointments, that have attachments uploading atm
    var uploadInProgress = {},

        checkForNotification = function (obj, removeAction) {
            if (removeAction) {
                require(['io.ox/core/api/reminder'], function (reminderApi) {
                    reminderApi.trigger('delete:appointment', obj);
                    api.trigger('delete:appointment', obj);
                });
            } else if (obj.alarm !== '-1' && obj.end_date > _.now()) {//new appointments
                require(['io.ox/core/api/reminder'], function (reminderApi) {
                    reminderApi.getReminders();
                });
            } else if (obj.alarm || obj.end_date || obj.start_date) {//if one of this has changed during update action
                require(['io.ox/core/api/reminder'], function (reminderApi) {
                    reminderApi.getReminders();
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
                params.folder = o.folder || config.get('folder.calendar');
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
                        get_cache[key] = JSON.stringify(data);
                    });
            } else {
                return $.Deferred().resolve(JSON.parse(get_cache[key]));
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
                        timestamp: _.now(),
                        timezone: 'UTC'
                    },
                    data: o
                })
                .pipe(function (obj) {
                    checkForNotification(o);
                    var getObj = {};
                    if (!_.isUndefined(obj.conflicts)) {
                        var df = new $.Deferred();
                        _(obj.conflicts).each(function (item) {
                            item.folder_id = folder_id;
                        });
                        df.reject(obj);
                        return df;
                    }

                    getObj.id = o.id;
                    getObj.folder = folder_id;
                    if (o.recurrence_position !== null) {
                        getObj.recurrence_position = o.recurrence_position;
                    }

                    all_cache = {};
                    delete get_cache[key];
                    return api.get(getObj)
                        .pipe(function (data) {
                            if (attachmentHandlingNeeded) {
                                api.addToUploadList(encodeURIComponent(_.cid(data)));//to make the detailview show the busy animation
                            }
                            api.trigger('update', data);
                            api.trigger('update:' + encodeURIComponent(_.cid(data)), data);
                            return data;
                        });
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
            all_cache = {};
            var key = (o.folder || o.folder_id) + '.' + o.id + '.' + (o.recurrence_position || 0);
            delete get_cache[key];
            return api.get(o)
                .pipe(function (data) {
                    api.trigger('update', data);
                    //to make the detailview remove the busy animation
                    api.removeFromUploadList(encodeURIComponent(_.cid(data)));
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
                data: o
            })
            .pipe(function (obj) {
                checkForNotification(o);
                var getObj = {};
                if (!_.isUndefined(obj.conflicts)) {
                    var df = new $.Deferred();
                    _(obj.conflicts).each(function (item) {
                        item.folder_id = o.folder_id;
                    });
                    df.reject(obj);
                    return df;
                }
                getObj.id = obj.id;
                getObj.folder = o.folder_id;
                if (o.recurrence_position !== null) {
                    getObj.recurrence_position = o.recurrence_position;
                }
                all_cache = {};
                return api.get(getObj)
                        .pipe(function (data) {
                            if (attachmentHandlingNeeded) {
                                api.addToUploadList(encodeURIComponent(_.cid(data)));//to make the detailview show the busy animation
                            }
                            api.trigger('create', data);
                            api.trigger('update:' + encodeURIComponent(_.cid(data)), data);
                            return data;
                        });
            });
        },

        // delete is a reserved word :( - but this will delete the
        // appointment on the server
        remove: function (o) {

            var key = (o.folder_id || o.folder) + '.' + o.id + '.' + (o.recurrence_position || 0);

            return http.PUT({
                module: 'calendar',
                params: {
                    action: 'delete',
                    timestamp: _.now()
                },
                data: o
            })
            .done(function (resp) {
                all_cache = {};
                delete get_cache[key];
                api.trigger('refresh.all');
                api.trigger('delete', resp);
                api.trigger('delete:' + encodeURIComponent(_.cid(o)), o);
                //remove Reminders in Notification Area
                checkForNotification(o, true);
            }).fail(function () {
                all_cache = {};
                api.trigger('delete');
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
                key = folder_id + '.' + o.id + '.' + (o.recurrence_position || 0);

            return http.PUT({
                module: 'calendar',
                params: {
                    action: 'confirm',
                    folder: o.folder,
                    id: o.id
                },
                data: o.data
            })
            .pipe(function (resp) {
                get_cache = {};
                api.trigger('mark:invite:confirmed', o); //redraw detailview to be responsive and remove invites
                all_cache = {};
                delete get_cache[key];
                return api.get(o)
                        .pipe(function (data) {
                            api.trigger('update', data);
                            api.trigger('update:' + encodeURIComponent(_.cid(data)), data);
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

        var now = _.now(), start = now - 2 * HOUR;

        return getUpdates({
            folder: 'all',
            start: start,
            end: start + 28 * 5 * DAY, // next four month?!?
            timestamp: 0,
            recurrence_master: true
        })
        .pipe(function (list) {
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
            .pipe(function (result) {

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
                    var cid = encodeURIComponent(_.cid(obj));
                    api.trigger('move:' + cid, targetFolderId);
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
        .pipe(function (response) {
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
        api.getInvites().done(function () {
            // clear caches
            all_cache = {};
            get_cache = {};
            participant_cache = {};
            // trigger local refresh
            api.trigger('refresh.all');
        });
    };

    ox.on('refresh^', function () {
        api.refresh();
    });

    return api;
});
