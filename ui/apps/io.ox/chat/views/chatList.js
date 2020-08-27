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
    'io.ox/chat/views/chatListEntry'
], function (DisposableView, StateView, ChatListEntryView) {

    'use strict';

    var ChatListView = DisposableView.extend({

        tagName: 'ul',

        className: 'chats',

        initialize: function () {
            this.listenTo(this.collection, {
                'add': this.onAdd,
                'remove': this.onRemove,
                'change:active': this.onChangeActive,
                'change:lastMessage': this.onChangeLastMessage,
                'sort': this.onSort
            });
        },

        render: function () {
            // rendering happens via onAdd
            this.collection.fetch();
            return this;
        },

        renderItem: function (model) {
            var node = this.getNode(model);
            if (node.length) return node;
            return new ChatListEntryView({ model: model }).render().$el;
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
            return this.collection.getActive();
        },

        getNode: function (model) {
            var node = this.$('[data-cid="' + model.get('roomId') + '"]');
            if (node.length === 0) node = this.$('[data-cid="' + model.cid + '"]');
            return node;
        },

        onSort: _.debounce(function () {
            if (this.disposed) return;

            var items = this.getItems().map(this.renderItem, this);
            this.$el.append(
                items
            );
        }, 1),

        onAdd: _.debounce(function (model, collection, options) {
            var all = this.getItems();
            options.changes.added
            .filter(function (model) { return model.isActive(); })
            .forEach(function (model) {
                var index = all.indexOf(model);
                if (index === 0) {
                    this.$el.prepend(this.renderItem(model));
                } else {
                    var prevModel = all[index - 1];
                    this.getNode(prevModel).after(this.renderItem(model));
                }
            }.bind(this));
        }),

        onRemove: function (model) {
            this.getNode(model).remove();
        },

        onChangeActive: function (model, value) {
            if (value) {
                this.onAdd(this.model, this.collection, { changes: { added: [model] } });
            } else {
                this.onRemove(model);
            }
        },

        onChangeLastMessage: function (model) {
            if ((model.previous('lastMessage') || {}).messageId === model.changed.lastMessage.messageId) return;
            var node = this.getNode(model),
                hasFocus = node[0] === document.activeElement;
            this.$el.prepend(node);
            if (hasFocus) node.focus();
        }
    });

    return ChatListView;
});
