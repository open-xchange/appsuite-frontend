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

define('io.ox/core/api/group', [
    'io.ox/core/http',
    'io.ox/core/api/factory'
], function (http, apiFactory) {

    'use strict';

    // generate basic API
    var api = apiFactory({
        module: 'group',
        keyGenerator: function (obj) {
            return String(obj.id);
        },
        requests: {
            all: {
                columns: '1,20',
                extendColumns: 'io.ox/core/api/group/all',
                // display_name
                sort: '500',
                order: 'asc'
            },
            list: {
            },
            get: {
            },
            search: {
                action: 'search',
                columns: '1,20,500,524',
                extendColumns: 'io.ox/core/api/group/search',
                sort: '500',
                order: 'asc',
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
            display_name: '',
            members: [],
            name: ''
        },

        initialize: function () {

            var members = this.get('members');
            if (_.isString(members) && members !== '') {
                // "all" sends comma-separated string, "get" sends array; happy debugging!
                this.set('members', members.split(',').map(function (id) {
                    return parseInt(id, 10);
                }), { silent: true });
            }

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
    // Create new group
    //
    api.create = function (data) {
        return http.PUT({
            module: 'group',
            params: { action: 'new' },
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
    // Update group
    //
    api.update = function (data) {
        return http.PUT({
            module: 'group',
            params: { action: 'update', id: data.id, timestamp: _.then() },
            data: _(data).pick('name', 'display_name', 'members'),
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
    // Delete group
    //
    api.remove = function (id) {
        api.trigger('before:remove', id);
        return http.PUT({
            module: 'group',
            params: { action: 'delete', timestamp: _.then() },
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


    /**
     * @param  {string} id
     * @return {deferred} done handler returns name (string)
     */
    api.getName = function (id) {
        return api.get({ id: id }).pipe(function (data) {
            return _.noI18n(data.display_name || data.name || '');
        });
    };

    /**
     * TODO: @deprecated/unused?
     */
    api.getTextNode = function (id) {
        var node = document.createTextNode('');
        api.get({ id: id })
            .done(function (data) {
                node.nodeValue = data.display_name;
            })
            .always(function () {
                // use defer! otherwise we return null on cache hit
                _.defer(function () {
                    // don't leak
                    node = null;
                });
            });
        return node;
    };

    return api;
});
