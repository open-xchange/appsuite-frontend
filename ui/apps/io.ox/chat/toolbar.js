/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2021 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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
