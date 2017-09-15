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

define('io.ox/chat/views/chatList', [], function () {

    'use strict';

    var ChatListView = Backbone.View.extend({

        className: 'chats',

        initialize: function () {
            this.listenTo(this.collection, 'add', this.onAdd);
            this.listenTo(this.collection, 'remove', this.onRemove);
            this.listenTo(this.collection, 'change:title', this.onChangeTitle);
            this.listenTo(this.collection, 'change:unseen', this.onChangeUnseen);
        },

        render: function () {
            this.$el.append(this.collection.map(this.renderChat, this));
            return this;
        },

        renderChat: function (model) {
            return $('<button type="button" class="btn-nav" data-cmd="show-chat">')
                .attr('data-id', model.id)
                .toggleClass('unseen', model.get('unseen') > 0)
                .append(
                    this.renderChatIcon(model),
                    $('<span class="label label-default">').text(model.get('unseen')),
                    $('<div class="title">').text(model.get('title'))
                );
        },

        renderChatIcon: function (model) {
            switch (model.get('type')) {
                case 'private': return $('<span class="btn-icon">').append(renderState('online').addClass(' small'));
                case 'group': return $('<i class="fa fa-group btn-icon">');
                case 'channel': return $('<i class="fa fa-hashtag btn-icon">');
                // no default
            }
        },

        getNodeById: function (id) {
            return this.$('[data-id="' + $.escape(id) + '"]');
        },

        onAdd: function (model) {
            this.$el.prepend(this.renderChat(model));
        },

        onRemove: function (model) {
            this.getNodeById(model.id).remove();
        },

        onChangeTitle: function (model) {
            this.getNodeById(model.id).find('.title').text(model.get('title') || '\u00A0');
        },

        onChangeUnseen: function (model) {
            var count = model.get('unseen');
            this.getNodeById(model.id).toggleClass('unseen', count > 0).find('.label').text(count);
        }
    });

    function renderState(state) {
        return $('<span class="fa state">').addClass(state);
    }

    return ChatListView;
});
