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
define('io.ox/contacts/widgets/pictureUpload', ['less!io.ox/contacts/widgets/widgets.less'], function () {

    "use strict";

    // For now specific to contacts
    // Might be generalized, who knows?

    function PictureUpload(options) {
        _.extend(this, {

            tagName: 'div',
            modelEvents: {
                'change:pictureFile': 'displayPictureFile',
                'change:image1_url': 'displayImageURL'
            },

            resetImage: function (e) {
                e.stopImmediatePropagation();
                this.model.set("image1", '');
                this.closeBtn.hide();
                var imageUrl =  ox.base + '/apps/themes/default/dummypicture.png';
                this.$el.find('.picture-uploader').css('background-image', 'url(' + imageUrl + ')');
            },

            handleFileSelect: function (e, input) {
                var fileData = {},
                    $input = $(input);
                if (this.oldMode) {
                    if ($input.val()) {
                        fileData = $input.parent();
                    }
                } else {
                    fileData = input.files[0];
                }
                this.model.set("pictureFile", fileData);
            },

            displayImageURL: function (e) {
                this.$el.find('.picture-uploader').css('background-image', 'url(' + this.model.get('image1_url') + ')');
            },

            displayPictureFile: function () {
                if (this.oldMode) {
                    return;
                }

                var self = this,
                    file = this.model.get("pictureFile"),
                    reader = new FileReader();

                reader.onload = function (e) {
                    self.closeBtn.show();
                    self.$el.find('.picture-uploader').css('background-image', 'url(' + e.target.result + ')');
                };

                reader.readAsDataURL(file);
            },

            render: function () {
                var self = this,
                    imageUrl = this.model.get('image1_url'),
                    hasImage = false;
                this.oldMode = _.browser.IE < 10;

                if (imageUrl) {
                    imageUrl = imageUrl.replace(/^\/ajax/, ox.apiRoot);
                    hasImage = true;
                } else {
                    imageUrl =  ox.base + '/apps/themes/default/dummypicture.png';
                }

                this.$el.append(
                    $('<div class="picture-uploader thumbnail">').css({
                        backgroundImage: 'url(' + imageUrl + ')',
                        cursor: 'pointer',
                        position: 'relative'
                    }).append(
                        this.closeBtn = $('<div class="close">').css({zIndex: 2}).html('&times;').on('click', function (e) {
                            self.resetImage(e);
                        })[hasImage ? 'show' : 'hide']()
                     ),
                    $('<form>').css({position: 'absolute'}).append(
                        $('<input type="file" name="file" accepts="image/*">').css({opacity: 0}).css({height: '110px', width: '110px', cursor: 'pointer'})
                            .on('change', function (e) {
                                self.handleFileSelect(e, this);
                            })
                    )
                );

                if (this.clear) {
                    this.$el.append($('<div>').css({clear: 'both'}));
                }
            }
        }, options);
    }

    return PictureUpload;
});
