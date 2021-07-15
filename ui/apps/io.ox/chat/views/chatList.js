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

define('io.ox/chat/views/chatList', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/chatListEntry',
    'gettext!io.ox/chat'
], function (DisposableView, ChatListEntryView, gt) {

    'use strict';

    var ChatListView = DisposableView.extend({

        tagName: 'li',
        attributes: { role: 'treeitem' },
        className: 'chats',

        initialize: function (options) {

            this.options = _.extend({ header: gt('Chat list'), filter: _.constant(true) }, options);

            // via initialize, never on prototype level
            this.onAdd = _.debounce(this.onAdd);
            this.onSort = _.debounce(this.onSort);

            this.listenTo(this.collection, {
                'expire': this.onExpire,
                'add': this.onAdd,
                'remove': this.onRemove,
                'change:active': this.addOrRemove,
                'change:favorite': this.addOrRemove,
                'change:lastMessage': this.onChangeLastMessage,
                'sort': this.onSort
            });

            this.$el.attr('aria-label', this.options.header);
            this.$ul = $('<ul class="chat-list" role="group">');
        },

        render: function () {
            // render existing items
            var items = this.getItems();
            this.toggle(items);
            this.$ul.append(
                items.map(function (model) {
                    return new ChatListEntryView({ model: model }).$el;
                })
            );
            this.$el.append(
                $('<h2 aria-hidden="true">').text(this.options.header),
                this.$ul
            );
            return this;
        },

        renderItem: function (model) {
            var node = this.getNode(model);
            if (node.length) return node;
            return new ChatListEntryView({ model: model }).$el;
        },

        toggle: function (items) {
            this.$el.toggle((items || this.getItems()).length > 0);
        },

        getItems: function () {
            return _(this.collection.getActive()).filter(this.options.filter);
        },

        getNode: function (model) {
            var node = this.$('[data-cid="' + model.get('roomId') + '"]') || this.$('[data-cid="' + model.cid + '"]');
            if (node.length === 0) node = this.$('[data-cid="' + model.cid + '"]');
            return node;
        },

        addOrRemove: function (model) {
            var visible = model.isActive() && this.options.filter(model);
            if (visible) this.onAdd(this.model, this.collection, { changes: { added: [model] } });
            else this.onRemove(model);
        },

        onSort: function () {
            if (this.disposed) return;
            var items = this.getItems().map(this.renderItem, this);
            if (items.length > 0) items[0].attr({ 'tabindex': 0 });
            this.$ul.append(items);
            this.toggle();
        },

        onAdd: function (model, collection, options) {
            if (this.disposed) return;
            var all = this.getItems();
            options.changes.added
                .filter(function (model) { return model.isActive(); })
                .filter(this.options.filter)
                .forEach(function (model) {
                    var index = all.indexOf(model);
                    if (index === 0) {
                        this.$ul.prepend(this.renderItem(model));
                    } else {
                        var prevModel = all[index - 1];
                        this.getNode(prevModel).after(this.renderItem(model));
                    }
                }.bind(this));
            this.toggle();
        },

        onRemove: function (model) {
            this.getNode(model).remove();
            this.toggle();
        },

        onChangeLastMessage: function (model) {
            var previousMessageId = (model.previous('lastMessage') || {}).messageId,
                currentMessageId = (model.changed.lastMessage || {}).messageId;
            if (previousMessageId === currentMessageId) return;
            var node = this.getNode(model),
                hasFocus = node[0] === document.activeElement;
            this.$ul.prepend(node);
            if (hasFocus) node.focus();
        },

        onExpire: function () {
            this.collection.expired = false;
        }
    });

    return ChatListView;
});
