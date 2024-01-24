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

define('io.ox/core/tk/hotspot', [], function () {

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
