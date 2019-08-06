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

define('io.ox/chat/views/chatListEntry', [
    'io.ox/chat/views/chatAvatar',
    'io.ox/chat/data'
], function (ChatAvatar, data) {

    var ChatListEntryView = Backbone.View.extend({

        tagName: 'li',
        attributes: function () {
            if (!this.model.get('id')) {
                return {
                    'data-cmd': 'start-private-chat',
                    'data-id': this.model.getFirstMember().id
                };
            }

            return {
                'data-cmd': 'show-chat',
                'data-cid': this.model.get('id') || this.model.cid,
                'data-message-id': this.model.get('searchResult') ? this.model.get('lastMessage').id : undefined
            };
        },

        initialize: function () {
            this.listenTo(this.model, {
                'change:title': this.onChangeTitle,
                'change:unreadCount': this.onChangeUnreadCount,
                'change:lastMessage': this.onChangeLastMessage
            });
        },

        render: function () {
            var model = this.model,
                lastMessage = model.get('lastMessage'),
                isCurrentUser = lastMessage.senderId.toString() === data.user_id.toString(),
                isPrivate = model.get('type') === 'private',
                isSystemMessage = lastMessage.type === 'system';

            this.$el
                .empty()
                .toggleClass('unseen', model.get('unreadCount') > 0)
                .append(
                    new ChatAvatar({ model: model }).render().$el,
                    $('<div class="chats-container">').append(
                        $('<div class="chats-row">').append(
                            $('<div class="title">').text(model.getTitle()),
                            $('<div class="last-modified">').text(model.getLastMessageDate())
                        ),
                        $('<div class="chats-row">').append(
                            $('<div class="fa delivery">')
                                .toggleClass('hidden', !isCurrentUser || isSystemMessage)
                                .addClass(lastMessage.state),
                            $('<div class="sender">')
                                .toggleClass('hidden', isCurrentUser || isPrivate || isSystemMessage)
                                .text(model.getLastSenderName() + ':'),
                            $('<div class="text-preview">').append(model.getLastMessage()),
                            $('<div class="label-container">').append(
                                $('<span class="label label-info">').text(model.get('unreadCount'))
                            )
                        )
                    )
                );

            return this;
        },

        onChangeTitle: function () {
            this.$('.title').text(this.model.getTitle() || '\u00A0');
        },

        onChangeUnreadCount: function () {
            var count = this.model.get('unreadCount');
            this.$el.toggleClass('unseen', count > 0).find('.label').text(count);
        },

        onChangeLastMessage: function () {
            var model = this.model,
                isCurrentUser = model.get('lastMessage').senderId.toString() === data.user_id.toString(),
                isPrivate = model.get('type') === 'private';

            this.$('.last-modified').text(model.getLastMessageDate());
            this.$('.text-preview').empty().append(model.getLastMessage());
            this.$('.delivery')
                .toggleClass('hidden', !isCurrentUser)
                .removeClass('server client seen')
                .addClass(model.get('lastMessage').state);
            this.$('.sender')
                .toggleClass('hidden', isCurrentUser || isPrivate)
                .text(model.getLastSenderName());
        }

    });

    return ChatListEntryView;
});
