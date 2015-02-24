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
define('io.ox/core/viewer/types/audiotype',  [
    'gettext!io.ox/core'
], function (gt) {
    /**
     * The audio file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function createSlide(model, modelIndex);
     *    function loadSlide(slideElement);
     * }
     *
     * @constructor
     */
    function AudioType(model) {
        /**
         * Creates a audio slide.
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
        this.createSlide = function (modelIndex) {
            //console.warn('AudioType.createSlide()');
            var slide = $('<div class="swiper-slide">'),
                caption = $('<div class="viewer-displayer-caption">'),
                slidesCount = model.collection.length;
            caption.text(modelIndex + 1 + ' ' + gt('of') + ' ' + slidesCount);
            slide.append(caption);
            return slide;
        };

        /**
         * "Loads" a audio slide.
         *
         * @param {Number} slideIndex
         *  index of the slide to be loaded.
         *
         * @param {jQuery} slideElement
         *  the slide jQuery element to be loaded.
         */
        this.loadSlide = function (slideIndex, slideElement) {
            //console.warn('AudioType.loadSlide()', slideIndex, slideElement);
            if (slideElement.length === 0) {
                return;
            }
        };
    }

    return AudioType;

});
