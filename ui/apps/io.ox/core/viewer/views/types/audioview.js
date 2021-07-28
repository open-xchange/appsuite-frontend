/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/viewer/views/types/audioview', [
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
     *    function prefetch();
     *    function show();
     *    function unload();
     * }
     *
     */
    var AudioView = BaseView.extend({

        initialize: function () {
            this.isPrefetched = false;
        },

        /**
         * Creates and renders the audio slide.
         *
         * @returns {AudioView}
         *  the AudioView instance.
         */
        render: function () {

            var mimeType = this.model.getMimeType() || '',
                audioUrl = this.getPreviewUrl() || '',
                self = this,
                coverUrl = FilesAPI.getUrl(this.model.toJSON(), 'cover', { width: 280, height: 280 });

            // remove event listeners from audio element before removing it from the DOM
            this.$el.find('audio').off();
            this.$el.empty().append(
                $('<div class="viewer-displayer-item viewer-displayer-audio player-hidden">').append(
                    // play button
                    $('<i class="play-button fa fa-play-circle-o">'),
                    $('<div class="player-text">').text(gt('Click to play audio file')),
                    // cover
                    $('<img class="cover">')
                        // we don't know if the cover url is valid or not until we load it from the server
                        .one({
                            load: function () {
                                self.$el.find('.play-button').addClass('cover');
                                self.$el.find('.player-text').remove();
                            },
                            error: function () {
                                $(this).remove();
                            }
                        })
                        .attr('data-src', _.unescapeHTML(coverUrl)),
                    // audio element
                    $('<audio controls="true">')
                        // set preload (and do a dance); see https://code.google.com/p/chromium/issues/detail?id=234779
                        .attr('preload', _.device('chrome') ? 'none' : 'auto')
                        .append(
                            $('<div>').text(gt('Your browser does not support the audio format of this file.'))
                        )
                        // register play handler, use 'loadeddata' because 'canplay' is not always triggered on Firefox
                        .on({
                            'loadeddata': this.onLoadedData.bind(this),
                            'error': this.onError.bind(this)
                        })
                        .attr({ 'data-src': _.unescapeHTML(audioUrl), 'type': mimeType })
                        .hide()
                )
            );

            return this;
        },

        /**
         * Audio data load handler
         */
        onLoadedData: function () {
            this.$el.find('.play-button,.player-text').remove();
            this.$el.find('audio').show()[0].play();
        },

        /**
         * Audio load error handler
         */
        onError: function () {
            this.$el.idle().find('.viewer-displayer-audio').addClass('player-hidden');
            this.$el.find('div.viewer-displayer-notification,play-button,.player-text').remove();
            this.$el.append(
                this.displayDownloadNotification(gt('Your browser does not support the audio format of this file.'))
            );
        },

        /**
         * Play button click handler
         */
        onPlay: function () {
            var audio = this.$el.find('audio');

            this.$el.find('.play-button').empty().busy();
            audio.attr('src', audio.attr('data-src'));
            audio[0].load();
        },

        /**
         * "Prefetches" the audio slide.
         * In order to save memory and network bandwidth audio files are not prefetched.
         *
         * @returns {AudioView}
         *  the AudioView instance.
         */
        prefetch: function () {
            this.isPrefetched = true;
            return this;
        },

        /**
         * "Shows" the audio slide by transferring the audio and the cover source
         * from the 'data-src' to the 'src' attribute.
         *
         * @returns {AudioView}
         *  the AudioView instance.
         */
        show: function () {
            var audio = this.$el.find('audio');
            var cover = this.$el.find('img.cover');

            if ((audio.length > 0)) {
                this.$el.find('div.viewer-displayer-notification').remove();
                this.$el.idle().find('.viewer-displayer-audio').removeClass('player-hidden');

                this.$el.find('.play-button').one('click', this.onPlay.bind(this));
                cover.attr('src', cover.attr('data-src'));
            }

            return this;
        },

        /**
         * "Unloads" the audio slide by removing the src attribute from
         * the audio element and calling load() again.
         *
         * @returns {AudioView}
         *  the AudioView instance.
         */
        unload: function () {
            this.disposeElement();
            this.isPrefetched = false;
            return this;
        },

        // work around for Chrome bug #234779, HTML5 video request stay pending (forever)
        // https://code.google.com/p/chromium/issues/detail?id=234779
        disposeElement: function () {
            var element = this.$el.find('audio');
            if (element.length === 0) return;
            this.$el.find('.viewer-displayer-audio').addClass('player-hidden');
            element[0].pause();
            element.removeAttr('src');
            element[0].load();
        },

        /**
         * Destructor function of this view.
         */
        onDispose: function () {
            // remove event listeners from audio element and cover image
            this.$el.find('audio, img.cover, .play-button').off();
            this.disposeElement();
        }

    });

    // returns an object which inherits BaseView
    return AudioView;
});
