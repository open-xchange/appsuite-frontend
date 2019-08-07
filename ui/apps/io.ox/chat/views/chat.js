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
        id: 'add-member',
        index: 400,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="add-member">').attr('data-id', model.id).text('Add member').on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'close-chat',
        index: 500,
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
            'click .jump-down': 'onJumpDown',
            'change .file-upload-input': 'onFileupload'
        },

        initialize: function (options) {

            this.room = options.room;
            this.messageId = options.messageId;
            this.model = data.chats.get(this.room);

            this.listenTo(this.model, {
                'change:title': this.onChangeTitle
            });

            this.listenTo(this.model.messages, {
                'add': this.onAdd,
                'reset': this.onReset,
                'remove': this.onRemove,
                'change:body': this.onChangeBody,
                'change:fileId': this.onChangeBody,
                'change:time': this.onChangeTime,
                'change:state': this.onChangeDelivery,
                'complete:prev': this.onComplete.bind(this, 'prev'),
                'complete:next': this.onComplete.bind(this, 'next'),
                'paginate': this.toggleAutoScroll.bind(this, false)
            });

            this.model.messages.messageId = this.messageId;
            // there are two cases when to reset the collection before usage
            // 1) We have a messageId but the requested messageId is not in the collection
            // 2) We don't have a messageId but the collection is not fully fetched
            if ((this.messageId && !this.model.messages.get(this.messageId)) || (!this.messageId && !this.model.messages.nextComplete)) this.model.messages.reset();
            _.delay(this.model.messages.fetch.bind(this.model.messages));

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
            this.autoScroll = _.isUndefined(options.autoScroll) ? true : options.autoScroll;
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
                this.$scrollpane = $('<div class="scrollpane">').on('scroll', $.proxy(this.onScroll, this)).append(
                    this.$paginatePrev = $('<div class="paginate prev">').toggle(!this.model.messages.prevComplete),
                    $('<div class="conversation">').append(
                        this.$messages = $('<div class="messages">').append(
                            this.model.messages.map(this.renderMessage, this)
                        ),
                        this.typing.$el
                    ),
                    this.$paginateNext = $('<div class="paginate next">').toggle(!this.model.messages.nextComplete)
                ),
                $('<div class="controls">').append(
                    this.$jumpDown = $('<button class="btn btn-default btn-circle jump-down">').append($('<i class="fa fa-chevron-down" aria-hidden="true">')),
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
                .toggleClass('highlight', !!model.get('id') && model.get('id') === this.messageId)
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
            var position = 0xFFFF,
                scrollpane = this.$scrollpane;
            if (this.messageId) {
                var model = this.model.messages.get(this.messageId);
                if (model) {
                    var elem = this.$messages.find('[data-cid="' + model.cid + '"]'),
                        delta = elem.position().top - scrollpane.height() / 2;
                    position = scrollpane.scrollTop() + delta;
                    delete this.messageId;
                }
            }
            scrollpane.scrollTop(position);
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

        onJumpDown: function () {
            if (!this.model.messages.nextComplete) {
                this.model.messages.reset();
                this.model.messages.fetch();
            } else {
                this.scrollToBottom();
            }
        },

        onPostMessage: function (body) {
            // reset and fetch messages when in search and collection is not complete
            if (!this.model.messages.nextComplete) {
                this.model.messages.reset();
                this.model.messages.fetch();
            }

            this.model.postMessage({ body: body });
        },

        onChangeTitle: function (model) {
            this.$('.title').text(model.getTitle() || '\u00a0');
        },

        onScroll: _.throttle(function () {
            this.$jumpDown.toggle(this.$scrollpane.scrollTop() + this.$scrollpane.height() < this.$scrollpane.prop('scrollHeight') - 50);

            if (this.$('.messages').is(':empty')) return;
            (function (view) {
                if (!view.model.messages.prevComplete) {
                    var $paginatePrev = view.$paginatePrev;
                    if ($paginatePrev.hasClass('io-ox-busy')) return;
                    if ($paginatePrev.position().top < -$paginatePrev.height() * 2) return;
                    $paginatePrev.busy();
                    view.model.messages.paginate('prev').then(function () {
                        $paginatePrev.idle();
                    });
                }
            }(this));

            (function (view) {
                if (!view.model.messages.nextComplete) {
                    var $paginateNext = view.$paginateNext;
                    if ($paginateNext.hasClass('io-ox-busy')) return;
                    if ($paginateNext.position().top - $paginateNext.height() > $paginateNext.parent().height()) return;
                    $paginateNext.busy();
                    view.model.messages.paginate('next').then(function () {
                        $paginateNext.idle();
                    });
                }
            }(this));
        }, 300),

        toggleAutoScroll: function (autoScroll) {
            if (autoScroll === undefined) autoScroll = !this.autoScroll;
            this.autoScroll = autoScroll;
        },

        onReset: function () {
            if (!this.$messages) return;
            this.$messages.empty();
            var collection = this.model.messages;
            this.onAdd(undefined, collection, { changes: { added: collection } });
        },

        onAdd: _.debounce(function (model, collection, options) {
            if (this.disposed) return;
            // need to check if view is not disposed since this function is debounced
            if (!this.$messages) return;

            var scrollpane = this.$scrollpane,
                firstChild = this.$messages.children().first(),
                prevTop = (firstChild.position() || {}).top || 0;

            options.changes.added.forEach(function (model) {
                var index = collection.indexOf(model);
                if (index === 0) return this.$messages.prepend(this.renderMessage(model));

                var prev = collection.at(index - 1);
                this.$messages.find('[data-cid="' + prev.cid + '"]').after(this.renderMessage(model));
            }.bind(this));

            if (this.autoScroll) this.scrollToBottom();
            else if (firstChild.position().top - prevTop) scrollpane.scrollTop(firstChild.position().top - prevTop);

            this.toggleAutoScroll(true);
        }, 1),

        onComplete: function (direction) {
            this.$('.paginate.' + direction).idle().hide();
        },

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
