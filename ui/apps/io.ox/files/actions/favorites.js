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

define('io.ox/files/actions/favorites', [
    'io.ox/files/api',
    'io.ox/core/folder/api'
], function (api, folderAPI) {

    'use strict';

    /**
     * Add specified element to favorites collection
     * @param {Descriptor} element
     *  Descriptor for File/Folder
     *
     * Additional parameters
     * @param {File|Folder|false} model
     *  Model to add to collection
     */
    function add(element, model) {
        var collectionId,
            collection,
            module = 'infostore';

        if (element.folder_id === 'folder') {
            model = model || folderAPI.pool.getModel(element.id);
            module = model.get('module');
            if (!module) {
                return;
            }
        } else {
            model = model || api.pool.get('detail').get(element.cid);
        }

        collectionId = 'virtual/favorites/' + module;
        collection = folderAPI.pool.getCollection(collectionId);
        // convert folder model into file model
        model = new api.Model(model.toJSON());

        if (!collection.fetched || collection.expired) {
            require(['settings!io.ox/core'], function (Settings) {
                var settingsId = 'favorites/infostore',
                    setting = model.id;
                if (model.isFile()) {
                    settingsId = 'favoriteFiles/infostore';
                    setting = {
                        id: model.attributes.id,
                        folder_id: model.attributes.folder_id
                    };
                }
                var favoriteSettings = Settings.get(settingsId, []);
                favoriteSettings.push(setting);
                Settings.set(settingsId, favoriteSettings);
            });
        } else {
            model.set('index/' + collectionId, true, { silent: false });
            collection.add(model);
            collection.sort();
        }
        api.propagate('favorite:add', model);
    }

    /**
     * Remove specified element from favorites collection
     * @param {Descriptor} element
     *  Descriptor for File/Folder
     *
     * Additional parameters
     * @param {File|Folder|false} model
     *  Model to remove from collection
     */
    function remove(element, model) {
        var collectionId,
            collection,
            module = 'infostore';

        if (element.folder_id === 'folder') {
            model = model || folderAPI.pool.getModel(element.id);
            module = model.get('module');
            if (!module) {
                return;
            }
        } else {
            model = model || api.pool.get('detail').get(element.cid);
        }

        collectionId = 'virtual/favorites/' + module;
        collection = folderAPI.pool.getCollection(collectionId);

        if (!collection.fetched || collection.expired) {
            require(['settings!io.ox/core'], function (Settings) {
                var favoriteSettings;

                if (model.isFile()) {
                    favoriteSettings = Settings.get('favoriteFiles/infostore', []);
                    favoriteSettings = _(favoriteSettings).filter(function (favorite) {
                        return favorite.id !== model.get('id');
                    });
                } else {
                    favoriteSettings = Settings.get('favorites/infostore', []);
                    favoriteSettings = _(favoriteSettings).filter(function (favoriteId) {
                        return favoriteId !== model.get('id');
                    });
                }

                Settings.set('favorites/infostore', favoriteSettings);
            });
        } else {
            model.set('index/' + collectionId, true, { silent: false });
            collection.remove(model);
        }
        api.propagate('favorite:remove', model);
    }

    return {
        add: function (list) {
            _.each(list, function (element) {
                add(element);
            });
        },
        remove: function (list) {
            _.each(list, function (element) {
                remove(element);
            });
        }
    };
});
