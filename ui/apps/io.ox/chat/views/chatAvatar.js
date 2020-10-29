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
