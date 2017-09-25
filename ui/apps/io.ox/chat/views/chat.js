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
    'io.ox/chat/data',
    'io.ox/chat/views/badge',
    'io.ox/chat/views/avatar'
], function (data, BadgeView, Avatar) {

    'use strict';

    var MESSAGE_LIMIT = 20;

    var ChatView = Backbone.View.extend({

        className: 'chat',

        events: {
            'keydown textarea': 'onEditorKeydown'
        },

        initialize: function (options) {

            this.model = data.backbone.chats.get(options.id);

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
        },

        render: function () {
            this.$el.append(
                $('<div class="header abs">').append(
                    $('<h2 class="title">').append(this.model.get('title') || '\u00a0'),
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
            return $('<li>').append(
                new BadgeView({ model: model }).render().$el
            );
        },

        renderMessage: function (model) {
            return $('<div class="message">')
                .attr('data-id', model.id)
                .addClass(model.get('type') || 'text')
                .toggleClass('myself', model.isMyself())
                .append(
                    // sender avatar & name
                    this.renderSender(model),
                    // message boby
                    $('<div class="body">').addClass().html(model.getBody()),
                    // time
                    $('<div class="time">').text(model.get('time')),
                    // delivery state
                    $('<div class="fa delivery">').addClass(model.get('delivery'))
                );
        },

        renderSender: function (model) {
            if (model.get('type') === 'system') return $();
            if (model.isMyself()) return $();
            if (model.hasSameSender()) return $();
            var user = data.backbone.users.get(model.get('sender'));
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
            this.model.messages.add({ id: this.model.messages.length + 1, sender: 1, body: editor.val(), time: moment().format('LT') });
            editor.val('').focus();
        },

        onChangeTitle: function (model) {
            this.$('.title').text(model.get('title') || '\u00a0');
        },

        onAdd: function (model) {
            this.$('.conversation').append(this.renderMessage(model));
            // too many messages?
            var children = this.$('.conversation').children();
            if (children.length > MESSAGE_LIMIT) children.first().remove();
            this.scrollToBottom();
            // exemplary animation
            setTimeout(function () {
                model.set('delivery', 'sent');
                setTimeout(function () {
                    model.set('delivery', 'received');
                    setTimeout(function () {
                        model.set('delivery', 'seen');
                        model = null;
                    }, 1000);
                }, 700);
            }, 300);
        },

        getMessageNode: function (model, selector) {
            return this.$('.message[data-id="' + model.id + '"] ' + (selector || ''));
        },

        onRemove: function (model) {
            this.getMessageNode(model).remove();
        },

        onChangeBody: function (model) {
            this.getMessageNode(model, '.body').html(model.getBody());
        },

        onChangeTime: function (model) {
            this.getMessageNode(model, '.time').text(model.get('time'));
        },

        onChangeDelivery: function (model) {
            this.getMessageNode(model, '.delivery').attr('class', 'fa delivery ' + model.get('delivery'));
        }
    });

    return ChatView;
});
