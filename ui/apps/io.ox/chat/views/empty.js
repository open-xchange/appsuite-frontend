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
