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
    'io.ox/calendar/chronos-util',
    'io.ox/calendar/chronos-model'
], function (http, Pool, util, models) {

    'use strict';

    // updates pool based on writing operations response (create update delete etc)
    var processResponse  = function (response) {
            if (!response) return;

            _(response.created).each(function (event) {
                api.pool.add(event.folder, event);
                api.trigger('create', event);
                api.trigger('create:' + _.cid(event), event);
            });
            _(response.deleted).each(function (event) {
                api.pool.get(event.folder).remove(_.cid(event));
                api.trigger('delete', event);
                api.trigger('delete:' + _.cid(event), event);
            });
            _(response.updated).each(function (event) {
                api.pool.add(event.folder, event);
                api.trigger('update', event);
                api.trigger('update:' + _.cid(event), event);
            });

            return response;
        },
        api = {
            getAll: function (obj, useCache) {
                obj = _.extend({
                    start: _.now(),
                    end: moment().add(28, 'days').valueOf(),
                    order: 'asc'
                }, obj || {});
                obj.useCache = obj.useCache || useCache || true;
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
                            timezone: 'UTC',
                            order: obj.order
                        }
                    });
                });
                return http.resume().then(function (data) {
                    data = _(data).chain().pluck('data').flatten().compact().value();
                    if (data.length > 0) api.pool.add(obj.folder, data);
                    return api.pool.get(obj.folder).filter(util.rangeFilter(obj.start, obj.end));
                }).then(function (list) {
                    return _(list).sortBy(function (model) { return model.getTimestamp('startDate'); });
                });
            },

            get: function (obj, useCache) {
                if (useCache !== false) {
                    var model = api.pool.get(obj.folder).findWhere(obj);
                    if (model) return $.when(model);
                }
                return http.GET({
                    module: 'chronos',
                    params: {
                        action: 'get',
                        id: obj.id,
                        recurrenceId: obj.recurrenceId,
                        timezone: 'UTC'
                    }
                }).then(function (data) {
                    api.pool.add(obj.folder, data);
                    return api.pool.get(obj.folder).findWhere(obj);
                });
            },

            uploadInProgress: function () {
                // TODO implement that if needed
                return false;
            },

            create: function (obj) {
                obj = obj.attributes || obj;
                return http.PUT({
                    module: 'chronos',
                    params: {
                        action: 'new',
                        folder: obj.folder
                    },
                    data: obj
                })
                .then(processResponse)
                .then(function (data) {
                    return api.pool.get(obj.folder).findWhere(data.created[0]);
                });
            },

            update: function () {
                //placeholder
                //todo implement that
                return $.when();
            },

            remove: function (list) {
                list = _.isArray(list) ? list : [list];
                return http.PUT({
                    module: 'chronos',
                    params: {
                        action: 'delete',
                        timestamp: _.now()
                    },
                    data: list
                })
                .then(processResponse);
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
                .then(processResponse);
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
                        attendees: list,
                        includeStackTraceOnError: true
                    }
                });
            }
        };

    api.pool = Pool.create('chronos', {
        Collection: models.Collection
    });

    _.extend(api, Backbone.Events);

    return api;
});
