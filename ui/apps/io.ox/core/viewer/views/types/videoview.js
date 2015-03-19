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
    /**
     * Default file type for OX Viewer. Displays a generic file icon
     * and the file name. This type acts as a fallback in cases if the
     * current file is not supported by OX Viewer.
     *
     * Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function render();
     *    function load();
     *    function unload();
     * }
     *
     */
    var VideoView = BaseView.extend({

        initialize: function () {
            //console.warn('VideoView.initialize()');
        },

        /**
         * Creates and renders a video slide.
         *
         * @returns {VideoView}
         *  the VideoView instance.
         */
        render: function () {
            //console.warn('VideoView.render()');

            var video,
                previewUrl = this.model.getPreviewUrl() || '',
                contentType = this.model.get('contentType') || '',
                caption = this.createCaption();

            // remove content of the slide duplicates
            if (this.$el.hasClass('swiper-slide-duplicate')) {
                this.$el.empty();
            }

            video = $('<video controls="true" class="viewer-displayer-item viewer-displayer-video player-hidden">').append(
                    $('<source>').attr({ 'data-src': _.unescapeHTML(previewUrl), type: contentType }),
                    $('<div>').text(gt('Your browser does not support HTML5 video.'))
            );

            this.$el.append(video, caption);
            return this;
        },

        /**
         * "Loads" a video slide by transferring the video source from the 'data-src'
         *  to the 'src' attribute of the <source> HTMLElement.
         *
         * @returns {VideoView}
         *  the VideoView instance.
         */
        load: function () {
            //console.warn('VideoView.load()', this.model.get('filename'));
            var videoToLoad = this.$el.find('video'),
                videoSource = videoToLoad.find('source'),
                self = this;

            if ((videoToLoad.length === 0) || (videoSource.length === 0) || (videoSource.attr('src'))) { return; }

            // register play handler, use 'onloadeddata' because 'oncanplay' is not always triggered on Firefox
            videoToLoad[0].onloadeddata = function () {
                self.$el.idle();
                videoToLoad.removeClass('player-hidden');
                //console.warn('VideoType.loadSlide()-- onloadeddata --', self.model.get('filename'));
            };

            // register error handler
            videoSource[0].onerror = function (e) {
                console.warn('VideoType.loadSlide() - error loading:', self.model.get('filename'), e.target.src);
                var notification = self.createNotificationNode(self.model, gt('Sorry, the video could not be played.'));
                self.$el.idle().append(notification);
            };

            this.$el.busy();
            this.$el.find('div.viewer-displayer-notification').remove();
            videoSource.attr('src', videoSource.attr('data-src'));
            videoToLoad[0].load(); // reset and start selecting and loading a new media resource from scratch

            return this;
        },

        /**
         * Unloads a video slide by replacing the src attribute of
         * the source element to an empty String.
         *
         * @returns {VideoView}
         *  the VideoView instance.
         */
        unload: function () {
            //console.warn('VideoView.unload()', this.model.get('filename'));
            var videoToUnLoad = this.$el.find('video'),
                videoSource = videoToUnLoad.find('source');

            // never unload slide duplicates
            if (!this.$el.hasClass('swiper-slide-duplicate') && videoToUnLoad.length > 0) {
                videoToUnLoad[0].pause();
                videoToUnLoad.addClass('player-hidden');
                videoSource.attr('src', '');
            }
        },

        /**
         * Destructor function of this view.
         *
         * @returns {VideoView}
         *  the VideoView instance.
         */
        disposeView: function () {
            //console.warn('ImageView.disposeView()');

            return this;
        }

    });

    // returns an object which inherits BaseView
    return VideoView;
});
