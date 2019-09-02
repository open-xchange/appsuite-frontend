/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Kristof Kamin <kristof.kamin@open-xchange.com>
 */

define('io.ox/files/favorites', [
    'io.ox/core/folder/node',
    'io.ox/core/folder/api',
    'io.ox/files/api',
    'io.ox/core/extensions',
    'io.ox/core/upsell',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (TreeNodeView, api, filesAPI, ext, upsell, settings, gt) {

    'use strict';

    var module = 'infostore';

    // skip if no capability (use capabilities from upsell to work in demo mode)
    if (!upsell.has('infostore')) return;

    var // register collection
        id = 'virtual/favorites/infostore',
        model = api.pool.getModel(id),
        collection = api.pool.getCollection(id),
        // track folders without permission or that no longer exist
        invalid = {};

    function storeFolders(elements) {
        settings.set('favorites/infostore', elements).save();
    }

    function storeFiles(elements) {
        settings.set('favoriteFiles/infostore', elements).save();
    }

    /**
     * Reads all models from folder collection (virtual/favorties/infostore)
     * and pushes them into store function
     */
    function storeCollection() {
        var folders = [];
        var files = [];

        _.each(collection.models, function (model) {
            if (model.attributes && model.attributes.id) {
                if (model.attributes.folder_name) {
                    folders.push(model.attributes.id);
                } else {
                    files.push({
                        id: model.attributes.id,
                        folder_id: model.attributes.folder_id
                    });
                }
            }
        });
        // trigger to update sorting in myFavoriteListView (drive)
        collection.trigger('update:collection');
        storeFolders(folders);
        storeFiles(files);
    }

    /**
     * Definition for virtual folder
     */
    api.virtual.add(id, function () {
        var cache = !collection.expired && collection.fetched;

        // get saved favorites from setting
        var folderSettings = settings.get('favorites/infostore', []);
        var fileSettings = settings.get('favoriteFiles/infostore', []);

        var folderDef = $.Deferred();
        var fileDef = $.Deferred();

        api.multiple(folderSettings, { errors: true, cache: cache }).then(function (response) {
            // remove non-existent entries
            var responseList = _(response).filter(function (item) {
                if (item.error && /^(FLD-0008|FLD-0003|ACC-0002|FLD-1004|IMAP-1002|FILE_STORAGE-0004)$/.test(item.code)) {
                    invalid[item.id] = true;
                    return false;
                }
                delete invalid[item.id];
                return true;
            });

            folderDef.resolve(responseList);
        });

        filesAPI.getList(fileSettings, { errors: true, cache: cache, fullModels: true }).then(function (response) {
            fileDef.resolve(response);
        });

        return $.when(folderDef, fileDef).then(function (favoriteFolders, favoriteFiles) {
            var returnList = [];

            _.each(favoriteFolders, function (folder) {
                api.injectIndex.bind(api, folder);
                var folderModel = api.pool.getModel(folder.id);
                // convert folder model into file model
                folderModel = new filesAPI.Model(folderModel.toJSON());
                filesAPI.pool.add('detail', folderModel.toJSON());
                returnList.push(folderModel);
            });

            _.each(favoriteFiles, function (file) {
                api.injectIndex.bind(api, file);
                returnList.push(file);
            });

            collection.add(returnList);
            collection.fetched = true;
            collection.expired = false;

            model.set('subscr_subflds', favoriteFolders.length > 0);
            // _.defer(storeCollection);
            storeCollection();

            return returnList;
        });
    });

    // respond to change events
    collection.on('add', function (model) {
        delete invalid[model.id];
    });

    collection.on('add remove change:id', storeCollection);

    // Add infos for the filesview
    model.set('title', gt('Favorites'));
    model.set('folder_id', '9');
    model.set('own_rights', 1);
    model.set('standard_folder', true);

    // Register listener for folder changes
    api.on('rename', function (id, data) {
        var changedModel = collection.get(_.cid(data));
        if (changedModel) {
            changedModel.set('title', data.title);
            storeCollection();
        }
    });
    api.on('remove', function (id, data) {
        collection.remove(_.cid(data));
        storeCollection();
    });

    // Register listener for file changes
    filesAPI.on('move', function (objects) {
        _.each(objects, function (obj) {
            var id = obj;
            if (typeof obj === 'object') {
                id = (obj.folder_id !== undefined) ? _.cid(obj) : obj.id;
            }
            collection.remove(id);
        });
    });
    filesAPI.on('rename description add:version remove:version change:version', function (obj) {
        var id = obj;
        if (typeof obj === 'object') {
            id = (obj.folder_id !== undefined) ? _.cid(obj) : obj.id;
        } else {
            obj = _.cid(obj);
        }

        filesAPI.get(obj).done(function (file) {
            var changedModel = collection.get(id);
            if (changedModel) {
                changedModel.set('com.openexchange.file.sanitizedFilename', file.filename);
                changedModel.set('title', file.filename);
                storeCollection();
            }
        });
    });
    filesAPI.on('remove:file', function (list) {
        _.each(list, function (model) {
            collection.remove(model.id);
        });
        storeCollection();
    });

    var extension = {
        id: 'favorites',
        index: 1,
        draw: function (tree) {

            this.append(
                new TreeNodeView({
                    empty: false,
                    folder: id,
                    indent: !api.isFlat(module),
                    open: false,
                    parent: tree,
                    sortable: true,
                    title: gt('Favorites'),
                    tree: tree,
                    icons: tree.options.icons
                })
                    .render().$el.addClass('favorites')
            );

            // store new order
            tree.on('sort:' + id, function () {
                storeCollection();
            });
        }
    };

    ext.point('io.ox/core/foldertree/infostore/app').extend(_.extend({}, extension));
    ext.point('io.ox/core/foldertree/infostore/popup').extend(_.extend({}, extension));

    /**
     * Removes specified model from collection
     * @param {Integer} id
     *  folder id or file cid
     * @param {Boolean} isFile
     *  if the element is a file
     *
     * Additional parameters
     * @param {File|Folder|false} model
     *  Folder or File model
     */
    function remove(id, model) {
        var collectionId,
            collection;

        // Load file/folder model from pool
        if (!model) {
            model = filesAPI.pool.get('detail').get(id);
            if (!model) {
                model = api.pool.getModel(id);
            }
            collectionId = 'virtual/favorites/infostore';
        }

        collection = api.pool.getCollection(collectionId);
        collection.remove(model);
    }

    /**
     * Adds folder to the collection
     * @param {Integer} id
     *
     * Additional parameters
     * @param {Folder|false} model
     *  Folder model
     */
    function add(id, model) {
        model = model || api.pool.getModel(id);
        if (!model.get('module')) return;
        var collectionId = 'virtual/favorites/infostore',
            collection = api.pool.getCollection(collectionId);
        // convert folder model into file model
        model = new filesAPI.Model(model.toJSON());
        model.set('index/' + collectionId, true, { silent: true });
        collection.add(model);
        collection.sort();
    }

    //
    // Folder API listeners
    //

    api.on('collection:remove', function (id, model) {
        remove(id, model);
    });

    /**
     * Function for add listener
     * @param {Event} e
     */
    function onAdd(e) {
        add(e.data.id);
    }

    /**
     * Function for remove listener
     * @param {Event} e
     */
    function onRemove(e) {
        remove(e.data.id, e.data.isFile);
    }

    function a(action, text) {
        return $('<a href="#" role="menuitem">')
            .attr('data-action', action).text(text)
            // always prevent default
            .on('click', $.preventDefault);
    }

    function disable(node) {
        return node.attr('aria-disabled', true).removeAttr('tabindex').addClass('disabled');
    }

    function addLink(node, options) {
        if (options.data.module !== 'infostore') return;
        var link = a(options.action, options.text);
        if (options.enabled) link.on('click', options.data, options.handler); else disable(link);
        node.append($('<li role="presentation">').append(link));
        return link;
    }

    ext.point('io.ox/core/foldertree/contextmenu/default').extend({
        id: 'toggle-infostore-favorite',
        // place after "Add new folder"
        index: 1010,
        draw: function (baton) {

            var id = baton.data.id,
                module = baton.module,

                // stored favorites from settings
                favorites = settings.get('favorites/infostore', []),
                favoriteFiles = settings.get('favoriteFiles/infostore', []);

            _.each(favoriteFiles, function (file) {
                favorites.push(file.id);
            });

            // checks if given element is in the favorite setting
            var isFavorite = _.find(favorites, function (elemId) {
                if (elemId === id) {
                    return true;
                }
            });


            // don't offer for trash folders
            if (api.is('trash', baton.data)) return;

            addLink(this, {
                action: 'toggle-infostore-favorite',
                data: { id: id, module: module },
                enabled: true,
                handler: isFavorite ? onRemove : onAdd,
                text: isFavorite ? gt('Remove from favorites') : gt('Add to favorites')
            });
        }
    });

    return {
        add: add,
        remove: remove
    };
});
