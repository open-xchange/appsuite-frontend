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

define('io.ox/core/viewer/models/filemodel', [
    'io.ox/files/api',
    'io.ox/core/api/attachment'
], function (FilesAPI, AttachmentAPI) {

    'use strict';

    var ITEM_TYPE_FILE = 'file',
        ITEM_TYPE_ATTACHMENT = 'attachment',
        THUMBNAIL_SIZE = { thumbnailWidth: 100, thumbnailHeight: 100 }; // todo: set better defaults;

    /**
     *  The FileModel represents a general file model for the OX Viewer.
     */
    var FileModel = Backbone.Model.extend({

        defaults: {
            source: null,
            filename: '',
            size: 0,
            version: null, // nur drive
            contentType: null,
            id: null, // could be a attachment id, or drive file id
            folderId: null,
            meta: {},
            lastModified: null,
            previewUrl: null,
            downloadUrl: null,
            thumbnailUrl: null
        },

        initialize: function () {
            //console.warn('FileModel.initialize(): ', data, options);
        },

        parse: function (data) {

            var result = {};

            /**
             * duck check for drive file or e-mail attachment
             */
            function getFileSource (data) {
                if (!data || !data.id) { return null; }

                if (data.mail && data.mail.id && data.mail.folder_id || data.group === 'mail' || data.disp === 'attachment') {
                    return ITEM_TYPE_ATTACHMENT;
                } else {
                    return ITEM_TYPE_FILE;
                }
            }

            result.source = getFileSource (data);

            if (result.source === ITEM_TYPE_ATTACHMENT) {

                result.filename = data.filename;
                result.size = data.size;
                result.contentType = data.content_type;
                result.id = data.mail && data.mail.id || null; // could be a attachment id, or drive file id
                result.folderId = data.mail && data.mail.folder_id || null;
                result.previewUrl = AttachmentAPI.getUrl(data, 'view');
                result.downloadUrl = AttachmentAPI.getUrl(data, 'download');
                result.thumbnailUrl = AttachmentAPI.getUrl(data, 'view');   // todo: check for thumbnails

            } else if (result.source === ITEM_TYPE_FILE) {

                result.filename = data.filename;
                result.size = data.file_size;
                result.version = data.version;  // drive only
                result.contentType = data.file_mimetype;
                result.id = data.id;    // could be a attachment id, or drive file id
                result.folderId = data.folder_id;
                result.meta = data.meta;
                result.lastModified = data.last_modified;
                result.previewUrl = FilesAPI.getUrl(data, 'preview');
                result.downloadUrl = FilesAPI.getUrl(data, 'download');
                result.thumbnailUrl = FilesAPI.getUrl(data, 'thumbnail', THUMBNAIL_SIZE);
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
            return this.previewUrl;
        },

        getDownloadUrl: function () {
            return this.downloadUrl;
        },

        getThumbnailUrl: function () {
            return this.thumbnailUrl;
        }

    });

    return FileModel;
});
