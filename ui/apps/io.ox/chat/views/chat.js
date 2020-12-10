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
    'io.ox/chat/views/typing',
    'io.ox/chat/events',
    'io.ox/chat/data',
    'io.ox/chat/util',
    'io.ox/core/yell',
    'io.ox/backbone/views/toolbar',
    'gettext!io.ox/chat',
    'io.ox/core/strings',
    'io.ox/core/notifications',
    'io.ox/chat/views/dropzone'
], function (ext, api, DisposableView, Avatar, ChatAvatar, ChatMember, MessagesView, ContentView, typing, events, data, util, yell, ToolbarView, gt, strings, notifications, dropzone) {

    'use strict';

    var ChatView = DisposableView.extend({

        className: 'chat abs',

        events: {
            'keydown textarea': 'onEditorKeydown',
            'input textarea': 'onEditorInput',
            'click .send-btn': 'onSend',
            'click .toggle-emoji': 'onToggleEmoji',
            'click .file-upload-btn': 'onTriggerFileupload',
            'click .jump-down': 'onJumpDown',
            'change .file-upload-input': 'onFileupload',
            'click .cancel-btn': 'onCancelSpecialMode'
        },

        initialize: function (options) {

            this.roomId = options.roomId;
            this.messageId = options.messageId;
            this.reference = options.reference;
            this.model = this.model || data.chats.get(this.roomId);

            // we create the scrollpane early to pass it along the view chain
            // this is just an optimization for better lazyload behavior (aka less flickering)
            this.$scrollpane = $('<div class="scrollpane">').lazyloadScrollpane();
            this.messagesView = new MessagesView({ room: this.model, collection: this.model.messages, scrollpane: this.$scrollpane });

            this.listenTo(this.model, {
                'change:title': this.onChangeTitle,
                'change:favorite': this.updateDropdown,
                'change:unreadCount': this.onChangeUnreadCount,
                'change:roomId': this.onChangeRoomId,
                'change:members': this.onChangeMembers
            });

            // track whether current user is member
            this.isMember = this.model.isMember();

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
                // restore textarea height for draft content
                this.$editor.trigger('input');
            });

            this.on('dispose', this.onDispose);

            this.messagesView.messageId = this.messageId;
            // there are two cases when to reset the collection before usage
            // 1) We have a messageId but the requested messageId is not in the collection
            // 2) We don't have a messageId but the collection is not fully fetched
            if ((this.messageId && !this.model.messages.get(this.messageId)) || (!this.messageId && !this.model.messages.nextComplete)) this.model.messages.reset();
            _.delay(this.model.messages.fetch.bind(this.model.messages));

            this.$editor = $();
            this.autoScroll = _.isUndefined(options.autoScroll) ? true : options.autoScroll;

            this.onHide = this.onHide.bind(this);
            this.onShow = this.onShow.bind(this);

            $(window).on('blur', this.onHide);
            $(window).on('focus', this.onShow);

            // apply throttle within initialize other we have a shared throttled function across all instances
            this.onScroll = _.throttle(this.onScroll, 300);

            // DnD support
            var zone = dropzone.add(this);
            this.listenTo(zone, 'drop', function (files) {
                files.forEach(function (file) {
                    if (isUnderFileSizeLimit(file)) this.model.postMessage({ content: '' }, file);
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
            this.toolbar = new ToolbarView({ point: 'io.ox/chat/detail/toolbar', title: gt('Chat actions') });
            this.toolbar.render(new ext.Baton({ model: this.model, view: this.toolbar }));

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
                this.toolbar.$el,
                this.$scrollpane.on('scroll', $.proxy(this.onScroll, this)).append(
                    this.$paginatePrev = $('<div class="paginate prev">').hide(),
                    $('<div class="conversation">').append(
                        this.messagesView.render().$el,
                        new typing.View({ roomId: this.model.id }).render().$el
                    ),
                    this.$paginateNext = $('<div class="paginate next">').hide()
                ),
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
            if (this.isMember) {
                var $container = $('<div class="editor-container">').append(
                    $('<div class="reference-container">'),
                    this.$editor = $('<textarea rows="1">').attr({
                        'aria-label': gt('Message'),
                        'placeholder': gt('Message'),
                        'maxlength': data.serverConfig.maxMsgLength
                    }).val(this.model.get('draft') || '')
                );
                var send = $('<button type="button" class="btn btn-link pull-right send-btn">').attr('aria-label', gt('Send'))
                    .append($('<i class="fa fa-paper-plane" aria-hidden="true">').attr('title', gt('Send')));
                var emoji = $('<button type="button" class="btn btn-link pull-right toggle-emoji">').attr('aria-label', gt('Add emoji'))
                    .append($('<i class="fa fa-smile-o" aria-hidden="true">').attr('title', gt('Add emoji')));
                var cancel = $('<button type="button" class="btn btn-link cancel-btn">').attr('aria-label', gt('Cancel'))
                    .append($('<i class="fa fa-times" aria-hidden="true">').attr('title', gt('Cancel')));
                var attachment = $('<button type="button" class="btn btn-link pull-right file-upload-btn">').attr('aria-label', gt('Upload file'))
                    .append($('<i class="fa fa-paperclip" aria-hidden="true">').attr('title', gt('Upload file')));
                var input = $('<input type="file" class="file-upload-input hidden" multiple>');

                return [attachment, input, $container, cancel, emoji, send];
            }

            if (this.model.isChannel()) {
                return $('<button type="button" class="btn btn-default btn-action join">')
                .attr({ 'data-cmd': 'join-channel', 'data-id': this.model.get('roomId') })
                .append(gt('Join'));
            }
        },

        updateEditor: function () {
            this.$('.controls').empty().append(this.renderEditor());
        },

        renderDropdown: function () {
            var $ul = $('<ul class="dropdown-menu dropdown-menu-right">'),
                model = this.model,
                id = model.id;

            this.toolbar.$('.more-dropdown .dropdown-menu').children().toArray().forEach(function (child) {
                var $child = $(child);
                if ($child.hasClass('divider')) return addSeparator();
                var a = $child.find('a');
                if (!a.length) return;
                addItem(a.text(), a.attr('data-cmd'));
            });

            function addItem(text, cmd) {
                $ul.append(
                    $('<li role="presentation">').append(
                        $('<a href="#" role="button">').attr({ 'data-cmd': cmd, 'data-id': id }).text(text)
                    )
                );
            }

            function addSeparator() {
                $ul.append('<li class="divider" role="separator">');
            }

            return $ul;
        },

        updateDropdown: function () {
            this.toolbar.render(new ext.Baton({ model: this.model, view: this.toolbar }));
            this.$dropdown.find('.dropdown-menu').replaceWith(this.renderDropdown());
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
            if (this.specialMode === 'edit') this.$editor.val('');
            if (this.$messageReference) this.$messageReference.remove();
            this.$('.controls').removeClass('edit-mode reply-mode system text preview emoji');
            this.specialMode = false;
            this.messageReference = null;
            _.defer(function () { this.$editor.focus().trigger('input'); }.bind(this));
        },

        onMessageEdit: function (model) {
            //clean up
            this.onCancelSpecialMode();
            var messageNode = this.getMessageNode(model);
            // scroll to edited message
            if (messageNode) {
                this.$scrollpane.scrollTop(messageNode[0].offsetTop - this.$scrollpane.height() + messageNode.height() + 4);
            }
            this.specialMode = 'edit';
            this.messageReference = model;
            this.$('.controls').addClass('edit-mode');
            this.$editor.val(model.get('content')).focus().trigger('input');
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
            this.$messageReference.find('button').remove();

            this.$('.controls').addClass('reply-mode');
            this.$('.reference-container').empty().append(this.$messageReference);
        },

        scrollToBottom: function () {
            var position = 0xFFFFFF,
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
            // the first line is to set the scroll position immediately to avoid flicker
            scrollpane.scrollTop(position);
            // the second line sets the position again a few ticks later so that cached images are covered
            setTimeout(function (pos) { scrollpane.scrollTop(pos); }, 10, position);
        },

        toggleAutoScroll: function (autoScroll) {
            if (autoScroll === undefined) autoScroll = !this.autoScroll;
            this.autoScroll = autoScroll;
        },

        onEditorKeydown: function (e) {
            // esc quits edit and reply
            if (e.which === 27 && this.specialMode) {
                e.preventDefault();
                e.stopPropagation();
                this.onCancelSpecialMode();
            }
            // cursor up handling to edit last own message
            // check if user has already typed something
            if (e.which === 38 && !this.specialMode && !this.model.get('draft')) {
                var last = this.model.getLastMessageForUser(data.user.email);
                if (last) this.onMessageEdit(last);
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
            this.model.set('draft', value, { silent: true });
            textarea.style.height = 'auto';
            var scrollHeight = textarea.scrollHeight;
            textarea.style.height = (scrollHeight) + 'px';
            if (value) typing.propagate(this.model.id);
        },

        onTriggerFileupload: function () {
            this.$('.file-upload-input').trigger('click');
        },

        onFileuploadNew: function () {
            var $input = this.$('.file-upload-input');
            var files = $input[0].files;
            if (files.length <= 0) return;
            for (var i = 0; i <= files.length - 1; i++) this.model.postMessage({ content: '' }, files.item(i));
            $input.val('');
        },

        onFileupload: function () {
            var $input = this.$('.file-upload-input');
            var files = $input[0].files;
            if (files.length > 0) {
                for (var i = 0; i <= files.length - 1; i++) {
                    var file = files.item(i);
                    if (isUnderFileSizeLimit(file)) this.model.postMessage({ content: '' }, file);
                }
            }
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
            this.model.unset('draft', { silent: true });
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
                api.editMessage(content, this.messageReference).fail(this.model.handleError);
                this.onCancelSpecialMode();
            } else if (this.specialMode === 'reply') {
                var replyTo = this.messageReference.omit('edited', 'replyTo');
                this.model.postMessage({ content: content, replyTo: replyTo });
                this.onCancelSpecialMode();
            } else {
                var message = { content: content };
                if (this.reference) message.reference = this.reference;
                this.model.postMessage(message);
            }

            // remove reference preview
            this.onRemoveReference();
        },

        onChangeTitle: function (model) {
            this.$('.title').text(model.getTitle() || '\u00a0');
        },

        onChangeUnreadCount: function () {
            this.$unreadCounter.text(this.model.get('unreadCount') || '');
        },

        onChangeMembers: function () {
            var isMember = this.model.isMember();
            var changed = this.isMember !== isMember;
            this.isMember = isMember;
            if (!changed) return;
            this.updateEditor();
            this.updateDropdown();
        },

        onScroll: function () {

            if (this.disposed) return;
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
        },

        onChangeRoomId: function () {
            this.$('[data-cid=' + this.model.cid + ']').attr('data-cid', this.model.get('roomId'));
        },

        markMessageAsRead: function () {
            if (this.hidden) return;
            if (this.model.isChannel() && !this.model.isMember()) return;
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

        getMessageNode: function (model, selector) {
            return this.$('.message[data-cid="' + model.cid + '"] ' + (selector || ''));
        },

        onToggleEmoji: function () {
            if (this.emojiView) return this.emojiView.toggle();
            if (this.emojiView === false) return;
            this.emojiView = false;
            require(['io.ox/core/emoji/view'], function (EmojiView) {
                this.emojiView = new EmojiView({ closeOnInsert: true, closeOnFocusLoss: true });
                this.listenTo(this.emojiView, 'insert', this.insertEmoji);
                this.$el.append(this.emojiView.$el);
                this.emojiView.render();
            }.bind(this));
        },

        insertEmoji: function (unicode) {
            var editor = this.$editor[0];
            var value = editor.value;
            var pos = editor.selectionStart;
            var activeElement = document.activeElement;
            if (pos !== undefined) {
                editor.value = value.substr(0, pos) + unicode + value.substr(pos);
                editor.focus();
                pos += unicode.length;
                editor.setSelectionRange(pos, pos);
                if (activeElement) activeElement.focus();
            } else {
                editor.value += unicode;
            }
            this.$editor.trigger('input');
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'back',
        index: 100,
        custom: true,
        draw: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="button" draggable="false" tabindex="-1" data-cmd="close-chat">').attr('aria-label', gt('Close chat')).append(
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
            baton.view.listenTo(baton.model, 'change:title', function () {
                this.text(baton.model.getTitle());
            }.bind(this));
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
        id: 'toggle-favorite',
        index: 400,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (model.isNew() || !model.get('active')) return;
            var title = model.isFavorite() ? gt('Remove from favorites') : gt('Add to favorites');
            createMenuItem(this, 'toggle-favorite', model.id, title, 'general');
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'edit-group',
        index: 500,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.isMember() || model.isPrivate()) return;
            createMenuItem(this, 'edit-group-chat', model.id, model.isChannel() ? gt('Edit channel') : gt('Edit chat'), 'general');
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'close-chat',
        index: 600,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.get('active') || model.isNew()) return;
            createMenuItem(this, 'unsubscribe-chat', model.id, model.isChannel() ? gt('Close channel') : gt('Close chat'), 'general');
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'leave-group',
        index: 700,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.isGroup() && !model.isChannel()) return;
            if (!model.isMember()) return;
            createMenuItem(this, model.isChannel() ? 'leave-channel' : 'leave-group', model.id, model.isChannel() ? gt('Leave channel') : gt('Leave chat'), 'actions');
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'join-channel',
        index: 800,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (!model.isChannel()) return;
            if (model.isMember()) return;
            if (model.get('active')) return;
            createMenuItem(this, 'join-channel', model.id, gt('Join channel'), 'join-leave', 'actions');
        }
    });

    ext.point('io.ox/chat/detail/toolbar').extend({
        id: 'delete-room',
        index: 800,
        custom: true,
        draw: function (baton) {
            var model = baton.model;
            if (model.isPrivate()) return;
            if (!model.isMember()) return;
            if (model.isGroup() && !model.isAdmin()) return;
            if (model.isChannel() && !(model.isAdmin() || model.isCreator())) return;

            createMenuItem(this, 'delete-chat', model.id, model.isChannel() ? gt('Delete channel') : gt('Delete chat'), 'join-leave', 'delete');
        }
    });

    function createMenuItem(node, cmd, id, label, section) {
        node.attr({ 'data-prio': 'lo', 'data-section': section }).append(
            $('<a href="#" role="menuitem" draggable="false" tabindex="-1">')
            .attr({ 'data-cmd': cmd, 'data-id': id })
            .text(label)
            .on('click', events.forward)
        );
    }

    function isUnderFileSizeLimit(file) {
        var sizeLimit = data.serverConfig.maxFileSize || -1;
        if (file.size < sizeLimit) return true;
        notifications.yell('error', gt('The file "%1$s" cannot be uploaded because it exceeds the maximum file size of %2$s', file.name, strings.fileSize(sizeLimit)));
        return false;
    }

    return ChatView;
});
