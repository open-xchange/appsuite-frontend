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
    'io.ox/chat/views/messages',
    'io.ox/chat/views/reference-preview',
    'io.ox/chat/events',
    'io.ox/chat/data',
    'io.ox/backbone/views/toolbar'
], function (ext, DisposableView, Avatar, ChatAvatar, ChatMember, MessagesView, ReferencePreview, events, data, ToolbarView) {

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
        id: 'edit-group',
        index: 400,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.isGroup()) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="open-group-dialog">').attr('data-id', model.id).text('Edit group').on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'leave-group',
        index: 450,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.isGroup()) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="leave-group">').attr('data-id', model.id).text('Leave group').on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'edit-channel',
        index: 500,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.isChannel()) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="open-group-dialog">').attr('data-id', model.id).text('Edit channel').on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'leave-channel',
        index: 600,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.isChannel()) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="leave-channel">').attr('data-id', model.id).text('Leave channel').on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'close-chat',
        index: 700,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.isPrivate()) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="unsubscribe-chat">').attr('data-id', model.id).text('Hide chat').on('click', events.forward)
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
            'change .file-upload-input': 'onFileupload',
            'changeheight': 'onChangeHeight'
        },

        initialize: function (options) {

            this.room = options.room;
            this.messageId = options.messageId;
            this.reference = options.reference;
            this.model = data.chats.get(this.room);
            this.messagesView = new MessagesView({ collection: this.model.messages });

            this.listenTo(this.model, {
                'change:title': this.onChangeTitle,
                'change:unreadCount': this.onChangeUnreadCount
            });

            this.listenTo(this.model.messages, {
                'complete:prev': this.onComplete.bind(this, 'prev'),
                'complete:next': this.onComplete.bind(this, 'next'),
                'paginate': this.toggleAutoScroll.bind(this, false)
            });

            this.listenTo(this.messagesView, {
                'before:add': this.onBeforeAdd,
                'after:add': this.onAfterAdd
            });

            this.listenTo(events, 'cmd:remove-reference', this.onRemoveReference);

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

            this.$editor = $();
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
                        this.messagesView.render().$el,
                        this.typing.$el
                    ),
                    this.$paginateNext = $('<div class="paginate next">').toggle(!this.model.messages.nextComplete)
                ),
                this.$referencePreview = this.reference ? new ReferencePreview({ reference: this.reference }).render().$el : undefined,
                $('<div class="controls">').append(
                    this.$jumpDown = $('<button class="btn btn-default btn-circle jump-down">').append(
                        $('<i class="fa fa-chevron-down" aria-hidden="true">'),
                        this.$unreadCounter = $('<span class="badge">').text(this.model.get('unreadCount') || '')
                    ).toggle(this.isJumpDownVisible()),
                    this.renderEditor()
                )
            );

            _.defer(function () {
                if (this.$editor) this.$editor.focus();
            }.bind(this));

            return this;
        },

        renderEditor: function () {
            if (this.isMember()) {
                this.$editor = $('<textarea class="form-control" placeholder="Enter message here">');
                return [this.$editor,
                    $('<button type="button" class="btn btn-default btn-circle pull-right file-upload-btn">')
                        .append('<i class="fa fa-paperclip" aria-hidden="true">'),
                    $('<input type="file" class="file-upload-input hidden">')];
            }

            return $('<button type="button" class="btn btn-default btn-action join" >')
                .attr({ 'data-cmd': 'join-channel', 'data-id': this.model.get('id') })
                .append('Join');
        },

        renderDropdown: function () {

            var $ul = $('<ul class="dropdown-menu">');

            function renderItem(text, data) {
                return $('<li>').append(
                    $('<a href="#" role="button">').attr(data).text(text)
                );
            }

            if (this.model.isGroup()) {
                $ul.append(renderItem('Edit group', { 'data-cmd': 'open-group-dialog', 'data-id': this.model.id }));
                $ul.append(renderItem('Leave group', { 'data-cmd': 'leave-group', 'data-id': this.model.id }));
            } else if (this.model.isChannel()) {
                $ul.append(renderItem('Edit channel', { 'data-cmd': 'open-group-dialog', 'data-id': this.model.id }));
                $ul.append(renderItem('Leave channel', { 'data-cmd': 'leave-channel', 'data-id': this.model.id }));
            } else if (this.model.isPrivate()) {
                $ul.append(renderItem('Hide chat', { 'data-cmd': 'unsubscribe-chat', 'data-id': this.model.id }));
            }

            return $ul;
        },

        renderTitle: function () {
            return $('<h2 class="title">').append(this.model.getTitle() || '\u00a0');
        },

        onBeforeAdd: function () {
            var scrollpane = this.$scrollpane,
                firstChild = this.messagesView.$el.children().first(),
                prevTop = (firstChild.position() || {}).top || 0,
                // check this before adding the new messages
                isScrolledDown = scrollpane.scrollTop() + scrollpane.height() > scrollpane.prop('scrollHeight') - 30;
            this.scrollInfo = { firstChild: firstChild, prevTop: prevTop, isScrolledDown: isScrolledDown };
        },

        onAfterAdd: function (added) {
            // determine whether to scroll to new or selected message
            var scrollpane = this.$scrollpane,
                firstChild = this.scrollInfo.firstChild,
                prevTop = this.scrollInfo.prevTop,
                isScrolledDown = this.scrollInfo.isScrolledDown,
                multipleMessages = added.length > 1,
                isCurrentUser = added[0].get('senderId').toString() === data.user_id.toString();

            if (multipleMessages || isCurrentUser || isScrolledDown) {
                if (this.autoScroll) this.scrollToBottom();
                else if (firstChild.position().top - prevTop) scrollpane.scrollTop(firstChild.position().top - prevTop);
            }

            this.toggleAutoScroll(true);
            delete this.scrollInfo;
        },

        scrollToBottom: function () {
            var position = 0xFFFF,
                scrollpane = this.$scrollpane;
            if (this.messageId) {
                var model = this.model.messages.get(this.messageId);
                if (model) {
                    var elem = this.messagesView.$('[data-cid="' + model.cid + '"]'),
                        delta = elem.position().top - scrollpane.height() / 2;
                    position = scrollpane.scrollTop() + delta;
                    delete this.messageId;
                }
            }
            scrollpane.scrollTop(position);
            this.model.set('unreadCount', 0);
        },

        toggleAutoScroll: function (autoScroll) {
            if (autoScroll === undefined) autoScroll = !this.autoScroll;
            this.autoScroll = autoScroll;
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

            var data = { body: body };
            if (this.reference) data.reference = this.reference;
            this.model.postMessage(data);

            // remove reference preview
            this.onRemoveReference();
        },

        onRemoveReference: function () {
            if (this.$referencePreview) this.$referencePreview.remove();
            delete this.$referencePreview;
            delete this.reference;
        },

        onChangeTitle: function (model) {
            this.$('.title').text(model.getTitle() || '\u00a0');
        },

        onChangeUnreadCount: function () {
            this.$unreadCounter.text(this.model.get('unreadCount') || '');
        },

        onScroll: _.throttle(function () {
            this.$jumpDown.toggle(this.isJumpDownVisible());

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

        isJumpDownVisible: function () {
            return this.$scrollpane.scrollTop() + this.$scrollpane.height() < this.$scrollpane.prop('scrollHeight') - 50;
        },

        onComplete: function (direction) {
            this.$('.paginate.' + direction).idle().hide();
        },

        onChangeHeight: function (e, opt) {
            var scrollpane = this.$scrollpane;
            if ($(e.target).position().top > scrollpane.height) return;
            // scroll to bottom again if height of image changes
            scrollpane.scrollTop(scrollpane.scrollTop() + opt.value - opt.prev);

        },

        isMember: function () {
            return this.model.get('members').filter(function (member) {
                return member.email === data.user.email;
            }).length > 0;
        },

        getMessageNode: function (model, selector) {
            return this.$('.message[data-cid="' + model.cid + '"] ' + (selector || ''));
        }

    });

    return ChatView;
});
