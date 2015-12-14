/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
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
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 * @author Edy Haryono <edy.haryono@open-xchange.com>
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
