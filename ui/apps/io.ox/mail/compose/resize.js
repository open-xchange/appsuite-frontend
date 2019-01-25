/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicableƒ
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Björn Köster <bjoern.koester@open-xchange.com>
 */

define('io.ox/mail/compose/resize', [
    'io.ox/contacts/widgets/canvasresize',
    'settings!io.ox/mail'
], function (canvasResize, settings) {

    'use strict';

    var api = {
        getImageDimensions: function (file) {
            var def = $.Deferred(),
                fileReader = new FileReader(),
                img = new Image();

            fileReader.onload = function () {
                img.onload = function () {
                    def.resolve({ width: img.width, height: img.height });
                };
                img.src = fileReader.result;
            };

            fileReader.onerror = def.reject;

            fileReader.readAsDataURL(file);
            return def.promise();
        },

        getTargetDimensions: function (dimensions, targetSize) {
            var scalar;
            scalar = targetSize / Math.max(dimensions.width, dimensions.height);

            return { width: Math.round(dimensions.width * scalar), height: Math.round(dimensions.height * scalar) };
        },

        isFileSizeMaxViolated: function (size) {
            var fileSizeMax = settings.get('features/imageResize/fileSizeMax', 10 * 1024 * 1024);

            return size > fileSizeMax;
        },

        isResizableImage: function (file) {
            var isCorrectType = (/^image\/jpe?g|png/).test(file.type);

            return isCorrectType && !this.isFileSizeMaxViolated(file.size);
        },

        resizeRecommended: function (dimensions, size) {
            var fileSizeThreshold = settings.get('features/imageResize/fileSizeThreshold', 1024 * 1024),
                imageSizeThreshold = settings.get('features/imageResize/imageSizeThreshold', 1024),
                fileSizeOverThreshold = size > fileSizeThreshold,
                imageSizeOverThreshold = Math.max(dimensions.width, dimensions.height) > imageSizeThreshold,
                overThreshold = fileSizeOverThreshold || imageSizeOverThreshold;

            return overThreshold && !this.isFileSizeMaxViolated(size);
        },

        resizeImage: function (file, targetDimensions) {
            var def = $.Deferred(),
                quality = settings.get('features/imageResize/quality', 0.75);

            canvasResize(file, {
                width: targetDimensions.width,
                height: targetDimensions.height,
                crop: false,
                quality: quality * 100,
                callback: function (data) {
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
                }
            });
            return def;
        }
    };

    return api;
});
