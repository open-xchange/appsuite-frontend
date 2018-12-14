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

define('io.ox/mail/compose/resizeUtils', [
    'io.ox/mail/compose/resize',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/strings'
], function (imageResize, settings, gt, DropDown, strings) {

    'use strict';

    var ResizeDropDown = DropDown.extend({
        label: function () {
            var self = this,
                attachments = this.model.get('attachments'),
                //.# In the context of resizing images before uploading them this text is used as a label for a dropdown
                sizeOption = gt('Original'),
                settingSmall = settings.get('features/imageResize/small', 320),
                settingMedium = settings.get('features/imageResize/medium', 640),
                settingLarge = settings.get('features/imageResize/large', 1024);
            switch (self.model.get('imageResizeOption')) {
                case settingSmall :
                    //.# In the context of resizing images before uploading them this text is used as a label for a dropdown
                    sizeOption = gt('Small');
                    break;
                case settingMedium :
                    //.# In the context of resizing images before uploading them this text is used as a label for a dropdown
                    sizeOption = gt('Medium');
                    break;
                case settingLarge :
                    //.# In the context of resizing images before uploading them this text is used as a label for a dropdown
                    sizeOption = gt('Large');
                    break;
                default :
                    //.# In the context of resizing images before uploading them this text is used as a label for a dropdown
                    sizeOption = gt('Original');
            }

            getImagesToResize(attachments).then(function (imagesToResize) {
                if (!imagesToResize.length) return this.$el.hide();
                var labelText = sizeOption;
                this.$el.find('.dropdown-label').text(labelText);
                this.$toggle.attr('aria-label', gt('Image size') + ': ' + labelText);
                this.$el.show();
            }.bind(this));
        }
    });

    function getImagesToResize(attachments) {
        var fileSizeMaxExceeded = false,
            images = attachments.chain()
                .each(function (model, index) {
                    if (!model.isLocalFile()) return;
                    model.set('_index', index, { silent: true });
                })
                .filter(function (model) {
                    if (!model.isLocalFile()) return;
                    // Check for filetype and max filesize restriction
                    if (imageResize.isFileSizeMaxViolated(model.get('size'))) fileSizeMaxExceeded = true;
                    return imageResize.isResizableImage(model.fileObj);
                })
                .map(function (model) {
                    var file = model.fileObj;
                    // Get image dimension and check if this image is ellegibable for resize
                    return imageResize.getImageDimensions(file).then(function (dimensions) {
                        if (!imageResize.resizeRecommended(dimensions, file.size)) return;
                        return _.extend(file, { '_dimensions': dimensions, '_index': model.get('_index') });
                    });
                })
                .value();

        return $.when.apply($, images).then(function () {
            if (fileSizeMaxExceeded) return [];
            // remove undefined entries
            return _(arguments).compact();
        });
    }

    function getDropDown(model) {
        var settingSmall = settings.get('features/imageResize/small', 320),
            settingMedium = settings.get('features/imageResize/medium', 640),
            settingLarge = settings.get('features/imageResize/large', 1024),
            dropDown = new ResizeDropDown({
                model: model,
                label: '',
                caret: true
            });
        if (_.device('smartphone')) {
            dropDown.header('Image size');
            dropDown.divider();
        }
        //.# Small (number px) is used as an option for resizing images and refers to a small sized image
        dropDown.option('imageResizeOption', settingSmall, gt('Small (%1$s px)', settingSmall), { radio: true });
        //.# Medium (number px) is used as an option for resizing images and refers to a medium sized image
        dropDown.option('imageResizeOption', settingMedium, gt('Medium (%1$s px)', settingMedium), { radio: true });
        //.# Large (number px) is used as an option for resizing images and refers to a large sized image
        dropDown.option('imageResizeOption', settingLarge, gt('Large (%1$s px)', settingLarge), { radio: true });
        //.# Original is used as an option for resizing images and refers to the original image size
        dropDown.option('imageResizeOption', 'original', gt('Original'), { radio: true });
        return dropDown;
    }

    function resizeIntoArray(attachments, resizeOption) {
        if (resizeOption === 'original') return $.when();

        var targetArray = [];

        return getImagesToResize(attachments).then(function (images) {
            var resizeQueue = _(images)
            .map(function (image) {
                var targetDimensions = imageResize.getTargetDimensions(image._dimensions, resizeOption);
                _.extend(image, { _targetDimensions: targetDimensions });
                return imageResize.resizeImage(attachments.at(image._index).fileObj, targetDimensions)
                .then(function (newImage) {
                    targetArray[image._index] = _.extend(newImage, { '_index': image._index });
                    image._resized = true;
                });
            });

            return $.when.apply($, resizeQueue);
        }).then(function () {
            return targetArray;
        });
    }

    function mergeResizedFiles(originalFiles, resizedFiles, resizeOption) {
        var def = $.Deferred();

        if (resizeOption === 'original' || typeof resizedFiles === 'undefined') return def.resolve();

        _(resizedFiles).each(function (file) {
            if (typeof file !== 'undefined') originalFiles[file._index] = file;
        });

        def.resolve();
        return def;
    }

    function getMailSizeString(model) {
        var attachments = model.get('attachments').filter(function (file) {
                var size = file.get('size');
                return typeof size !== 'undefined';
            }),
            mailSize = _(attachments).reduce(function (agg, file) { return agg + file.get('size'); }, 0);

        return gt('Mail size:') + ' ' + strings.fileSize(mailSize, 1);
    }

    function getResizedSizeString(model, resizedFiles) {
        var attachmentsSize =  model.get('attachments').chain()
            .map(function (file, index) {
                var resizedFile = _(resizedFiles).findWhere({ _index: index });
                if (resizedFile && resizedFile.size) return resizedFile.size;
                return file.getSize();
            })
            .reduce(function (memo, size) {
                return memo + size;
            }, 0)
            .value(),
            mailSize = attachmentsSize + model.getContent().length;
        return gt('Mail size:') + ' ' + strings.fileSize(mailSize, 1);
    }

    var api = {
        getDropDown: getDropDown,
        getImagesToResize: getImagesToResize,
        resizeIntoArray: resizeIntoArray,
        getMailSizeString: getMailSizeString,
        getResizedSizeString: getResizedSizeString,
        mergeResizedFiles: mergeResizedFiles
    };

    return api;
});
