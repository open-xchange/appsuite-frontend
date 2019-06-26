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
    'io.ox/chat/data'
], function (DisposableView, StateView) {

    'use strict';

    var ChatListView = DisposableView.extend({

        className: 'chats',

        initialize: function () {
            this.listenTo(this.collection, {
                'add': this.onAdd,
                'remove': this.onRemove,
                'change:title': this.onChangeTitle,
                'change:unreadCount': this.onChangeUnreadCount,
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
            return $('<button type="button" class="btn-nav" data-cmd="show-chat">')
                .toggleClass('unseen', model.get('unreadCount') > 0)
                .attr('data-cid', model.cid)
                .append(
                    this.renderIcon(model),
                    $('<span class="label label-default">').text(model.get('unseen')),
                    $('<div class="title">').text(model.getTitle())
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
        }
    });

    return ChatListView;
});
