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

define('io.ox/chat/views/history', ['io.ox/chat/data'], function (data) {

    'use strict';

    var History = Backbone.View.extend({

        className: 'history abs',

        initialize: function () {

            this.collection = data.backbone.chats;

            this.listenTo(this.collection, {
                'add': this.onAdd,
                'remove': this.onRemove,
                'change:active': this.onChangeActive,
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
            return $('<li>').append(
                $('<div class="avatar">'),
                $('<div class="title">').text(model.get('title')),
                $('<div class="message">').text(model.getLastMessage()),
                $('<div class="date">').text(model.getLastMessageDate())
            );
        },

        getNode: function (model) {
            return this.$('[data-id="' + $.escape(model.get('id')) + '"]');
        },

        onAdd: function () {

        },

        onRemove: function () {

        },

        onChangeActive: function () {

        },

        onChange: function () {

        }
    });

    return History;
});
