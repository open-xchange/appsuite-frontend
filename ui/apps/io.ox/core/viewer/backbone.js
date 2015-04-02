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
    'io.ox/files/api',
    'io.ox/core/api/attachment',
    'io.ox/mail/api'
], function (FilesAPI, AttachmentAPI, MailAPI) {

    'use strict';

    var ITEM_TYPE_FILE = 'drive',
        ITEM_TYPE_MAIL_ATTACHMENT = 'mail',
        ITEM_TYPE_PIM_ATTACHMENT = 'pim',
        VIEW_MODES = { VIEW: 'view', PREVIEW: 'preview', THUMBNAIL: 'thumbnail', DOWNLOAD: 'download' },
        MIME_TYPES = {
            IMAGE: {
                'jpg':  'image/jpeg',
                'jpeg': 'image/jpeg',
                'png':  'image/png',
                'gif':  'image/gif',
                'tif':  'image/tiff',
                'tiff': 'image/tiff',
                'bmp':  'image/bmp'
            },
            AUDIO: {
                'mp3':  'audio/mpeg',
                'ogg':  'audio/ogg',
                'opus': 'audio/ogg',
                'aac':  'audio/aac',
                'm4a':  'audio/mp4',
                'm4b':  'audio/mp4',
                'wav':  'audio/wav'
            },
            VIDEO: {
                'mp4':  'video/mp4',
                'm4v':  'video/mp4',
                'ogv':  'video/ogg',
                'ogm':  'video/ogg',
                'webm': 'video/webm'
            },
            OFFICE: {
                // open office
                'odc': 'application/vnd.oasis.opendocument.chart',
                'odb': 'application/vnd.oasis.opendocument.database',
                'odf': 'application/vnd.oasis.opendocument.formula',
                'odg': 'application/vnd.oasis.opendocument.graphics',
                'otg': 'application/vnd.oasis.opendocument.graphics-template',
                'odi': 'application/vnd.oasis.opendocument.image',
                'odp': 'application/vnd.oasis.opendocument.presentation',
                'otp': 'application/vnd.oasis.opendocument.presentation-template',
                'ods': 'application/vnd.oasis.opendocument.spreadsheet',
                'ots': 'application/vnd.oasis.opendocument.spreadsheet-template',
                'odt': 'application/vnd.oasis.opendocument.text',
                'odm': 'application/vnd.oasis.opendocument.text-master',
                'ott': 'application/vnd.oasis.opendocument.text-template',
                'oth': 'application/vnd.oasis.opendocument.text-web',
                // microsoft office
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'xltx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
                'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'ppsx': 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
                'potx': 'application/vnd.openxmlformats-officedocument.presentationml.template',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
                'doc': 'application/msword',
                'dot': 'application/msword',
                'xls': 'application/vnd.ms-excel',
                'xlb': 'application/vnd.ms-excel',
                'xlt': 'application/vnd.ms-excel',
                'ppt': 'application/vnd.ms-powerpoint',
                'pps': 'application/vnd.ms-powerpoint'
            },

            OFFICE_SPREADSHEET: {
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'xltx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
                'xls': 'application/vnd.ms-excel',
                'xlb': 'application/vnd.ms-excel',
                'xlt': 'application/vnd.ms-excel',
                'ods': 'application/vnd.oasis.opendocument.spreadsheet',
                'ots': 'application/vnd.oasis.opendocument.spreadsheet-template'
            },

            OFFICE_TEXT: {
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
                'doc': 'application/msword',
                'dot': 'application/msword',
                'odt': 'application/vnd.oasis.opendocument.text',
                'odm': 'application/vnd.oasis.opendocument.text-master',
                'ott': 'application/vnd.oasis.opendocument.text-template',
                'oth': 'application/vnd.oasis.opendocument.text-web'
            },

            OFFICE_PRESENTATION: {
                'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'ppsx': 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
                'potx': 'application/vnd.openxmlformats-officedocument.presentationml.template',
                'ppt': 'application/vnd.ms-powerpoint',
                'pps': 'application/vnd.ms-powerpoint',
                'odp': 'application/vnd.oasis.opendocument.presentation',
                'otp': 'application/vnd.oasis.opendocument.presentation-template'
            },

            PDF: {
                'pdf': 'application/pdf'
            }
        };

    function convert(data) {
        var result = {};

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
            if (!data || !data.id) { return null; }

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
         *  Retrieves the file category from its MIME type and extension.
         *
         *  @param {String} mimeType
         *  the MIME type string
         *
         *  @param {String} fileExtension
         *  the file extension
         *
         *  @returns {String}
         *   Returns one of these supported categories: 'IMAGE', 'VIDEO', AUDIO', 'OFFICE', 'PDF',
         *   and returns null if no matching category is found.
         */
        function getFileCategory (mimeType, fileExtension) {
            var fileCategory = null;
            _.each(MIME_TYPES, function (types, category) {
                var mimeTypes = _.values(types),
                    extensions = _.keys(types);
                if (_.contains(mimeTypes, mimeType) || _.contains(extensions, fileExtension)) {
                    fileCategory = category;
                }
            });
            return fileCategory;
        }

        /**
         *  Retrieves the extension from a given file name.
         *
         * @param {String} filename
         *  Filename string
         *
         * @returns {String | null}
         *  Returns the file extension string if found, null otherwise.
         */
        function getExtension (fileName) {
            if (!fileName || !_.isString(fileName) || fileName.length === 0) { return null; }
            var index = fileName.lastIndexOf('.');
            return (fileName.lastIndexOf('.') >= 0) ? fileName.substring(index + 1).toLowerCase() : null;
        }

        result.source = getFileSourceType (data);

        if (result.source === ITEM_TYPE_MAIL_ATTACHMENT) {
            result.filename = data.filename;
            result.size = data.size;
            result.contentType = data.content_type;
            result.fileCategory = getFileCategory(data.content_type, getExtension(data.filename));
            result.id = data.id;    // could be a attachment id, or drive file id
            result.folderId = data.mail && data.mail.folder_id || null;

        } else if (result.source === ITEM_TYPE_PIM_ATTACHMENT) {
            result.filename = data.filename;
            result.size = data.file_size;
            result.contentType = data.file_mimetype;
            result.fileCategory = getFileCategory(data.file_mimetype, getExtension(data.filename));
            result.id = data.id;
            result.folderId = data.folder;
            result.module = data.module;

        } else if (result.source === ITEM_TYPE_FILE) {
            result.filename = data.filename;
            result.size = data.file_size;
            result.version = data.version;  // drive only
            result.contentType = data.file_mimetype;
            result.fileCategory = getFileCategory(data.file_mimetype, getExtension(data.filename));
            result.id = data.id;    // could be a attachment id, or drive file id
            result.folderId = data.folder_id;
            result.meta = data.meta;
            result.lastModified = data.last_modified;
            result.numberOfVersions = data.number_of_versions;
            result.description = data.description;
        }

        return result;
    }

    /**
     *  The Model represents a general file model for the OX Viewer.
     */
    var Model = Backbone.Model.extend({

        defaults: function () {
            return {
                origData: null,
                source: null,
                filename: '',
                size: 0,
                version: null, // nur drive
                contentType: null,
                id: null, // could be a attachment id, or drive file id
                folderId: null,
                meta: {},
                lastModified: null,
                module: null,
                description: null,
                versions: null,
                numberOfVersions: 0
            };
        },

        initialize: function () {
            //console.warn('FileModel.initialize(): ', data);
        },

        parse: convert,

        isMailAttachment: function () {
            return this.get('source') === ITEM_TYPE_MAIL_ATTACHMENT;
        },

        isPIMAttachment: function () {
            return this.get('source') === ITEM_TYPE_PIM_ATTACHMENT;
        },

        isDriveFile: function () {
            return this.get('source') === ITEM_TYPE_FILE;
        },

        /**
         * Whether this file is a 'Document' file. Office or PDF are declared
         * as documents at the moment.
         *
         * @returns {boolean}
         */
        isDocumentFile: function () {
            var category = this.get('fileCategory');
            return (_.isString(category) && category.indexOf('OFFICE') >= 0) || (category === 'PDF');
        },

        getPreviewUrl: function () {
            if (this.isMailAttachment()) {
                return MailAPI.getUrl(this.get('origData'), VIEW_MODES.VIEW);

            } else if (this.isDriveFile()) {
                var viewMode = VIEW_MODES.THUMBNAIL;
                // temporary workaround to show previews of office documents
                if (this.isDocumentFile()) {
                    viewMode = VIEW_MODES.PREVIEW;
                }
                return FilesAPI.getUrl(this.get('origData').attributes, viewMode, null);

            } else if (this.isPIMAttachment()) {
                return AttachmentAPI.getUrl(this.get('origData'), VIEW_MODES.VIEW);
            }
            return null;
        }

    });

    /**
     *  The Collection consists of an array of viewer models.
     */
    var Collection = Backbone.Collection.extend({

        model: Model,

        // TODO: filter file models without a real file
        /**
         *  Transform Drive Backbone Models to Viewer Backbone Models.
         *
         * @param {Array} models
         *  Backbone models from Drive.
         *
         * @returns {Array} viewerModels
         *  Viewer Backbone models.
         */
        parse: function (models) {
            var viewerModels = [];
            //var self = this;
            _.each(models, function (model) {
                // check if model is a Backbone Model (Drive), or POJs (Mail, PIM apps)
                var attributes = model instanceof Backbone.Model ? model.attributes : model,
                    newModel = new Model(attributes, { parse: true });
                newModel.set('origData', model);
                viewerModels.push(newModel);
                newModel.listenTo(model, 'change', function (changeModel) {
                    //console.warn('ViewerCollection model changed', changeModel, changeModel.changed);
                    var converted = convert(changeModel.attributes);
                    newModel.set(converted);
                    //console.warn('ViewerCollection model converted', newModel, converted);
                });
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
        Model: Model,
        Collection: Collection
    };
});
