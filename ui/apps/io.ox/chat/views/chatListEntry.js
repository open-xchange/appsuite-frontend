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
    'io.ox/chat/events',
    'io.ox/core/strings',
    'io.ox/chat/util',
    'io.ox/switchboard/presence',
    'settings!io.ox/chat'
], function (ChatAvatar, data, events, strings, util, presence, settings) {

    var densitySetting = settings.get('density', 'default');
    settings.on('change:density', function (value) {
        densitySetting = value;
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

        initialize: function (options) {

            options = _.extend({ showTyping: true }, options);
            // this might be defined to overrule the user setting, e.g. during search
            if (options.density) this.getDensity = _.constant(options.density);

            this.lastMessage = this.getLastMessage();
            this.listenTo(this.model, {
                'change:title': this.onChangeTitle,
                'change:unreadCount': this.onChangeUnreadCount,
                'change:lastMessage': this.onChangeLastMessage
            });

            this.applyDensity();
            this.listenTo(settings, 'change:density', this.applyDensity);

            if (options.showTyping !== false) {
                this.listenTo(events, 'typing:' + this.model.id + ':summary', function (summary) {
                    switch (this.getDensity()) {
                        case 'compact':
                        case 'default':
                            if (this.model.isPrivate()) {
                                this.$('.title').text(summary.text || this.model.getTitle());
                            } else {
                                this.$('.title').empty().append(
                                    this.model.getTitle(),
                                    $('<span class="typing">').text(summary.text)
                                );
                            }
                            break;
                        case 'detailed':
                            this.$('.last-message').empty().text(
                                summary.text ? summary.text : this.model.getLastMessageText()
                            );
                            break;
                        // no default
                    }
                });
            }
        },

        getDensity: function () {
            return densitySetting;
        },

        applyDensity: function () {
            this.$el
                .removeClass('density-compact density-detailed density-default')
                .addClass('density-' + this.getDensity());
            this.render();
        },

        getLastMessage: function () {
            return new data.MessageModel(_.extend({ roomId: this.model.get('roomId') }, this.model.get('lastMessage')));
        },

        render: function () {
            this.$el.empty().toggleClass('unseen', this.model.get('unreadCount') > 0);
            switch (this.getDensity()) {
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
                        $('<div class="last-message ellipsis">').text(this.model.getLastMessageText()),
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
            // var model = this.model;
            //     isPrivate = model.get('type') === 'private',
            //     isCurrentUser = model.get('lastMessage').sender === data.user.email,
            //     lastMessage = this.getLastMessage(),
            //     isSystemMessage = lastMessage ? lastMessage.type === 'system' : false;
            // this.lastMessage = lastMessage;
            this.$('.last-modified').text(this.model.getLastMessageDate());
            this.$('.last-message').text(this.model.getLastMessageText());
            // this.$('.delivery')
            //     .toggleClass('hidden', !isCurrentUser)
            //     .removeClass('server received seen')
            //     .addClass(isCurrentUser ? util.getDeliveryStateClass(model.get('lastMessage').deliveryState) : '');
            // this.$('.sender')
            //     .toggleClass('hidden', isCurrentUser || isPrivate || isSystemMessage)
            //     .text(model.getLastSenderName() + ':');
        }
    });

    return ChatListEntryView;
});
