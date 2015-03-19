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
         * Creates and renders a audio slide.
         *
         * @returns {AudioView}
         *  the AudioView instance.
         */
        render: function () {
            // console.warn('AudioView.render()');

            var audio = $('<audio controls="true" class="viewer-displayer-item viewer-displayer-audio player-hidden">'),
                source = $('<source>'),
                fallback = $('<div>').text(gt('Your browser does not support HTML5 audio.')),
                previewUrl = this.model.getPreviewUrl() || '',
                contentType = this.model.get('contentType') || '',
                caption = this.createCaption(),
                self = this;

            // run own disposer function on dispose event from DisposableView
            this.on('dispose', this.disposeView.bind(this));

            // remove content of the slide duplicates
            if (this.$el.hasClass('swiper-slide-duplicate')) {
                this.$el.empty();
            }

            // register play handler, use 'loadeddata' because 'canplay' is not always triggered on Firefox
            audio.on('loadeddata', function () {
                self.$el.idle();
                audio.removeClass('player-hidden');
                // console.warn('AudioView.loadSlide() - loaded:', self.model.get('filename'));
            });

            // register error handler
            audio.on('error', function () {
                // console.warn('AudioView.loadSlide() - error loading:', self.model.get('filename'));

                self.$el.idle().append(
                    self.createNotificationNode(gt('Sorry, the audio file could not be played.'))
                );
            });

            source.attr({ 'data-src': _.unescapeHTML(previewUrl), type: contentType });
            audio.append(source, fallback);

            this.$el.append(audio, caption);
            return this;
        },

        /**
         * "Loads" an audio slide by transferring the audio source from the 'data-src'
         *  to the 'src' attribute of the <source> HTMLElement.
         *
         * @returns {AudioView}
         *  the AudioView instance.
         */
        load: function () {
            // console.warn('AudioView.load()', this.model.get('filename'));
            var audioToLoad = this.$el.find('audio'),
                audioSource = audioToLoad.find('source');

            if ((audioToLoad.length > 0) && (audioSource.length > 0)) {
                this.$el.busy();
                this.$el.find('div.viewer-displayer-notification').remove();
                audioSource.attr('src', audioSource.attr('data-src'));
                audioToLoad[0].load();
            }

            return this;
        },

        /**
         * "Unloads" an audio slide by replacing the src attribute of
         * the source element to an empty String.
         *
         * @returns {AudioView}
         *  the AudioView instance.
         */
        unload: function () {
            // console.warn('AudioView.unload()', this.model.get('filename'));
            var audioToUnLoad = this.$el.find('audio');

            // never unload slide duplicates
            if (!this.$el.hasClass('swiper-slide-duplicate') && audioToUnLoad.length > 0) {
                audioToUnLoad[0].pause();
                audioToUnLoad.addClass('player-hidden');
                audioToUnLoad.find('source').attr('src', '');
            }
        },

        /**
         * Destructor function of this view.
         *
         * @returns {AudioView}
         *  the AudioView instance.
         */
        disposeView: function () {
            // console.warn('ImageView.disposeView()');
            var audio = this.$el.find('audio');
            // remove event listeners from audio and source element
            audio.off().find('source').off();
            return this;
        }

    });

    // returns an object which inherits BaseView
    return AudioView;
});
