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
define('io.ox/core/viewer/types/videotype', [
    'io.ox/core/viewer/types/basetype',
    'gettext!io.ox/core'
], function (BaseType, gt) {

    'use strict';

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
    var videoType = {
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
        createSlide: function (model, modelIndex) {
            //console.warn('VideoType.createSlide()');
            var slide = $('<div class="swiper-slide" tabindex="-1" role="option" aria-selected="false">'),
                video,
                slidesCount = model.collection.length,
                previewUrl = model && model.getPreviewUrl(),
                contentType = model && model.get('contentType') || '';

            if (previewUrl) {
                video = $('<video controls="true">').append(
                    $('<source>').attr({ 'data-src': _.unescapeHTML(previewUrl), type: contentType }),
                    $('<div>').text(gt('Your browser does not support HTML5 video.'))
                );
            }

            slide.append(video, this.createCaption(modelIndex, slidesCount));
            return slide;
        },

        /**
         * "Loads" a video slide.
         *
         * @param {Object} model
         *  An OX Viewer Model object.
         *
         * @param {jQuery} slideElement
         *  The slide jQuery element to be loaded.
         */
        loadSlide: function (model, slideElement) {
            //console.warn('VideoType.loadSlide()', slideIndex, slideElement);
            if (!model || !slideElement || slideElement.length === 0) {
                return;
            }

            var videoToLoad = slideElement.find('video'),
                videoSource = videoToLoad.find('source');

            if ((videoToLoad.length === 0) || (videoSource.length === 0)) { return; }
            slideElement.busy();

            // register play handler
            videoToLoad[0].oncanplay = function () {
                slideElement.idle();
                videoToLoad.show();
            };

            // register error handler
            videoSource[0].onerror = function (/*e*/) {
                //console.warn('VideoType.loadSlide() - error loading:', e.target.src);
                var filename = model && model.get('filename') || '',
                    slideContent;

                videoToLoad.remove();
                slideContent = $('<div class="viewer-displayer-notification">').append(
                    $('<i class="fa fa-file-video-o">'),
                    $('<p>').text(filename),
                    $('<p class="apology">').text(gt('Sorry, the video could not be played.'))
                );
                slideElement.idle().append(slideContent);
            };

            videoSource.attr('src', videoSource.attr('data-src'));
            videoToLoad[0].load(); // reset and start selecting and loading a new media resource from scratch
        },

        /**
         * "Unloads" a previously loaded video slide again.
         *
         * @param {jQuery} slideElement
         *  the slide jQuery element to be loaded.
         */
        unloadSlide: function (slideElement) {
            //console.warn('VideoType.unloadSlide()', slideElement);
            if (!slideElement || slideElement.length === 0) {
                return;
            }

            var videoToLoad = slideElement.find('video'),
                videoSource = videoToLoad.find('source');

            videoToLoad[0].pause();
            videoSource.attr('src', '');
        }
    };

    // returns an object which inherits BaseType
    return _.extend(Object.create(BaseType), videoType);

});
