/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/mail/compose/resize', [
    'io.ox/contacts/widgets/canvasresize',
    'io.ox/core/tk/image-util',
    'settings!io.ox/mail'
], function (canvasResize, imageUtil, settings) {

    'use strict';

    var api = {

        getDimensions: function (file) {
            return imageUtil.getImageFromFile(file, { exif: true }).then(function (img) {
                return { width: img.width, height: img.height };
            });
        },

        addDimensionsProperty: function (file) {
            // early exit when custom property is set already
            if (file._dimensions) { return $.Deferred().resolve(file._dimensions); }
            return api.getDimensions(file).then(function (dimensions) {
                file._dimensions = dimensions;
                return file;
            });
        },

        getTargetDimensions: function (file, targetSize) {
            var dimensions = file._dimensions;
            if (!dimensions) return;

            var maximum = Math.max(dimensions.width || -1, dimensions.height || -1),
                scalar = targetSize / maximum;
            // prevent upscaling
            if (targetSize >= maximum) return dimensions;
            return {
                width:  Math.round(dimensions.width * scalar),
                height: Math.round(dimensions.height * scalar)
            };
        },

        resizeRecommended: function (file) {
            return api.matches('type', file) &&
                   api.matches('size', file) &&
                   api.matches('dimensions', file);
        },

        matches: (function () {
            var reType = /^image\/(jpg|jpeg|png)/i,
                minDimension = settings.get('features/imageResize/imageSizeThreshold', 1024),
                maxSize = settings.get('features/imageResize/fileSizeMax', 10 * 1024 * 1024);

            return function (aspect, file, options) {
                var opt = _.extend({
                    dimensions: file._dimensions || {},
                    target: undefined
                }, options);

                var fileMaxDimension = Math.max(opt.dimensions.width || -1, opt.dimensions.height || -1);
                switch (aspect) {
                    case 'type':
                        return reType.test(file.type);
                    case 'size':
                        return file.size <= maxSize;
                    case 'dimensions':
                        // prevent upscaling
                        if (opt.target && opt.target >= fileMaxDimension) return false;
                        return minDimension < fileMaxDimension;
                    default:
                        break;
                }
            };
        }()),

        containsResizables: function (list) {
            var defs = [],
                files = _.chain(list)
                    .map(function (obj) { return obj.get ? obj.get('originalFile') : obj; })
                    .compact()
                    .filter(function (file) { return api.matches('type', file); })
                    .value();
            // ensure custom dimension property is set
            _.each(files, function (file) {
                defs.push(api.addDimensionsProperty(file));
            });

            return $.when.apply($, defs).then(function () {
                return _.some(files, function (file) {
                    return api.resizeRecommended(file);
                });
            });
        },

        resizeImage: function (file, targetDimensions) {
            if (!targetDimensions) return;
            var def = $.Deferred(),
                quality = settings.get('features/imageResize/quality', 0.75);

            canvasResize(file, {
                width: targetDimensions.width,
                height: targetDimensions.height,
                crop: false,
                quality: quality * 100
            }).then(function (data) {
                // canvas.toBlob is not compatible with all browsers, using the dataUrl to build the blob
                var binStr = atob(data.split(',')[1]),
                    len = binStr.length,
                    arr = new window.Uint8Array(len),
                    blob,
                    type = file.type || 'image/png',
                    typeSuffix = _(type.split('/')).last(),
                    filenamePrefix = _(file.name.split('.')).initial();

                for (var i = 0; i < len; i++) {
                    arr[i] = binStr.charCodeAt(i);
                }
                blob = new Blob([arr], { type: type, filename: filenamePrefix + '.' + typeSuffix });
                // blob = new File([blob], filenamePrefix + '.' + typeSuffix, { type: type });
                blob.lastModifiedDate = new Date();
                blob.name = filenamePrefix + '.' + typeSuffix;
                blob.filename = filenamePrefix + '.' + typeSuffix;
                blob.group = 'localFile';
                def.resolve(blob);
            });

            return def;
        }
    };

    return api;
});
