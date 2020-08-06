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

define('io.ox/chat/views/channelList', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/chatAvatar',
    'io.ox/chat/data'
], function (DisposableView, ChatAvatar, data) {

    'use strict';

    var ChannelList = DisposableView.extend({

        className: 'channel-list abs',

        initialize: function () {

            this.collection = data.chats;

            this.listenTo(this.collection, {
                'add': this.onAdd,
                'remove': this.onRemove,
                'change:joined': this.onChangeJoined,
                'change:title': this.onChangeTitle
            });

            // get fresh data
            this.collection.fetch({ remove: false, data: { type: 'channel' } });
        },

        render: function () {
            this.$el.append(
                $('<div class="header abs">').append(
                    $('<h2>').append('All channels')
                ),
                $('<div class="scrollpane abs">').append(
                    $('<ul>').append(
                        this.getItems().map(this.renderItem, this)
                    )
                )
            );
            return this;
        },

        renderItem: function (model) {
            return $('<li class="channel">').append(
                $('<div>').append(
                    new ChatAvatar({ model: model }).render().$el,
                    $('<span class="title">').text(model.getTitle()),
                    $('<span class="members">').text((model.get('members') || []).length + ' member(s)')
                ),
                $('<div class="description">').text(model.get('description')),
                $('<button type="button" class="btn btn-default btn-action join" >')
                    .attr({ 'data-cmd': 'join-channel', 'data-id': model.get('id') })
                    .text('Join')
            );
        },

        getItems: function () {
            return this.collection.getChannelsUnjoined();
        },

        getNode: function (model) {
            return this.$('[data-id="' + $.escape(model.get('id')) + '"]');
        },

        onAdd: _.debounce(function () {
            if (this.disposed) return;

            this.$('ul').empty().append(
                this.getItems().map(this.renderItem.bind(this))
            );
        }, 1),

        onRemove: function (model) {
            this.getNode(model).remove();
        },

        onChangeJoined: function (model) {
            this.onRemove(model);
        },

        onChangeTitle: function (model) {
            this.getNode(model).find('.title').text(model.getTitle());
        }
    });

    return ChannelList;
});
