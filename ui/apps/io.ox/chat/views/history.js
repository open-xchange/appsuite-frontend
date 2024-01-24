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

define('io.ox/chat/views/history', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/chatAvatar',
    'io.ox/chat/data',
    'io.ox/backbone/views/toolbar',
    'io.ox/core/strings',
    'io.ox/chat/util',
    'io.ox/chat/toolbar',
    'gettext!io.ox/chat'
], function (ext, DisposableView, ChatAvatar, data, ToolbarView, strings, util, toolbar, gt) {

    'use strict';

    var History = DisposableView.extend({

        className: 'history-list abs',

        initialize: function () {

            this.collection = data.chats;

            this.listenTo(this.collection, {
                'expire': this.onExpire,
                'add': this.onAdd,
                'remove': this.onRemove,
                'change:active': this.onChangeActive,
                'change': this.onChange
            });

            // get fresh data
            this.collection.fetch().fail(function () {
                require(['io.ox/core/yell'], function (yell) {
                    yell('error', gt('Recent chats could not be loaded.'));
                });
            });
        },

        render: function () {
            this.$el.append(
                $('<div class="header">').append(
                    //#. Used for a list of olders/recent chats
                    $('<h2>').append(gt('History'))
                ),
                new ToolbarView({ point: 'io.ox/chat/history/toolbar', title: gt('History actions') }).render(new ext.Baton()).$el,
                $('<div class="scrollpane scrollable" tabindex="0">').append(
                    $('<ul>').append(this.renderItems())
                )
            );
            return this;
        },

        renderItems: function () {
            return this.collection.length > 0 ?
                this.collection.map(this.renderItem, this) :
                this.renderEmpty().delay(1500).fadeIn(200);
        },

        renderEmpty: function () {
            return $('<li class="history-item">').hide()
                .append($('<div class="info">').text(gt('There are no archived chats yet')));
        },

        renderItem: function (model) {
            return $('<li class="history-item">')
                .attr('data-cid', model.cid)
                .append(
                    new ChatAvatar({ model: model }).render().$el,
                    $('<div class="details">').append(
                        $('<div class="ellipsis">').append(
                            $('<span class="title">').text(model.getTitle()),
                            $('<span class="type">').text('(' + this.getType(model) + ')')
                        ),
                        $('<div class="body">').text(model.getLastMessageText())
                    ),
                    $('<button type="button" class="btn btn-default btn-action" >')
                        .attr({ 'data-cmd': 'open-chat', 'data-id': model.id })
                        //#. Used as a verb
                        .text(gt('Open'))
                );
        },

        getType: function (model) {
            var type = model.get('type');
            if (type === 'channel') return gt('Channel');
            if (type === 'group') return gt('Group chat');
            return gt('Private chat');
        },

        getNode: function (model) {
            return this.$('[data-cid="' + model.cid + '"]');
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

        onChangeActive: function (model, value) {
            if (value) this.onRemove(model);
        },

        onChange: function () {

        },

        onExpire: function () {
            this.collection.expired = false;
        }
    });

    ext.point('io.ox/chat/history/toolbar').extend(
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
                //#. Used for chats this time, not for mail threads
                this.addClass('toolbar-title').attr('data-prio', 'hi').text(gt('History'));
            }
        },
        {
            id: 'switch-to-floating',
            index: 300,
            custom: true,
            draw: toolbar.detach
        }
    );

    return History;
});
