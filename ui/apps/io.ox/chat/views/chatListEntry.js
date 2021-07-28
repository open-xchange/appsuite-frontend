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
            if (this.model.get('searchDummy')) {
                var member = this.model.getFirstMember();
                return {
                    role: 'treeitem',
                    tabindex: -1,
                    'aria-selected': false,
                    'data-cmd': 'open-private-chat',
                    'data-email': member.get('email'),
                    'data-cid': this.model.cid
                };
            }
            return {
                role: 'treeitem',
                tabindex: -1,
                'aria-selected': false,
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
                                this.$('.title').empty().text(this.model.getTitle()).append(
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
                case 'group': $el.append(util.svg({ icon: 'fa-group' })); break;
                case 'channel': $el.append(util.svg({ icon: 'fa-hashtag' })); break;
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
            return $('<div class="unread-count">').text(this.model.getUnreadCount());
        },

        onChangeTitle: function () {
            this.$('.title').text(this.model.getTitle() || '\u00A0');
        },

        onChangeUnreadCount: function () {
            var count = this.model.getUnreadCount();
            this.$el.toggleClass('unseen', count > 0).find('.unread-count').text(count);
        },

        onChangeLastMessage: function () {
            this.$('.last-modified').text(this.model.getLastMessageDate());
            this.$('.last-message').text(this.model.getLastMessageText());
        }
    });

    return ChatListEntryView;
});
