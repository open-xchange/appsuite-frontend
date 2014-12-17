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
    'io.ox/core/api/attachment'
], function (FilesAPI, AttachmentAPI) {

    'use strict';

    var ITEM_TYPE_FILE = 'file',
        ITEM_TYPE_ATTACHMENT = 'attachment',
        THUMBNAIL_SIZE = { thumbnailWidth: 400, thumbnailHeight: 600 }, // temporary default size for office docs
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
                description: null
            };
        },

        initialize: function () {
            //console.warn('FileModel.initialize(): ', data, options);
        },

        parse: function (data) {

            var result = {};

            /**
             * Guesses the source of a file by its properties.
             *
             * @param {Object} data
             *  a file descriptor object passed from e.g Drive or Mail app.
             *
             * @returns {String}
             *  returns the file source string constant ('file' or 'attachment')
             */
            function getFileSource (data) {
                if (!data || !data.id) { return null; }
                if ((data.mail && data.mail.id && data.mail.folder_id) || (data.group === 'mail') || (data.disp === 'attachment')) {
                    return ITEM_TYPE_ATTACHMENT;
                } else {
                    return ITEM_TYPE_FILE;
                }
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

            result.origData = _.copy(data, true);   // create a deep copy, since we want to do updates later
            result.source = getFileSource (data);

            if (result.source === ITEM_TYPE_ATTACHMENT) {
                result.filename = data.filename;
                result.size = data.size;
                result.contentType = data.content_type;
                result.fileCategory = getFileCategory(data.content_type, getExtension(data.filename));
                result.id = data.id;    // could be a attachment id, or drive file id
                result.folderId = data.mail && data.mail.folder_id || null;
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
            }

            return result;
        },

        isMailAttachment: function () {
            return this.get('source') === ITEM_TYPE_ATTACHMENT;
        },

        isDriveFile: function () {
            return this.get('source') === ITEM_TYPE_FILE;
        },

        getPreviewUrl: function () {
            //console.warn('backbone.getPreviewUrl()');
            if (this.isMailAttachment()) {
                return AttachmentAPI.getUrl(this.get('origData'), VIEW_MODES.VIEW);
            } else if (this.isDriveFile()) {
                // temporary workaround to show previews of office documents
                var fileCategory = this.get('fileCategory'),
                    viewMode = VIEW_MODES.THUMBNAIL;
                if (fileCategory && fileCategory.indexOf('OFFICE') >= 0) {
                    viewMode = VIEW_MODES.PREVIEW;
                }
                return FilesAPI.getUrl(this.get('origData'), viewMode, null);
            }
            return null;
        },

        getDownloadUrl: function () {
            if (this.isMailAttachment()) {
                return AttachmentAPI.getUrl(this.get('origData'), VIEW_MODES.DOWNLOAD);
            } else if (this.isDriveFile()) {
                return FilesAPI.getUrl(this.get('origData'), VIEW_MODES.DOWNLOAD);
            }
            return null;
        },

        getThumbnailUrl: function () {
            if (this.isMailAttachment()) {
                return AttachmentAPI.getUrl(this.get('origData'), VIEW_MODES.VIEW);
            } else if (this.isDriveFile()) {
                return FilesAPI.getUrl(this.get('origData'), VIEW_MODES.THUMBNAIL, THUMBNAIL_SIZE);
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
        parse: function (model/*, options*/) {
            //console.info('FileCollection.parse()', model, options);
            return model;
        },

        initialize: function () {
            //console.info('FileCollection.initialize()');
        }

    });

    return {
        Model: Model,
        Collection: Collection
    };
});
