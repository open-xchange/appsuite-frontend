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
    'io.ox/chat/api',
    'io.ox/chat/data',
    'io.ox/backbone/views/toolbar',
    'gettext!io.ox/chat'
], function (ext, DisposableView, ChatAvatar, api, data, ToolbarView, gt) {

    'use strict';

    ext.point('io.ox/chat/channel-list/toolbar').extend({
        id: 'back',
        index: 100,
        custom: true,
        draw: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="button" draggable="false" tabindex="-1" data-cmd="close-chat">').attr('aria-label', gt('Close chat')).append(
                    $('<i class="fa fa-chevron-left" aria-hidden="true">').css({ 'margin-right': '4px' }), gt('Chats')
                )
            );
        }
    });

    ext.point('io.ox/chat/channel-list/toolbar').extend({
        id: 'title',
        index: 200,
        custom: true,
        draw: function () {
            this.addClass('toolbar-title').attr('data-prio', 'hi').text(gt('All channels'));
        }
    });

    ext.point('io.ox/chat/channel-list/toolbar').extend({
        id: 'switch-to-floating',
        index: 300,
        custom: true,
        draw: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="button" draggable="false" tabindex="-1" data-cmd="switch-to-floating">').attr('aria-label', gt('Detach window')).append(
                    $('<i class="fa fa-window-maximize" aria-hidden="true">').attr('title', gt('Detach window'))
                )
            );
        }
    });

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
            this.collection.fetch({
                success: function (channels) {
                    this.$el.find('.scrollpane').idle().append(
                        $('<ul>').append(
                            channels.length > 0 ? channels.map(this.renderItem, this) : this.renderEmpty().fadeIn(100)
                        )
                    );
                }.bind(this),
                fail: function () {
                    this.$el.find('.scrollpane').idle();
                    require(['io.ox/core/yell'], function (yell) {
                        yell('error', gt('Channels could not be loaded.'));
                    });
                }.bind(this)
            });
        },

        render: function () {
            this.$el.append(
                $('<div class="header">').append(
                    $('<h2>').text(gt('All channels'))
                ),
                new ToolbarView({ point: 'io.ox/chat/channel-list/toolbar', title: gt('All channels') }).render(new ext.Baton()).$el,
                $('<div class="scrollpane">').busy()
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
                    $('<div>').append(
                        new ChatAvatar({ model: model }).render().$el,
                        $('<div class="title">').text(model.getTitle()),
                        //#. %1$d: is the number of members
                        $('<div class="members">').text(gt.ngettext('%1$d member', '%1$d members', numberOfMembers, numberOfMembers))
                    ),
                    $('<div class="description">').text(model.get('description')),
                    $('<button type="button" class="btn btn-default btn-action" >')
                        .attr({ 'data-cmd': 'join-channel', 'data-id': model.get('roomId') })
                        .prop('disabled', isMember)
                        .toggleClass('join', !isMember)
                        .toggleClass('hidden', isMember)
                        .append(isMember ? $('<i class="fa fa-check">') : gt('Join'))
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

    return ChannelList;
});
