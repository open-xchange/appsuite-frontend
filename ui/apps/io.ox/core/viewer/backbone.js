/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/viewer/backbone', [
    'io.ox/files/api'
], function (FilesAPI) {

    'use strict';

    /**
     *  The Collection consists of an array of viewer models.
     */
    var Collection = Backbone.Collection.extend({

        model: FilesAPI.Model,

        /**
         *  Normalizes given models array and create Files API models out of the
         *  model objects if not yet already.
         *  For compatibility reasons,the original model will be saved as
         *  'origData' property for Mail and PIM attachment files.
         *
         * @param {Array} models
         *  an array of models objects from Drive, Mail or PIM Apps.
         *
         * @returns {Array} viewerModels
         *  an array of file models to be used by OX Viewer.
         */
        parse: function (models) {
            var viewerFileModels = [];
            _.each(models, function (model) {
                if (model instanceof FilesAPI.Model) {
                    // filter out folders
                    if (!model.isFolder()) {
                        // drive files
                        viewerFileModels.push(model);
                    }
                } else {
                    // mail, PIM attachments
                    viewerFileModels.push(new FilesAPI.Model(model));
                }
            });
            return viewerFileModels;
        },

        /**
         * Finds the current start (selected) file in the model and save the model index
         * in the collection. If the selected file is not found, zero index will be set.
         *
         * @param {Object} startFile
         *  The file descriptor of the currently selected file.
         */
        setStartIndex: function (startFile) {
            if (!startFile || !startFile.id) { return; }
            var startModel = this.findWhere({ id: startFile.id }),
                startModelIndex = this.indexOf(startModel);
            this.startIndex = startModelIndex < 0 ? 0 : startModelIndex;
        },

        /**
         * Gets the index of the selected file in the collection.
         *
         * @returns {Number} startIndex
         *  Returns the start index or zero if startIndex is not set.
         */
        getStartIndex: function () {
            return this.startIndex || 0;
        }

    });

    return {
        Collection: Collection
    };
});
