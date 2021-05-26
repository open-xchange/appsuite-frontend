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

define('io.ox/chat/views/chatAvatar', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/avatar',
    'io.ox/chat/views/groupAvatar',
    'io.ox/switchboard/presence'
], function (DisposableView, AvatarView, GroupAvatarView, presence) {

    'use strict';

    var ChatAvatarView = DisposableView.extend({

        className: 'chat-avatar',

        render: function () {
            this.$el.attr('aria-hidden', true);
            switch (this.model.get('type')) {
                case 'private': this.renderPrivateChat(); break;
                case 'group': this.renderGroupChat(); break;
                case 'channel': this.renderGroupChat(); break;
                // no default
            }
            return this;
        },

        renderPrivateChat: function () {
            var model = this.model.getFirstMember();
            this.$el.append(
                new AvatarView({ model: model }).render().$el,
                presence.getPresenceIcon(model.get('email'))
            );
        },

        renderGroupChat: function () {
            this.$el.append(
                new GroupAvatarView({ model: this.model }).render().$el
            );
        }

    });

    return ChatAvatarView;
});
