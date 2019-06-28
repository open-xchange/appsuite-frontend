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

define('io.ox/chat/views/chatList', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/state',
    'io.ox/chat/views/chatAvatar',
    'io.ox/chat/data'
], function (DisposableView, StateView, ChatAvatar, data) {

    'use strict';

    var ChatListView = DisposableView.extend({

        tagName: 'ul',

        className: 'chats',

        initialize: function () {
            this.listenTo(this.collection, {
                'add': this.onAdd,
                'remove': this.onRemove,
                'change:title': this.onChangeTitle,
                'change:unreadCount': this.onChangeUnreadCount,
                'change:lastMessage': this.onChangeLastMessage,
                'change:modified': this.onChangeModified,
                'change:open': this.onChangeOpen
            });
        },

        render: function () {
            // rendering happens via onAdd
            this.collection.fetch();
            return this;
        },

        renderItem: function (model) {
            var isCurrentUser = model.get('lastMessage').senderId.toString() === data.user_id.toString(),
                isPrivate = model.get('type') === 'private';

            return $('<li data-cmd="show-chat">')
                .toggleClass('unseen', model.get('unreadCount') > 0)
                .attr('data-cid', model.cid)
                .append(
                    new ChatAvatar({ model: model }).render().$el,
                    $('<div class="chats-container">').append(
                        $('<div class="chats-row">').append(
                            $('<div class="title">').text(model.getTitle()),
                            $('<div class="last-modified">').text(model.getLastMessageDate())
                        ),
                        $('<div class="chats-row">').append(
                            $('<div class="fa delivery">')
                                .toggleClass('hidden', !isCurrentUser)
                                .addClass(model.get('lastMessage').state),
                            $('<div class="sender">')
                                .toggleClass('hidden', isCurrentUser || isPrivate)
                                .text(model.getLastSenderName() + ':'),
                            $('<div class="text-preview">').text(model.getLastMessage()),
                            $('<div class="label-container">').append(
                                $('<span class="label label-info">').text(model.get('unreadCount'))
                            )
                        )
                    )
                );
        },

        renderIcon: function (model) {
            switch (model.get('type')) {
                case 'private':
                    return $('<span class="btn-icon">').append(
                        new StateView({ model: model.getFirstMember() }).render().$el.addClass('small')
                    );
                case 'group':
                    return $('<i class="fa fa-group btn-icon" aria-hidden="true">');
                case 'channel':
                    return $('<i class="fa fa-hashtag btn-icon" aria-hidden="true">');
                // no default
            }
        },

        getItems: function () {
            return this.collection.getOpen();
        },

        getNode: function (model) {
            return this.$('[data-cid="' + model.cid + '"]');
        },

        onAdd: _.debounce(function (model, collection, options) {
            if (this.disposed) return;

            this.$el.prepend(
                options.changes.added
                .filter(function (model) { return model.isOpen(); })
                .map(this.renderItem, this)
            );
        }, 1),

        onRemove: function (model) {
            this.getNode(model).remove();
        },

        onChangeTitle: function (model) {
            this.getNode(model).find('.title').text(model.getTitle() || '\u00A0');
        },

        onChangeUnreadCount: function (model) {
            var count = model.get('unreadCount');
            this.getNode(model).toggleClass('unseen', count > 0).find('.label').text(count);
        },

        onChangeModified: function (model) {
            var node = this.getNode(model),
                hasFocus = node[0] === document.activeElement;
            this.$el.prepend(node);
            if (hasFocus) node.focus();
        },

        onChangeOpen: function (model, value) {
            if (value) {
                this.$el.prepend(this.renderItem(model));
            } else {
                this.onRemove(model);
            }
        },

        onChangeLastMessage: function (model) {
            var node = this.getNode(model),
                isCurrentUser = model.get('lastMessage').senderId.toString() === data.user_id.toString(),
                isPrivate = model.get('type') === 'private';

            node.find('.last-modified').text(model.getLastMessageDate());
            node.find('.text-preview').text(model.getLastMessage());
            node.find('.delivery')
                .toggleClass('hidden', !isCurrentUser)
                .removeClass('server client seen')
                .addClass(model.get('lastMessage').state);
            node.find('.sender')
                .toggleClass('hidden', isCurrentUser || isPrivate)
                .text(model.getLastSenderName());
        }
    });

    return ChatListView;
});
