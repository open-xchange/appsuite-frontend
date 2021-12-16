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

define('io.ox/core/attachments/backbone', [
    'io.ox/core/folder/title',
    'io.ox/core/capabilities',
    'io.ox/contacts/api',
    'settings!io.ox/mail'
], function (shortTitle, capabilities, api, settings) {

    'use strict';

    var UploadSimulator = function () {
        var loaded = 0,
            total,
            def = $.Deferred();
        var wait = function () {
            loaded = Math.floor(loaded + total / 10);
            def.notify({
                loaded: loaded,
                total: total
            });
            if (loaded / total >= 1) {
                def.resolve({ data: ['133713371337'] });
            } else {
                _.delay(wait, 1000);
            }
        };
        this.upload = function (file) {
            total = file.size;
            wait();
            return def;
        };
    };

    var regIsDocument = /\.((?:doc|dot|pot|pps|ppt|xls|xlt)[mx]?|o[dt][cfgipst]|odm|pdf|ppam?|rtf|txt|xlam?|xlsb)$/i,
        regIsImage = /\.(gif|bmp|jpe?g|gmp|png|psd|tif?f|heic?f?)$/i;

    var previewFetcher = {
        localFile: function (model) {
            // consider retina displays
            // use double size in combination with background-size: cover
            var size = 2 * (_.device('retina') ? 240 : 120);
            return require(['io.ox/contacts/widgets/canvasresize']).then(function (canvasResize) {
                return canvasResize(model.fileObj || model.get('originalFile'), {
                    width: size,
                    height: size,
                    crop: false,
                    quality: 80
                });
            }).then(function (data) {
                var meta = _.clone(model.get('meta'));
                meta.previewUrl = data;
                model.set('meta', meta);
                return data;
            });
        },
        contact: function (model) {
            var meta = _.clone(model.get('meta'));
            // get URL of preview image
            meta.previewUrl = model.get('image1_url') || api.getFallbackImage();
            model.set('meta', meta);
            return $.Deferred().resolve(meta.previewUrl);
        },
        file: function (model) {
            var def = $.Deferred();
            // consider retina displays
            var size = _.device('retina') ? 240 : 120;
            require(['io.ox/files/api'], function (filesAPI) {
                var meta = _.clone(model.get('meta'));
                // get URL of preview image
                meta.previewUrl = filesAPI.getUrl(model.toJSON(), 'view') + '&scaleType=cover&width=' + size + '&height=' + size;
                if (!regIsImage.test(model.get('filename'))) meta.previewUrl += '&format=preview_image&session=' + ox.session;
                def.resolve(meta.previewUrl);
                model.set('meta', meta);
            }, def.reject);
            return def;
        },
        mail: function (model) {
            var def = $.Deferred();
            var size = _.device('retina') ? 240 : 120;
            require(['io.ox/mail/api'], function (mailAPI) {
                var meta = _.clone(model.get('meta'));
                // get URL of preview image
                meta.previewUrl = mailAPI.getUrl(model.toJSON(), 'view') + '&scaleType=cover&width=' + size + '&height=' + size;
                // Check if from an encrypted mail, add authentication if so
                var security = model.get('security');
                if (security && security.authentication) meta.previewUrl += '&decrypt=true&cryptoAuth=' + encodeURIComponent(security.authentication);
                // non-image files need special format parameter
                if (!regIsImage.test(model.get('filename') || model.get('name'))) meta.previewUrl += '&format=preview_image&session=' + ox.session;
                def.resolve(meta.previewUrl);
                model.set('meta', meta);
            }, def.reject);
            return def;
        }
    };

    var Model = Backbone.Model.extend({

        defaults: function () {
            return {
                filename: '',
                disp: 'attachment',
                uploaded: 1,
                meta: {}
            };
        },

        initialize: function (obj) {
            // check if its a blob (also superclass of File)
            if (obj instanceof window.Blob) {
                this.fileObj = obj;
                this.set('filename', obj.name, { silent: true });
                this.set('uploaded', 0, { silent: true });
                this.set('file_size', obj.size, { silent: true });
            }
            if (this.isContact()) {
                // guess the filename that will be generated by backend
                var base = this.get('display_name') || this.get('sort_name') || 'vcard',
                    filename = base.replace(/\s/, '_').concat('.vcf');
                this.set('filename', filename, { silent: true });
            }
        },

        getTitle: function () {
            // attachments from drive may have a sanitized filename
            return this.get('com.openexchange.file.sanitizedFilename') || this.get('filename') || this.get('name');
        },

        getShortTitle: function (length) {
            return shortTitle(this.getTitle(), length || 30);
        },

        getSize: function () {
            var originalFileSize = this.get('originalFile') ? this.get('originalFile').size : undefined;
            return this.get('file_size') || this.get('size') || originalFileSize || 0;
        },

        getExtension: function () {
            var parts = String(this.get('filename') || this.get('name') || '').split('.');
            return parts.length === 1 ? '' : parts.pop().toLowerCase();
        },

        isFileAttachment: function () {
            return (this.get('disp') === 'attachment' || this.get('contentDisposition') === 'ATTACHMENT' || this.get('disp') === 'inline')
                && this.get('contentDisposition') !== 'INLINE' && !!this.getTitle();
        },

        isContact: function () {
            return this.get('group') === 'contact';
        },

        isLocalFile: function () {
            return this.get('group') === 'localFile';
        },

        needsUpload: function () {
            return this.get('uploaded') === 0;
        },

        previewUrl: function (options) {
            options = options || {};
            var supportsDocumentPreview = capabilities.has('document_preview'),
                filename = this.get('filename') || this.get('name'), url,
                file = this.fileObj || this.get('originalFile');

            // special handling for psd and tiff; These can only be previewed by MW, not local (on upload)
            if (this.isLocalFile() && filename.match(/psd|tif/)) return null;
            if (!this.isFileAttachment()) return null;
            if (!regIsImage.test(filename) && !(supportsDocumentPreview && (regIsDocument.test(filename)) || this.isContact())) return null;
            // no support for localFile document preview
            if (this.get('group') === 'localFile' && supportsDocumentPreview && regIsDocument.test(filename)) return null;
            // no support for large local files
            if (this.get('group') === 'localFile' && file.size >= settings.get('features/imageResize/fileSizeMax', 10 * 1024 * 1024)) return null;

            url = this.get('meta') ? this.get('meta').previewUrl : false;
            if (url) return url;

            var fetchPreview = previewFetcher[this.get('group')];
            if (fetchPreview) {
                // you may want to delay the execution of the previewfetcher as it may cause heavy load on cpu and memory (canvasresize)
                // give return value as previewUrl option to lazyload function will enable lazyload to create the previewURL on demand
                if (options.delayExecution) {
                    return fetchPreview.bind(this, this);
                }
                return fetchPreview(this);
            }

            return null;
        },

        upload: function () {
            if ('FormData' in window) {
                var formData = new FormData();
                formData.append('file', this.fileObj);
                var def = new UploadSimulator().upload(this.fileObj);
                var model = this;
                def.then(function uploadDone() {
                    var url = api.getFallbackImage();
                    var meta = _.clone(model.get('meta'));
                    meta.previewUrl = meta.previewUrl || url;
                    model.set('meta', meta);
                    model.trigger('upload:complete');
                }, function uploadFail() {

                }, function uploadProgress(ev) {
                    model.set('uploaded', ev.loaded / ev.total);
                });
            }
        }
    });

    var Collection = Backbone.Collection.extend({
        model: Model,
        fileAttachments: function () {
            return this.filter(function (model) {
                return model.isFileAttachment();
            });
        },
        mailAttachments: function () {
            return this.filter(function (model) {
                return model.get('disp') === 'inline' || model.get('disp') === 'attachment';
            }).map(function (m, i) {
                var attr;
                if (i === 0 && m.attributes.content_type === 'text/plain') {
                    attr = m.pick('content_type', 'content');
                    // For "text/plain" mail bodies, the JSON boolean field "raw" may be specified inside the body's JSON representation to signal that the text content shall be kept as-is; meaning to keep all formatting intact
                    attr.raw = true;
                } else {
                    attr = m.attributes;
                }
                return attr;
            });
        },
        getSize: function () {
            return this.reduce(function (memo, model) { return memo + model.getSize(); }, 0);
        },
        isValidModel: function (model) {
            return model.isFileAttachment();
        },
        getValidModels: function () {
            return this.filter(this.isValidModel, this);
        }
    });

    return {
        Model: Model,
        Collection: Collection
    };
});
