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
                'change:unseen': this.onChangeUnseen,
                'change:modified': this.onChangeModified
            });
        },

        render: function () {
            this.$el.append(
                this.getItems().map(this.renderItem, this)
            );
            return this;
        },

        renderItem: function (model) {
            return $('<button type="button" class="btn-nav" data-cmd="show-chat">')
                .attr('data-id', model.id)
                .toggleClass('unseen', model.get('unseen') > 0)
                .append(
                    this.renderIcon(model),
                    $('<span class="label label-default">').text(model.get('unseen')),
                    $('<div class="title">').text(model.get('title'))
                );
        },

        renderIcon: function (model) {
            switch (model.get('type')) {
                case 'private':
                    return $('<span class="btn-icon">').append(
                        new StateView({ model: model.members.at(0) }).render().$el.addClass('small')
                    );
                case 'group':
                    return $('<i class="fa fa-group btn-icon">');
                case 'channel':
                    return $('<i class="fa fa-hashtag btn-icon">');
                // no default
            }
        },

        getItems: function () {
            return this.collection.getActive();
        },

        getNode: function (model) {
            return this.$('[data-id="' + $.escape(model.get('id')) + '"]');
        },

        onAdd: function (model) {
            this.$el.prepend(this.renderItem(model));
        },

        onRemove: function (model) {
            this.getNode(model).remove();
        },

        onChangeTitle: function (model) {
            this.getNode(model).find('.title').text(model.get('title') || '\u00A0');
        },

        onChangeUnseen: function (model) {
            var count = model.get('unseen');
            this.getNode(model).toggleClass('unseen', count > 0).find('.label').text(count);
        },

        onChangeModified: function (model) {
            var node = this.getNode(model),
                hasFocus = node[0] === document.activeElement;
            this.$el.prepend(node);
            if (hasFocus) node.focus();
        }
    });

    return ChatListView;
});
