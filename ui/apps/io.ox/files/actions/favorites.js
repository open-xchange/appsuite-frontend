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

        if (element.folder_name) {
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
        model.set('index/' + collectionId, collection.length, { silent: false });
        api.propagate('favorite:add', model);
        collection.add(model);
        collection.sort();
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
        model.set('index/' + collectionId, collection.length, { silent: false });
        api.propagate('favorite:remove', model);
        collection.remove(model);
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
