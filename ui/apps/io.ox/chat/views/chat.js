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
    'io.ox/core/extensions',
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/avatar',
    'io.ox/chat/views/chatAvatar',
    'io.ox/chat/views/chatMember',
    'io.ox/chat/events',
    'io.ox/chat/data',
    'io.ox/backbone/views/toolbar'
], function (ext, DisposableView, Avatar, ChatAvatar, ChatMember, events, data, ToolbarView) {

    'use strict';

    var MESSAGE_LIMIT = 20;

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'back',
        index: 100,
        custom: true,
        draw: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="close-chat">').append(
                    $('<i class="fa fa-chevron-left" aria-hidden="true">').css({ 'margin-right': '4px' }), 'Back'
                )
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'title',
        index: 200,
        custom: true,
        draw: function (baton) {
            this.addClass('toolbar-title').attr('data-prio', 'hi').text(baton.model.getTitle());
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'switch-to-floating',
        index: 300,
        custom: true,
        draw: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="switch-to-floating">').append(
                    $('<i class="fa fa-external-link" aria-hidden="true">')
                )
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'close-chat',
        index: 400,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="unsubscribe-chat">').attr('data-id', model.id).text('Close chat').on('click', events.forward)
            );
        }
    });

    var ChatView = DisposableView.extend({

        className: 'chat abs',

        events: {
            'keydown textarea': 'onEditorKeydown',
            'input textarea': 'onEditorInput',
            'click .file-upload-btn': 'onTriggerFileupload',
            'change .file-upload-input': 'onFileupload'
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
                'change:fileId': this.onChangeBody,
                'change:time': this.onChangeTime,
                'change:state': this.onChangeDelivery
            });

            this.model.messages.fetch();

            // tracking typing
            this.typing = {
                $el: $('<div class="typing">'),
                timer: {},
                show: function (userId) {
                    var model = data.users.get(userId);
                    if (!model || model.isMyself()) return;
                    this.reset(userId);
                    var $span = this.span(userId);
                    if (!$span.length) this.add(userId, model.getName());
                    this.timer[userId] = setTimeout(function () {
                        if (this.disposed) return;
                        this.hide(userId);
                    }.bind(this), 5000);
                },
                span: function (userId) {
                    return this.$el.find('[data-user-id="' + userId + '"]');
                },
                reset: function (userId) {
                    if (!this.timer[userId]) return;
                    window.clearTimeout(this.timer[userId]);
                    delete this.timer[userId];
                },
                add: function (userId, name) {
                    this.$el.append($('<div class="name">').attr('data-user-id', userId).text(name + ' is typing'));
                },
                hide: function (userId) {
                    this.reset(userId);
                    this.span(userId).remove();
                },
                toggle: function (userId, state) {
                    if (state) this.show(userId); else this.hide(userId);
                }
            };

            this.listenTo(events, 'typing:' + this.model.id, function (userId, state) {
                this.typing.toggle(userId, state);
            });

            this.$messages = $();
            this.$editor = $();
            this.updateDelivery = _.debounce(this.updateDelivery.bind(this), 10);
        },

        render: function () {
            this.$el.append(
                $('<div class="header">').append(
                    new ChatAvatar({ model: this.model }).render().$el,
                    this.model.isPrivate() ?
                        // private chat
                        this.renderTitle().addClass('flex-grow') :
                        // groups / channels
                        $('<div class="flex-grow">').append(
                            this.renderTitle().addClass('small-line'),
                            new ChatMember({ collection: this.model.members }).render().$el
                        ),
                    // burger menu (pull-right just to have the popup right aligned)
                    $('<div class="dropdown pull-right">').append(
                        $('<button type="button" class="btn btn-default btn-circle dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">')
                        .append('<i class="fa fa-bars" aria-hidden="true">'),
                        this.renderDropdown()
                    )
                ),
                new ToolbarView({ point: 'io.ox/chat/detail/toolbar', title: 'Chat actions' }).render(new ext.Baton({ model: this.model })).$el,
                $('<div class="scrollpane">').append(
                    $('<div class="conversation">').append(
                        this.$messages = $('<div class="messages">').append(
                            this.model.messages.last(MESSAGE_LIMIT).map(this.renderMessage, this)
                        ),
                        this.typing.$el
                    )
                ),
                $('<div class="controls">').append(
                    this.$editor = $('<textarea class="form-control" placeholder="Enter message here">'),
                    $('<button type="button" class="btn btn-default btn-circle pull-right file-upload-btn">')
                        .append('<i class="fa fa-paperclip" aria-hidden="true">'),
                    $('<input type="file" class="file-upload-input hidden">')
                )
            );

            return this;
        },

        renderDropdown: function () {

            var $ul = $('<ul class="dropdown-menu">');

            function renderItem(text, data) {
                return $('<li>').append(
                    $('<a href="#" role="button">').attr(data).text(text)
                );
            }

            // add member
            if (this.model.isGroup()) {
                $ul.append(renderItem('Add member', { 'data-cmd': 'add-member', 'data-id': this.model.id }));
            }

            // unsubscribe
            $ul.append(renderItem('Close chat', { 'data-cmd': 'unsubscribe-chat', 'data-id': this.model.id }));

            return $ul;
        },

        renderTitle: function () {
            return $('<h2 class="title">').append(this.model.getTitle() || '\u00a0');
        },

        renderMessage: function (model) {
            // mark message as seen as soon as it is rendered
            if (model.get('state') !== 'seen' && model.get('senderId').toString() !== data.user_id.toString()) this.updateDelivery(model, 'seen');
            return $('<div class="message">')
                // here we use cid instead of id, since the id might be unknown
                .attr('data-cid', model.cid)
                .addClass(model.isSystem() ? 'system' : model.get('type'))
                .toggleClass('myself', model.isMyself())
                .append(
                    // sender avatar & name
                    this.renderSender(model),
                    // message boby
                    $('<div class="content">').append(
                        $('<div class="body">').html(model.getBody()),
                        $('<div class="foot">').append(
                            // time
                            $('<div class="time">').text(model.getTime()),
                            // delivery state
                            $('<div class="fa delivery">').addClass(model.get('state'))
                        )
                    )
                );
        },

        updateDelivery: function (model, state) {
            model.updateDelivery(state);
        },

        renderSender: function (model) {
            if (model.isSystem() || model.isMyself() || model.hasSameSender()) return $();
            var user = data.users.get(model.get('senderId'));
            return [new Avatar({ model: user }).render().$el, $('<div class="sender">').text(user.getName())];
        },

        scrollToBottom: function () {
            this.$('.scrollpane').scrollTop(0xFFFF);
            this.model.set('unreadCount', 0);
        },

        onEditorKeydown: function (e) {
            if (e.which !== 13) return;
            e.preventDefault();
            this.onPostMessage(this.$editor.val());
            this.$editor.val('').focus();
        },

        onEditorInput: function () {
            var state = this.$editor.val() !== '';
            data.socket.emit('typing', { roomId: this.model.id, state: state });
        },

        onTriggerFileupload: function () {
            this.$('.file-upload-input').trigger('click');
        },

        onFileupload: function () {
            var $input = this.$('.file-upload-input');
            this.model.postMessage({ body: '' }, $input[0].files[0]);
            $input.val('');
        },

        onPostMessage: function (body) {
            this.model.postMessage({ body: body });
        },

        onChangeTitle: function (model) {
            this.$('.title').text(model.getTitle() || '\u00a0');
        },

        onAdd: _.debounce(function (model, collection) {
            if (this.disposed) return;

            // render
            this.$messages.empty().append(
                collection.map(this.renderMessage.bind(this))
            );
            // too many messages?
            var children = this.$messages.children();
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
            var $message = this.getMessageNode(model);
            var $body = $message.find('.body');
            $message
                .removeClass('system text image file audio')
                .addClass(model.isSystem() ? 'system' : model.get('type'));
            $body.html(model.getBody());
        },

        onChangeTime: function (model) {
            this.getMessageNode(model, '.time').text(model.getTime());
        },

        onChangeDelivery: function (model) {
            this.getMessageNode(model, '.delivery').attr('class', 'fa delivery ' + model.get('state'));
        }
    });

    return ChatView;
});
