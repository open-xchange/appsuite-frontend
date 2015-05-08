/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/viewer/views/types/textview', [
    'io.ox/core/viewer/views/types/baseview'
], function (BaseView) {

    'use strict';

    var TextView = BaseView.extend({

        initialize: function (options) {
            _.extend(this, options);
            this.listenTo(this.displayerEvents, 'viewer:zoomin', this.onZoomIn);
            this.listenTo(this.displayerEvents, 'viewer:zoomout', this.onZoomOut);
            this.$el.on('scroll', _.throttle(this.onScrollHandler.bind(this), 500));
        },

        render: function () {
            // handle zoom events
            this.size = 13;
            // quick hack to get rid of flex box
            this.$el.empty().css('display', 'block');
            return this;
        },

        prefetch: function () {
            // simply load the document content via $.ajax
            var $el = this.$el.busy(),
                previewUrl = this.getPreviewUrl();
            $.ajax({ url: previewUrl, dataType: 'text' }).done(function (text) {
                $el.idle().append($('<div class="plain-text-page">').text(text));
                $el = null;
            });
            return this;
        },

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
            this.$el.find('.plain-text-page').remove();
            return this;
        },

        setFontSize: function (value) {
            this.size = Math.min(Math.max(value, 9), 21);
            this.$('.plain-text-page').css('fontSize', this.size);
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
            this.displayerEvents.trigger('viewer:blendnavigation');
        }

    });

    return TextView;
});
