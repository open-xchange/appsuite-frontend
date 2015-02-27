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
     * @constructor
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
            var slide = $('<div class="swiper-slide" tabindex="-1" role="option" aria-selected="false">'),
                image = $('<img class="viewer-displayer-image">'),
                previewUrl = model && model.getPreviewUrl(),
                filename = model && model.get('filename') || '',
                slidesCount = model.collection.length,
                displayerTopOffset = 45;
            if (previewUrl) {
                image.attr({ 'data-src': _.unescapeHTML(previewUrl), alt: filename })
                    .css({ maxHeight: window.innerHeight - displayerTopOffset, maxWidth: window.innerWidth });
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
            //console.warn('ImageType.loadSlide()', slideIndex, slideElement);
            if (slideElement.length === 0) {
                return;
            }
            var imageToLoad = slideElement.find('img');
            if (imageToLoad.length === 0) { return ;}
            slideElement.busy();
            imageToLoad[0].onload = function () {
                slideElement.idle();
                imageToLoad.show();
            };
            imageToLoad[0].onerror = function () {
                var notification = $('<p class="viewer-displayer-notification">')
                    .text(gt('Sorry, there is no preview available for this file.'));
                slideElement.idle().append(notification);
            };
            imageToLoad.attr('src', imageToLoad.attr('data-src'));
        }
    };

    // returns an object which inherits BaseType
    return _.extend(Object.create(BaseType), imageType);
});
