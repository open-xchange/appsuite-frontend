/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/contacts/widgets/pictureUpload', [
    'io.ox/core/notifications',
    'io.ox/contacts/api',
    'gettext!io.ox/contacts',
    'settings!io.ox/contacts',
    'less!io.ox/contacts/widgets/widgets'
], function (notifications, api, gt, settings) {

    'use strict';

    // For now specific to contacts
    // Might be generalized, who knows?

    function PictureUpload(options) {
        _.extend(this, {

            tagName: 'div',

            className: 'picture-upload-view',

            init: function () {
                this.listenTo(this.model, 'change:image1_url', this.displayImageURL);
            },

            resetImage: function (e) {
                e.stopImmediatePropagation();
                this.model.set('image1', '', { validate: true });
                this.closeBtn.hide();
                this.addImgText.show();
                this.setImageURL();
                this.fileInput.val('');
                if (this.oldMode) {
                    this.fileInput.removeAttr('style');
                }
            },

            handleFileSelect: function (e, input) {

                var fileData = {}, $input = $(input);

                if (this.oldMode) {
                    if ($input.val()) {
                        fileData = $input.parent();
                    }
                    // user information
                    this.setImageURL();
                    notifications.yell('success', gt('Your selected picture will be displayed after saving'));
                } else {
                    fileData = input.files[0];
                    // check if the picture is small enough
                    if (fileData && settings.get('maxImageSize') && fileData.size > settings.get('maxImageSize')) {
                        require(['io.ox/core/strings'], function (strings) {
                            //#. %1$s maximum file size
                            notifications.yell('error', gt('Your selected picture exceeds the maximum allowed file size of %1$s', strings.fileSize(settings.get('maxImageSize'), 2)));
                        });
                        return;
                    }
                }

                if (!fileData) {
                    // may happen if a user first selects a picture and then when trying to choose a new one presses cancel
                    // prevent js error and infinite loading
                    return;
                }
                this.model.set('pictureFile', fileData);
                this.model.unset('image1');

                // we have to call this manually because not all browsers (e.g. Firefox)
                // detect a change of fileData properly
                this.previewPictureFile();
            },

            displayImageURL: function () {
                this.setImageURL(this.model.get('image1_url'));
            },

            setImageURL: function (url, callback) {
                if (callback) {
                    var self = this;
                    //preload Image
                    $('<img>').attr('src', url).load(function () {
                        //no memory leaks
                        $(this).remove();
                        //image is cached now so no loading time for this
                        self.imgCon.css('background-image', 'url(' + (url || api.getFallbackImage()) + ')');
                        callback();
                    });
                } else {
                    this.imgCon.css('background-image', 'url(' + (url || api.getFallbackImage()) + ')');
                }
            },

            previewPictureFile: function () {

                if (this.oldMode) {
                    this.setImageURL();
                    return;
                }

                var self = this, file = this.model.get('pictureFile');

                self.imgCon.css('background-image', 'initial').busy();
                self.addImgText.hide();

                require(['io.ox/contacts/widgets/canvasresize'], function (canvasResize) {
                    canvasResize(file, {
                        width: 300,
                        height: 0,
                        crop: false,
                        quality: 80,
                        callback: function (data) {
                            self.setImageURL(data, function () {
                                self.imgCon.idle();
                                self.closeBtn.show();
                            });
                        }
                    });
                });
            },

            render: function () {

                var self = this,
                    dataUrl,
                    imageUrl = this.model.get('image1_url'),
                    guid = _.uniqueId('form-picture-upload-'),
                    hasImage = false;

                self.oldMode = _.browser.IE < 10;

                if (imageUrl) {
                    imageUrl = imageUrl.replace(/^\/ajax/, ox.apiRoot);
                    hasImage = true;
                } else {
                    // temporary support for data-url images
                    if (this.model.get('image1') && this.model.get('image1_content_type')) {
                        dataUrl = 'data:' + this.model.get('image1_content_type') + ';base64,' + this.model.get('image1');
                        this.model.set('image1_url', dataUrl, { silent: true, validate: true });
                        hasImage = true;
                    }
                }

                this.$el.append(
                    self.imgCon = $('<div class="picture-uploader thumbnail">').append(
                        this.closeBtn = $('<div class="close">')
                            .html('&times;')
                            .on('click', function (e) { self.resetImage(e); })[hasImage ? 'show' : 'hide'](),
                        this.addImgText = $('<div class="add-img-text">')
                            .append(
                                $('<span>').text(gt('Click to upload image'))
                            )[hasImage ? 'hide' : 'show']()
                    ),
                    $('<form>').append(
                        $('<label class="sr-only">').attr('for', guid).text(gt('Click to upload image')),
                        self.fileInput = $('<input type="file" name="file" accepts="image/*" tabindex="1">').attr('id', guid)
                            .on('change', function (e) {
                                self.handleFileSelect(e, this);
                            })
                            .on('focus', function () {
                                self.imgCon.addClass('focussed');
                            })
                            .on('blur', function () {
                                self.imgCon.removeClass('focussed');
                            })
                    )
                );

                if (!self.oldMode || hasImage) {
                    self.fileInput.css({ height: '1px', width: '1px', cursor: 'pointer' });
                }

                self.imgCon.on('click', function () { self.fileInput.trigger('click'); });

                self.setImageURL(dataUrl || imageUrl);
            }
        }, options);
    }

    return PictureUpload;
});
