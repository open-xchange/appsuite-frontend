/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/types/imageview', [
    'io.ox/core/viewer/views/types/baseview',
    'gettext!io.ox/core'
], function (BaseView, gt) {

    'use strict';

    var RETINA_FACTOR = 2;

    /**
     * The image file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function render();
     *    function load();
     *    function unload();
     * }
     *
     */
    var ImageView =  BaseView.extend({

        initialize: function () {
            this.isPrefetched = false;
        },

        /**
         * Creates and renders the image slide.
         *
         * @returns {ImageView}
         *  the ImageView instance.
         */
        render: function () {
            var image      = $('<img class="viewer-displayer-item viewer-displayer-image hidden">');
            var imageSize  = this.getImageSize();
            var options    = _.extend({ scaleType: 'contain' }, imageSize);
            var previewUrl = this.getPreviewUrl(options);
            var filename   = this.model.get('filename') || '';
            var self       = this;

            this.$el.empty();

            if (previewUrl) {
                previewUrl = _.unescapeHTML(previewUrl);
                image.attr({ 'data-src': previewUrl, alt: filename });
                this.$el.busy();
                image.one('load', function () {
                    self.$el.idle();
                    image.removeClass('hidden');
                });
                image.one('error', function () {
                    var notification = self.createNotificationNode(gt('Sorry, there is no preview available for this image.'));
                    self.$el.idle().append(notification);
                });
                this.$el.append($('<div class="viewer-displayer-item-container">').append(image));
            }

            return this;
        },

        /**
         * Returns an object with the width and the height to apply to the image.
         *
         * @returns {Object}
         *  And object containing the width and the height for the image.
         */
        getImageSize: function () {
            // since this node is not yet part of the DOM we look
            // for the carousel's dimensions directly
            var retina   = _.device('retina');
            var carousel = $('.viewer-displayer:visible');
            // on retina screen request larger previews to render sharp images
            var width    = retina ? carousel.width() * RETINA_FACTOR : carousel.width();
            var height   = retina ? carousel.height() * RETINA_FACTOR : carousel.height();
            var size     = { width: width, height: height };

            return size;
        },

        /**
         * Generates a Base64 preview URL for files that have been added
         * from local file system but are not yet uploaded to the server.
         *
         * @return {$.Promise}
         *  A Promise that if resolved contains the Base64 preview URL.
         */
        getLocalFilePreviewUrl: function () {
            var fileObj = this.model.get('fileObj');
            var size    = this.getImageSize();

            return require(['io.ox/contacts/widgets/canvasresize']).then(function (canvasResize) {

                var def = $.Deferred();

                var options = _.extend({
                    crop: false,
                    quality: 80,
                    callback: callback
                }, size);

                function callback(data) {
                    def.resolve(data);
                }

                canvasResize(fileObj, options);

                return def;
            });
        },

        /**
         * "Prefetches" the image slide by transferring the image source from the 'data-src'
         *  to the 'src' attribute of the <img> HTMLElement, or by generating a Base64 URL
         *  for local files.
         *
         * @returns {ImageView}
         *  the ImageView instance.
         */
        prefetch: function () {
            var image = this.$el.find('img.viewer-displayer-image');
            if (image.length > 0) {
                // handle local file that has not yet been uploaded to the server
                if (this.model.get('group') === 'localFile') {
                    this.getLocalFilePreviewUrl().done(function (previewUrl) {
                        if (previewUrl) {
                            image.attr('src', previewUrl);
                        }
                    });

                } else {
                    image.attr('src', image.attr('data-src'));
                }

                this.isPrefetched = true;
            }

            return this;
        },

        /**
         * "Shows" the image slide.
         * For images all work is already done in prefetch()
         *
         * @returns {ImageView}
         *  the ImageView instance.
         */
        show: function () {
            return this;
        },

        /**
         * "Unloads" the image slide by replacing the src attribute of the image to an
         * Base64 encoded, 1x1 pixel GIF image.
         *
         * @returns {ImageView}
         *  the ImageView instance.
         */
        unload: function () {
            var imageToUnLoad;
            // never unload slide duplicates
            if (!this.$el.hasClass('swiper-slide-duplicate')) {
                imageToUnLoad = this.$el.find('img.viewer-displayer-image');
                if (imageToUnLoad.length > 0) {
                    imageToUnLoad.attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=');
                }
                this.isPrefetched = false;
            }
            return this;
        }

    });

    // returns an object which inherits BaseView
    return ImageView;
});
