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
     *    function loadSlide(slideIndex, slideElement);
     * }
     *
     * @constructor
     */
    function VideoType() {
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
        this.createSlide = function (model, modelIndex) {
            //console.warn('VideoType.createSlide()');
            var slide = $('<div class="item">'),
                image = $('<img class="viewer-displayer-image">'),
                caption = $('<div class="viewer-displayer-caption">'),
                previewUrl = model && model.getPreviewUrl(),
                filename = model && model.get('filename') || '',
                slidesCount = model.collection.length,
                displayerTopOffset = $('.viewer-toolbar').outerHeight();
            if (previewUrl) {
                image.attr({ 'data-src': _.unescapeHTML(previewUrl), alt: filename })
                    .css({ maxHeight: window.innerHeight - displayerTopOffset });
                caption.text(modelIndex + 1 + ' ' + gt('of') + ' ' + slidesCount);
                slide.append(image, caption);
            }
            slide.attr('data-slide', modelIndex);
            return slide;
        };

        /**
         * "Loads" a video slide.
         *
         * @param {Number} slideIndex
         *  index of the slide to be loaded.
         *
         * @param {jQuery} slideElement
         *  the slide jQuery element to be loaded.
         */
        this.loadSlide = function (slideIndex, slideElement) {
            //console.warn('VideoType.loadSlide()', slideIndex, slideElement);
            if (typeof slideIndex !== 'number' || isNaN(slideIndex)) {
                return;
            }
            var imageToLoad = slideElement.find('img');
            if (imageToLoad.length === 0 || imageToLoad.attr('src')) { return ;}
            slideElement.busy();
            imageToLoad.attr('src', imageToLoad.attr('data-src'));
            imageToLoad[0].onload = function () {
                slideElement.idle();
                imageToLoad.show();
            };
            imageToLoad[0].onerror = function () {
                var notification = $('<p class="viewer-displayer-notification">')
                    .text(gt('Sorry, there is no preview available for this file.'));
                slideElement.idle().append(notification);
            };
        };
    }

    return VideoType;

});
