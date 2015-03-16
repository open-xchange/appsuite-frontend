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
 */
define('io.ox/core/viewer/views/types/imageview', [
    'io.ox/core/viewer/views/types/baseview',
    'gettext!io.ox/core'
], function (BaseView, gt) {

    /**
     * The image file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function render(model, modelIndex);
     *    function loadSlide(model, slideElement);
     *    function unloadSlide(slideElement);
     * }
     *
     */
    var ImageView =  BaseView.extend({

        initialize: function () {
            console.warn('ImageView.initialize()');
        },

        /**
         * Creates and renders an Image slide.
         *
         * @param {Object} model
         *  An OX Viewer Model object.
         *
         * @param {Number} modelIndex
         *  Index of this model object in the collection.
         *
         * @returns {jQuery} slide
         *  the slide jQuery element.
         */
        render: function () {
            console.warn('ImageView.render()');
            var slide = this.createSlideNode(),
                image = $('<img class="viewer-displayer-item viewer-displayer-image">'),
                previewUrl = this.model.getPreviewUrl(),
                filename = this.model.get('filename') || '',
                slidesCount = this.model.collection.length,
                self = this;
            if (previewUrl) {
                previewUrl = _.unescapeHTML(previewUrl);
                image.attr({ 'data-src': previewUrl, alt: filename });
                slide.busy();
                image.one('load', function () {
                    slide.idle();
                    image.show();
                });
                image.one('error', function () {
                    var notification = self.createNotificationNode(this.model, gt('Sorry, there is no preview available for this image.'));
                    slide.idle().append(notification);
                });
                slide.append(image, this.createCaption(this.attributes.modelIndex, slidesCount));
                slide.append(image);
            }
            this.$el.append(slide);
            return this;
        },

        /**
         * "Loads" an image slide by transferring the image source from the 'data-src'
         *  to the 'src' attribute of the <img> HTMLElement.
         *
         * @param {jQuery} slideElement
         *  the slide jQuery element to be loaded.
         */
        load: function () {
            //console.warn('ImageType.loadSlide()', slideElement.attr('class'));
            var imageToLoad = this.$el.find('img');
            if (imageToLoad.length === 0 || this.$el.hasClass('cached')) { return;}
            imageToLoad.attr('src', imageToLoad.attr('data-src'));
            this.$el.addClass('cached');
        },

        /**
         * Unloads an image slide by replacing the src attribute of the image to an
         * Base64 encoded, 1x1 pixel GIF image.
         *
         */
        unload: function () {
            //console.warn('ImageType.unloadSlide()');
            var slideElement = this.$el;
            if (slideElement.length === 0 || slideElement.hasClass('swiper-slide-duplicate') || !slideElement.hasClass('cached')) { return; }
            var imageElement = slideElement.find('img')[0];
            if (!imageElement) { return; }
            imageElement.onload = null;
            imageElement.onerror = null;
            $(imageElement).attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=');
            slideElement.removeClass('cached');
        },

        /**
         * Destructor function of this view.
         */
        dispose: function () {
            console.warn('ImageView.dispose()');
        }

    });

    // returns an object which inherits BaseType
    return ImageView;
});
