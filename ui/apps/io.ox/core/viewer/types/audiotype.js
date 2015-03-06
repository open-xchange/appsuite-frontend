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
define('io.ox/core/viewer/types/audiotype',  [
    'io.ox/core/viewer/types/basetype',
    'gettext!io.ox/core'
], function (BaseType, gt) {

    'use strict';

    /**
     * The audio file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function createSlide(model, modelIndex);
     *    function loadSlide(model, slideElement);
     * }
     *
     */
    var audioType = {
        /**
         * Creates an audio slide.
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
            //console.warn('AudioType.createSlide()');
            var slide = this.createSlideNode(),
                audio,
                slidesCount = model.collection.length,
                previewUrl = model && model.getPreviewUrl(),
                contentType = model && model.get('contentType') || '';

            if (previewUrl) {
                audio = $('<audio controls="true" class="viewer-displayer-audio player-hidden">').append(
                    $('<source>').attr({ 'data-src': _.unescapeHTML(previewUrl), type: contentType }),
                    $('<div>').text(gt('Your browser does not support HTML5 audio.'))
                );
            }

            slide.append(audio, this.createCaption(modelIndex, slidesCount));
            return slide;
        },

        /**
         * "Loads" an audio slide.
         *
         * @param {Object} model
         *  The OX Viewer Model of the slide to be loaded.
         *
         * @param {jQuery} slideElement
         *  The slide jQuery element to be loaded.
         */
        loadSlide: function (model, slideElement) {
            //console.warn('AudioType.loadSlide()', slideIndex, slideElement);
            if (!model || !slideElement || slideElement.length === 0) {
                return;
            }

            var audioToLoad = slideElement.find('audio'),
                audioSource = audioToLoad.find('source');

            if ((audioToLoad.length === 0) || (audioSource.length === 0) || (audioSource.attr('src'))) { return; }

            // register play handler, use 'onloadeddata' because 'oncanplay' is not always triggered on Firefox
            audioToLoad[0].onloadeddata = function () {
                slideElement.idle();
                audioToLoad.removeClass('player-hidden');
                console.warn('AudioType.loadSlide()-- onloadeddata --', model.get('filename'));
            };

            // register error handler
            audioSource[0].onerror = function (e) {
                console.warn('AudioType.loadSlide() - error loading:', model.get('filename'), e.target.src);
                var filename = model && model.get('filename') || '',
                    slideContent;

                slideContent = $('<div class="viewer-displayer-notification">').append(
                    $('<i class="fa fa-file-audio-o">'),
                    $('<p>').text(filename),
                    $('<p class="apology">').text(gt('Sorry, the audio file could not be played.'))
                );
                slideElement.idle().append(slideContent);
            };

            slideElement.busy();
            slideElement.find('div.viewer-displayer-notification').remove();
            audioSource.attr('src', audioSource.attr('data-src'));
            audioToLoad[0].load();
        },

        /**
         * "Unloads" a previously loaded audio slide again.
         *
         * @param {jQuery} slideElement
         *  The slide jQuery element to be unloaded.
         */
        unloadSlide: function (slideElement) {
            //console.warn('AudioType.unloadSlide()', slideElement);
            if (!slideElement || slideElement.length === 0) {
                return;
            }

            var audioToLoad = slideElement.find('audio'),
                audioSource = audioToLoad.find('source');

            if (audioToLoad.length > 0) {
                audioToLoad[0].pause();
                audioToLoad.addClass('player-hidden');
                audioSource.attr('src', '');
            }
        }

    };

    // returns an object which inherits BaseType
    return _.extend(Object.create(BaseType), audioType);

});
