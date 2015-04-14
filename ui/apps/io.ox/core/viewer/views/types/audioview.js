/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/types/audioview',  [
    'io.ox/core/viewer/views/types/baseview',
    'gettext!io.ox/core'
], function (BaseView, gt) {

    'use strict';

    /**
     * The audio file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function render();
     *    function load();
     *    function unload();
     * }
     *
     */
    var AudioView = BaseView.extend({

        /**
         * Creates and renders the audio slide.
         *
         * @returns {AudioView}
         *  the AudioView instance.
         */
        render: function () {
            //console.warn('AudioView.render()', this.model.get('filename'));

            var audio = $('<audio controls="true" class="viewer-displayer-item viewer-displayer-audio player-hidden">'),
                source = $('<source>'),
                fallback = $('<div>').text(gt('Your browser does not support HTML5 audio.')),
                previewUrl = this.getPreviewUrl() || '',
                contentType = this.model.get('file_mimetype') || '',
                caption = this.createCaption(),
                self = this;

            // run own disposer function on dispose event from DisposableView
            this.on('dispose', this.disposeView.bind(this));

            // register play handler, use 'loadeddata' because 'canplay' is not always triggered on Firefox
            audio.on('loadeddata', function () {
                self.$el.idle();
                audio.removeClass('player-hidden');
                // console.warn('AudioView.loadSlide() - loaded:', self.model.get('filename'));
            });

            // register error handler
            source.on('error', function () {
                // console.warn('AudioView.loadSlide() - error loading:', self.model.get('filename'));

                self.$el.idle().append(
                    self.createNotificationNode(gt('Sorry, the audio file could not be played.'))
                );
            });

            source.attr({ 'data-src': _.unescapeHTML(previewUrl), type: contentType });
            audio.append(source, fallback);

            this.$el.empty().append(audio, caption);
            return this;
        },

        /**
         * "Prefetches" the audio slide.
         * In order to save memory and network bandwidth audio files are not prefetched.
         *
         * @returns {AudioView}
         *  the AudioView instance.
         */
        prefetch: function () {
            //console.warn('AudioView.prefetch()', this.model.get('filename'));
            return this;
        },

        /**
         * "Shows" the audio slide by transferring the audio source from the 'data-src'
         *  to the 'src' attribute of the <source> HTMLElement.
         *
         * @returns {AudioView}
         *  the AudioView instance.
         */
        show: function () {
            //console.warn('AudioView.load()', this.model.get('filename'));

            var audio = this.$el.find('audio.viewer-displayer-audio'),
                audioSource = audio.find('source');

            if ((audio.length > 0) && (audioSource.length > 0)) {
                this.$el.busy();
                this.$el.find('div.viewer-displayer-notification').remove();
                audioSource.attr('src', audioSource.attr('data-src'));
                audio[0].load();
            }

            return this;
        },

        /**
         * "Unloads" the audio slide by replacing the src attribute of
         * the source element to an empty String.
         *
         * @returns {AudioView}
         *  the AudioView instance.
         */
        unload: function () {
            //onsole.warn('AudioView.unload()', this.model.get('filename'));
            var audio = this.$el.find('audio.viewer-displayer-audio');

            // never unload slide duplicates
            if (!this.$el.hasClass('swiper-slide-duplicate') && audio.length > 0) {
                audio[0].pause();
                audio.addClass('player-hidden');
                audio.find('source').attr('src', '');
            }

            return this;
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            //console.warn('ImageView.disposeView()', this.model.get('filename'));

            var audio = this.$el.find('audio.viewer-displayer-audio');
            // remove event listeners from audio and source element
            audio.off().find('source').off();
        }

    });

    // returns an object which inherits BaseView
    return AudioView;
});
