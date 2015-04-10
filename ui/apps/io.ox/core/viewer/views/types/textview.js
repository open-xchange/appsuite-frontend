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
    'io.ox/core/viewer/views/types/baseview',
    'io.ox/core/viewer/eventdispatcher'
], function (BaseView, EventDispatcher) {

    'use strict';

    var TextView = BaseView.extend({

        render: function () {
            // handle zoom events
            this.size = 13;
            this.on('dispose', function () {
                EventDispatcher.off('viewer:document:zoomin viewer:document:zoomout');
            });
            EventDispatcher.on('viewer:document:zoomin', this.zoomIn.bind(this));
            EventDispatcher.on('viewer:document:zoomout', this.zoomOut.bind(this));
            // quick hack to get rid of flex box
            this.$el.css('display', 'block');
            return this;
        },

        prefetch: function () {
            // this only works for files
            var model = this.model.get('origData');
            if (!model) return;
            // simply load the document content via $.ajax
            var $el = this.$el.busy();
            $.ajax({ url: model.getUrl('view'), dataType: 'text' }).done(function (text) {
                $el.idle().append($('<div class="plain-text-page">').text(text));
                $el = model = null;
            });
            return this;
        },

        show: function () {
            return this;
        },

        setFontSize: function (value) {
            this.size = Math.min(Math.max(value, 9), 21);
            this.$('.plain-text-page').css('fontSize', this.size);
        },

        zoomIn: function () {
            this.setFontSize(this.size + 2);
        },

        zoomOut: function () {
            this.setFontSize(this.size - 2);
        }
    });

    return TextView;
});
