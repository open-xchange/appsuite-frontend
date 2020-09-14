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
    'gettext!io.ox/chat'
], function (ext, DisposableView, ChatAvatar, data, ToolbarView, gt) {

    'use strict';

    ext.point('io.ox/chat/history/toolbar').extend({
        id: 'back',
        index: 100,
        custom: true,
        draw: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="button" draggable="false" tabindex="-1" data-cmd="close-chat">').append(
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
            this.addClass('toolbar-title').attr('data-prio', 'hi').text(gt('Recent conversations'));
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
                'add': this.onAdd,
                'remove': this.onRemove,
                'change:active': this.onChangeActive,
                'change': this.onChange
            });

            // get fresh data
            this.collection.fetch({ remove: false, data: { active: false } });
        },

        render: function () {
            this.$el.append(
                $('<div class="header">').append(
                    //#. Used for chats this time, not for mail threads
                    $('<h2>').append(gt('Recent conversations'))
                ),
                new ToolbarView({ point: 'io.ox/chat/history/toolbar', title: gt('History actions') }).render(new ext.Baton()).$el,
                $('<div class="scrollpane">').append(
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
            return $('<li class="history-list">')
                .attr('data-cid', model.cid)
                .append(
                    new ChatAvatar({ model: model }).render().$el,
                    $('<div class="chats-container">').append(
                        $('<div class="chats-row">').append(
                            $('<div class="title">').text(model.getTitle()),
                            $('<div class="body">').append(model.getLastMessage()),
                            $('<button type="button" class="btn btn-default btn-action" >')
                                .attr({ 'data-cmd': 'open-chat', 'data-id': model.id })
                                //#. Used as a verb
                                .text(gt('Open'))
                        )
                    )
                );
        },

        getNode: function (model) {
            return this.$('[data-cid="' + model.cid + '"]');
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

        onChangeActive: function (model, value) {
            if (value) this.onRemove(model);
        },

        onChange: function () {

        }
    });

    return History;
});
