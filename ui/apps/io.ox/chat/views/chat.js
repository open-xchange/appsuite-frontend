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

define('io.ox/chat/views/chat', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/badge',
    'io.ox/chat/views/avatar',
    'io.ox/chat/data'
], function (DisposableView, BadgeView, Avatar, data) {

    'use strict';

    var MESSAGE_LIMIT = 20;

    var ChatView = DisposableView.extend({

        className: 'chat',

        events: {
            'keydown textarea': 'onEditorKeydown'
        },

        initialize: function (options) {

            this.room = options.room;
            this.model = data.chats.get(this.room);

            this.listenTo(this.model, {
                'change:title': this.onChangeTitle
            });

            this.listenTo(this.model.messages, {
                'add': this.onAdd,
                'remove': this.onRemove,
                'change:body': this.onChangeBody,
                'change:time': this.onChangeTime,
                'change:delivery': this.onChangeDelivery
            });

            this.model.messages.fetch();
        },

        render: function () {
            this.$el.append(
                $('<div class="header abs">').append(
                    $('<h2 class="title">').append(this.model.getTitle() || '\u00a0'),
                    $('<ul class="members">').append(
                        this.model.members
                            .map(this.renderMember, this)
                    )
                ),
                $('<div class="scrollpane abs">').append(
                    $('<div class="conversation ">').append(
                        this.model.messages
                            .last(MESSAGE_LIMIT)
                            .map(this.renderMessage, this)
                    )
                ),
                $('<div class="controls abs">').append(
                    $('<textarea class="form-control" placeholder="Enter message here">')
                )
            );
            return this;
        },

        renderMember: function (model) {
            if (model.isMyself()) return $();
            return $('<li>').append(
                new BadgeView({ model: model }).render().$el
            );
        },

        renderMessage: function (model) {
            return $('<div class="message">')
                // here we use cid instead of id, since the id might be unknown
                .attr('data-cid', model.cid)
                .addClass(model.isSystem() ? 'system' : model.get('type'))
                .toggleClass('myself', model.isMyself())
                .append(
                    // sender avatar & name
                    this.renderSender(model),
                    // message boby
                    $('<div class="body">').addClass().html(model.getBody()),
                    // time
                    $('<div class="time">').text(model.getTime()),
                    // delivery state
                    $('<div class="fa delivery">').addClass(model.get('delivery'))
                );
        },

        renderSender: function (model) {
            if (model.isSystem() || model.isMyself() || model.hasSameSender()) return $();
            var user = data.users.get(model.get('senderId'));
            return [new Avatar({ model: user }).render().$el, $('<div class="sender">').text(user.getName())];
        },

        scrollToBottom: function () {
            this.$('.scrollpane').scrollTop(0xFFFF);
            this.model.set('unseen', 0);
        },

        onEditorKeydown: function (e) {
            if (e.which !== 13) return;
            e.preventDefault();
            var editor = $(e.currentTarget);
            this.onPostMessage(editor.val());
            editor.val('').focus();
        },

        onPostMessage: function (body) {
            this.model.postMessage({ body: body });
        },

        onChangeTitle: function (model) {
            this.$('.title').text(model.getTitle() || '\u00a0');
        },

        onAdd: _.debounce(function (model, collection, options) {
            // render
            this.$('.conversation').append(
                options.changes.added.map(this.renderMessage.bind(this))
            );
            // too many messages?
            var children = this.$('.conversation').children();
            if (children.length > MESSAGE_LIMIT) children.slice(0, children.length - MESSAGE_LIMIT).remove();
            // proper scroll position
            this.scrollToBottom();
        }, 1),

        getMessageNode: function (model, selector) {
            return this.$('.message[data-cid="' + model.cid + '"] ' + (selector || ''));
        },

        onRemove: function (model) {
            this.getMessageNode(model).remove();
        },

        onChangeBody: function (model) {
            this.getMessageNode(model, '.body').html(model.getBody());
        },

        onChangeTime: function (model) {
            this.getMessageNode(model, '.time').text(model.getTime());
        },

        onChangeDelivery: function (model) {
            this.getMessageNode(model, '.delivery').attr('class', 'fa delivery ' + model.get('delivery'));
        }
    });

    return ChatView;
});
