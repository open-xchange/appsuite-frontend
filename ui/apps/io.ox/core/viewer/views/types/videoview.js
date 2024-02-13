/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/viewer/views/types/videoview', [
    'io.ox/core/viewer/views/types/baseview',
    'gettext!io.ox/core'
], function (BaseView, gt) {

    'use strict';

    /**
     * The video file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function render();
     *    function prefetch();
     *    function show();
     *    function unload();
     * }
     *
     */
    var VideoView = BaseView.extend({

        initialize: function () {
            this.isPrefetched = false;
        },

        /**
         * Creates and renders the video slide.
         *
         * @returns {VideoView}
         *  the VideoView instance.
         */
        render: function () {

            var video = $('<video controls="true" disablepictureinpicture="true" controlslist="nodownload" class="viewer-displayer-item viewer-displayer-video player-hidden">'),
                previewUrl = this.getPreviewUrl() || '',
                contentType = this.model.get('file_mimetype') || '';

            // remove event listeners from video element before removing it from the DOM
            this.$el.find('video').off();
            this.$el.empty().append(
                video.append(
                    $('<div>').text(gt('Your browser does not support the video format of this file.'))
                )
            );

            // register play handler, use 'loadeddata' because 'canplay' is not always triggered on Firefox
            video.on({
                'loadeddata': this.onLoadedData.bind(this),
                'error': this.onError.bind(this)
            });

            video.attr({ 'data-src': _.unescapeHTML(previewUrl), type: contentType });

            return this;
        },

        /**
         * Video data load handler
         */
        onLoadedData: function () {
            this.$el.idle().find('.viewer-displayer-video').removeClass('player-hidden');
            this.$el.find('video')[0].play();
        },

        /**
         * Video load error handler
         */
        onError: function () {
            this.$el.idle().find('.viewer-displayer-video').addClass('player-hidden');
            this.$el.find('div.viewer-displayer-notification').remove();
            this.$el.find('.viewer-displayer-audio-video-placeholder').remove();
            this.$el.append(
                this.displayDownloadNotification(
                    gt('Error while playing the video. Either your browser does not support the format or you have connection problems.')
                )
            );
        },

        /**
         * "Prefetches" the video slide.
         * In order to save memory and network bandwidth videos are not prefetched.
         *
         * @returns {VideoView}
         *  the VideoView instance.
         */
        prefetch: function () {
            this.isPrefetched = true;
            return this;
        },

        /**
         * "Shows" the video slide by transferring the video source from the 'data-src'
         *  to the 'src' attribute.
         *
         * @returns {VideoView}
         *  the VideoView instance.
         */
        show: function () {

            var self = this,
                video = this.$el.find('video'),
                placeholder = this.$el.find('div.viewer-displayer-notification');

            if (video.length > 0 && placeholder.length < 1) {
                placeholder = this.createNotificationNode(
                    gt('Start video'),
                    'fa-play-circle-o'
                );
                this.$el.append(placeholder).one('click', function () {
                    self.$el.busy().find('div.viewer-displayer-notification').remove();
                    video.attr('src', video.attr('data-src'));
                    video[0].load(); // reset and start selecting and loading a new media resource from scratch
                });
            }

            return this;
        },

        /**
         * "Unloads" the video slide by removing the src attribute from
         * the video element and calling load() again.
         *
         * @returns {VideoView}
         *  the VideoView instance.
         */
        unload: function () {
            this.disposeElement();
            this.isPrefetched = false;
            return this;
        },

        // work around for Chrome bug #234779, HTML5 video request stay pending (forever)
        // https://code.google.com/p/chromium/issues/detail?id=234779
        disposeElement: function () {
            var element = this.$el.find('video');
            if (element.length === 0) return;
            this.$el.find('.viewer-displayer-video').addClass('player-hidden');
            element[0].pause();
            element.removeAttr('src');
            element[0].load();
        },

        /**
         * Destructor function of this view.
         */
        onDispose: function () {
            // remove event listeners from video element
            this.$el.find('video').off();
            this.$el.find('viewer-displayer-audio-video-placeholder').off();
            this.disposeElement();
        }

    });

    // returns an object which inherits BaseView
    return VideoView;
});
