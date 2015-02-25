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
define('io.ox/core/viewer/types/videotype', [
    'gettext!io.ox/core'
], function (gt) {
    /**
     * The video file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function createSlide(model, modelIndex);
     *    function loadSlide(slideElement);
     * }
     *
     * @constructor
     */
    var videoType = (function () {
        /**
         * Creates a video slide.
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
        function createSlide (model, modelIndex) {
            //console.warn('VideoType.createSlide()');
            var slide = $('<div class="swiper-slide" tabindex="-1" role="option" aria-selected="false">'),
                slidesCount = model.collection.length;
            function createCaption () {
                var caption = $('<div class="viewer-displayer-caption">');
                caption.text(modelIndex + 1 + ' ' + gt('of') + ' ' + slidesCount);
                return caption;
            }
            slide.append(createCaption());
            return slide;
        }

        /**
         * "Loads" a video slide.
         *
         * @param {Number} slideIndex
         *  index of the slide to be loaded.
         *
         * @param {jQuery} slideElement
         *  the slide jQuery element to be loaded.
         */
        function loadSlide(model, slideElement) {
            //console.warn('VideoType.loadSlide()', slideIndex, slideElement);
            if (!model || slideElement.length === 0) {
                return;
            }
        }

        return {
            createSlide: createSlide,
            loadSlide: loadSlide
        };
    })();

    return videoType;

});
