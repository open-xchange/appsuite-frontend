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
define('io.ox/core/viewer/types/imagetype', [
    'io.ox/core/viewer/types/basetype',
    'gettext!io.ox/core'
], function (BaseType, gt) {

    /**
     * The image file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function createSlide(model, modelIndex);
     *    function loadSlide(slideElement);
     * }
     *
     */
    var imageType = {
        /**
         * Creates a Image slide.
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
        createSlide: function (model, modelIndex) {
            //console.warn('ImageType.createSlide()');
            if (!model) { return; }
            var slide = this.createSlideNode(),
                image = $('<img class="viewer-displayer-item viewer-displayer-image">'),
                previewUrl = model.getPreviewUrl(),
                filename = model.get('filename') || '',
                slidesCount = model.collection.length;
            if (previewUrl) {
                previewUrl = _.unescapeHTML(previewUrl);
                image.attr({ 'data-src': previewUrl, alt: filename });
                slide.append(image, this.createCaption(modelIndex, slidesCount));
            }
            return slide;
        },

        /**
         * "Loads" an image slide by transferring the image source from the 'data-src'
         *  to the 'src' attribute of the <img> HTMLElement.
         *
         * @param {jQuery} slideElement
         *  the slide jQuery element to be loaded.
        */
        loadSlide: function (model, slideElement) {
            //console.warn('ImageType.loadSlide()', slideElement.attr('class'));
            if (slideElement.length === 0) { return; }
            var self = this,
                imageToLoad = slideElement.find('img');
            if (imageToLoad.length === 0 || slideElement.hasClass('cached')) { return;}
            slideElement.busy();
            imageToLoad[0].onload = function () {
                slideElement.idle();
                imageToLoad.show();
            };
            imageToLoad[0].onerror = function () {
                var notification = self.createNotificationNode(model, gt('Sorry, there is no preview available for this image.'));
                slideElement.idle().append(notification);
            };
            imageToLoad.attr('src', imageToLoad.attr('data-src'));
            slideElement.addClass('cached');
        },

        /**
         * Unloads an image slide by replacing the src attribute of the image to an
         * Base64 encoded, 1x1 pixel GIF image.
         *
         * @param {jQuery} slideElement
         *  the slide jQuery element to be unloaded
         */
        unloadSlide: function (slideElement) {
            //console.warn('ImageType.unloadSlide()', slideElement.data('swiper-slide-index'));
            if (slideElement.length === 0 || slideElement.hasClass('swiper-slide-duplicate') || !slideElement.hasClass('cached')) { return; }
            var imageElement = slideElement.find('img')[0];
            if (!imageElement) { return; }
            imageElement.onload = null;
            imageElement.onerror = null;
            $(imageElement).attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=');
            slideElement.removeClass('cached');
        }

    };

    // returns an object which inherits BaseType
    return _.extend(Object.create(BaseType), imageType);
});
