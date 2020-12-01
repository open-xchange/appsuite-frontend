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
    'io.ox/core/extensions',
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/chatAvatar',
    'io.ox/chat/data',
    'io.ox/backbone/views/toolbar',
    'io.ox/core/strings',
    'io.ox/chat/util',
    'gettext!io.ox/chat'
], function (ext, DisposableView, ChatAvatar, data, ToolbarView, strings, util, gt) {

    'use strict';

    ext.point('io.ox/chat/history/toolbar').extend({
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

    ext.point('io.ox/chat/history/toolbar').extend({
        id: 'title',
        index: 200,
        custom: true,
        draw: function () {
            //#. Used for chats this time, not for mail threads
            this.addClass('toolbar-title').attr('data-prio', 'hi').text(gt('History'));
        }
    });

    ext.point('io.ox/chat/history/toolbar').extend({
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

    var History = DisposableView.extend({

        className: 'history abs',

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
                $('<div class="scrollpane">').append(
                    $('<ul>').append(
                        this.collection.length > 0 ? this.collection.map(this.renderItem, this) : this.renderEmpty().delay(1500).fadeIn(200)
                    )
                )
            );
            return this;
        },

        renderEmpty: function () {
            return $('<li class="history-list">').hide()
                .append($('<div class="info">').text(gt('There are no archived chats yet')));
        },

        renderItem: function (model) {
            return $('<li class="history-list">')
                .attr('data-cid', model.cid)
                .append(
                    new ChatAvatar({ model: model }).render().$el,
                    $('<div>').append(
                        $('<div>').append(
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

    return History;
});
