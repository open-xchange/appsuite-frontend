/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/files/favorites', [
    'io.ox/core/folder/node',
    'io.ox/core/folder/api',
    'io.ox/files/api',
    'io.ox/core/extensions',
    'io.ox/core/upsell',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (TreeNodeView, folderAPI, filesAPI, ext, upsell, settings, gt) {

    'use strict';

    var module = 'infostore';

    var FOLDERS_INFOSTORE_PATH = 'favorites/infostore';
    var FILESS_INFOSTORE_PATH = 'favoriteFiles/infostore';

    // skip if no capability (use capabilities from upsell to work in demo mode)
    if (!upsell.has('infostore')) return;

    var // register collection
        collectionId = 'virtual/favorites/infostore',
        model = folderAPI.pool.getModel(collectionId),
        collection = folderAPI.pool.getCollection(collectionId);

    // Add infos for the filesview
    model.set('title', gt('Favorites'));
    model.set('folder_id', '9');
    model.set('own_rights', 1);
    model.set('standard_folder', true);

    function storeFolders(elements) {
        settings.set(FOLDERS_INFOSTORE_PATH, elements);
    }

    function storeFiles(elements) {
        settings.set(FILESS_INFOSTORE_PATH, elements);
    }

    function addFavoriteIndex(model) {
        var fileModel = new filesAPI.Model(model.toJSON());
        fileModel.set('index/' + collectionId, true, { silent: true });
        return fileModel;
    }

    /**
     * Add a folder to the collection
     * @param {Integer} id
     *
     * Additional parameters
     * @param {Folder|File|false} model
     *  Folder model
     */
    function addFavorite(id, model) {

        model = model || folderAPI.pool.getModel(id);

        addFavorites([model]);
    }

    function addFavorites(models) {

        if (!models || models.length === 0) return;

        var folderSettings = settings.get(FOLDERS_INFOSTORE_PATH, []);
        var fileSettings = settings.get(FILESS_INFOSTORE_PATH, []);

        var updateFolders = false;
        var updateFiles = false;
        var collectionModels = [];

        models.forEach(function (model) {
            if (model && model.attributes && model.attributes.id) {
                if (model.attributes.folder_name) {

                    if (folderSettings.indexOf(model.attributes.id) < 0) {
                        folderSettings.push(model.attributes.id);
                        collectionModels.push(addFavoriteIndex(model));
                        updateFolders = true;
                    }

                } else {

                    var file = {
                        id: model.attributes.id,
                        folder_id: model.attributes.folder_id
                    };

                    if (!containsFile(fileSettings, file)) {
                        fileSettings.push(file);
                        collectionModels.push(addFavoriteIndex(model));
                        updateFiles = true;
                    }
                }
            }
        });

        if (updateFolders) {
            storeFolders(folderSettings);
        }
        if (updateFiles) {
            storeFiles(fileSettings);
        }

        if (collectionModels.length > 0) {
            settings.save();
            collection.add(collectionModels);
            triggerCollectionUpdate();
        }

    }

    function removeFavorites(models) {

        if (!models || models.length === 0) return;

        var folders = [];
        var files = [];

        models.forEach(function (obj) {
            var id = obj;
            if (typeof obj === 'object' && obj.attributes && obj.attributes.id) {
                if (obj.attributes.folder_name) {
                    folders.push(obj.id);
                } else if (obj.attributes.folder_id) {
                    files.push({
                        id: obj.attributes.id,
                        folder_id: obj.attributes.folder_id
                    });
                }
            } else if (typeof obj === 'object' && obj.id) {
                if (obj.folder_name) {
                    folders.push(obj.id);
                } else if (obj.folder_id) {
                    files.push({
                        id: obj.id,
                        folder_id: obj.folder_id
                    });
                }
            } else {

                var model = filesAPI.pool.get('detail').get(id);
                if (model && model.attributes && model.attributes.folder_id) {
                    files.push({
                        id: model.attributes.id,
                        folder_id: model.attributes.folder_id
                    });
                } else {
                    model = folderAPI.pool.getModel(id);
                    if (model && model.attributes && model.attributes.folder_name) {
                        folders.push(id);
                    }
                }
            }
        });
        var updateCollection = false;
        if (folders.length > 0) {

            var folderSettings = settings.get(FOLDERS_INFOSTORE_PATH, []);

            var newFolderSettings = folderSettings.filter(function (folder) {
                return folders.indexOf(folder) < 0;
            });
            if (folderSettings.length !== newFolderSettings.length) {
                updateCollection = true;
                storeFolders(newFolderSettings);
            }
        }

        if (files.length > 0) {

            var fileSettings = settings.get(FILESS_INFOSTORE_PATH, []);

            var newFileSettings = fileSettings.filter(function (file) {
                return !containsFile(files, file);
            });
            if (fileSettings.length !== newFileSettings.length) {
                updateCollection = true;
                storeFiles(newFileSettings);
            }

        }

        if (updateCollection) {
            settings.save();
            collection.remove(models);
            triggerCollectionUpdate();
        }
    }

    function containsFile(files, file) {
        return _.find(files, function (removeFile) {
            return removeFile.id === file.id && removeFile.folder_id === file.folder_id;
        });
    }

    /**
     * Trigger to update sorting in myFavoriteListView (drive).
     */
    function triggerCollectionUpdate() {
        collection.trigger('update:collection');
    }

    function refreshCollection() {

        // get saved favorites from setting
        var folderSettings = settings.get(FOLDERS_INFOSTORE_PATH, []);
        var fileSettings = settings.get(FILESS_INFOSTORE_PATH, []);

        var folderDef = $.Deferred();
        var fileDef = $.Deferred();

        folderAPI.multiple(folderSettings, { errors: true, cache: false }).then(function (responses) {
            // remove non-existent entries
            var folderList = _(responses).filter(function (item) {
                if (item.error && /^(FLD-0008|FLD-0003|ACC-0002|FLD-1004|IMAP-1002|FILE_STORAGE-0004)$/.test(item.code)) {
                    return false;
                }
                return true;
            });

            folderDef.resolve(folderList);
        });

        filesAPI.getList(fileSettings, { cache: false, errors: true, fullModels: true }).then(function (responses) {
            var fileList = _(responses).filter(function (response) {
                return !response.error;
            });
            fileDef.resolve(fileList);
        });

        return $.when(folderDef, fileDef).then(function (favoriteFolders, favoriteFiles) {
            var returnList = [];
            var folders = [];
            var files = [];
            _.each(favoriteFolders, function (folder) {
                if (folder) {
                    folderAPI.injectIndex.bind(folderAPI, folder);
                    var folderModel = folderAPI.pool.getModel(folder.id);
                    if (!folderAPI.is('trash', model.toJSON())) {
                        // convert folder model into file model
                        folderModel = new filesAPI.Model(folderModel.toJSON());
                        filesAPI.pool.add('detail', folderModel.toJSON());
                        returnList.push(folderModel);

                        folders.push(folder.id);
                    }
                }
            });

            _.each(favoriteFiles, function (file) {
                if (file) {
                    var model = folderAPI.pool.getModel(file.attributes.folder_id);
                    if (!folderAPI.is('trash', model.toJSON())) {
                        folderAPI.injectIndex.bind(folderAPI, file);
                        returnList.push(file);

                        files.push({
                            id: file.attributes.id,
                            folder_id: file.attributes.folder_id
                        });
                    }
                }
            });

            storeFolders(folders);
            storeFiles(files);
            settings.save();

            collection.reset(returnList);
            collection.fetched = true;
            collection.expired = false;

            model.set('subscr_subflds', favoriteFolders.length > 0);
            triggerCollectionUpdate();

            return returnList;
        });
    }

    /**
     * Definition for virtual folder
     */
    folderAPI.virtual.add(collectionId, function () {
        return refreshCollection();
    });

    // Folder API listener ----------------------------------------------------

    folderAPI.on('rename', function (id, data) {
        var changedModel = collection.get(_.cid(data));
        if (changedModel) {
            changedModel.set('title', data.title);
            triggerCollectionUpdate();
        }
    });

    // error:FLD-1004 is storage was removed (dropbox, googledrive folder etc)
    // error:OAUTH-0040 token no longer valid
    folderAPI.on('error:FLD-1004 remove move collection:remove', function (id, data) {
        removeFavorites([data]);
    });

    // Files API listener -----------------------------------------------------

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
                changedModel.set('com.openexchange.file.sanitizedFilename', file['com.openexchange.file.sanitizedFilename']);
                changedModel.set('title', file.filename);
                triggerCollectionUpdate();
            }
        });
    });

    filesAPI.on('remove:file favorites:remove move', function (list) {
        removeFavorites(list);
    });

    filesAPI.on('favorites:add', function (files) {
        addFavorites(files);
    });

    // Folder tree view extensions --------------------------------------------

    var extension = {
        id: 'favorites',
        index: 1,
        draw: function (tree) {

            this.append(
                new TreeNodeView({
                    empty: false,
                    folder: collectionId,
                    indent: !folderAPI.isFlat(module),
                    open: false,
                    parent: tree,
                    sortable: true,
                    title: gt('Favorites'),
                    tree: tree,
                    icons: tree.options.icons
                })
                    .render().$el.addClass('favorites')
            );
        }
    };

    // Add folder tree view to drive app
    ext.point('io.ox/core/foldertree/infostore/app').extend(_.extend({}, extension));
    // Add foler tree view to popup dialog e.g. Portal 'Open Docuemnt' dialog
    ext.point('io.ox/core/foldertree/infostore/popup').extend(_.extend({}, extension));

    //
    // Folder View ------------------------------------------------------------
    //

    /**
     * Add contextmenu entry 'Add to Favorites' or 'Remove from favorites'
     *
     * @param {Element} node to add the context menu entry
     * @param {Object} options
     */
    function addContextMenuEntry(node, options) {

        if (options.data.module !== 'infostore') return;

        var link = $('<a href="#" role="menuitem">').attr('data-action', options.action).text(options.text).on('click', $.preventDefault); // always prevent default

        if (options.enabled) {
            link.on('click', options.data, options.handler);
        } else {
            link.attr('aria-disabled', true).removeAttr('tabindex').addClass('disabled');
        }

        node.append($('<li role="presentation">').append(link));
    }

    /**
     * Function for add listener
     * @param {Event} e
     */
    function onClickAdd(e) {
        addFavorite(e.data.id);
    }

    /**
     * Function for remove listener
     * @param {Event} e
     */
    function onClickRemove(e) {
        removeFavorites([e.data.id]);
    }

    ext.point('io.ox/core/foldertree/contextmenu/default').extend({
        id: 'toggle-infostore-favorite',
        // place after "Add new folder"
        index: 1010,
        draw: function (baton) {

            var id = baton.data.id,
                module = baton.module,

                // stored favorites from settings
                favorites = settings.get(FOLDERS_INFOSTORE_PATH, []),
                favoriteFiles = settings.get(FILESS_INFOSTORE_PATH, []);

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
            if (folderAPI.is('trash', baton.data)) return;

            addContextMenuEntry(this, {
                action: 'toggle-infostore-favorite',
                data: { id: id, module: module },
                enabled: true,
                handler: isFavorite ? onClickRemove : onClickAdd,
                text: isFavorite ? gt('Remove from favorites') : gt('Add to favorites')
            });
        }
    });

    return {
        add: addFavorite,
        remove: removeFavorites
    };
});
