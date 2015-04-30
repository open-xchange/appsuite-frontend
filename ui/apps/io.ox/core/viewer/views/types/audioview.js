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
    'io.ox/files/api',
    'gettext!io.ox/core'
], function (BaseView, FilesAPI, gt) {

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
            var audio,
                source,
                cover,
                mimeType = this.model.getMimeType() || '',
                audioUrl = this.getPreviewUrl() || '',
                coverUrl = FilesAPI.getUrl(this.model.toJSON(), 'cover', { width: 280, height: 280 }),
                self = this;

            // run own disposer function on dispose event from DisposableView
            this.on('dispose', this.disposeView.bind(this));

            this.$el.empty().append(
                $('<div class="viewer-displayer-item viewer-displayer-audio player-hidden">').append(
                    cover = $('<img>').attr('src', _.unescapeHTML(coverUrl)),
                    audio = $('<audio controls="true">').append(
                        source = $('<source>'),
                        $('<div>').text(gt('Your browser does not support the audio format of this file.'))
                    )
                )
            );

            // register play handler, use 'loadeddata' because 'canplay' is not always triggered on Firefox
            audio.on('loadeddata', function () {
                self.$el.idle().find('.viewer-displayer-audio').removeClass('player-hidden');
            });

            source.attr({ 'data-src': _.unescapeHTML(audioUrl), type: mimeType });
            source.on('error', function () {
                self.$el.idle().append(
                    self.createNotificationNode(gt('Your browser does not support the audio format of this file.'))
                );
            });

            // we don't know if the cover url is valid or not until we load it from the server
            cover.one('error', function () {
                cover.remove();
            });

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
            var audio = this.$el.find('audio'),
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
            var audio = this.$el.find('audio');

            // never unload slide duplicates
            if (!this.$el.hasClass('swiper-slide-duplicate') && audio.length > 0) {
                audio[0].pause();
                this.$el.find('.viewer-displayer-audio').addClass('player-hidden');
                audio.find('source').attr('src', '');
            }

            return this;
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            // remove event listeners from audio and source element
            this.$el.find('audio').off().find('source').off();
        }

    });

    // returns an object which inherits BaseView
    return AudioView;
});
