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

define('io.ox/mail/compose/resize-view', [
    'io.ox/mail/compose/resize',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'io.ox/backbone/mini-views/dropdown'
], function (imageResize, settings, gt, Dropdown) {

    'use strict';

    function resize(size, model) {
        var file = model.get('originalFile');
        if (!file) return;
        if (!imageResize.isResizableImage(file)) return;

        // Get image dimension and check if this image is ellegibable for resize
        return imageResize.getImageDimensions(file).then(function (dimensions) {
            if (!imageResize.resizeRecommended(dimensions, file.size)) return;

            // no computation necessary for original size
            if (size === 'original') return file;

            var targetDimensions = imageResize.getTargetDimensions(dimensions, size);
            return imageResize.resizeImage(file, targetDimensions);
        }).then(function (file) {
            if (!file) return;
            model.trigger('image:resized', file);
        });
    }

    return Dropdown.extend({

        settings: {
            small: settings.get('features/imageResize/small', 320),
            medium: settings.get('features/imageResize/medium', 640),
            large: settings.get('features/imageResize/large', 1024)
        },

        initialize: function (opt) {
            opt = _({ label: '', caret: true }).extend(opt);
            Dropdown.prototype.initialize.call(this, opt);
        },

        setup: function () {
            Dropdown.prototype.setup.apply(this, arguments);

            if (_.device('smartphone')) {
                this.header('Image size');
                this.divider();
            }

            //.# Small (number px) is used as an option for resizing images and refers to a small sized image
            this.option('imageResizeOption', this.settings.small, gt('Small (%1$s px)', this.settings.small), { radio: true });
            //.# Medium (number px) is used as an option for resizing images and refers to a medium sized image
            this.option('imageResizeOption', this.settings.medium, gt('Medium (%1$s px)', this.settings.medium), { radio: true });
            //.# Large (number px) is used as an option for resizing images and refers to a large sized image
            this.option('imageResizeOption', this.settings.large, gt('Large (%1$s px)', this.settings.large), { radio: true });
            //.# Original is used as an option for resizing images and refers to the original image size
            this.option('imageResizeOption', 'original', gt('Original'), { radio: true });

            this.listenTo(this.model, 'change:imageResizeOption', function () {
                this.collection.each(resize.bind(null, this.model.get('imageResizeOption')));
            }.bind(this));
        },

        label: function () {
            //.# In the context of resizing images before uploading them this text is used as a label for a dropdown
            var label = gt('Original');

            switch (this.model.get('imageResizeOption')) {
                case this.settings.small :
                    //.# In the context of resizing images before uploading them this text is used as a label for a dropdown
                    label = gt('Small');
                    break;
                case this.settings.medium :
                    //.# In the context of resizing images before uploading them this text is used as a label for a dropdown
                    label = gt('Medium');
                    break;
                case this.settings.large :
                    //.# In the context of resizing images before uploading them this text is used as a label for a dropdown
                    label = gt('Large');
                    break;
                default :
                    //.# In the context of resizing images before uploading them this text is used as a label for a dropdown
                    label = gt('Original');
            }

            this.$el.find('.dropdown-label').text(label);
            this.$toggle.attr('aria-label', gt('Image size') + ': ' + label);
        }

    });

});
