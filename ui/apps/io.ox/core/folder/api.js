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

define('io.ox/core/folder/api',
    ['io.ox/core/http',
     'io.ox/core/event',
     'settings!io.ox/mail',
     'settings!io.ox/core',
     'gettext!io.ox/core'], function (http, Events, mailSettings, coreSettings, gt) {

    'use strict';

    // collection pool
    var pool = {
        models: {},
        collections: {}
    };

    //
    // Utility functions
    //

    function injectIndex(item, index) {
        item.index = index;
    }

    function onChangeModelId(model) {
        delete pool.models[model.previous('id')];
        pool.models[model.id] = model;
    }

    function getDefaultFolder(type) {
        type = type || 'mail';
        return type === 'mail' ? mailSettings.get('folder/inbox') : coreSettings.get('folder/' + type);
    }

    //
    // Model & Collections
    //

    var FolderModel = Backbone.Model.extend({
        constructor: function () {
            Backbone.Model.apply(this, arguments);
            this.on('change:id', onChangeModelId);
        }
    });

    var FolderCollection = Backbone.Collection.extend({
        constructor: function () {
            Backbone.Collection.apply(this, arguments);
            this.fetched = false;
        },
        comparator: 'index',
        model: FolderModel
    });

    // collection pool
    _.extend(pool, {

        addModel: function (data) {
            var id = data.id;
            if (this.models[id] === undefined) {
                // add new model
                this.models[id] = new FolderModel(data);
            } else {
                // update existing model
                this.models[id].set(data);
            }
            return this.models[id];
        },

        addCollection: function (id, list) {
            // transform list to models
            var models = _(list).map(this.addModel, this);
            // update collection
            var collection = this.getCollection(id),
                type = collection.fetched ? 'set' : 'reset';
            collection[type](models);
        },

        getModel: function (id) {
            return this.models[id] || (this.models[id] = new FolderModel({ id: id }));
        },

        getCollection: function (id) {
            return this.collections[id] || (this.collections[id] = new FolderCollection());
        }
    });

    //
    // Use ramp-up data
    //

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

    //
    // Get a single folder
    //

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

    //
    // Get subfolders
    //

    function list(id, options) {

        options = _.extend({ all: false, cache: true }, options);

        // already cached?
        var collection = pool.getCollection(id);
        if (collection.fetched && options.cache === true) return $.when(collection.toJSON());

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
            // inject index
            _(list).each(injectIndex);
            pool.addCollection(id, list);
            collection.fetched = true;
        });
    }

    //
    // Update folder
    //

    function update(id, changes) {

        // update model first
        var model = pool.getModel(id);
        model.set(changes);

        return http.PUT({
            module: 'folders',
            params: {
                action: 'update',
                id: id,
                tree: '1',
                timezone: 'UTC'
            },
            data: changes,
            appendColumns: false
        })
        .then(
            function success(newId) {
                // id change?
                if (id !== newId) {
                    model.set('id', newId);
                    // fetch sub-folders of parent folder to ensure proper order after rename
                    return list(model.get('folder_id'), { cache: false });
                }
                // trigger event
                api.trigger('update', id, newId, model.toJSON());
            },
            function fail(error) {
                if (error && error.code && error.code === 'FLD-0018')
                    error.error = gt('Could not save settings. There have to be at least one user with administration rights.');
                api.trigger('update:fail', error, id);
            }
        );
    }

    //
    // Create folder
    //

    function create(id, data) {

        // default data
        data = _.extend({
            title: gt('New Folder'),
            subscribed: 1
        }, data);

        // get parent folder first - actually just to inherit 'module';
        return get(id).then(function (parent) {
            // go!
            return http.PUT({
                module: 'folders',
                params: {
                    action: 'new',
                    autorename: true,
                    folder_id: id,
                    module: data.module || parent.module,
                    tree: '1'
                },
                data: data,
                appendColumns: false
            })
            .then(function () {
                // reload parent folder's sub-folders
                return list(id, { cache: false });
            })
            .done(function () {
                // update parent folder
                pool.getModel(id).set('subfolders', true);
            })
            .then(
                function success(data) {
                    api.trigger('create', data);
                },
                function fail(error) {
                    api.trigger('create:fail', error, id);
                }
            );
        });
    }

    //
    // Remove folder
    //

    function remove(id) {

        // get model
        var model = pool.getModel(id),
            data = model.toJSON(),
            parent = model.get('folder_id'),
            collection = pool.getCollection(parent);
        // trigger event
        api.trigger('remove:prepare', data);
        // remove model from collection
        collection.remove(model);
        // update parent folder; subfolders might have changed
        pool.getModel(parent).set('subfolders', collection.length > 0);

        // delete on server
        return http.PUT({
            module: 'folders',
            params: {
                action: 'delete',
                tree: '1',
                failOnError: true
            },
            data: [id],
            appendColumns: false
        })
        .then(
            function success() {
                api.trigger('remove', id, data);
                api.trigger('remove:' + id, data);
                api.trigger('remove:' + data.module, data);
            },
            function fail() {
                api.trigger('remove:fail', id);
            }
        );
    }

    //
    // Refresh all folders
    //

    function refresh() {
        // pause http layer to get one multiple
        http.pause();
        // loop over all subfolder collection and reload
        _(pool.collections).each(function (collection, id) {
            // check collection.fetched; no need to fetch brand new subfolders
            if (collection.fetched) list(id, { cache: false });
        });
        // go!
        http.resume();
    }

    ox.on('please:refresh refresh^', refresh);

    // publish api
    var api = {
        FolderModel: FolderModel,
        FolderCollection: FolderCollection,
        pool: pool,
        get: get,
        list: list,
        update: update,
        create: create,
        remove: remove,
        refresh: refresh,
        getDefaultFolder: getDefaultFolder
    };

    // add event hub
    Events.extend(api);

    return api;
});
