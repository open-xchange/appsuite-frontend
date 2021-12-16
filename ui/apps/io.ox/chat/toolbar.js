/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/chat/toolbar', [
    'io.ox/chat/util',
    'gettext!io.ox/chat'
], function (util, gt) {

    'use strict';

    return {

        back: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="button" draggable="false" tabindex="-1" data-cmd="close-chat">')
                .attr('aria-label', gt('Close chat'))
                .append(
                    util.svg({ icon: 'fa-chevron-left' }).attr('title', gt('Close chat')),
                    $.txt(' ' + gt('Chats'))
                )
            );
        },

        detach: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="button" draggable="false" tabindex="-1" data-cmd="switch-to-floating">')
                .attr('aria-label', gt('Detach window'))
                .append(
                    util.svg({ icon: 'fa-window-maximize' }).attr('title', gt('Detach window'))
                )
            );
        }
    };
});
