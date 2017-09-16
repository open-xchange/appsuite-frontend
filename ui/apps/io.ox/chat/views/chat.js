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

define('io.ox/chat/views/chat', ['io.ox/chat/data', 'io.ox/chat/views/state'], function (data, StateView) {

    'use strict';

    var ChatView = Backbone.View.extend({

        className: 'chat',

        events: {
            'keydown textarea': 'onEditorKeydown'
        },

        initialize: function (options) {

            this.model = data.backbone.chats.get(options.id);
            this.previousSender = 0;

            this.listenTo(this.model.messages, 'add', this.onAdd);
        },

        render: function () {
            this.$el.append(
                $('<div class="header abs">').append(
                    $('<h2>').append(this.model.get('title')),
                    $('<ul class="members">').append(
                        this.model.members.map(this.renderMember, this)
                    )
                ),
                $('<div class="scrollpane abs">').append(
                    $('<div class="conversation ">').append(
                        this.model.messages.map(this.renderMessage, this)
                    )
                ),
                $('<div class="controls abs">').append(
                    $('<textarea class="form-control" placeholder="Enter message here">')
                )
            );
            return this;
        },

        renderMember: function (model) {
            return $('<li class="member">').append(
                renderMemberState(model),
                $.txt(getUserName(model.id))
            );
        },

        renderMessage: function (model) {
            var data = model.toJSON();
            var $message = $('<div class="message">')
                .toggleClass('myself', model.isMyself())
                .append(
                    // sender
                    data.sender === this.previousSender ? $() : getSender(data),
                    // message boby
                    $('<div>').addClass(data.type === 'image' ? 'image' : 'body').html(model.getBody()),
                    // time
                    $('<div class="time">').text(model.get('time')),
                    // delivery state
                    $('<div class="fa message-state">')
                )
                // exemplary animation
                .delay(100).queue(function () {
                    $(this).find('.message-state').addClass('sent').delay(500).queue(function () {
                        $(this).addClass('received').dequeue().delay(2000).queue(function () {
                            $(this).addClass('seen');
                        });
                    });
                });
            this.previousSender = data.sender;
            return $message;
        },

        scrollToBottom: function () {
            this.$('.scrollpane').scrollTop(0xFFFF);
        },

        onEditorKeydown: function (e) {
            if (e.which !== 13) return;
            e.preventDefault();
            var editor = $(e.currentTarget);
            this.model.messages.add({ sender: 1, body: editor.val(), time: moment().format('LT') });
            editor.val('').focus();
        },

        onAdd: function (model) {
            this.$('.conversation').append(this.renderMessage(model));
            this.scrollToBottom();
        }
    });

    function getSender(message) {
        return $('<div class="sender">').text(getUserName(message.sender));
    }

    function getUserName(id) {
        return data.backbone.users.get(id).get('name');
    }

    function renderMemberState(model) {
        return new StateView({ model: model }).render().$el;
    }

    return ChatView;
});
