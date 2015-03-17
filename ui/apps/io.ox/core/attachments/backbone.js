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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/attachments/backbone',
    ['io.ox/core/folder/title',
     'io.ox/core/capabilities'
    ], function (shortTitle, capabilities) {

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
                def.resolve({data: ['133713371337']});
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

    var regIsDocument = /\.(pdf|do[ct]x?|xlsx?|p[po]tx?)$/i,
        regIsImage = /\.(gif|bmp|tiff|jpe?g|gmp|png)$/i;

    var previewFetcher = {
        localFile: function (model) {
            var def = $.Deferred();
            // consider retina displays
            // use double size in combination with background-size: cover
            var size = 2 * (_.device('retina') ? 240 : 120);
            require(['io.ox/contacts/widgets/canvasresize'], function (canvasResize) {
                canvasResize(model.fileObj, {
                    width: size,
                    height: size,
                    crop: false,
                    quality: 80,
                    callback: function (data) {
                        var meta = _.clone(model.get('meta'));
                        meta.previewUrl = data;
                        def.resolve(meta.previewUrl);
                        model.set('meta', meta);
                    }
                });
            });
            return def;
        },
        file: function (model) {
            var def = $.Deferred();
            // consider retina displays
            var size = _.device('retina') ? 240 : 120;
            require(['io.ox/files/api'], function (filesAPI) {
                var meta = _.clone(model.get('meta'));
                // get URL of preview image
                meta.previewUrl = filesAPI.getUrl(model.toJSON(), 'view')  + '&scaleType=cover&width=' + size + '&height=' + size;
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
                // non-image files need special format parameter
                if (!regIsImage.test(model.get('filename'))) meta.previewUrl += '&format=preview_image&session=' + ox.session;
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
        },

        getTitle: function () {
            return this.get('filename');
        },

        getShortTitle: function () {
            return shortTitle(this.getTitle(), 30);
        },

        getSize: function () {
            return this.get('file_size') || this.get('size') || 0;
        },

        getExtension: function () {
            var parts = String(this.get('filename') || '').split('.');
            return parts.length === 1 ? '' : parts.pop().toLowerCase();
        },

        isFileAttachment: function () {
            return this.get('disp') === 'attachment' ||
                this.get('disp') === 'inline' && this.get('filename');
        },

        needsUpload: function () {
            return this.get('uploaded') === 0;
        },

        previewUrl: function () {

            var supportsDocumentPreview = capabilities.has('document_preview'),
                filename = this.get('filename'), url;

            if (!this.isFileAttachment()) return null;
            if (!regIsImage.test(filename) && !(supportsDocumentPreview && regIsDocument.test(filename))) return null;

            url = this.get('meta').previewUrl;
            if (url) return url;

            var fetchPreview = previewFetcher[this.get('group')];
            if (fetchPreview) return fetchPreview(this);

            return null;
        },

        upload: function () {
            if ('FormData' in window) {
                var formData = new FormData();
                formData.append('file', this.fileObj);
                var def = new UploadSimulator().upload(this.fileObj);
                var model = this;
                def.then(function uploadDone() {
                    var url = 'appsuite/v=7.6.0.20140716.154321/apps/themes/default/dummypicture.png';
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
        }
    });

    return {
        Model: Model,
        Collection: Collection
    };
});
