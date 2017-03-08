/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/viewer/views/types/textview', [
    'io.ox/core/viewer/views/types/baseview',
    'gettext!io.ox/core'
], function (BaseView, gt) {

    'use strict';

    var TextView = BaseView.extend({

        initialize: function (options) {
            _.extend(this, options);
            this.isPrefetched = false;
            this.xhr = null;
            this.listenTo(this.viewerEvents, 'viewer:zoom:in', this.onZoomIn);
            this.listenTo(this.viewerEvents, 'viewer:zoom:out', this.onZoomOut);
            this.$el.on('scroll', _.throttle(this.onScrollHandler.bind(this), 500));
        },

        render: function () {
            // handle zoom events
            this.size = 13;
            // quick hack to get rid of flex box
            this.$el.empty().css('display', 'block');
            // run own disposer function on dispose event from DisposableView
            this.on('dispose', this.disposeView.bind(this));
            return this;
        },

        /**
         * data load handler
         */
        onDataLoaded: function (text) {
            var filesize = this.model.get('file_size');
            // work around for large files in drive, no content is provided and also no error
            if (_.isNumber(filesize) && (filesize > 0) && _.isEmpty(text)) {
                this.onError();
            } else {
                this.$el.idle();
                this.$el.addClass('swiper-no-swiping').append(
                    $('<div class="white-page letter plain-text">').text(text)
                );
            }
        },

        /**
         * load error handler
         */
        onError: function () {
            this.displayNotification(gt('Sorry, there is no preview available for this file.'));
        },

        /**
         * "Prefetches" the text file
         *
         * @param {Object} options
         *  @param {Object} options.version
         *      an alternate version than the current version.
         *
         * @returns {TextView}
         *  the TextView instance.
         */
        prefetch: function (options) {
            // simply load the document content via $.ajax
            var previewUrl = this.getPreviewUrl(options);

            this.$el.busy();
            this.xhr = $.ajax({ url: previewUrl, dataType: 'text', context: this }).done(this.onDataLoaded).fail(this.onError);

            this.isPrefetched = true;
            return this;
        },

        /**
         * "Shows" the text file.
         * For text files all work is already done in prefetch()
         *
         * @returns {TextView}
         *  the TextView instance.
         */
        show: function () {
            return this;
        },

        /**
         * Unloads the text file
         *
         * @returns {TextView}
         *  the TextView instance.
         */
        unload: function () {
            // never unload slide duplicates
            if (!this.$el.hasClass('swiper-slide-duplicate')) {
                this.$el.find('.white-page').remove();
                this.isPrefetched = false;
            }

            return this;
        },

        setFontSize: function (value) {
            this.size = Math.min(Math.max(value, 9), 21);
            this.$('.white-page').css('fontSize', this.size);
        },

        onZoomIn: function () {
            this.setFontSize(this.size + 2);
        },

        onZoomOut: function () {
            this.setFontSize(this.size - 2);
        },

        /**
         *  Scroll event handler:
         *  -blends in navigation controls.
         */
        onScrollHandler: function () {
            this.viewerEvents.trigger('viewer:blendnavigation');
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            // abort AJAX request
            if (this.xhr) {
                this.xhr.abort();
                this.xhr = null;
            }
        }

    });

    return TextView;
});
