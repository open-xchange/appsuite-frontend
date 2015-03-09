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
            var slide = this.createSlideNode(),
                video,
                slidesCount = model.collection.length,
                previewUrl = model && model.getPreviewUrl(),
                contentType = model && model.get('contentType') || '';

            if (previewUrl) {
                video = $('<video controls="true" class="viewer-displayer-item viewer-displayer-video player-hidden">').append(
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
         *  The OX Viewer Model of the slide to be loaded.
         *
         * @param {jQuery} slideElement
         *  The slide jQuery element to be loaded.
         */
        loadSlide: function (model, slideElement) {
            //console.warn('VideoType.loadSlide()', slideElement);
            if (!model || !slideElement || slideElement.length === 0) {
                return;
            }

            var videoToLoad = slideElement.find('video'),
                videoSource = videoToLoad.find('source'),
                self = this;

            if ((videoToLoad.length === 0) || (videoSource.length === 0) || (videoSource.attr('src'))) { return; }

            // register play handler, use 'onloadeddata' because 'oncanplay' is not always triggered on Firefox
            videoToLoad[0].onloadeddata = function () {
                slideElement.idle();
                videoToLoad.removeClass('player-hidden');
                console.warn('VideoType.loadSlide()-- onloadeddata --', model.get('filename'));
            };

            // register error handler
            videoSource[0].onerror = function (e) {
                console.warn('VideoType.loadSlide() - error loading:', model.get('filename'), e.target.src);
                var notification = self.createNotificationNode(model, gt('Sorry, the video could not be played.'));
                slideElement.idle().append(notification);
            };

            slideElement.busy();
            slideElement.find('div.viewer-displayer-notification').remove();
            videoSource.attr('src', videoSource.attr('data-src'));
            videoToLoad[0].load(); // reset and start selecting and loading a new media resource from scratch
        },

        /**
         * "Unloads" a previously loaded video slide.
         *
         * @param {jQuery} slideElement
         *  the slide jQuery element to be unloaded.
         */
        unloadSlide: function (slideElement) {
            //console.warn('VideoType.unloadSlide()', slideElement);
            if (!slideElement || slideElement.length === 0) {
                return;
            }

            var videoToLoad = slideElement.find('video'),
                videoSource = videoToLoad.find('source');

            if (videoToLoad.length > 0) {
                videoToLoad[0].pause();
                videoToLoad.addClass('player-hidden');
                videoSource.attr('src', '');
            }
        }

    };

    // returns an object which inherits BaseType
    return _.extend(Object.create(BaseType), videoType);

});
