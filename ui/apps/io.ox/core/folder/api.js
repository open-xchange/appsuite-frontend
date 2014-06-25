/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/api', ['io.ox/core/http'], function (http) {

    'use strict';

    function newModel(data) {
        var model = new Backbone.Model(data || {});
        model.fetched = false;
        return model;
    }

    function newCollection(list) {
        var collection = new Backbone.Collection(list || []);
        collection.fetched = false;
        return collection;
    }

    // collection pool
    var pool = {

        models: {},
        collections: {},

        addModel: function (data) {
            var id = data.id;
            if (this.models[id] === undefined) {
                // add new model
                this.models[id] = newModel(data);
            } else {
                // update existing model
                this.models[id].set(data);
            }
        },

        addCollection: function (id, list) {
            // add folder models first
            _(list).each(this.addModel, this);
            // add to pool
            if (this.collections[id] === undefined) {
                // add new collection
                this.collections[id] = newCollection(list);
            } else {
                // update existing collection
                var collection = this.collections[id];
                if (!collection.fetched) collection.reset(list); else collection.set(list);
            }
        },

        getModel: function (id) {
            return this.models[id] || (this.models[id] = newModel({ id: id }));
        },

        getCollection: function (id) {
            return this.collections[id] || (this.collections[id] = newCollection());
        }
    };

    // use ramp-up data
    _(ox.rampup.folder).each(function (data) {
        pool.addModel(data);
    });

    _(ox.rampup.folderlist || {}).each(function (list, id) {
        // make objects
        list = _(list).map(function (data) {
            return _.isArray(data) ? http.makeObject(data, 'folders') : data;
        });
        // add
        pool.addCollection(id, list);
    });

    // get a folder
    function get(id) {

        var model = pool.models[id];
        if (model !== undefined && model.has('title')) return $.Deferred().resolve(model.toJSON());

        return http.GET({
            module: 'folders',
            params: {
                action: 'get',
                altNames: true,
                id: id,
                timezone: 'UTC',
                tree: '1'
            }
        })
        .done(function (data) {
            pool.addModel(data);
        });
    }

    // get subfolders
    function list(id, options) {

        options = _.extend({ all: false }, options);

        // already cached?
        var collection = pool.getCollection(id);
        if (collection.fetched) return $.when(collection.toJSON());

        return http.GET({
            module: 'folders',
            params: {
                action: 'list',
                all: options.all ? '1' : '0',
                altNames: true,
                parent: id,
                timezone: 'UTC',
                tree: '1'
            },
            appendColumns: true
        })
        .done(function (list) {
            pool.addCollection(id, list);
            collection.fetched = true;
        });
    }

    return {
        pool: pool,
        get: get,
        list: list
    };
});
