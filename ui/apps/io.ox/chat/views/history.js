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

define('io.ox/chat/views/history', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/chatAvatar',
    'io.ox/chat/data'
], function (DisposableView, ChatAvatar, data) {

    'use strict';

    var History = DisposableView.extend({

        className: 'history abs',

        initialize: function () {

            this.collection = data.chats;

            this.listenTo(this.collection, {
                'add': this.onAdd,
                'remove': this.onRemove,
                'change:open': this.onChangeOpen,
                'change': this.onChange
            });
        },

        render: function () {
            this.$el.append(
                $('<div class="header abs">').append(
                    $('<h2>').append('Recent conversations')
                ),
                $('<div class="scrollpane abs">').append(
                    $('<ul>').append(
                        this.getItems().map(this.renderItem, this)
                    )
                )
            );
            return this;
        },

        getItems: function () {
            return this.collection.getHistory();
        },

        renderItem: function (model) {
            return $('<li>')
                .attr('data-cid', model.cid)
                .append(
                    new ChatAvatar({ model: model }).render().$el,
                    $('<div class="title">').text(model.getTitle()),
                    $('<div class="date">').text(model.getLastMessageDate()),
                    $('<div class="body">').append(model.getLastMessage()),
                    $('<button type="button" class="btn btn-default btn-action" >')
                        .attr({ 'data-cmd': 'open-chat', 'data-id': model.id })
                        .text('Open')
                );
        },

        getNode: function (model) {
            return this.$('[data-cid="' + model.cid + '"]');
        },

        onAdd: function () {

        },

        onRemove: function (model) {
            this.getNode(model).remove();
        },

        onChangeOpen: function (model, value) {
            console.log('onChangeOpen', model, value);
            if (value) this.onRemove(model);
        },

        onChange: function () {

        }
    });

    return History;
});
