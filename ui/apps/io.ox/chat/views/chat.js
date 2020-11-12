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
    'io.ox/chat/views/content',
    'io.ox/chat/views/reference-preview',
    'io.ox/chat/events',
    'io.ox/chat/data',
    'io.ox/chat/util',
    'io.ox/core/yell',
    'io.ox/backbone/views/toolbar',
    'gettext!io.ox/chat',
    'io.ox/core/strings',
    'io.ox/core/notifications',
    'io.ox/chat/views/dropzone'
], function (ext, api, DisposableView, Avatar, ChatAvatar, ChatMember, MessagesView, ContentView, ReferencePreview, events, data, util, yell, ToolbarView, gt, strings, notifications, dropzone) {

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
        id: 'close-chat',
        index: 400,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.get('active') || model.isNew()) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="unsubscribe-chat">').attr('data-id', model.id).text(gt('Close chat')).on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'edit-group',
        index: 500,
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
        id: 'leave-group',
        index: 600,
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
        index: 700,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!(model.isChannel() && !model.isMember())) return;
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="join-channel">').attr('data-id', model.id).text(gt('Join chat')).on('click', events.forward)
            );
        }
    });

    var ChatView = DisposableView.extend({

        className: 'chat abs',

        events: {
            'keydown textarea': 'onEditorKeydown',
            'input textarea': 'onEditorInput',
            'click .send-btn': 'onSend',
            'click .file-upload-btn': 'onTriggerFileupload',
            'click .jump-down': 'onJumpDown',
            'change .file-upload-input': 'onFileupload',
            'click .cancel-btn': 'onCancelSpecialMode'
        },

        initialize: function (options) {
            var self = this;

            this.roomId = options.roomId;
            this.messageId = options.messageId;
            this.reference = options.reference;
            this.model = this.model || data.chats.get(this.roomId);
            this.messagesView = new MessagesView({ room: this.model, collection: this.model.messages });

            this.listenTo(this.model, {
                'change:title': this.onChangeTitle,
                'change:favorite': this.updateDropdown,
                'change:unreadCount': this.onChangeUnreadCount,
                'change:members': this.onChangeMembers,
                'change:roomId': this.onChangeRoomId
            });

            this.listenTo(this.model.messages, {
                'after:all': this.onUpdatePaginators.bind(this),
                'paginate': this.toggleAutoScroll.bind(this, false)
            });

            this.listenTo(events, {
                'cmd:message:delete': this.onMessageDelete,
                'cmd:message:edit': this.onMessageEdit,
                'cmd:message:reply': this.onMessageReply
            });

            this.listenTo(this.messagesView, {
                'before:add': this.onBeforeAdd,
                'after:add': this.onAfterAdd
            });

            this.on('appended', function () {
                // view must be appended to the dom for this to work
                this.chatMemberview.updateToggleButton();
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
                hash: {},
                show: function (email) {
                    var model = data.users.getByMail(email);
                    if (!model || model.isMyself()) return;
                    this.reset(email);
                    var atBottom = self.isScrolledToBottom();
                    this.hash[email] = {
                        name: '<span class="name">' + _.escape(model.getName()) + '</span>',
                        timeout: setTimeout(function () {
                            if (this.disposed) return;
                            this.hide(email);
                        }.bind(this), 5000)
                    };
                    this.render();
                    if (atBottom) self.scrollToBottom();
                },
                reset: function (email) {
                    if (!this.hash[email]) return;
                    window.clearTimeout(this.hash[email].timeout);
                    delete this.hash[email];
                },
                render: function () {
                    var names = _(this.hash).pluck('name');
                    this.$el.html(this.getNotificationString(names));
                },
                getNotificationString: function (names) {
                    if (!names.length) return '';
                    //#. %1$s is a member name
                    if (names.length === 1) return gt('%1$s is typing ...', names[0]);
                    //#. %1$s and %2$s are member names
                    if (names.length === 2) return gt('%1$s and %2$s are typing ...', names[0], names[1]);
                    //#. %1$s, %2$s, and %3$s are member names
                    if (names.length === 3) return gt('%1$s, %2$s, and %3$s are typing ...', names[0], names[1], names[2]);
                    //#. %1$s and %2$s are member names, %3$d is the number of further members
                    return gt('%1$s, %2$s and %3$d others are typing ...', names[0], names[1], names.length - 2);
                },
                hide: function (email) {
                    this.reset(email);
                    this.render();
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

            // DnD support
            var zone = dropzone.add(this);
            this.listenTo(zone, 'drop', function (files) {
                _(files).each(function (file) {
                    this.model.postMessage({ content: '' }, file);
                }, this);
            });
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
            this.$toolbar = new ToolbarView({ point: 'io.ox/chat/detail/toolbar', title: gt('Chat actions') });
            this.chatMemberview = new ChatMember({ collection: this.model.members });
            this.$el.append(
                $('<div class="header">').append(
                    new ChatAvatar({ model: this.model }).render().$el,
                    (this.model.isPrivate() ?
                        // private chat
                        this.renderTitle() :
                        // groups / channels
                        $('<div>').append(
                            this.renderTitle().addClass('small-line'),
                            this.chatMemberview.render().$el
                        )
                    )
                    .addClass('flex-grow flex-center-vertically'),
                    // burger menu (pull-right just to have the popup right aligned)
                    this.$dropdown = $('<div class="dropdown">').append(
                        $('<button type="button" class="btn btn-link dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">').attr('title', gt('More actions'))
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
                var $container = $('<div class="editor-container">').append(
                    $('<div class="reference-container">'),
                    this.$editor = $('<textarea rows="1">').attr({
                        'aria-label': gt('Message'),
                        'placeholder': gt('Message'),
                        'maxlength': data.serverConfig.maxMsgLength
                    })
                );
                var send = $('<button type="button" class="btn btn-link pull-right send-btn">').attr('aria-label', gt('Send'))
                    .append($('<i class="fa fa-paper-plane" aria-hidden="true">').attr('title', gt('Send')));
                var cancel = $('<button type="button" class="btn btn-link cancel-btn">').attr('aria-label', gt('Cancel'))
                    .append($('<i class="fa fa-times" aria-hidden="true">').attr('title', gt('Cancel')));
                var attachment = $('<button type="button" class="btn btn-link pull-right file-upload-btn">').attr('aria-label', gt('Upload file'))
                    .append($('<i class="fa fa-paperclip" aria-hidden="true">').attr('title', gt('Upload file')));
                var input = $('<input type="file" class="file-upload-input hidden" multiple>');

                return [attachment, input, $container, cancel, send];
            }

            if (this.model.get('type') === 'channel') {
                return $('<button type="button" class="btn btn-default btn-action join">')
                .attr({ 'data-cmd': 'join-channel', 'data-id': this.model.get('roomId') })
                .append(gt('Join'));
            }
        },

        updateEditor: function () {
            var $controls = this.$('.controls');
            $controls.empty().append(this.renderEditor());
        },

        renderDropdown: function () {

            var $ul = $('<ul class="dropdown-menu dropdown-menu-right">'),
                model = this.model,
                isActive = model.isActive(),
                isNew = model.isNew(),
                id = model.id;

            if (!isNew && isActive) {
                var title = model.isFavorite() ? gt('Remove from favorites') : gt('Add to favorites');
                addItem($ul, title, 'toggle-favorite', id);
            }
            if (!isNew && (model.isPrivate() || model.isGroup() || (model.isChannel() && model.isMember())) && isActive) {
                addItem($ul, gt('Close chat'), 'unsubscribe-chat', id);
            }
            if ((model.isGroup() || model.isChannel()) && model.isMember()) {
                addItem($ul, gt('Edit chat'), 'edit-group-chat', id);
            }
            if (!model.isPrivate() && model.isMember()) {
                addItem($ul, gt('Leave chat'), model.isChannel() ? 'leave-channel' : 'leave-group', id);
            } else if (model.isChannel() && !model.get('active')) {
                addItem($ul, gt('Join chat'), 'join-channel', id);
            }

            function addItem($ul, text, cmd, id) {
                $ul.append(
                    $('<li role="presentation">').append(
                        $('<a href="#" role="button">').attr({ 'data-cmd': cmd, 'data-id': id }).text(text)
                    )
                );
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

        onMessageDelete: function (model) {
            // success will trigger a message:changed event on the websocket. This takes care of view updates etc
            api.deleteMessage(model).fail(function () {
                yell('error', gt('The message could not be deleted.'));
            });
        },

        onCancelSpecialMode: function () {
            this.$editor.val('').focus();
            if (this.$messageReference) this.$messageReference.remove();
            this.$('.controls').removeClass('edit-mode reply-mode system text preview emoji');
            this.specialMode = false;
            this.messageReference = null;
        },

        onMessageEdit: function (model) {
            //clean up
            this.onCancelSpecialMode();
            var messageNode = this.getMessageNode(model);
            // scroll to edited message
            if (messageNode) {
                this.$scrollpane.scrollTop(messageNode[0].offsetTop - this.$scrollpane.height() + messageNode.height() + 4);
            }
            this.$editor.val(model.get('content')).focus();
            this.$('.controls').addClass('edit-mode');
            this.specialMode = 'edit';
            this.messageReference = model;
        },

        onMessageReply: function (model) {

            // clean up
            this.onCancelSpecialMode();

            // scroll to quoted message
            var $el = this.getMessageNode(model);
            if ($el.length) $el[0].scrollIntoView(false);

            var user = data.users.getByMail(model.get('sender'));

            this.specialMode = 'reply';
            this.messageReference = model;
            this.$messageReference = $('<div class="message-quote">').append(
                $('<div class="sender">').text(user.getName()),
                new ContentView({ model: model, inEditor: true }).render().$el
            );

            this.$('.controls').addClass('reply-mode');
            this.$('.reference-container').empty().append(this.$messageReference);
            this.$editor.focus();
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
                // shift + enter appends newline
                // other modifiers don't do anything to avoid unwanted messages
                if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
                e.preventDefault();
                this.onSend();
                this.$editor.focus().trigger('input');
            }
        },

        onEditorInput: function () {
            var textarea = this.$editor[0],
                value = textarea.value;
            textarea.style.height = 'auto';
            var scrollHeight = textarea.scrollHeight;
            textarea.style.height = (scrollHeight) + 'px';
            this.onTyping(value !== '');
        },

        onTyping: _.throttle(function (state) {
            api.typing(this.model.id, state);
        }, 2500, { trailing: false }),

        onTriggerFileupload: function () {
            this.$('.file-upload-input').trigger('click');
        },

        onFileupload: function () {
            var $input = this.$('.file-upload-input'),
                files = _.toArray($input[0].files),
                sizeLimit = data.serverConfig.maxFileSize || -1;

            if (sizeLimit > 0) {
                for (var i = 0; i < files.length; i++) {
                    if (files[i].size > sizeLimit) {
                        notifications.yell('error', gt('The file "%1$s" cannot be uploaded because it exceeds the maximum file size of %2$s', files[i].name, strings.fileSize(sizeLimit)));
                        $input.val('');
                        return;
                    }
                }
            }

            files.forEach(function (file) {
                this.model.postMessage({ content: '' }, file);
            }.bind(this));

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

        onSend: function () {
            var text = this.$editor.val();
            if (text.trim().length > 0) this.onPostMessage(text);
            this.$editor.val('');
        },

        onPostMessage: function (content) {
            var maxMessageLength = data.serverConfig.maxMsgLength || -1;

            if (maxMessageLength > 0 && (content.length > maxMessageLength)) {
                notifications.yell('error', gt('The message cannot be sent because it exceeds the maximum message length of %1$s characters.', maxMessageLength));
                return;
            }

            // reset and fetch messages when in search and collection is not complete
            if (!this.model.messages.nextComplete) {
                this.model.messages.reset();
                this.model.messages.fetch();
            }

            api.typing(this.model.id, false);

            if (this.specialMode === 'edit') {
                //this.messageReference.set({ content: content, edited: true });
                api.editMessage(content, this.messageReference).fail(this.model.handleError);
                this.onCancelSpecialMode();
            } else if (this.specialMode === 'reply') {
                this.model.postMessage({ content: content, replyTo: this.messageReference.attributes });
                this.onCancelSpecialMode();
            } else {
                var message = { content: content };
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

        onChangeRoomId: function () {
            $('[data-cid=' + this.model.cid + ']').attr('data-cid', this.model.get('roomId'));
        },

        markMessageAsRead: function () {
            if (this.hidden) return;
            if (!this.model.isMember()) return;
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
        }
    });

    return ChatView;
});
