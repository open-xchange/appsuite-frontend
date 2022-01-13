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

define('io.ox/mail/compose/resize-view', [
    'io.ox/mail/compose/resize',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'io.ox/backbone/mini-views/dropdown'
], function (imageResize, settings, gt, Dropdown) {

    'use strict';

    var label = gt('Image size');

    function resize(size, model) {
        var file = model.get('originalFile');
        // no computation necessary without a file
        if (!file) return $.when();
        // no computation if file has size 0, that means it has been deleted in the meantime
        if (file.size === 0) {
            require(['io.ox/core/notifications'], function (notifications) {
                notifications.yell('warning', gt('The image cannot not be resized because it was not found on your hard drive.'));
            });
            return $.when();
        }
        // no computation necessary for original, but fileupload needs to be triggered
        if (size === 'original') {
            delete model.resized;
            model.trigger('image:resized', file);
            return $.when();
        }
        if (!imageResize.matches('type', file)) return $.when();
        if (!imageResize.matches('size', file)) return $.when();

        model.resized = new $.Deferred();

        // add image dimension and check if this image is ellegibable for resize
        return imageResize.addDimensionsProperty(file).then(function () {
            if (!file._dimensions) return;
            // check dimensions threshold and potential upscaling
            if (!imageResize.matches('dimensions', file, { target: size })) return;
            var targetDimensions = imageResize.getTargetDimensions(file, size);
            return imageResize.resizeImage(file, targetDimensions);
        }).then(function (file) {
            if (file) {
                model.resized.resolve(file);
                model.trigger('image:resized', file);
            }
        });
    }

    return Dropdown.extend({

        settings: {
            small: settings.get('features/imageResize/small', 320),
            medium: settings.get('features/imageResize/medium', 640),
            large: settings.get('features/imageResize/large', 1280)
        },

        initialize: function (opt) {
            // apply default imageResizeOption
            var predefined = settings.get('features/imageResize/default', 'original');
            this.model.set('imageResizeOption', this.settings[predefined] || 'original');

            opt = _({ label: '', caret: true }).extend(opt);
            Dropdown.prototype.initialize.call(this, opt);
        },

        setup: function () {
            Dropdown.prototype.setup.apply(this, arguments);

            this.$el.addClass('resize-options');

            if (_.device('smartphone')) {
                this.header(label);
                this.divider();
            }

            //#. Small (number px) is used as an option for resizing images and refers to a small sized image
            this.option('imageResizeOption', this.settings.small, gt('Small (%1$s px)', this.settings.small), { radio: true });
            //#. Medium (number px) is used as an option for resizing images and refers to a medium sized image
            this.option('imageResizeOption', this.settings.medium, gt('Medium (%1$s px)', this.settings.medium), { radio: true });
            //#. Large (number px) is used as an option for resizing images and refers to a large sized image
            this.option('imageResizeOption', this.settings.large, gt('Large (%1$s px)', this.settings.large), { radio: true });
            //#. Original is used as an option for resizing images and refers to the original image size
            this.option('imageResizeOption', 'original', gt('Original'), { radio: true });

            this.listenTo(this.model, 'change:imageResizeOption', this.onChange);
            this.listenTo(this.collection, 'add reset', this.onAddReset);

            if (!_.device('smartphone')) this.$el.prepend($('<span class="image-resize-label">').text(label + ':\u00A0'));
        },

        onChange: function () {
            this.collection.each(resize.bind(null, this.model.get('imageResizeOption')));
        },

        onAddReset: function (model) {
            var self = this;

            this.$ul.find('a').addClass('disabled');

            model.once('change:id', function () {
                if (_.some(_.pluck(self.options.mailModel.get('attachments').models, 'id'), function (id) { return !id; })) {
                    self.$ul.find('a').addClass('disabled');
                    return;
                }
                self.$ul.find('a').removeClass('disabled');
            });

            resize(this.model.get('imageResizeOption'), model);
        },


        label: function () {
            //#. In the context of resizing images before uploading them this text is used as a label for a dropdown
            var label = gt('Original');

            switch (this.model.get('imageResizeOption')) {
                case this.settings.small :
                    //#. In the context of resizing images before uploading them this text is used as a label for a dropdown
                    label = gt('Small');
                    break;
                case this.settings.medium :
                    //#. In the context of resizing images before uploading them this text is used as a label for a dropdown
                    label = gt('Medium');
                    break;
                case this.settings.large :
                    //#. In the context of resizing images before uploading them this text is used as a label for a dropdown
                    label = gt('Large');
                    break;
                default :
                    //#. In the context of resizing images before uploading them this text is used as a label for a dropdown
                    label = gt('Original');
            }

            this.$el.find('.dropdown-label').text(label + '\u00A0');
            this.$toggle.attr('aria-label', gt('Image size') + ': ' + label);
        }

    });

});
