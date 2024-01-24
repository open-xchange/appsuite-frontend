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

define('io.ox/core/tk/sidebar', [], function () {

    'use strict';

    return {

        //
        // Add a generic side-bar to the UI
        // Stays visible across all apps
        //
        // options:
        // side: 'left' or 'right'
        // sidebar: [optional] A DOM element to append as sidebar
        // target: [optional] The outer DOM element (defaults to #io-ox-windowmanager)
        // visible: true/false Sets the initial state
        //
        // The sidebar responds to the following DOM events:
        // - toggle-sidebar
        // - maximize-sidebar
        // - minimize-sidebar
        //
        add: function (options) {

            options = _.extend({ side: 'right', visible: true }, options);

            // ensure DOM element
            options.sidebar = options.sidebar || $('<div>');

            // ensure proper css classes
            options.sidebar.addClass('abs generic-sidebar scrollpane border-' + (options.side === 'left' ? 'right' : 'left'));

            // replace target node (default is indow manager) by sidebar container
            var container = $('<div class="abs generic-sidebar-container"><div class="abs generic-sidebar-content"></div></div>');
            var target = options.target || $('#io-ox-windowmanager');
            container.insertBefore(target);
            container.find('.generic-sidebar-content').append(target);

            // add sidebar
            container
                .on({ 'maximize-sidebar': maximize, 'minimize-sidebar': minimize, 'toggle-sidebar': toggle })
                .addClass('has-' + options.side + (options.visible ? ' visible' : ''))
                .append(options.sidebar);

            // respond to app:start/resume to minimize
            ox.on('app:start app:resume', function () {
                container.trigger('minimize-sidebar');
            });

            // for easy debugging
            window.sidebar = container;
        }
    };

    function maximize() {
        $(this).addClass('visible maximize');
    }

    function minimize() {
        $(this).removeClass('maximize');
    }

    function toggle(e, state) {
        $(this).toggleClass('visible', state);
    }

    //
    // HOW TO
    //
    // Add a sidebar:
    // require(['io.ox/core/tk/sidebar'], function (sidebar) { sidebar.add(); });
    //
    // Toggle, maximize, minimize can be triggered from the sidebar as the DOM events bubble up
    // Either inspect the element and use $($0) in console OR use debugging shorthand window.sidebar
    //
    // sidebar.trigger('toggle-sidebar');
    // sidebar.trigger('maximize-sidebar');
    // sidebar.trigger('minimize-sidebar');
});
