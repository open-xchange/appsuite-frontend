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
    'io.ox/core/extensions',
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/chatAvatar',
    'io.ox/chat/data',
    'io.ox/backbone/views/toolbar'
], function (ext, DisposableView, ChatAvatar, data, ToolbarView) {

    'use strict';

    ext.point('io.ox/chat/channel-list/toolbar').extend({
        id: 'back',
        index: 100,
        custom: true,
        draw: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="close-chat">').append(
                    $('<i class="fa fa-chevron-left" aria-hidden="true">').css({ 'margin-right': '4px' }), 'Chats'
                )
            );
        }
    });

    ext.point('io.ox/chat/channel-list/toolbar').extend({
        id: 'title',
        index: 200,
        custom: true,
        draw: function () {
            this.addClass('toolbar-title').attr('data-prio', 'hi').text('All channels');
        }
    });

    ext.point('io.ox/chat/channel-list/toolbar').extend({
        id: 'switch-to-floating',
        index: 300,
        custom: true,
        draw: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="switch-to-floating">').append(
                    $('<i class="fa fa-window-maximize" aria-hidden="true">')
                )
            );
        }
    });

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
                $('<div class="header">').append(
                    $('<h2>').append('All channels')
                ),
                new ToolbarView({ point: 'io.ox/chat/channel-list/toolbar', title: 'All channels' }).render(new ext.Baton()).$el,
                $('<div class="scrollpane">').append(
                    $('<ul>').append(
                        this.getItems().map(this.renderItem, this)
                    )
                )
            );
            return this;
        },

        renderItem: function (model) {
            var isMember = model.isMember();
            return $('<li class="channel">')
                .attr({ 'data-cmd': 'view-channel', 'data-id': model.get('id') })
                .append(
                    $('<div>').append(
                        new ChatAvatar({ model: model }).render().$el,
                        $('<span class="title">').text(model.getTitle()),
                        $('<span class="members">').text((model.get('members') || []).length + ' member(s)')
                    ),
                    $('<div class="description">').text(model.get('description')),
                    $('<button type="button" class="btn btn-default btn-action" >')
                        .attr({ 'data-cmd': 'join-channel', 'data-id': model.get('id') })
                        .prop('disabled', isMember)
                        .toggleClass('join', !isMember)
                        .toggleClass('btn-success', isMember)
                        .append(isMember ? $('<i class="fa fa-check">') : 'Join')
                );
        },

        getItems: function () {
            return this.collection.getChannels();
        },

        getNode: function (model) {
            return this.$('[data-id="' + $.escape(model.get('id')) + '"]');
        },

        onAdd: _.debounce(function () {
            if (this.disposed) return;

            this.$('.scrollpane ul').empty().append(
                this.getItems().map(this.renderItem.bind(this))
            );
        }, 1),

        onRemove: function (model) {
            this.getNode(model).remove();
        },

        onChangeTitle: function (model) {
            this.getNode(model).find('.title').text(model.getTitle());
        }
    });

    return ChannelList;
});
