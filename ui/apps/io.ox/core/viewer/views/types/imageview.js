/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/types/imageview', [
    'io.ox/core/viewer/views/types/baseview',
    'gettext!io.ox/core'
], function (BaseView, gt) {

    /**
     * The image file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function render({model: model, modelIndex: modelIndex});
     *    function load();
     *    function unload();
     * }
     *
     */
    var ImageView =  BaseView.extend({

        initialize: function () {
            //console.warn('ImageView.initialize()');
        },

        /**
         * Creates and renders an Image slide.
         *
         * @param {Object} data
         *  @param {Object} data.model
         *      An OX Viewer Model object.
         *  @param {Number} data.modelIndex
         *      Index of the model object in the collection.
         *
         * @returns {ImageView}
         *  the ImageView instance.
         */
        render: function (data) {
            //console.warn('ImageView.render()');

            var image = $('<img class="viewer-displayer-item viewer-displayer-image">'),
                previewUrl = this.model.getPreviewUrl(),
                filename = this.model.get('filename') || '',
                slidesCount = this.model.collection.length,
                modelIndex = data && data.modelIndex || 0,
                self = this;

            // remove content of the slide duplicates
            if (this.$el.hasClass('swiper-slide-duplicate')) {
                this.$el.empty();
            }

            if (previewUrl) {
                previewUrl = _.unescapeHTML(previewUrl);
                image.attr({ 'data-src': previewUrl, alt: filename });
                this.$el.busy();
                image.one('load', function () {
                    self.$el.idle();
                    image.show();
                });
                image.one('error', function () {
                    var notification = self.createNotificationNode(this.model, gt('Sorry, there is no preview available for this image.'));
                    self.$el.idle().append(notification);
                });
                this.$el.append(image, this.createCaption(modelIndex, slidesCount));
            }

            return this;
        },

        /**
         * "Loads" an image slide by transferring the image source from the 'data-src'
         *  to the 'src' attribute of the <img> HTMLElement.
         *
         * @returns {ImageView}
         *  the ImageView instance.
         */
        load: function () {
            //console.warn('ImageType.load()', this.model.get('filename'));

            var imageToLoad = this.$el.find('img');
            if (imageToLoad.length > 0) {
                imageToLoad.attr('src', imageToLoad.attr('data-src'));
            }

            return this;
        },

        /**
         * Unloads an image slide by replacing the src attribute of the image to an
         * Base64 encoded, 1x1 pixel GIF image.
         *
         * @returns {ImageView}
         *  the ImageView instance.
         */
        unload: function () {
            //console.warn('ImageType.unload()', this.model.get('filename'));

            var imageToUnLoad;
            // never unload slide duplicates
            if (!this.$el.hasClass('swiper-slide-duplicate')) {
                imageToUnLoad = this.$el.find('img');
                if (imageToUnLoad.length > 0) {
                    imageToUnLoad.attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=');
                }
            }

            return this;
        },

        /**
         * Destructor function of this view.
         *
         * @returns {ImageView}
         *  the ImageView instance.
         */
        disposeView: function () {
            //console.warn('ImageView.disposeView()');

            return this;
        }

    });

    // returns an object which inherits BaseView
    return ImageView;
});
