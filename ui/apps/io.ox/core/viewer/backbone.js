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

    var ITEM_TYPE_FILE = 'drive',
        ITEM_TYPE_MAIL_ATTACHMENT = 'mail',
        ITEM_TYPE_PIM_ATTACHMENT = 'pim';

    /**
     * Guesses (duck check) the source type of a file by its properties.
     *
     * @param {Object} data
     *  a file descriptor object passed from e.g Drive, Calendar or Mail app.
     *
     * @returns {String|null}
     *  returns the file source type or null:
     *      ITEM_TYPE_FILE for Drive files
     *      ITEM_TYPE_MAIL_ATTACHMENT for mail attachments
     *      ITEM_TYPE_PIM_ATTACHMENT for attachments of contacts, appointments or tasks
     */
    function getFileSourceType (data) {
        if (!data) {
            return null;
        }
        if (data instanceof FilesAPI.Model) {
            data = data.toJSON();
        }
        if ((data.mail && data.mail.id && data.mail.folder_id) || (data.group === 'mail') || (data.disp === 'attachment')) {
            return ITEM_TYPE_MAIL_ATTACHMENT;

        } else if (_.isNumber(data.attached) && _.isNumber(data.folder) && _.isNumber(data.module)) {
            return ITEM_TYPE_PIM_ATTACHMENT;

        } else if (_.isString(data.version)) {
            return ITEM_TYPE_FILE;
        }

        return null;
    }

    /**
     * Normalize file descriptors coming from Mail and PIM Apps.
     *
     * @param {Object} data
     *  file descriptor object from Mail, Drive, and PIM Apps.
     *
     * @returns {Object} result
     *  normalized object which will be used to create OX Viewer models.
     *
     */
    function normalize(data) {
        var result = {},
            source = getFileSourceType(data);
        if (!source ) {
            console.warn('Core.Viewer.backbone: Can not determine file source.');
            return result;
        }

        // normalize properties
        switch (source) {
            case ITEM_TYPE_MAIL_ATTACHMENT:
                result = {
                    filename: data.filename,
                    file_size: data.size,
                    file_mimetype: data.content_type,
                    id: data.id,
                    folder_id: data.mail && data.mail.folder_id || null
                }; break;
            case ITEM_TYPE_PIM_ATTACHMENT:
                result = {
                    filename: data.filename,
                    file_size: data.file_size,
                    file_mimetype: data.file_mimetype,
                    id: data.id,
                    folder_id: data.folder,
                    module: data.module
                }; break;
            default:
                break;
        }

        return result;
    }

    /**
     *  The Collection consists of an array of viewer models.
     */
    var Collection = Backbone.Collection.extend({

        model: FilesAPI.Model,

        /**
         *  Normalizes given models array and create Files API models out of the
         *  model objects if not yet already.
         *
         * @param {Array} models
         *  an array of models objects from Drive, Mail or PIM Apps.
         *
         * @returns {Array} viewerModels
         *  an array of file models to be used by OX Viewer.
         */
        parse: function (models) {
            var viewerModels = [];
            _.each(models, function (model) {
                var isFileModel = model instanceof FilesAPI.Model;
                // filter out folders
                if (isFileModel && model.isFolder()) {
                    return;
                }
                // normalize non-file model objects and create file models out of it
                if (!isFileModel) {
                    var normalizedModel = normalize(model);
                    model = new FilesAPI.Model(normalizedModel);
                    model.set('origData', model);
                }
                model.set('source', getFileSourceType(model));
                viewerModels.push(model);
            });
            return viewerModels;
        },

        /**
         * Finds the current start (selected) file in the model and save the model index
         * in the collection. If the selected file is not found, zero index will be set.
         *
         * @param {Object} startFile
         *  The file descriptor of the currently selected file.
         */
        setStartIndex: function (startFile) {
            if (!startFile || !startFile.id ) { return; }
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
