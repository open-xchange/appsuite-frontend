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

    var api = {
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
            }).then(function (data) {
                // very strange response: object with create deleted updated arrays in it.
                // todo talk to backend if this can be changed to just the new appointment object
                api.pool.add(data.created[0].folder, data.created[0]);
                return api.pool.get(obj.folder).findWhere(data.created[0]);
            });
        },

        update: function () {
            //placeholder
            //todo implement that
            return $.when();
        }
    };

    api.pool = Pool.create('chronos', {
        Collection: models.Collection
    });

    _.extend(api, Backbone.Events);

    return api;
});
