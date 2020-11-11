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
    'io.ox/chat/util',
    'io.ox/switchboard/presence',
    'settings!io.ox/chat'
], function (ChatAvatar, data, strings, sanitizer, util, presence, settings) {

    var density = settings.get('density', 'default');
    settings.on('change:density', function (value) {
        density = value;
    });

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
            this.lastMessage = this.getLastMessage();
            this.listenTo(this.model, {
                'change:title': this.onChangeTitle,
                'change:unreadCount': this.onChangeUnreadCount,
                'change:lastMessage': this.onChangeLastMessage
            });
            this.listenTo(settings, 'change:density', this.applyDensity);
            this.applyDensity();
        },

        applyDensity: function () {
            this.$el
                .removeClass('density-compact density-detailed density-default')
                .addClass('density-' + density);
            this.render();
        },

        getLastMessage: function () {
            return new data.MessageModel(_.extend({ roomId: this.model.get('roomId') }, this.model.get('lastMessage')));
        },

        renderSender: function () {
            if (this.lastMessage.isMyself() || this.model.isPrivate() || this.lastMessage.isSystem()) return;
            return $('<span class="sender">').text(this.model.getLastSenderName() + ':');
        },

        renderLastMessage: function () {
            if (!this.lastMessage) return $.txt('\u00a0');
            if (this.lastMessage.isFile()) return util.renderFile({ model: this.lastMessage });
            if (this.lastMessage.isSystem()) return this.lastMessage.getSystemMessage();
            return [this.renderSender(), $.txt(sanitizer.simpleSanitize(this.lastMessage.get('content')))];
        },

        render: function () {
            this.$el.empty().toggleClass('unseen', this.model.get('unreadCount') > 0);
            switch (density) {
                case 'compact': this.renderCompact(); break;
                case 'detailed': this.renderDetailed(); break;
                default: this.renderDefault(); break;
            }
            return this;
        },

        renderCompact: function () {
            this.$el.append(
                this.renderSimpleAvatar(),
                $('<div class="chats-container">').append(
                    $('<div class="chats-row">').append(
                        this.renderTitle(),
                        this.renderUnread()
                    )
                )
            );
        },

        renderDefault: function () {
            this.$el.append(
                new ChatAvatar({ model: this.model }).render().$el,
                $('<div class="chats-container">').append(
                    $('<div class="chats-row">').append(
                        this.renderTitle(),
                        this.renderUnread()
                    )
                )
            );
        },

        renderDetailed: function () {
            this.$el.append(
                new ChatAvatar({ model: this.model }).render().$el,
                $('<div class="chats-container">').append(
                    $('<div class="chats-row">').append(
                        this.renderTitle(),
                        $('<div class="last-modified">').text(this.model.getLastMessageDate())
                    ),
                    $('<div class="chats-row">').append(
                        $('<div class="last-message ellipsis">').append(this.renderLastMessage()),
                        this.renderUnread()
                    )
                )
            );
        },

        renderSimpleAvatar: function () {
            var $el = $('<div class="simple-avatar">');
            switch (this.model.get('type')) {
                case 'private': $el.append(this.renderPresenceIcon()); break;
                case 'group': $el.append('<i class="fa fa-users" aria-hidden="true">'); break;
                case 'channel': $el.append('<i class="fa fa-hashtag" aria-hidden="true">'); break;
                // no default
            }
            return $el;
        },

        renderPresenceIcon: function () {
            var model = this.model.getFirstMember();
            return model && presence.getPresenceIcon(model.get('email'));
        },

        renderTitle: function () {
            return $('<div class="title">').text(this.model.getTitle());
        },

        renderUnread: function () {
            return $('<div class="unread-count">').text(this.model.get('unreadCount'));
        },

        onChangeTitle: function () {
            this.$('.title').text(this.model.getTitle() || '\u00A0');
        },

        onChangeUnreadCount: function () {
            var count = this.model.get('unreadCount');
            this.$el.toggleClass('unseen', count > 0).find('.unread-count').text(count);
        },

        onChangeLastMessage: function () {
            var model = this.model,
                isPrivate = model.get('type') === 'private',
                isCurrentUser = model.get('lastMessage').sender === data.user.email,
                lastMessage = this.getLastMessage(),
                isSystemMessage = lastMessage ? lastMessage.type === 'system' : false;

            this.lastMessage = lastMessage;

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
