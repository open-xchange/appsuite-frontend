/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012 Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/contacts/widgets/pictureUpload',
    ['io.ox/core/notifications',
     'gettext!io.ox/contacts',
     'less!io.ox/contacts/widgets/widgets.less'], function (notifications, gt) {

    'use strict';

    // For now specific to contacts
    // Might be generalized, who knows?

    function PictureUpload(options) {
        _.extend(this, {

            tagName: 'div',

            className: 'picture-upload-view',

            modelEvents: {
                'change:image1_url': 'displayImageURL'
            },

            resetImage: function (e) {
                e.stopImmediatePropagation();
                this.model.set('image1', '', {validate: true});
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
                }

                this.model.set('pictureFile', fileData);
                this.model.unset('image1');

                // we have to call this manually because not all browsers (e.g. Firefox)
                // detect a change of fileData properly
                this.previewPictureFile();
            },

            displayImageURL: function (e) {
                this.setImageURL(this.model.get('image1_url'));
            },

            setImageURL: function (url) {
                this.imgCon.css('background-image', 'url(' + (url || ox.base + '/apps/themes/default/dummypicture.png') + ')');
            },

            previewPictureFile: function () {

                if (this.oldMode) {
                    this.setImageURL();
                    return;
                }

                var self = this, file = this.model.get('pictureFile');

                require(['io.ox/contacts/widgets/canvasresize'], function (canvasResize) {
                    canvasResize(file, {
                        width: 300,
                        height: 0,
                        crop: false,
                        quality: 80,
                        callback: function (data, width, height) {
                            self.setImageURL(data);
                            self.addImgText.hide();
                            self.closeBtn.show();
                        }
                    });
                });
            },

            render: function () {

                var self = this,
                    dataUrl,
                    imageUrl = this.model.get('image1_url'),
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
                        self.fileInput = $('<input type="file" name="file" accepts="image/*" tabindex="1">')
                            .on('change', function (e) {
                                self.handleFileSelect(e, this);
                            })
                            .on('focus', function (e) {
                                self.imgCon.addClass('focussed');
                            })
                            .on('blur', function (e) {
                                self.imgCon.removeClass('focussed');
                            })
                    )
                );

                if (!self.oldMode || hasImage) {
                    self.fileInput.css({ height: '1px', width: '1px', cursor: 'pointer'});
                }

                self.imgCon.on('click', function () { self.fileInput.trigger('click'); });

                self.setImageURL(dataUrl || imageUrl);

                if (this.clear) {
                    this.$el.append($('<div>').css({ clear: 'both' }));
                }
            }
        }, options);
    }

    return PictureUpload;
});
