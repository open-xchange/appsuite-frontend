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

    function getModel(element) {
        var module = 'infostore';
        var model;

        if (element.folder_id === 'folder') {
            model = folderAPI.pool.getModel(element.id);
            module = model.get('module');
            if (!module) {
                model = null;
            }
        } else {
            model = api.pool.get('detail').get(element.cid);
        }

        return model;
    }

    /**
     * Add specified elements to favorites list.
     * @param {Descriptor} element
     *  Descriptor for File/Folder
     */
    function add(elements) {

        var models = [];

        elements.forEach(function (element) {

            var model = getModel(element);

            if (model) {
                models.push(model);
                api.propagate('favorite:add', model.toJSON());
            }
        });

        api.trigger('favorites:add', models);
    }

    /**
     * Remove specified elements from favorites list.
     *
     * @param {Descriptor} element
     *  Descriptor for File/Folder
     */
    function remove(elements) {

        var models = [];

        elements.forEach(function (element) {

            var model = getModel(element);

            if (model) {
                models.push(model);
                api.propagate('favorite:remove', model.toJSON());
            }
        });

        api.trigger('favorites:remove', models);
    }

    return {
        add: function (list) {
            add(list);
        },
        remove: function (list) {
            remove(list);
        }
    };
});
