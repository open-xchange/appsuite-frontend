/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/views/empty', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/util',
    'gettext!io.ox/chat'
], function (DisposableView, util, gt) {

    'use strict';

    function button(cmd, icon, text) {
        return $('<button type="button" class="btn btn-link">')
            .attr({ 'data-cmd': cmd, 'aria-label': text })
            .append(
                $('<div class="btn-round">').append(util.svg({ icon: icon }).attr('title', text)),
                $.txt(text)
            );
    }

    return DisposableView.extend({

        render: function () {
            this.$el.append(
                $('<div class="start-chat abs">').append(
                    $('<div class="center empty-view">').append(
                        button('start-private-chat', 'fa-user', gt('Create private chat')),
                        button('edit-group-chat', 'fa-group', gt('Create group chat')),
                        button('edit-group-chat', 'fa-hashtag', gt('Create channel')).attr('data-type', 'channel')
                    )
                )
            );
            return this;
        }
    });
});
