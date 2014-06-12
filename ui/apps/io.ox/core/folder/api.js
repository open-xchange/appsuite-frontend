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

    // collection pool
    var pool = {

        models: {},
        collections: {},

        addModel: function (data) {
            var id = data.id;
            if (this.models[id] === undefined) {
                // add new model
                this.models[id] = new Backbone.Model(data);
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
                this.collections[id] = new Backbone.Collection(list);
            } else {
                // update existing collection
                var collection = this.collections[id];
                if (collection.length === 0) collection.reset(list); else collection.set(list);
            }
        },

        getFolderModel: function (id) {
            return this.models[id] || (this.models[id] = new Backbone.Model({ id: id }));
        },

        getSubFolderCollection: function (id) {
            return this.collections[id] || (this.collections[id] = new Backbone.Collection());
        }
    };

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
        });
    }

    return {
        pool: pool,
        get: get,
        list: list
    };
});
