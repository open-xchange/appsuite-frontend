/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/chat/views/channelList', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/chatAvatar',
    'io.ox/chat/api',
    'io.ox/chat/data',
    'io.ox/backbone/views/toolbar',
    'io.ox/chat/toolbar',
    'gettext!io.ox/chat'
], function (ext, DisposableView, ChatAvatar, api, data, ToolbarView, toolbar, gt) {

    'use strict';

    var ChannelList = DisposableView.extend({

        className: 'channel-list abs',

        initialize: function () {

            this.collection = data.channels;

            this.listenTo(this.collection, {
                'expire': this.onExpire,
                'add': this.onAdd,
                'remove': this.onRemove,
                'change:title': this.onChangeTitle
            });

            // add all channels from chat collection first, so we don't have 2 different models for the same channel
            // only needed once
            if (!this.collection.synced) {
                this.collection.add(data.chats.filter({ type: 'channel' }));
                this.collection.synced = true;
            }

            // get fresh data
            this.collection.fetch();
        },

        render: function () {
            var channels = this.collection;
            this.$el.append(
                $('<div class="header">').append(
                    $('<h2>').text(gt('All channels'))
                ),
                new ToolbarView({ point: 'io.ox/chat/channel-list/toolbar', title: gt('All channels') }).render(new ext.Baton()).$el,
                $('<div class="scrollpane scrollable" tabindex="0">').append(
                    $('<ul>').append(
                        channels.length > 0 ? channels.map(this.renderItem, this) : this.renderEmpty().delay(500).fadeIn(100)
                    )
                )
            );
            return this;
        },
        renderEmpty: function () {
            return $('<li class="channel">').hide()
                .append($('<div class="info">').text(gt('There are no channels yet')));
        },
        renderItem: function (model) {
            var isMember = model.isMember(),
                numberOfMembers =  (model.get('members') && Object.keys(model.get('members')) || []).length;

            return $('<li class="channel">')
                .attr({ 'data-cmd': 'view-channel', 'data-id': model.get('roomId') })
                .append(
                    new ChatAvatar({ model: model }).render().$el,
                    $('<div class="details">').append(
                        $('<div class="title">').text(model.getTitle()),
                        //#. %1$d: is the number of members
                        $('<div class="members">').text(gt.ngettext('%1$d member', '%1$d members', numberOfMembers, numberOfMembers)),
                        $('<div class="description">').text(model.get('description'))
                    ),
                    $('<button type="button" class="btn btn-default btn-action" >')
                        .attr({ 'data-cmd': 'join-channel', 'data-id': model.get('roomId') })
                        .prop('disabled', isMember)
                        .toggleClass('join', !isMember)
                        .toggleClass('hidden', isMember)
                        .text(gt('Join'))
                );
        },

        getNode: function (model) {
            return this.$('[data-id="' + $.escape(model.get('roomId')) + '"]');
        },

        onAdd: _.debounce(function () {
            if (this.disposed) return;
            this.$('.scrollpane ul').empty().append(
                this.collection.map(this.renderItem.bind(this))
            );
        }, 1),

        onRemove: function (model) {
            this.getNode(model).remove();
        },

        onChangeTitle: function (model) {
            this.getNode(model).find('.title').text(model.getTitle());
        },

        onExpire: function () {
            this.collection.expired = false;
        }
    });

    ext.point('io.ox/chat/channel-list/toolbar').extend(
        {
            id: 'back',
            index: 100,
            custom: true,
            draw: toolbar.back
        },
        {
            id: 'title',
            index: 200,
            custom: true,
            draw: function () {
                this.addClass('toolbar-title').attr('data-prio', 'hi').text(gt('All channels'));
            }
        },
        {
            id: 'switch-to-floating',
            index: 300,
            custom: true,
            draw: toolbar.detach
        }
    );

    return ChannelList;
});
