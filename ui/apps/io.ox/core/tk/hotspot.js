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

define('io.ox/core/tk/hotspot', [
], function () {

    'use strict';

    function getBounds(elem) {
        var o = elem.offset();
        o.width = elem.outerWidth();
        o.height = elem.outerHeight();
        o.availableWidth = $(window).width();
        o.availableHeight = $(window).height();
        o.right = o.availableWidth - o.width - o.left;
        o.bottom = o.availableHeight - o.height - o.top;
        return o;
    }

    return {

        listening: false,

        add: function (selector, options) {
            if (!selector) return;
            options = _.extend({ top: 0, left: 0, tooltip: '', selector: selector }, options);
            // get a fresh node
            var hotspot = $('<div class="hotspot">').data('options', options);
            if (options.tooltip) hotspot.tooltip({ placement: 'auto top', title: options.tooltip });
            $('body').append(this.position(hotspot, options));
            this.register();
        },

        position: function (hotspot, options) {
            var elem = $(options.selector).filter(':visible');
            if (!elem.length) return elem;
            var bounds = getBounds(elem);
            return hotspot.css({
                top: bounds.top - 4 + options.top,
                left: (bounds.left || (bounds.width / 2 >> 0)) - 4 + options.left
            });
        },

        reposition: function () {
            var self = this;
            $('.hotspot').each(function () {
                var node = $(this), options = node.data('options');
                self.position(node, options);
            });
        },

        removeAll: function () {
            $('.hotspot').remove();
            this.deregister();
        },

        register: function () {
            if (this.listening) return;
            this.onResize = this.onResize || _.debounce(this.reposition.bind(this), 100);
            this.listening = true;
            $(window).on('resize.hotspot', this.onResize);
        },

        deregister: function () {
            if (!this.listening) return;
            this.listening = false;
            $(window).off('resize.hotspot', this.onResize);
        }
    };

});
