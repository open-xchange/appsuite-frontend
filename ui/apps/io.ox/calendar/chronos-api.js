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
            });
            _(response.deleted).each(function (event) {
                api.pool.remove(event.folder, event);
                // should trigger a redraw of the view if needed
                // TODO see if it works after mw fixed the delete request response
                api.trigger('delete', event);
            });
            _(response.updated).each(function (event) {
                api.pool.add(event.folder, event);
            });

            return response;
        },
        api = {
            getAll: function (obj, useCache) {
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
                            rangeStart: range.start,
                            rangeEnd: range.end,
                            timezone: 'UTC'
                        }
                    });
                });
                return http.resume().then(function (data) {
                    data = _(data).chain().pluck('data').flatten().value();
                    if (data.length > 0) api.pool.add(obj.folder, data);
                    return api.pool.get(obj.folder).filter(util.rangeFilter(obj.start, obj.end));
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
            }
        };

    api.pool = Pool.create('chronos', {
        Collection: models.Collection
    });

    _.extend(api, Backbone.Events);

    return api;
});
