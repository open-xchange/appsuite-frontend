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
    'io.ox/chat/data',
    'io.ox/core/strings',
    'io.ox/mail/sanitizer',
    'io.ox/chat/util'
], function (ChatAvatar, data, strings, sanitizer, util) {

    var ChatListEntryView = Backbone.View.extend({

        tagName: 'li',
        attributes: function () {
            if (!this.model.get('roomId')) {
                var member = this.model.getFirstMember();
                return {
                    tabindex: -1,
                    role: 'option',
                    'data-cmd': 'open-private-chat',
                    'data-email': member.get('email1') || member.get('email2') || member.get('email3'),
                    'data-cid': this.model.cid
                };
            }

            return {
                tabindex: -1,
                role: 'option',
                'data-cmd': 'show-chat',
                'data-cid': this.model.get('roomId') || this.model.cid,
                'data-message-id': this.model.get('searchResult') ? this.model.get('lastMessage').messageId : undefined
            };
        },

        initialize: function () {
            if (this.lastMessage) {
                this.lastMessage = this.model.lastMessage || this.model.get('lastMessage');
                if (!this.lastMessage.isFile) this.lastMessage = new data.MessageModel(this.lastMessage);
            }

            this.listenTo(this.model, {
                'change:title': this.onChangeTitle,
                'change:unreadCount': this.onChangeUnreadCount,
                'change:lastMessage': this.onChangeLastMessage
            });
        },

        renderSender: function () {
            if (this.lastMessage.isMyself() || this.model.isPrivate() || this.lastMessage.isSystem()) return;
            return $('<span class="sender">').text(this.model.getLastSenderName() + ':');
        },

        renderLastMessage: function () {
            if (!this.lastMessage) return '\u00a0';
            var content;

            if (this.lastMessage.isFile()) content = util.renderFile({ model: this.lastMessage });
            else if (this.lastMessage.isSystem()) content = this.lastMessage.getSystemMessage();
            else content = [this.renderSender(), $.txt(sanitizer.simpleSanitize(this.lastMessage.get('content')))];

            return [
                $('<div class="text-preview">').append(content),
                this.renderUnreadCount()
            ];
        },

        renderUnreadCount: function () {
            return $('<div class="label-container">').append(
                $('<span class="label label-info">').text(this.model.get('unreadCount'))
            );
        },

        render: function () {
            var model = this.model;

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
                            $('<div class="last-message">').append(
                                this.renderLastMessage()
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
                isPrivate = model.get('type') === 'private',
                isCurrentUser = model.get('lastMessage').sender === data.user.email,
                lastMessage = model.get('lastMessage') || {},
                isSystemMessage = lastMessage ? lastMessage.type === 'system' : false;

            this.lastMessage = lastMessage;
            if (!this.lastMessage.isFile) this.lastMessage = new data.MessageModel(this.lastMessage);
            this.$('.last-modified').text(model.getLastMessageDate());
            this.$('.last-message').empty().append(this.renderLastMessage());
            this.$('.delivery')
                .toggleClass('hidden', !isCurrentUser)
                .removeClass('server received seen')
                .addClass(isCurrentUser ? util.getDeliveryStateClass(model.get('lastMessage').deliveryState) : '');
            this.$('.sender')
                .toggleClass('hidden', isCurrentUser || isPrivate || isSystemMessage)
                .text(model.getLastSenderName() + ':');
        }

    });

    return ChatListEntryView;
});
