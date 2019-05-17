/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/contacts/widgets/pictureUpload', [
    'io.ox/backbone/views/edit-picture',
    'io.ox/core/notifications',
    'io.ox/contacts/api',
    'io.ox/core/util',
    'gettext!io.ox/contacts',
    'settings!io.ox/contacts',
    'less!io.ox/contacts/widgets/pictureUpload'
], function (editPicture, notifications, api, util, gt, settings) {

    'use strict';

    // disabled for IE (no Promies, no File API Constructor)
    var disableEditPicture = _.device('IE');

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

    function PictureUpload(options) {
        _.extend(this, {

            tagName: 'div',

            className: 'picture-upload-view',

            init: function () {
                this.listenTo(this.model, 'change:image1_url', this.onChangeImageUrl);
                this.listenTo(this.model, 'change:pictureFileEdited', this.onChangeFile);
            },

            events: {
                'click .reset': 'reset',
                'change .file': 'onFileSelect',
                'focus .file': 'toggleFocus',
                'blur .file': 'toggleFocus',
                'click .file': 'onClick',
                'click .picture-uploader': 'onClickContainer'
            },


            onClick: function (e, options) {
                var opt = options || {};
                e.stopPropagation();
                if (opt.forceUpload || disableEditPicture) return;
                e.preventDefault();
                this.openEditDialog();
            },

            onClickContainer: function () {
                return disableEditPicture ? this.openFilePicker() : this.openEditDialog();
            },

            reset: function (e) {
                if (e) e.stopImmediatePropagation();
                this.model.set({
                    'pictureFile': undefined,
                    'pictureFileEdited': '',
                    'crop': '',
                    'image1': '',
                    'image1_url': ''
                });
                this.fileInput.val('');
                this.setPreview();
            },

            openFilePicker: function () {
                this.fileInput.trigger('click', { forceUpload: true });
            },

            openEditDialog: function () {
                if (this.editPictureDialog && this.editPictureDialog.close) this.editPictureDialog.close();
                this.editPictureDialog = editPicture
                    .getDialog({ model: this.model })
                    .open()
                    .on('upload', this.openFilePicker.bind(this));
            },

            onChangeImageUrl: function () {
                var url = this.model.get('image1_url');
                if (url) this.setPreview(url);
            },

            // preview prefers edited
            onChangeFile: function () {
                var file = this.model.get('pictureFileEdited');
                //check if the edited picture is small enough
                if (maxSizeViolation(file)) {
                    this.model.unset('pictureFileEdited', { silent: true });
                    return require(['io.ox/core/strings'], function (strings) {
                        //#. %1$s maximum file size
                        notifications.yell('error', gt('Your selected picture exceeds the maximum allowed file size of %1$s', strings.fileSize(settings.get('maxImageSize'), 2)));
                    });
                }
                if (!file || !(file.lastModified || file.lastModifiedDate)) return;
                this.imgCon.css('background-image', 'initial').busy();
                this.addImgText.hide();
                // update preview
                getContent(file).done(function (file, content) {
                    this.imgCon.idle();
                    this.setPreview(content);
                }.bind(this));
            },

            onFileSelect: function (e) {
                var input = e.target,
                    file = input.files[0];
                // check for valid image type. especially, svg is not allowed (see Bug 50748)
                if (file && !/(jpg|jpeg|gif|bmp|png)/i.test(file.type)) {
                    return notifications.yell('error', gt('This filetype is not supported as contact picture. Only image types (JPG, GIF, BMP or PNG) are supported.'));
                }
                // may happen if a user first selects a picture and then when trying to choose a new one presses cancel
                if (!file) return;

                // no-edit: trigger onChangeFile
                if (disableEditPicture) {
                    this.model.unset('pictureFileEdited', { silent: true });
                    return this.model.set('pictureFileEdited', file);
                }

                // reset cause otherwise we have to remember the original file for case (upload > crop view > cancel)
                this.reset();

                // edit: trigger proper change event
                this.model.unset('pictureFile', { silent: true });
                this.model.set('pictureFile', file);
                this.openEditDialog();
            },

            toggleFocus: function (e) {
                // applies focus style on container when input has focus
                this.imgCon.toggleClass('focussed', e.type === 'focusin');
            },

            setPreview: function (url, callback) {
                // proper handling on restore case
                var self = this,
                    isFallback = !url;
                this.$el.toggleClass('preview', !isFallback);
                this.addImgText.toggle(isFallback);
                this.closeBtn.toggle(!isFallback);
                this.imgCon.busy();
                url = url || api.getFallbackImage();
                //preload Image
                $('<img>').attr('src', url).on('load', function () {
                    //no memory leaks
                    $(this).remove();
                    self.imgCon.idle();
                    self.imgCon.css('background-image', 'url(' + url + ')');
                    if (callback) callback();
                });
            },

            render: function () {
                var guid = _.uniqueId('form-picture-upload-'),
                    imageUrl = this.model.get('image1_url'),
                    dataUrl;

                if (imageUrl) {
                    // add unique identifier to prevent caching bugs
                    imageUrl = util.getShardingRoot(util.replacePrefix(imageUrl + '&' + $.param({ uniq: _.now() })));
                } else if (this.model.get('image1') && this.model.get('image1_content_type')) {
                    // temporary support for data-url images
                    dataUrl = 'data:' + this.model.get('image1_content_type') + ';base64,' + this.model.get('image1');
                    this.model.set('image1_url', dataUrl, { silent: true, validate: true });
                }

                this.$el.append(
                    this.imgCon = $('<div class="picture-uploader thumbnail">').append(
                        this.closeBtn = $('<button type="button" class="reset close">').attr('title', gt('Remove'))
                            .append('<i class="fa fa-times" aria-hidden="true">'),
                        this.addImgText = $('<div class="add-img-text">')
                            .append(
                                $('<label>').attr('for', guid).text(gt('Upload image'))
                            )
                    ),
                    $('<form>').append(
                        this.fileInput = $('<input type="file" name="file" class="file" accept="image/*">').attr('id', guid)
                    )
                );

                this.setPreview(dataUrl || imageUrl);
            }
        }, options);
    }

    return PictureUpload;
});
