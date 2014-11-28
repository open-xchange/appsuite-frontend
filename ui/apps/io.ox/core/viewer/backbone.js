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
        THUMBNAIL_SIZE = { thumbnailWidth: 100, thumbnailHeight: 100 }; // todo: set better defaults;

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
                lastModified: null
            };
        },

        initialize: function () {
            //console.warn('FileModel.initialize(): ', data, options);
        },

        parse: function (data) {
            //console.warn('backbone.parse()', data);

            var result = {};

            /**
             * duck check for drive file or e-mail attachment
             */
            function getFileSource (data) {
                if (!data || !data.id) { return null; }
                if ((data.mail && data.mail.id && data.mail.folder_id) || (data.group === 'mail') || (data.disp === 'attachment')) {
                    return ITEM_TYPE_ATTACHMENT;
                } else {
                    return ITEM_TYPE_FILE;
                }
            }

            result.origData = _.copy(data, true);   // create a deep copy, since we want to do updates later
            result.source = getFileSource (data);

            if (result.source === ITEM_TYPE_ATTACHMENT) {
                result.filename = data.filename;
                result.size = data.size;
                result.contentType = data.content_type;
                result.id = data.id;    // could be a attachment id, or drive file id
                result.folderId = data.mail && data.mail.folder_id || null;
            } else if (result.source === ITEM_TYPE_FILE) {
                result.filename = data.filename;
                result.size = data.file_size;
                result.version = data.version;  // drive only
                result.contentType = data.file_mimetype;
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
            if (this.isMailAttachment()) {
                return AttachmentAPI.getUrl(this.get('origData'), 'view');
            } else if (this.isDriveFile()) {
                //return FilesAPI.getUrl(this.get('origData'), 'preview');  // doesn't work
                return FilesAPI.getUrl(this.get('origData'), 'view');
            }
            return null;
        },

        getDownloadUrl: function () {
            if (this.isMailAttachment()) {
                return AttachmentAPI.getUrl(this.get('origData'), 'download');
            } else if (this.isDriveFile()) {
                return FilesAPI.getUrl(this.get('origData'), 'download');
            }
            return null;
        },

        getThumbnailUrl: function () {
            if (this.isMailAttachment()) {
                return AttachmentAPI.getUrl(this.get('origData'), 'view');
            } else if (this.isDriveFile()) {
                return FilesAPI.getUrl(this.get('origData'), 'thumbnail', THUMBNAIL_SIZE);
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
