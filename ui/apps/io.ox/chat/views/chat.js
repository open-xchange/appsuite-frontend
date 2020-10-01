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
    'io.ox/chat/api',
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/avatar',
    'io.ox/chat/views/chatAvatar',
    'io.ox/chat/views/chatMember',
    'io.ox/chat/views/messages',
    'io.ox/chat/views/reference-preview',
    'io.ox/chat/events',
    'io.ox/chat/data',
    'io.ox/chat/util',
    'io.ox/backbone/views/toolbar',
    'gettext!io.ox/chat',
    'io.ox/core/tk/visibility-api-util'
], function (ext, api, DisposableView, Avatar, ChatAvatar, ChatMember, MessagesView, ReferencePreview, events, data, util, ToolbarView, gt, visibilityApi) {

    'use strict';

    ext.point('io.ox/chat/detail/toolbar').extend({
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
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="switch-to-floating">').attr('aria-label', gt('Detach window')).append(
                    $('<i class="fa fa-window-maximize" aria-hidden="true">').attr('title', gt('Detach window'))
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
            if (!model.isMember() || model.isPrivate()) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="edit-group-chat">').attr('data-id', model.id).text(gt('Edit chat')).on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'close-chat',
        index: 450,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.get('active') || model.isNew()) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="unsubscribe-chat">').attr('data-id', model.id).text(gt('Hide chat')).on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'leave-group',
        index: 500,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.isGroup() || !model.isMember()) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="leave-group">').attr('data-id', model.id).text(gt('Leave chat')).on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'leave-channel',
        index: 600,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.isChannel() || !model.isMember()) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="leave-channel">').attr('data-id', model.id).text(gt('Leave chat')).on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'join-channel',
        index: 650,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!(model.isChannel() && !model.isMember())) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="join-channel">').attr('data-id', model.id).text(gt('Join chat')).on('click', events.forward)
            );
        }
    });

    function formDownloadWithJwtAuth(url, token) {
        $('<form method="post" target="_blank"></form>').attr('action', url).append(
            $('<input type="hidden" name="jwt">').val(token)).appendTo('body').submit().remove();
    }

    var ChatView = DisposableView.extend({

        className: 'chat abs',

        events: {
            'keydown textarea': 'onEditorKeydown',
            'input textarea': 'onEditorInput',
            'click .file-upload-btn': 'onTriggerFileupload',
            'click .jump-down': 'onJumpDown',
            'change .file-upload-input': 'onFileupload',
            'click button[data-download]': 'onFileDownload',
            'click .cancel-btn': 'onCancelSpecialMode'
        },

        initialize: function (options) {
            var self = this;

            this.roomId = options.roomId;
            this.messageId = options.messageId;
            this.reference = options.reference;
            this.model = this.model || data.chats.get(this.roomId);
            this.messagesView = new MessagesView({ collection: this.model.messages });

            this.listenTo(this.model, {
                'change:title': this.onChangeTitle,
                'change:unreadCount': this.onChangeUnreadCount,
                'change:members': this.onChangeMembers
            });

            this.listenTo(this.model.messages, {
                'after:all': this.onUpdatePaginators.bind(this),
                'paginate': this.toggleAutoScroll.bind(this, false)
            });

            this.listenTo(this.messagesView, {
                'before:add': this.onBeforeAdd,
                'after:add': this.onAfterAdd,
                'delete': this.onDelete,
                'editMessage': this.onEditMessage,
                'replyToMessage': this.onReplyToMessage
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
                    //#. %1$s: name of the chat member that is currently typing
                    this.$el.append($('<div class="name">').attr('data-user-id', email).text(gt('%1$s is typing', name)));
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

            if (visibilityApi.isSupported) {
                this.onChangevisibility = function (e, data) {
                    (data.currentHiddenState ? this.onHide : this.onShow)();
                }.bind(this);

                $(visibilityApi).on('visibility-changed', this.onChangevisibility);
                return;
            }
            // Fallback
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
            if (visibilityApi.isSupported) {
                $(visibilityApi).off('visibility-changed', this.onChangevisibility);
                return;
            }
            // Fallback
            $(window).off('blur', this.onHide);
            $(window).off('focus', this.onShow);
        },

        render: function () {
            this.$toolbar = new ToolbarView({ point: 'io.ox/chat/detail/toolbar', title: gt('Chat actions') });

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
                    this.$dropdown = $('<div class="dropdown pull-right">').append(
                        $('<button type="button" class="btn btn-default btn-circle dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">').attr('title', gt('More actions'))
                        .append($('<i class="fa fa-bars" aria-hidden="true">').attr('title', gt('More actions'))),
                        this.renderDropdown()
                    ).css('visibility', 'hidden')
                ),
                this.$toolbar.render(new ext.Baton({ model: this.model })).$el,
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

            if (this.$dropdown.find('.dropdown-menu').children().length > 0) this.$dropdown.css('visibility', 'visible');

            return this;
        },

        renderEditor: function () {
            if (this.isMember()) {
                this.$editor = $('<textarea class="form-control">').attr({ 'aria-label': gt('Enter message here'), placeholder: gt('Enter message here') });
                return [this.$editor,
                    $('<button type="button" class="btn btn-circle cancel-btn">').attr('aria-label', gt('Cancel'))
                        .append($('<i class="fa fa-times" aria-hidden="true">').attr('title', gt('Cancel'))),
                    $('<button type="button" class="btn btn-default btn-circle pull-right file-upload-btn">').attr('aria-label', gt('Upload file'))
                        .append($('<i class="fa fa-paperclip" aria-hidden="true">').attr('title', gt('Upload file'))),
                    $('<input type="file" class="file-upload-input hidden">')];
            }

            if (this.model.get('type') === 'channel') {
                return $('<button type="button" class="btn btn-default btn-action join">')
                .attr({ 'data-cmd': 'join-channel', 'data-id': this.model.get('roomId') })
                .append(gt('Join'));
            }
        },

        updateEditor: function () {
            var $controls = this.$el.find('.controls');
            $controls.empty().append(this.renderEditor());
        },

        renderDropdown: function () {
            var $ul = $('<ul class="dropdown-menu">');

            function renderItem(text, data) {
                return $('<li>').append(
                    $('<a href="#" role="button">').attr(data).text(text)
                );
            }

            if (!this.model.isNew() && (this.model.isPrivate() || this.model.isGroup() || (this.model.isChannel() && this.model.isMember())) && this.model.get('active')) {
                $ul.append(renderItem(gt('Hide chat'), { 'data-cmd': 'unsubscribe-chat', 'data-id': this.model.id }));
            }
            if ((this.model.isGroup() || this.model.isChannel()) && this.model.isMember()) {
                $ul.append(renderItem(gt('Edit chat'), { 'data-cmd': 'edit-group-chat', 'data-id': this.model.id }));
            }

            if (!this.model.isPrivate() && this.model.isMember()) {
                $ul.append(renderItem('Leave chat', { 'data-cmd': this.model.isChannel() ? 'leave-channel' : 'leave-group', 'data-id': this.model.id }));
            } else if (this.model.isChannel() && !this.model.get('active')) {
                $ul.append(renderItem('Join chat', { 'data-cmd': 'join-channel', 'data-id': this.model.id }));
            }

            return $ul;
        },

        updateDropdown: function () {
            this.$dropdown.find('.dropdown-menu').replaceWith(this.renderDropdown());
            this.$toolbar.render(new ext.Baton({ model: this.model }));
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

        onDelete: function (message) {
            // success will trigger a message:changed event on the websocket. This takes care of view updates etc
            api.deleteMessage(message).fail(function () {
                require(['io.ox/core/yell'], function (yell) {
                    yell('error', gt('Could not delete the message'));
                });
            });
        },

        onCancelSpecialMode: function () {
            this.$editor.val('').focus();
            if (this.$messageReference) this.$messageReference.remove();
            this.$el.find('.controls').removeClass('edit-mode reply-mode');
            this.specialMode = false;
            this.messageReference = null;
        },

        onEditMessage: function (message) {
            //clean up
            this.onCancelSpecialMode();

            var messageNode = this.getMessageNode(message);
            // scroll to edited message
            if (messageNode) {
                this.$scrollpane.scrollTop(messageNode[0].offsetTop - this.$scrollpane.height() + messageNode.height() + 4);
            }
            this.$editor.val(message.get('content')).focus();
            this.$el.find('.controls').addClass('edit-mode');
            this.specialMode = 'edit';
            this.messageReference = message;
        },

        onReplyToMessage: function (message) {
            // clean up
            this.onCancelSpecialMode();

            var messageNode = this.getMessageNode(message),
                user = data.users.getByMail(message.get('sender'));
            // scroll to cited message
            if (messageNode) {
                this.$scrollpane.scrollTop(messageNode[0].offsetTop - this.$scrollpane.height() + messageNode.height() + 4);
            }

            this.$messageReference = $('<div class="reference-message message">')
                .addClass(message.getType())
                .toggleClass('emoji', util.isOnlyEmoji(message.getBody()))
                .append(
                    $('<div class="content">').append(
                        // sender name
                        $('<div class="sender">').text(user.getName()),
                        // message body
                        $('<div class="body">')
                            .html(message.getBody())
                    )
                );

            this.$editor.before(this.$messageReference).focus();
            this.$el.find('.controls').addClass('reply-mode');
            this.specialMode = 'reply';
            this.messageReference = message;
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
            if (e.which === 27 && this.specialMode) {
                e.preventDefault();
                e.stopPropagation();
                this.onCancelSpecialMode();
            }

            if (e.which === 13) {
                if (e.ctrlKey) {
                    // append newline manually if ctrl is pressed
                    this.$editor.val(this.$editor.val() + '\n');
                    return;
                }
                e.preventDefault();
                var text = this.$editor.val();
                if (text.trim().length > 0) this.onPostMessage(text);
                this.$editor.val('').focus();
            }
        },

        onEditorInput: function () {
            var state = this.$editor.val() !== '';
            data.socket.emit('typing', { roomId: this.model.id, state: state });
        },

        onTriggerFileupload: function () {
            this.$('.file-upload-input').trigger('click');
        },

        onFileupload: function () {
            var $input = this.$('.file-upload-input'),
                files = _.toArray($input[0].files);

            this.model.postMessage({ content: '' }, files.length === 1 ? files[0] : files);

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

            if (this.specialMode === 'edit') {
                api.editMessage(content, this.messageReference);
                this.onCancelSpecialMode();
            } else if (this.specialMode === 'reply') {
                this.model.postMessage({ content: content, sender: data.user.email, replyTo: { content: this.messageReference.get('content'), sender: this.messageReference.get('sender') } });
                this.onCancelSpecialMode();
            } else {
                var message = { content: content, sender: data.user.email };
                if (this.reference) message.reference = this.reference;
                this.model.postMessage(message);
            }

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

        onChangeMembers: function () {
            if (this.model.get('lastMessage').type !== 'system') return;

            var event = JSON.parse(this.model.get('lastMessage').content),
                members = event.members;

            if (!_.isArray(members) && _.isObject(members)) members = Object.keys(members);
            if (!members || members.indexOf(data.user.email) < 0) return;

            this.updateEditor();
            this.updateDropdown();
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
                    view.model.messages.paginate('older').then(function () {
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
                    view.model.messages.paginate('newer').then(function () {
                        $paginateNext.idle();
                    });
                }
            }(this));

            this.markMessageAsRead();
        }, 300),

        markMessageAsRead: function () {
            if (this.hidden) return;
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

        isMember: function () {
            return _.allKeys(this.model.get('members')).filter(function (member) {
                return member === data.user.email;
            }).length > 0;
        },

        getMessageNode: function (model, selector) {
            return this.$('.message[data-cid="' + model.cid + '"] ' + (selector || ''));
        },

        onFileDownload: function (e) {
            e.preventDefault();
            var url = $(e.currentTarget).attr('data-download');
            api.getJwtFromSwitchboard().then(function (token) {
                formDownloadWithJwtAuth(url, token);
            });
        }

    });

    return ChatView;
});
