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

define('io.ox/core/tk/sidebar', [], function () {

    'use strict';

    return {

        //
        // Add a generic side-bar to the UI
        // Stays visible across all apps
        //
        // options:
        // side: 'left' or 'right'
        // $el: A DOM element to append
        //
        add: function (options) {

            options = _.extend({ side: 'right', visible: true }, options);

            // ensure DOM element
            options.$el = options.$el || $('<div>');

            // ensure proper css classes
            options.$el.addClass('abs generic-sidebar border-' + (options.side === 'left' ? 'right' : 'left'));

            // wrap window manager to introduce container element
            $('#io-ox-windowmanager').wrap('<div class="abs generic-sidebar-container"><div class="abs generic-sidebar-wrapper"></div></div>');

            // add sidebar
            var container = $('.generic-sidebar-container:last')
                .on({ maximize: maximize, minimize: minimize, toggle: toggle })
                .addClass('has-' + options.side + (options.visible ? ' visible' : ''))
                .append(options.$el);

            // respond to app:start/resume to minimize
            ox.on('app:start app:resume', function () {
                container.trigger('minimize');
            });
        }
    };

    function maximize() {
        $(this).addClass('visible maximize');
    }

    function minimize() {
        $(this).removeClass('maximize');
    }

    function toggle() {
        $(this).toggleClass('visible');
    }
});
