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
 */

define('io.ox/core/api/resource',
    ['io.ox/core/http',
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
                return this.get('name') || this.get('display_name').trim().toLowerCase()
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
            params: { action: 'new' },
            data: data,
            appendColumns: false
        })
        .then(function (data) {
            return api.get({ id: data.id }).done(function (data) {
                api.collection.add(data, { parse: true });
                api.trigger('create', data);
            });
        });
    };

    //
    // Update resource
    //
    api.update = function (data) {
        return http.PUT({
            module: 'resource',
            params: { action: 'update', id: data.id, timestamp: _.then() },
            data: _(data).pick('description', 'display_name', 'mailaddress', 'name'),
            appendColumns: false
        })
        .done(function () {
            var model = api.collection.get(data.id);
            if (model) model.set(data);
            api.trigger('update', data);
        });
    };

    //
    // Delete resource
    //
    api.remove = function (id) {
        api.trigger('before:remove', id);
        return http.PUT({
            module: 'resource',
            params: { action: 'delete', timestamp: _.then() },
            data: { id: id },
            appendColumns: false
        })
        .done(function () {
            var model = api.collection.get(id);
            if (model) api.collection.remove(model);
            api.trigger('remove', id);
        });
    };

    return api;
});
