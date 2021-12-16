/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/api/resource', [
    'io.ox/core/http',
    'io.ox/core/api/factory'
], function (http, apiFactory) {

    'use strict';

    // generate basic API
    var api = apiFactory({
        module: 'resource',
        keyGenerator: function (obj) {
            return String(obj.id);
        },
        requests: {
            all: {
            },
            list: {
            },
            get: {
            },
            search: {
                action: 'search',
                getData: function (query) {
                    return { pattern: query };
                }
            }
        }
    });

    // helper: simply clear "old" caches on update
    function clearCaches() {
        api.caches.all.clear();
        api.caches.list.clear();
        api.caches.get.clear();
    }

    //
    // Backbone Model & Collection
    //

    var Model = Backbone.Model.extend({

        defaults: {
            description: '',
            display_name: '',
            name: '',
            mailaddress: ''
        },

        initialize: function () {

            this.on('change:display_name', function () {
                this.set('name', this.getName());
            });

            this.set('name', this.getName());
        },

        getName: (function () {

            var tr = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };

            return function () {
                if (this.has('id') && this.get('name')) return this.get('name');
                return this.get('display_name').trim().toLowerCase()
                    .replace(/[äöüß]/g, function (match) {
                        return tr[match];
                    })
                    .replace(/\W+/g, '_');
            };
        }())
    });

    var Collection = Backbone.Collection.extend({
        comparator: function (model) {
            return (model.get('display_name') || '').toLowerCase();
        },
        model: Model
    });

    api.collection = new Collection();

    api.getModel = function (id) {
        return api.collection.get(id) || new Model();
    };

    //
    // Create new resource
    //
    api.create = function (data) {
        return http.PUT({
            module: 'resource',
            params: { action: 'new' },
            data: data,
            appendColumns: false
        })
        .then(function (data) {
            return api.get({ id: data.id }).done(function (data) {
                api.collection.add(data, { parse: true });
                api.trigger('create', data);
                clearCaches();
            });
        });
    };

    //
    // Update resource
    //
    api.update = function (data) {
        return http.PUT({
            module: 'resource',
            params: { action: 'update', id: data.id, timestamp: _.then() },
            data: _(data).pick('description', 'display_name', 'mailaddress', 'name'),
            appendColumns: false
        })
        .done(function () {
            var model = api.collection.get(data.id);
            if (model) model.set(data);
            api.trigger('update', data);
            clearCaches();
        });
    };

    //
    // Delete resource
    //
    api.remove = function (id) {
        api.trigger('before:remove', id);
        return http.PUT({
            module: 'resource',
            params: { action: 'delete', timestamp: _.then() },
            data: { id: id },
            appendColumns: false
        })
        .done(function () {
            var model = api.collection.get(id);
            if (model) api.collection.remove(model);
            api.trigger('remove', id);
            clearCaches();
        });
    };

    return api;
});
