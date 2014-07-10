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
     'io.ox/core/folder/util',
     'io.ox/core/folder/sort',
     'io.ox/core/folder/blacklist',
     'gettext!io.ox/core'], function (http, Events, util, sort, blacklist, gt) {

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
            collection.fetched = true;
        },

        getModel: function (id) {
            return this.models[id] || (this.models[id] = new FolderModel({ id: id }));
        },

        getCollection: function (id) {
            return this.collections[id] || (this.collections[id] = new FolderCollection());
        }
    });

    //
    // Used by list() and ramp-up
    //

    function processListResponse(id, list) {
        // 1. apply blacklist
        list = blacklist.apply(list);
        // 2. apply custom order
        list = sort.apply(id, list);
        // 3. inject index
        _(list).each(injectIndex);
        // done
        return list;
    }

    //
    // Use ramp-up data
    //

    _(ox.rampup.folder).each(function (data) {
        pool.addModel(data);
    });

    var rampup = {};

    _(ox.rampup.folderlist || {}).each(function (list, id) {
        // make objects
        rampup[id] = _(list).map(function (data) {
            return _.isArray(data) ? http.makeObject(data, 'folders') : data;
        });
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
        .then(function (data) {
            pool.addModel(data);
            return data; // to make sure we always get the same result (just data; not timestamp)
        });
    }

    //
    // Special case: Get multiple folders at once
    //

    function multiple(ids) {
        try {
            http.pause();
            return $.when.apply($,
                _(ids).map(function (id) {
                    return get(id).then(null, function () { return $.when(undefined); });
                })
            )
            .then(function () {
                return _(arguments).toArray();
            });
        } finally {
            http.resume();
        }
    }

    //
    // Get subfolders
    //

    function list(id, options) {

        options = _.extend({ all: false, cache: true }, options);

        // already cached?
        var collection = pool.getCollection(id);
        if (collection.fetched && options.cache === true) return $.when(collection.toJSON());

        // use rampup data?
        if (rampup[id]) {
            var array = processListResponse(id, rampup[id]);
            pool.addCollection(id, array);
            delete rampup[id];
            return $.when(array);
        }

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
        .done(function (array) {
            array = processListResponse(id, array);
            pool.addCollection(id, array);
        });
    }

    //
    // Update folder
    //

    function update(id, changes) {

        if (!_.isObject(changes) || _.isEmpty(changes)) return;

        // update model
        var model = pool.getModel(id).set(changes);

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
                // id change? (caused by rename or move)
                if (id !== newId) model.set('id', newId);
                // trigger event
                api.trigger('update', id, newId, model.toJSON());
                // fetch subfolders of parent folder to ensure proper order after rename/move
                if (id !== newId) return list(model.get('folder_id'), { cache: false }).then(function () {
                    return newId;
                });
            },
            function fail(error) {
                if (error && error.code && error.code === 'FLD-0018')
                    error.error = gt('Could not save settings. There have to be at least one user with administration rights.');
                api.trigger('update:fail', error, id);
            }
        );
    }

    //
    // Move folder
    //

    function move(id, target) {

        if (id === target) return;

        // prepare move
        var model = pool.getModel(id),
            parent = model.get('folder_id'),
            collection = pool.getCollection(parent);

        // remove model from parent collection
        collection.remove(model);
        // update parent folder; subfolders might have changed
        pool.getModel(parent).set('subfolders', collection.length > 0);

        return update(id, { folder_id: target }).done(function (newId) {
            // update new parent folder
            pool.getModel(target).set('subfolders', true);
            // trigger event
            api.trigger('move', id, newId);
        });
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
    // Reload folder
    //

    function getId(arg) {
        return _.isString(arg) ? arg : (arg ? arg.folder_id : null);
    }

    function reload() {
        _.chain(arguments).flatten().map(getId).compact().uniq().each(function (id) {
            get(id, { cache: false });
        });
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
        multiple: multiple,
        update: update,
        move: move,
        create: create,
        remove: remove,
        reload: reload,
        refresh: refresh,
        is: util.is,
        can: util.can,
        getDefaultFolder: util.getDefaultFolder,
        processListResponse: processListResponse
    };

    // add event hub
    Events.extend(api);

    return api;
});
