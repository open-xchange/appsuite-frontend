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
                    $('<i class="fa fa-chevron-left" aria-hidden="true">').css({ 'margin-right': '4px' }), 'Chats'
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
                    $('<i class="fa fa-window-maximize" aria-hidden="true">')
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
            if (!model.isMember() || model.isPrivate() || (model.isChannel() && !model.get('active'))) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="edit-group-chat">').attr('data-id', model.id).text('Edit chat').on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'close-chat',
        index: 450,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (model.isChannel() && !model.get('active')) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="unsubscribe-chat">').attr('data-id', model.id).text('Hide chat').on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'leave-group',
        index: 500,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.isGroup()) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="leave-group">').attr('data-id', model.id).text('Leave chat').on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'leave-channel',
        index: 600,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.isChannel() || (model.isChannel() && !model.get('active'))) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="leave-channel">').attr('data-id', model.id).text('Leave chat').on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'join-channel',
        index: 650,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!(model.isChannel() && !model.get('active'))) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="join-channel">').attr('data-id', model.id).text('Join chat').on('click', events.forward)
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
            var self = this;

            this.roomId = options.roomId;
            this.room = options.room;
            this.messageId = options.messageId;
            this.reference = options.reference;
            this.model = data.chats.get(this.roomId) || this.room;
            this.messagesView = new MessagesView({ collection: this.model.messages });

            this.listenTo(this.model, {
                'change:title': this.onChangeTitle,
                'change:unreadCount': this.onChangeUnreadCount
            });

            this.listenTo(this.model.messages, {
                'after:all': this.onUpdatePaginators.bind(this),
                'paginate': this.toggleAutoScroll.bind(this, false)
            });

            this.listenTo(this.messagesView, {
                'before:add': this.onBeforeAdd,
                'after:add': this.onAfterAdd
            });

            this.on('dispose', this.onDispose);

            this.listenTo(events, 'cmd:remove-reference', this.onRemoveReference);

            this.messagesView.messageId = this.messageId;
            // there are two cases when to reset the collection before usage
            // 1) We have a messageId but the requested messageId is not in the collection
            // 2) We don't have a messageId but the collection is not fully fetched
            if ((this.messageId && !this.model.messages.get(this.messageId)) || (!this.messageId && !this.model.messages.nextComplete)) this.model.messages.reset();
            _.delay(this.model.messages.fetch.bind(this.model.messages));

            // tracking typing
            this.typing = {
                $el: $('<div class="typing">'),
                timer: {},
                show: function (email) {
                    var model = data.users.getByMail(email);
                    if (!model || model.isMyself()) return;
                    this.reset(email);
                    var $span = this.span(email),
                        atBottom = self.isScrolledToBottom();
                    if (!$span.length) this.add(email, model.getName());
                    if (atBottom) self.scrollToBottom();
                    this.timer[email] = setTimeout(function () {
                        if (this.disposed) return;
                        this.hide(email);
                    }.bind(this), 5000);
                },
                span: function (email) {
                    return this.$el.find('[data-user-id="' + email + '"]');
                },
                reset: function (email) {
                    if (!this.timer[email]) return;
                    window.clearTimeout(this.timer[email]);
                    delete this.timer[email];
                },
                add: function (email, name) {
                    this.$el.append($('<div class="name">').attr('data-user-id', email).text(name + ' is typing'));
                },
                hide: function (email) {
                    this.reset(email);
                    this.span(email).remove();
                },
                toggle: function (email, state) {
                    if (state) this.show(email); else this.hide(email);
                }
            };

            this.listenTo(events, 'typing:' + this.model.id, function (email, state) {
                this.typing.toggle(email, state);
            });

            this.$editor = $();
            this.autoScroll = _.isUndefined(options.autoScroll) ? true : options.autoScroll;

            this.onHide = this.onHide.bind(this);
            this.onShow = this.onShow.bind(this);
            $(window).on('blur', this.onHide);
            $(window).on('focus', this.onShow);
        },

        onShow: function () {
            this.hidden = false;
            this.markMessageAsRead();
        },

        onHide: function () {
            this.hidden = true;
        },

        onDispose: function () {
            $(window).off('blur', this.onHide);
            $(window).off('focus', this.onShow);
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
                    this.$paginatePrev = $('<div class="paginate prev">').hide(),
                    $('<div class="conversation">').append(
                        this.messagesView.render().$el,
                        this.typing.$el
                    ),
                    this.$paginateNext = $('<div class="paginate next">').hide()
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

            this.onUpdatePaginators();
            this.markMessageAsRead();

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
                .attr({ 'data-cmd': 'join-channel', 'data-id': this.model.get('roomId') })
                .append('Join');
        },

        renderDropdown: function () {

            var $ul = $('<ul class="dropdown-menu">');

            function renderItem(text, data) {
                return $('<li>').append(
                    $('<a href="#" role="button">').attr(data).text(text)
                );
            }

            if (this.model.isPrivate() && this.model.get('active')) {
                $ul.append(renderItem('Hide chat', { 'data-cmd': 'unsubscribe-chat', 'data-id': this.model.id }));
            } else if (!(this.model.isChannel() && !this.model.get('joined')) && this.model.get('active')) {
                if (this.model.isMember()) $ul.append(renderItem('Edit chat', { 'data-cmd': 'edit-group-chat', 'data-id': this.model.id }));
                $ul.append(renderItem('Hide chat', { 'data-cmd': 'unsubscribe-chat', 'data-id': this.model.id }));
            } else if (this.model.isChannel() && !this.model.get('active')) {
                $ul.append(renderItem('Join chat', { 'data-cmd': 'join-channel', 'data-id': this.model.id }));
            }

            if (!this.model.isPrivate() && !(this.model.isChannel() && !this.model.get('active'))) {
                $ul.append(renderItem('Leave chat', { 'data-cmd': 'leave-group', 'data-id': this.model.id }));
            }

            return $ul;
        },

        renderTitle: function () {
            return $('<h2 class="title">').append(this.model.getTitle() || '\u00a0');
        },

        isScrolledToBottom: function () {
            var scrollpane = this.$scrollpane;
            return scrollpane.scrollTop() + scrollpane.height() > scrollpane.prop('scrollHeight') - 30;
        },

        onBeforeAdd: function () {
            var firstChild = this.messagesView.$el.children().first(),
                prevTop = (firstChild.position() || {}).top || 0,
                // check this before adding the new messages
                isScrolledDown = this.isScrolledToBottom();
            this.scrollInfo = { firstChild: firstChild, prevTop: prevTop, isScrolledDown: isScrolledDown };
        },

        onAfterAdd: function (added) {
            // determine whether to scroll to new or selected message
            var scrollpane = this.$scrollpane,
                firstChild = this.scrollInfo.firstChild,
                prevTop = this.scrollInfo.prevTop,
                isScrolledDown = this.scrollInfo.isScrolledDown,
                multipleMessages = added.length > 1,
                isCurrentUser = added[0].get('sender') === data.user.email;

            if (multipleMessages || isCurrentUser || isScrolledDown) {
                if (this.autoScroll) this.scrollToBottom();
                else if (firstChild.position().top - prevTop) scrollpane.scrollTop(firstChild.position().top - prevTop);
            }

            this.toggleAutoScroll(true);
            delete this.scrollInfo;

            this.markMessageAsRead();
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
        },

        toggleAutoScroll: function (autoScroll) {
            if (autoScroll === undefined) autoScroll = !this.autoScroll;
            this.autoScroll = autoScroll;
        },

        onEditorKeydown: function (e) {
            if (e.which !== 13) return;
            if (e.ctrlKey) {
                // append newline manually if ctrl is pressed
                this.$editor.val(this.$editor.val() + '\n');
                return;
            }
            e.preventDefault();
            var text = this.$editor.val();
            if (text.trim().length > 0) this.onPostMessage(text);
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
            var $input = this.$('.file-upload-input'), type, i,
                files = $input[0].files;

            for (i = 0; i < files.length; i++) {
                files.type = /(jpg|jpeg|gif|bmp|png)/i.test(files[i].type) ? 'image' : 'file';
            }

            this.model.postMessage({ content: '', type: type }, files);

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

        onPostMessage: function (content) {
            // reset and fetch messages when in search and collection is not complete
            if (!this.model.messages.nextComplete) {
                this.model.messages.reset();
                this.model.messages.fetch();
            }

            data.socket.emit('typing', { roomId: this.model.id, state: false });

            var body = { content: content };
            if (this.reference) body.reference = this.reference;
            this.model.postMessage(body);

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

            this.markMessageAsRead();
        }, 300),

        markMessageAsRead: function () {
            if (this.hidden) return;
            if (!this.isScrolledToBottom()) return;
            var lastIndex = this.model.messages.findLastIndex(function (message) {
                return message.get('sender') !== data.user.email;
            });
            if (lastIndex < 0) return;
            var message = this.model.messages.at(lastIndex);
            if (message.get('deliveryState') === 'seen') return;
            message.updateDelivery('seen');
        },

        isJumpDownVisible: function () {
            return this.$scrollpane.scrollTop() + this.$scrollpane.height() < this.$scrollpane.prop('scrollHeight') - 50;
        },

        onUpdatePaginators: function () {
            var wasScrolledToBottom = this.isScrolledToBottom();

            this.$('.paginate.prev').idle().toggle(!this.model.messages.prevComplete && this.model.messages.length > 0);
            this.$('.paginate.next').idle().toggle(!this.model.messages.nextComplete && this.model.messages.length > 0);

            if (wasScrolledToBottom && !this.isScrolledToBottom()) this.scrollToBottom();
        },

        onComplete: function (direction) {
            this.$('.paginate.' + direction).idle().hide();
        },

        onChangeHeight: function (e, opt) {
            var scrollpane = this.$scrollpane;
            if ($(e.target).closest('.message').position().top > scrollpane.height()) return;

            // scroll to bottom again if height of image changes
            scrollpane.scrollTop(scrollpane.scrollTop() + opt.value - opt.prev);

        },

        isMember: function () {
            return _.allKeys(this.model.get('members')).filter(function (member) {
                return member === data.user.email;
            }).length > 0;
        },

        getMessageNode: function (model, selector) {
            return this.$('.message[data-cid="' + model.cid + '"] ' + (selector || ''));
        }

    });

    return ChatView;
});
