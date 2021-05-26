/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/contacts/widgets/pictureUpload', [
    'io.ox/backbone/views/disposable',
    'io.ox/backbone/views/edit-picture',
    'io.ox/core/notifications',
    'io.ox/contacts/api',
    'io.ox/core/util',
    'io.ox/core/strings',
    'gettext!io.ox/contacts',
    'settings!io.ox/contacts'
], function (DisposableView, editPicture, notifications, api, util, strings, gt, settings) {

    'use strict';

    // disabled for IE and non-chrome based Edge (no Promies, no File API Constructor);
    var disableEditPicture = (_.device('IE') || _.device('edge')) && !_.device('edgechromium');

    function getContent(file) {
        var def = $.Deferred(),
            reader = new FileReader();
        reader.onload = function (e) { def.resolve(file, e.target.result); };
        reader.onerror = function (e) { def.reject(file, e); };
        reader.readAsDataURL(file);
        return def;
    }

    function maxSizeViolation(file) {
        return file && settings.get('maxImageSize') && file.size > settings.get('maxImageSize');
    }

    var ImageUploadView = DisposableView.extend({

        className: 'contact-photo-upload',

        events: {
            'change .file': 'onFileSelect',
            'focus .file': 'toggleFocus',
            'blur .file': 'toggleFocus',
            'click .file': 'onClick',
            'click .contact-photo': 'onClickContainer',
            'keydown .contact-photo': 'onKey'
        },

        initialize: function () {
            this.listenTo(this.model, 'change:pictureFileEdited', this.onChangeFile);
        },

        // standalone version
        openDialog: function () {
            // add hidden
            $('body').append(this.render().$el.addClass('hidden'));

            this.on('standalone:save', function () {
                var $el = this.$el;
                this.model.save();
                this.dispose();
                $el.remove();
            }.bind(this));

            // open edit dialog
            return disableEditPicture ? this.openFilePicker() : this.openEditDialog();
        },

        onClick: function (e, options) {
            var opt = options || {};
            e.stopPropagation();
            if (opt.forceUpload || disableEditPicture) return;
            e.preventDefault();
            this.openEditDialog();
        },

        onClickContainer: function (e) {
            e.stopPropagation();
            e.preventDefault();
            return disableEditPicture ? this.openFilePicker() : this.openEditDialog();
        },

        onKey: function (e) {
            // forward enter to click handler
            if (e.which === 13) this.onClickContainer();
        },

        removeImage: function (e) {
            if (e) e.stopImmediatePropagation();
            this.$('input[type="file"]').val('');
            this.model.set({
                'pictureFile': undefined,
                'pictureFileEdited': '',
                'crop': '',
                'image1': '',
                'image1_url': ''
            });
        },

        openFilePicker: function () {
            this.$('input[type="file"]').trigger('click', { forceUpload: true });
        },

        openEditDialog: function () {
            if (this.editPictureDialog && this.editPictureDialog.close) this.editPictureDialog.close();
            this.editPictureDialog = editPicture
                .getDialog({ model: this.model, title: gt('Change contact photo') })
                .open()
                .on('upload', this.openFilePicker.bind(this))
                .on('reset', this.removeImage.bind(this));
        },

        // preview prefers edited
        onChangeFile: function () {
            var file = this.model.get('pictureFileEdited');
            //check if the edited picture is small enough
            if (maxSizeViolation(file)) {
                this.model.unset('pictureFileEdited', { silent: true });
                //#. %1$s maximum file size
                notifications.yell('error', gt('The photo exceeds the allowed file size of %1$s', strings.fileSize(settings.get('maxImageSize'), 2)));
            }
            if (!file || !(file.lastModified || file.lastModifiedDate)) {
                // webcam snapshot
                if (this.model.get('save')) this.trigger('standalone:save');
                return;
            }
            // update preview
            this.$thumbnail.css('background-image', 'none').busy();
            getContent(file).done(function (file, content) {
                this.$thumbnail.idle();
                this.model.set({
                    image1_url: '',
                    image1_data_url: content
                });
                // uploaded image
                if (this.model.get('save')) this.trigger('standalone:save');
            }.bind(this));
        },

        onFileSelect: function (e) {
            var input = e.target,
                file = input.files[0];
            // check for valid image type. especially, svg is not allowed (see Bug 50748)
            if (file && !/(jpg|jpeg|gif|bmp|png|webp)/i.test(file.type)) {
                return notifications.yell('error', gt('The file type "%1$s" cannot be used as a contact photo. Supported file types are JPEG, GIF, BMP, and PNG.', file.type));
            }
            // may happen if a user first selects a picture and then when trying to choose a new one presses cancel
            if (!file) return;

            // no-edit: trigger onChangeFile
            if (disableEditPicture) {
                this.model.unset('pictureFileEdited', { silent: true });
                return this.model.set('pictureFileEdited', file);
            }

            // reset cause otherwise we have to remember the original file for case (upload > crop view > cancel)
            this.removeImage();

            // edit: trigger proper change event
            this.model.unset('pictureFile', { silent: true });
            this.model.set('pictureFile', file);
            this.openEditDialog();
        },

        toggleFocus: function (e) {
            // applies focus style on container when input has focus
            this.$thumbnail.toggleClass('focus', e.type === 'focusin');
        },

        render: function () {

            var guid = _.uniqueId('image-upload-');

            this.$el.append(
                this.$thumbnail = $('<div class="contact-photo empty">').append(
                    $('<label>').attr('for', guid).text(gt('Click to add photo'))
                ),
                $('<form>').append(
                    $('<input type="file" name="file" class="file" accept="image/*">')
                    .attr('id', guid)
                )
            );

            this.listenTo(this.model, 'change:image1_url change:image1_data_url', _.debounce(this.renderImage));
            this.renderImage();
            return this;
        },

        renderImage: function () {
            // this function is debounced so it might be called when the view is already disposed
            if (this.disposed) return;
            var url = this.model.get('image1_data_url') || this.getImageUrl();
            this.$('label').toggleClass('sr-only', !!url);
            this.$('button').toggle(!!url);
            this.$thumbnail
                .css('background-image', 'none')
                .toggleClass('empty', !url);

            // load image
            if (!url) return;
            this.$thumbnail.busy();
            $('<img>').attr('src', url).one('load', function () {
                this.$thumbnail.idle().css('background-image', 'url(' + url + ')');
            }.bind(this)).one('error', function () {
                this.$thumbnail.idle().addClass('empty');
            }.bind(this));
        },

        getImageUrl: function () {
            var url = this.model.get('image1_url');
            if (!url) return '';
            if (/^data:/i.test(url)) return url;
            return util.getShardingRoot(util.replacePrefix(url + '&' + $.param({ uniq: _.now() })));
        }
    });

    return ImageUploadView;
});
