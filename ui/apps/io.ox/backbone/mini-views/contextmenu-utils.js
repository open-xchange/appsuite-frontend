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

define('io.ox/backbone/mini-views/contextmenu-utils', [
], function () {

    'use strict';

    //
    // drawing utility functions
    //
    function a(action, text) {
        return $('<a href="#" role="menuitem" tabindex="-1">')
            .attr('data-action', action).text(text)
            // always prevent default
            .on('click', $.preventDefault);
    }

    function disable(node) {
        return node.attr('aria-disabled', true).removeAttr('tabindex').addClass('disabled');
    }

    function addLink(node, options) {
        var link = a(options.action, options.text);
        if (options.enabled) link.on('click', options.data, options.handler); else disable(link);
        node.append($('<li role="presentation">').append(link));
        return link;
    }

    function divider() {
        this.append(
            $('<li class="divider" role="separator">')
        );
    }

    function header(label) {
        this.append(
            $('<li class="dropdown-header" role="presentation" aria-hidden="true">').text(label)
        );
    }

    var api = {
        a: a,
        disable: disable,
        addLink: addLink,
        divider: divider,
        header: header,
        /**
         * Will add 'isKeyboardEvent' attribute to the event if triggered by Shift-F10 on macOS
         */
        macOSKeyboardHandler: function macOSKeyboardContextMenuHandler(e) {
            // manually trigger contextmenu on macos when using keyboard navigation
            var shiftF10 = (e.shiftKey && e.which === 121);

            if (_.device('macos') && shiftF10) {
                e.isKeyboardEvent = true;
            }
        },
        /**
         * Check if a contextmenu event is most likely triggered via keyboard.
         * This helps to determine if contextmenu position needs manual calculation.
         * As the keyboard handler for macos, this function will add 'isKeyboardEvent'
         * attribute to the event on positive detection.
         */
        checkKeyboardEvent: function checkKeyboardEvent(e) {
            if (_.device('macos || !desktop')) return;

            if ((_.device('chrome || firefox')) && e.button === 0) {
                e.isKeyboardEvent = true;
            } else if (_.device('ie') && e.pageX === 0 && e.pageY === 0) {
                e.isKeyboardEvent = true;
            }
        },
        /**
         * Calculate the desired position for a given contextmenu event.
         * Takes keyboard events into account.
         */
        positionForEvent: function positionForEvent(e) {
            api.checkKeyboardEvent(e);
            var target, top, left, targetOffset;

            if (e.isKeyboardEvent) {
                // for keyboardEvent
                target = $(document.activeElement);
                targetOffset = target.offset();
                top = targetOffset.top;
                // open at the mid from the list
                left = targetOffset.left + (target.width() / 2);
            } else {
                // for mouseEvent
                target = $(e.currentTarget);
                top = e.pageY - 20;
                left = e.pageX + 30;
            }

            return { target: target, top: top, left: left };
        },

        // Check if clicked below the list entries in the outside-list area.
        checkEventTargetOutsideList: function (e) {
            // target when clicking in a empty folder
            var emptyList = $(e.target).hasClass('abs notification');
            // target when clicked below a list
            var areaBelowList = $(e.target).is('ul');

            return areaBelowList || emptyList;
        }

    };

    return api;
});
