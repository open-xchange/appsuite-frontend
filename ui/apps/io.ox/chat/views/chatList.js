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
    'io.ox/chat/views/chatListEntry',
    'gettext!io.ox/chat'
], function (DisposableView, ChatListEntryView, gt) {

    'use strict';

    var ChatListView = DisposableView.extend({

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

            this.$ul = $('<ul class="chat-list" role="listbox">').attr('aria-label', this.options.header);
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
                $('<h2>').text(this.options.header),
                this.$ul
            );
            // rendering happens via onAdd
            this.collection.fetch().fail(function () {
                require(['io.ox/core/yell'], function (yell) {
                    yell('error', gt('Chats could not be loaded.'));
                });
            });
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
