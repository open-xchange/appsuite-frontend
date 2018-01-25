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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/favorites', [
    'io.ox/core/folder/node',
    'io.ox/core/folder/api',
    'io.ox/files/api',
    'io.ox/core/extensions',
    'io.ox/core/upsell',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (TreeNodeView, api, filesAPI, ext, upsell, settings, gt) {

    'use strict';

    _('mail contacts calendar tasks infostore'.split(' ')).each(function (module) {

        // skip if no capability (use capabilities from upsell to work in demo mode)
        if (module === 'mail' && !upsell.has('webmail')) return;
        if (module !== 'mail' && !upsell.has(module)) return;

        var // register collection
            id = 'virtual/favorites/' + module,
            model = api.pool.getModel(id),
            collection = api.pool.getCollection(id),
            // track folders without permission or that no longer exist
            invalid = {};

        /**
         * Stores given elements into setting (favorites/[module])
         * @param elements {Object[]} Element to store
         *  Needed parameters
         *  @param {Integer} [elements.id]
         *      modelId to store
         *  @param {Integer} [elements.folder_id]
         *      in which folder the element is located
         *  @param {Boolean} [elements.isFolder]
         *      element is folder or not
         */
        function store(elements) {
            settings.set('favorites/' + module, elements).save();
        }

        /**
         * Reads all models from folder collection (virtual/favorties/[module])
         * and pushes them into store function
         */
        function storeCollection() {
            var elements = [];

            _.each(collection.models, function (model) {
                if (model.attributes.id) {
                    var id,
                        folder_id;
                    if (model.attributes) {
                        id = model.attributes.id;
                        folder_id = model.attributes.folder_id;
                    }
                    elements.push({
                        id: id,
                        folder_id: folder_id,
                        isFolder: model.attributes.folder_name !== undefined
                    });
                }
            });
            // trigger to update sorting in myFavoriteListView (drive)
            collection.trigger('update:collection');
            store(elements);
        }

        /**
         * Definition for virtual folder
         */
        api.virtual.add(id, function () {
            var cache = !collection.expired && collection.fetched;

            // get saved favorites from setting
            var favorites = settings.get('favorites/' + module, []);
            if (typeof favorites[0] === 'object') {
                var files = [];
                var folders = [];
                _.each(favorites, function (element) {
                    if (element.isFolder) {
                        folders.push(element.id);
                    } else {
                        files.push(element);
                    }
                });

                /**
                 * Creates an array with all models for files/folders from the setting and
                 * removes special folders.
                 * Stores the files/folders into the collection and back into the setting
                 */
                return filesAPI.getList(files, { errors: true, cache: cache, fullModels: true }).then(function (favoriteFiles) {
                    return api.multiple(folders, { errors: true, cache: cache }).then(function (favoriteFolders) {
                        var folderList = _(favoriteFolders).filter(function (item) {
                            // FLD-0008 -> not found
                            // FLD-0003 -> permission denied
                            // ACC-0002 -> account not found (see bug 46481)
                            // FLD-1004 -> folder storage service no longer available (see bug 47089)
                            // IMAP-1002 -> mail folder "..." could not be found on mail server (see bug 47847)
                            // FILE_STORAGE-0004 -> The associated (infostore) account no longer exists
                            if (item.error && /^(FLD-0008|FLD-0003|ACC-0002|FLD-1004|IMAP-1002|FILE_STORAGE-0004)$/.test(item.code)) {
                                invalid[item.id] = true;
                                return false;
                            }
                            delete invalid[item.id];
                            return true;
                        });

                        var returnList = [];
                        _.each(folderList, function (folder) {
                            api.injectIndex.bind(api, folder);
                            var model = api.pool.getModel(folder.id);
                            // convert folder model into file model
                            model = new filesAPI.Model(model.toJSON());
                            filesAPI.pool.add('detail', model.toJSON());
                            returnList.push(model);
                        });
                        _.each(favoriteFiles, function (file) {
                            api.injectIndex.bind(api, file);
                            returnList.push(file);
                        });
                        collection.add(returnList);
                        model.set('subscr_subflds', folderList.length > 0 && favoriteFiles.length > 0);
                        storeCollection();

                        return returnList;
                    });
                });
            }

            /**
             * Fallback for old favorite settings (only for folders)
             */
            return api.multiple(settings.get('favorites/' + module, []), { errors: true, cache: cache }).then(function (response) {
                // remove non-existent entries
                var list = _(response).filter(function (item) {
                    if (item.error && /^(FLD-0008|FLD-0003|ACC-0002|FLD-1004|IMAP-1002|FILE_STORAGE-0004)$/.test(item.code)) {
                        invalid[item.id] = true;
                        return false;
                    }
                    delete invalid[item.id];
                    return true;
                });
                _(list).each(api.injectIndex.bind(api, id));
                model.set('subscr_subflds', list.length > 0);
                // if there was an error we update settings
                if (list.length !== response.length) _.defer(storeCollection);
                return list;
            });
        });

        // respond to change events
        collection.on('add', function (model) {
            delete invalid[model.id];
        });

        collection.on('add remove change:id', storeCollection);

        // response to rename for mail folders
        if (module === 'mail') {

            api.on('rename', function (id, data) {
                if (data.module !== 'mail') return;
                getAffectedSubfolders(collection, id).forEach(function (model) {
                    model.set('id', data.id + model.get('id').substr(id.length));
                    storeCollection();
                });
            });

            api.on('remove:mail', function (data) {
                getAffectedSubfolders(collection, data.id).forEach(function (model) {
                    collection.remove(model);
                    storeCollection();
                });
            });
        } else if (module === 'infostore') {
            // Add infos for the filesview
            model.set('title', gt('Favorites'));
            model.set('folder_id', '9');
            model.set('own_rights', 1);
            model.set('standard_folder', true);

            // Register listener for folder changes
            api.on('rename', function (id, data) {
                if (data.module === 'mail') return;
                var changedModel = collection.get(_.cid(data));
                if (changedModel) {
                    changedModel.set('title', data.title);
                    storeCollection();
                }
            });
            api.on('remove', function (id, data) {
                if (data.module === 'mail') return;
                collection.remove(_.cid(data));
                storeCollection();
            });

            // Register listener for file changes
            filesAPI.on('rename description add:version remove:version change:version', function (obj) {
                var id = obj;
                if (typeof obj === 'object') {
                    id = (obj.folder_id !== undefined) ? _.cid(obj) : obj.id;
                }
                var newModel = filesAPI.pool.get('detail').get(id).toJSON();
                var changedModel = collection.get(id);
                if (changedModel) {
                    changedModel.set('com.openexchange.file.sanitizedFilename', newModel.filename);
                    changedModel.set('title', newModel.filename);
                    storeCollection();
                }
            });
            filesAPI.on('remove:file', function (list) {
                _.each(list, function (model) {
                    collection.remove(model.id);
                });
                storeCollection();
            });
        }

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
                tree.on('sort:' + id, store);
            }
        };

        ext.point('io.ox/core/foldertree/' + module + '/app').extend(_.extend({}, extension));
        ext.point('io.ox/core/foldertree/' + module + '/popup').extend(_.extend({}, extension));
    });

    function getAffectedSubfolders(collection, id) {
        return collection.filter(function (model) {
            var modelId = model.get('id');
            if (!modelId) return;
            return modelId.indexOf(id + api.getMailFolderSeparator(modelId)) === 0;
        });
    }

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
    function remove(id, isFile, model) {
        var collectionId,
            collection;

        // Load file/folder model from pool
        if (!model) {
            if (isFile) {
                model = filesAPI.pool.get('detail').get(id);
                collectionId = 'virtual/favorites/infostore';
            } else {
                model = api.pool.getModel(id);
                collectionId = 'virtual/favorites/' + model.get('module');
            }
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
        var collectionId = 'virtual/favorites/' + model.get('module'),
            collection = api.pool.getCollection(collectionId);
        // convert folder model into file model
        model = new filesAPI.Model(model.toJSON());
        model.set('index/' + collectionId, collection.length, { silent: true });
        collection.add(model);
        collection.sort();
    }

    //
    // Folder API listeners
    //

    api.on('collection:remove', remove);

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
        var link = a(options.action, options.text);
        if (options.enabled) link.on('click', options.data, options.handler); else disable(link);
        node.append($('<li role="presentation">').append(link));
        return link;
    }

    ext.point('io.ox/core/foldertree/contextmenu/default').extend({
        id: 'toggle-favorite',
        // place after "Add new folder"
        index: 1010,
        draw: function (baton) {

            var id = baton.data.id,
                module = baton.module,

                // stored favorites from settings
                favorites = settings.get('favorites/' + module, []),

                // checks if given element is in the favorite setting
                isFavorite = _.find(favorites, function (elem) {
                    if (elem.id === id) {
                        return true;
                    }
                });
            // don't offer for trash folders
            if (api.is('trash', baton.data)) return;

            addLink(this, {
                action: 'toggle-favorite',
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
