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
define('io.ox/core/viewer/views/types/videoview',  [
    'io.ox/core/viewer/views/types/baseview',
    'gettext!io.ox/core'
], function (BaseView, gt) {

    'use strict';

    /**
     * The video file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function render();
     *    function load();
     *    function unload();
     * }
     *
     */
    var VideoView = BaseView.extend({

        /**
         * Creates and renders the video slide.
         *
         * @returns {VideoView}
         *  the VideoView instance.
         */
        render: function () {
            //console.warn('VideoView.render()', this.model.get('filename'));

            var video = $('<video controls="true" class="viewer-displayer-item viewer-displayer-video player-hidden">'),
                source = $('<source>'),
                fallback = $('<div>').text(gt('Your browser does not support HTML5 video.')),
                previewUrl = this.getPreviewUrl() || '',
                contentType = this.model.get('file_mimetype') || '',
                caption = this.createCaption(),
                self = this;

            // run own disposer function on dispose event from DisposableView
            this.on('dispose', this.disposeView.bind(this));

            // register play handler, use 'loadeddata' because 'canplay' is not always triggered on Firefox
            video.on('loadeddata', function () {
                self.$el.idle();
                video.removeClass('player-hidden');
                // console.warn('VideoType.loadSlide() - loaded:', self.model.get('filename'));
            });

            // register error handler
            source.on('error', function () {
                // console.warn('VideoType.loadSlide() - error loading:', self.model.get('filename'));

                self.$el.idle().append(
                    self.createNotificationNode(gt('Sorry, the video could not be played.'))
                );
            });

            source.attr({ 'data-src': _.unescapeHTML(previewUrl), type: contentType });
            video.append(source, fallback);

            this.$el.empty().append(video, caption);
            return this;
        },

        /**
         * "Prefetches" the video slide.
         * In order to save memory and network bandwidth videos are not prefetched.
         *
         * @returns {VideoView}
         *  the VideoView instance.
         */
        prefetch: function () {
            //console.warn('VideoView.prefetch()', this.model.get('filename'));
            return this;
        },

        /**
         * "Shows" the video slide by transferring the video source from the 'data-src'
         *  to the 'src' attribute of the <source> HTMLElement.
         *
         * @returns {VideoView}
         *  the VideoView instance.
         */
        show: function () {
            //console.warn('VideoView.show()', this.model.get('filename'));

            var video = this.$el.find('video.viewer-displayer-video'),
                videoSource = video.find('source');

            if ((video.length > 0) && (videoSource.length > 0)) {
                this.$el.busy();
                this.$el.find('div.viewer-displayer-notification').remove();
                videoSource.attr('src', videoSource.attr('data-src'));
                video[0].load(); // reset and start selecting and loading a new media resource from scratch
            }

            return this;
        },

        /**
         * "Unloads" the video slide by replacing the src attribute of
         * the <source> element to an empty String.
         *
         * @returns {VideoView}
         *  the VideoView instance.
         */
        unload: function () {
            //console.warn('VideoView.unload()', this.model.get('filename'));

            var video = this.$el.find('video.viewer-displayer-video');

            // never unload slide duplicates
            if (!this.$el.hasClass('swiper-slide-duplicate') && video.length > 0) {
                video[0].pause();
                video.addClass('player-hidden');
                video.find('source').attr('src', '');
            }

            return this;
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            //console.warn('ImageView.disposeView()', this.model.get('filename'));

            var video = this.$el.find('video.viewer-displayer-video');
            // remove event listeners from video and source element
            video.off().find('source').off();
        }

    });

    // returns an object which inherits BaseView
    return VideoView;
});
