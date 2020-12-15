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

define('io.ox/chat/main', [
    'io.ox/core/extensions',
    'io.ox/chat/api',
    'io.ox/chat/data',
    'io.ox/chat/events',
    'io.ox/backbone/views/window',
    'io.ox/chat/views/empty',
    'io.ox/chat/views/chat',
    'io.ox/chat/views/chatList',
    'io.ox/chat/views/channelList',
    'io.ox/chat/views/history',
    'io.ox/chat/views/fileList',
    'io.ox/chat/views/search',
    'io.ox/chat/views/searchResult',
    'io.ox/chat/util/url',
    'io.ox/contacts/api',
    'io.ox/backbone/views/toolbar',
    'io.ox/backbone/views/modal',
    'io.ox/chat/views/avatar',
    'io.ox/switchboard/presence',
    'io.ox/core/yell',
    'settings!io.ox/chat',
    'gettext!io.ox/chat',
    'less!io.ox/chat/style',
    'io.ox/chat/commands'
], function (ext, api, data, events, FloatingWindow, EmptyView, ChatView, ChatListView, ChannelList, History, FileList, searchView, SearchResultView, url, contactsAPI, ToolbarView, ModalDialog, AvatarView, presence, yell, settings, gt) {

    'use strict';

    var point = ext.point('io.ox/contacts/addressbook-popup-single');
    point.disable('tokenview')
    .disable('footer')
    .extend({
        id: 'single-selection',
        after: 'list',
        render: function () {
            this.listView.selection.pickSingle = function (node) {
                this.selectNone();
                this.check(node);
            };
            this.listView.selection.isMultiple = function () { return false; };
        }
    });

    var Window = FloatingWindow.View.extend({

        events: function () {
            return _.extend(FloatingWindow.View.prototype.events, {
                'keydown .left-navigation': 'onLeftNavigationKeydown',
                'keydown .overlay': 'onOverlayEvent',
                'click .overlay': 'onOverlayEvent'
                // We need to solve this differently
                // these lines conflict with the "show-chat" command
                // users might not be able to switch between certain chats
                // 'focus ul[role="listbox"] > li': 'onFocus',
                // 'click ul[role="listbox"] > li': 'onClick'
            });
        },

        initialize: function () {

            FloatingWindow.View.prototype.initialize.apply(this, arguments);

            this.listenTo(this.model, {
                'change:sticky': this.toggleWindowMode,
                'open': this.showApp,
                'quit': this.hideApp
            });

            // give the model a unique identifer to find it
            this.model.set('app', 'io.ox/chat', { silent: true });

            this.listenTo(events, 'cmd', this.onCommand);

            this.listenTo(settings, 'change:groupByType', function () {
                this.$body.find('.left-navigation').replaceWith(this.getLeftNavigation());
            });

            this.listenTo(settings, 'change:density', this.onChangeDensity);

            this.listenTo(data.chats, 'remove', this.onRemoveFromCollection);
            this.listenTo(data.channels, 'remove', this.onRemoveFromCollection);

            this.state = '{}';

            // alias to make window manager happy
            this.show = this.showApp;
        },

        setState: function (state, payload) {
            var stringified = JSON.stringify(state);
            if (this.state === stringified) return;
            this.state = stringified;
            this.onChangeState(_.extend(state, payload));
        },

        onStick: function () {
            var cid = this.getCurrentMessageCid();
            FloatingWindow.View.prototype.onStick.apply(this);
            this.scrollToMessage(cid);
        },

        setCount: function (count) {
            this.model.set('count', count);
        },

        onCommand: function (data) {
            switch (data.cmd) {
                case 'start-private-chat': this.startPrivateChat(data); break;
                case 'edit-group-chat': this.editGroupChat(data); break;
                case 'leave-group': this.leaveGroup(data.id); break;
                case 'open-private-chat': this.openPrivateChat(data); break;
                case 'view-channel': this.viewChannel(data); break;
                case 'join-channel': this.joinChannel(data); break;
                case 'leave-channel': this.leaveChannel(data.id); break;
                case 'show-chat': this.showChat(data.id || data.cid, data); break;
                case 'close-chat': this.closeChat(); break;
                case 'delete-chat': this.deleteChat(data); break;
                case 'show-history': this.showHistory(); break;
                case 'show-channels': this.showChannels(); break;
                case 'show-all-files': this.showAllFiles(); break;
                case 'show-file': this.showFile(data); break;
                case 'show-message-file': this.showMessageFile(data); break;
                case 'open-chat': this.resubscribeChat(data.id); break;
                case 'unsubscribe-chat': this.unsubscribeChat(data.id); break;
                case 'add-member': this.addMember(data.id); break;
                case 'switch-to-floating': this.model.set('sticky', false); break;
                case 'discard-app': this.hideApp(); break;
                case 'toggle-favorite': this.toggleFavorite(data.id); break;
                case 'download': this.download(data); break;
                // no default
            }
        },

        startPrivateChat: function () {
            var self = this;

            require(['io.ox/contacts/addressbook/popup'], function (picker) {
                picker.open(
                    function callback(items) {
                        if (items.length === 0) return;
                        var members = _(items).pluck('email');
                        return self.openPrivateChat({ email: members[0] });
                    },
                    {
                        help: false,
                        build: function () {
                            this.$el.addClass('ox-private-chat-popup');
                            // super hacky, but works for the moment
                            this.renderItems = _.wrap(this.renderItems, function (renderItems, list, options) {
                                list = list.filter(function (data) {
                                    return data.user_id !== ox.user_id;
                                });
                                return renderItems.call(this, list, options);
                            });
                        },
                        title: gt('Start new conversation'),
                        button: gt('Start conversation'),
                        point: 'io.ox/contacts/addressbook-popup-single'
                    }
                );
            });
        },

        editGroupChat: function (data) {
            var self = this;
            require(['io.ox/chat/actions/openGroupDialog'], function (openGroupDialog) {
                openGroupDialog(_(data).pick('id', 'type')).then(function (id) {
                    self.showChat(id);
                });
            });
        },

        openPrivateChat: function (cmd) {

            if (!cmd.email) return console.error('openPrivateChat(): Missing email address');
            if (api.isMyself(cmd.email)) return;

            var chat = data.chats.findPrivateRoom(cmd.email);

            if (chat) {
                if (!chat.get('active')) this.resubscribeChat(chat.get('roomId'));
                // we need to fall back to the cid in case, the room has not been saved yet
                return this.showChat(chat.get('roomId') || chat.cid, { model: chat });
            }

            // open temporary chat (until first message)
            var members = {};
            members[api.userId] = 'admin';
            members[cmd.email] = 'member';
            var room = new data.ChatModel({ type: 'private', members: members, active: true });
            this.setState({ view: 'chat', temporary: true, member: cmd.email }, { model: room });
        },

        leaveGroup: function (groupId) {
            new ModalDialog({
                point: 'io.ox/chat/actions/confirmLeavingGroup',
                backdrop: true,
                title: gt('Leave chat'),
                description: gt('Do you really want to leave the chat?')
            })
            .addCancelButton()
            .addButton({ action: 'continue', label: gt('Leave') })
            .on('continue', function () {
                data.chats.leaveGroup(groupId);
            })
            .open();
        },

        viewChannel: function (cmd) {
            // give model in options otherwise functions only look in already joined chats collection
            this.showChat(cmd.id, { model: data.channels.get(cmd.id) });
        },

        joinChannel: function (cmd) {
            data.channels.joinChannel(cmd.id);
            this.showChat(cmd.id);
        },

        leaveChannel: function (id) {
            data.chats.leaveChannel(id);
            this.closeChat();
        },

        onChangeState: function (state) {

            this.$rightside.empty();
            this.$body.toggleClass('open', state.view !== 'empty');
            this.clearActiveSelection();

            switch (state.view) {
                case 'empty':
                    this.$rightside.append(new EmptyView().render().$el);
                    break;
                case 'chat':
                    var view = new ChatView(_(state).pick('roomId', 'messageId', 'reference', 'model'));
                    this.showApp();
                    this.$rightside.append(view.render().$el);
                    view.trigger('appended');
                    view.scrollToBottom();
                    if (state.roomId) {
                        this.resetCount(state.roomId, state.model);
                        this.$body.find('.chat-leftside li[data-cid="' + state.roomId + '"]').attr('tabindex', 0).addClass('active');
                        settings.set('lastRoomId', state.roomId).save();
                    }
                    break;
                case 'history':
                    this.$rightside.append(new History().render().$el);
                    break;
                case 'channels':
                    this.$rightside.append(new ChannelList().render().$el);
                    break;
                case 'files':
                    this.$rightside.append(new FileList().render().$el);
                    break;
                // no default
            }
        },

        showChat: function (id, opt) {
            this.setState(_.extend({ view: 'chat', roomId: id }, _(opt).pick('messageId', 'reference', 'model')));
        },

        closeChat: function () {
            this.setState({ view: 'empty' });
        },

        deleteChat: function (cmd) {
            var room = data.chats.get(cmd.id);
            if (room.isGroup()) return api.deleteGroup(cmd.id);

            room.destroy({ wait: true });
            this.closeChat();
        },

        onRemoveFromCollection: function (model) {
            var state = JSON.parse(this.state);
            if (state.roomId === model.get('roomId')) this.closeChat();
        },

        showHistory: function () {
            this.setState({ view: 'history' });
        },

        showChannels: function () {
            this.setState({ view: 'channels' });
        },

        showAllFiles: function () {
            this.setState({ view: 'files' });
        },

        clearActiveSelection: function () {
            this.$leftside.find('li[role="option"]').each(function () {
                $(this).attr('tabindex', -1).removeClass('active');
            });
        },

        showFile: function (cmd) {
            this.openPictureViewer(data.files, cmd.fileId);
        },

        showMessageFile: function (cmd) {
            // TODO: consider pagination for non-prototype implementation
            var files = new data.RoomFilesCollection([], { roomId: cmd.roomId, fileId: cmd.fileId });
            files.fetch();

            files.initialized.then(function () {
                this.openPictureViewer(files, cmd.fileId);
            }.bind(this));
        },

        openPictureViewer: function (fileList, selectedFile) {

            // Viewer needs handling for JWT images, for now only request one image at a time
            var files = [fileList.get(selectedFile)];

            var promises = files.map(function (file) {
                return url.request(file.getFileUrl()).then(function (url) {
                    return {
                        id: file.get('fileId'),
                        name: file.get('name'),
                        size: file.get('size'),
                        url: url,
                        // try to fake mail compose attachment
                        space: true
                    };
                }, function () {
                    yell('error', gt('The file could not be loaded.'));
                });
            });

            $.when(require(['io.ox/core/viewer/main']), $.when.apply(null, promises)).then(function (Viewer) {
                var fileList = Array.prototype.slice.call(arguments);
                fileList.shift();

                // remove files that couldn't be loaded
                fileList = _.compact(fileList);
                // no files to show? no need to open the viewer
                if (fileList.length === 0) return;

                var viewer = new Viewer();
                // disable file details: data unavailable for mail attachments
                viewer.launch({
                    files: fileList,
                    opt: { disableFolderInfo: true, disableFileDetail: true },
                    selection: { id: selectedFile }
                });
            });
        },

        onLeftNavigationKeydown: function (e) {
            if (!/^(13|32|38|40)$/.test(e.which)) return;

            e.preventDefault();

            // Cursor up / down
            if (/^(38|40)$/.test(e.which)) {
                var items = this.$('.left-navigation [role="option"]'),
                    index = items.index(document.activeElement) + (e.which === 38 ? -1 : +1);
                index = Math.max(0, Math.min(index, items.length - 1));
                items.eq(index).focus();
            }

            // Enter / space
            if (/^(13|32)$/.test(e.which)) this.onClick(e);

        },

        onClick: function (e) {
            e.stopPropagation();
            _.defer(function () { this.$rightside.find('textarea').trigger('focus'); }.bind(this));
        },

        onFocus: function (e) {
            var node = $(e.currentTarget);
            var data = node.data();
            if (!node.hasClass('active')) return data.cmd === 'show-chat' ? this.showChat(data.cid, data) : this.openPrivateChat(data);
        },

        resetCount: function (roomId, model) {
            model = data.chats.get(roomId) || model;
            model.set('unreadCount', 0);
        },

        onOverlayEvent: function (e) {
            if ((e.type === 'click' && $(e.target).is('.overlay')) || e.which === 27) return this.closeFile();
            if (e.which !== 37 && e.which !== 39) return;
            this.moveFile(e.which === 37 ? -1 : +1);
        },

        unsubscribeChat: function (roomId) {
            var model = data.chats.get(roomId);
            if (!model) return;
            model.toggleRecent();
            this.closeChat();
        },

        resubscribeChat: function (roomId) {
            var model = data.chats.get(roomId);
            model.toggleRecent().then(
                this.showChat.bind(this, roomId)
            );
        },

        toggleFavorite: function (roomId) {
            var model = data.chats.get(roomId);
            if (model) model.toggleFavorite();
        },

        toggleWindowMode: function () {
            var mode = this.model.get('sticky') ? 'sticky' : 'floating';
            var cid = this.getCurrentMessageCid();
            settings.set('mode', mode).save();
            this.$body.toggleClass('columns', mode === 'sticky');
            this.scrollToMessage(cid);
        },

        // we offer this via command because it's needed at different places, e.g. messages and file overview
        download: function (data) {
            api.downloadFile(data.url);
        },

        getCurrentMessageCid: function () {
            if (this.$body.find('.controls').length === 0) return;

            var height = this.$body.find('.scrollpane').height(),
                currentMessage;
            this.$body.find('.message').each(function () {
                var top = $(this).position().top;
                var isReply = $(this).hasClass('replied-to-message');
                if (!isReply && top < height) currentMessage = $(this);
            });

            return currentMessage ? currentMessage.attr('data-cid') : undefined;
        },

        scrollToMessage: function (cid) {
            if (!cid) return;

            var scrollpane = this.$body.find('.scrollpane'),
                position = 0xFFFF,
                elem = this.$body.find('[data-cid="' + cid + '"]'),
                delta = elem.position().top - scrollpane.height() + elem.height(),
                margin = elem.is(':last-child') ? 25 : 8;

            position = scrollpane.scrollTop() + delta;
            scrollpane.scrollTop(position + margin);
        },

        getResizeBar: (function () {

            var cursorStart,
                baseWidth,
                MAX_WIDTH = 500,
                MIN_WIDTH = 240;

            function populateResize() {
                // trigger generic resize event so that other components can respond to it
                $(document).trigger('resize');
            }

            function mousemove(e) {
                var deltaX = -(e.pageX - cursorStart),
                    width = baseWidth + deltaX;
                width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
                this.$body.width(width);
                populateResize();
            }

            function mouseup() {
                $(document).off('mousemove.resize mouseup.resize');
                populateResize();
                settings.set('width', this.$body.width()).save();
            }

            function mousedown(e) {
                e.preventDefault();
                cursorStart = e.pageX;
                baseWidth = this.$body.width();
                $(document).on({
                    'mousemove.resize': mousemove.bind(this),
                    'mouseup.resize': mouseup.bind(this)
                });
            }

            return function () {
                return $('<div class="resizebar">').on('mousedown.resize', mousedown.bind(this));
            };
        }()),

        hideApp: function () {
            if (this.$el.is(':visible')) this.$el.hide(); else this.$body.hide();
            this.model.set('minimized', true);
            return this;
        },

        showApp: function () {
            this.$el.show();
            this.$body.show();
            this.model.set('minimized', false);
            return this;
        },

        draw: function () {

            var user = data.users.getByMail(api.userId),
                mode = settings.get('mode', 'sticky');

            // start with BAD style and hard-code stuff
            this.$body.empty().addClass('ox-chat').toggleClass('columns', mode === 'sticky').width(settings.get('width', 320)).append(
                this.getResizeBar(),
                this.$leftside = $('<div class="chat-leftside">').addClass('density-' + settings.get('density', 'default')).append(
                    $('<div class="header">').append(
                        $('<div class="picture">').append(
                            new AvatarView({ model: user }).render().$el,
                            presence.getPresenceIcon(user.get('email'))
                        ),
                        $('<div class="dropdown pull-right action-button-rounded">').append(
                            $('<button type="button" class="btn btn-link dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">').attr('aria-label', gt('New'))
                                .append($('<i class="fa fa-plus" aria-hidden="true">').attr('title', gt('New'))),
                            $('<ul class="dropdown-menu" role="menu">').append(
                                //#. title of a dropdown. This text is followed by 'Private chat', 'Group chat' and 'Public channel'
                                $('<li class="dropdown-header" role="separator">').append('<span aria-hidden="true">').text(gt('New')),
                                $('<li role="presentation">').append(
                                    $('<a href="#" role="menuitem">')
                                    .attr({ 'data-cmd': 'start-private-chat', 'data-id': this.model.id })
                                        .text(gt('Private chat'))
                                ),
                                $('<li role="presentation">').append(
                                    $('<a href="#" role="menuitem">')
                                        .attr({ 'data-cmd': 'edit-group-chat', 'data-id': this.model.id })
                                        .text(gt('Group chat'))
                                ),
                                $('<li role="presentation">').append(
                                    $('<a href="#" role="menuitem">')
                                        .attr({ 'data-cmd': 'edit-group-chat', 'data-id': this.model.id, 'data-type': 'channel' })
                                        .text(gt('Channel'))
                                )
                            )
                        ),
                        $('<div class="name">').text(user.getName())
                    ),
                    new ToolbarView({ point: 'io.ox/chat/list/toolbar', title: 'Chat actions' }).render(new ext.Baton()).$el,
                    new searchView().render().$el,
                    this.getLeftNavigation(),
                    // recent, all channels, all files
                    $('<div class="navigation-actions">').append(
                        $('<button type="button" class="btn-nav" data-cmd="show-channels">').append(
                            $('<i class="fa fa-hashtag btn-icon" aria-hidden="true">'),
                            $.txt(gt('All channels'))
                        ),
                        $('<button type="button" class="btn-nav" data-cmd="show-all-files">').append(
                            $('<i class="fa fa-paperclip btn-icon" aria-hidden="true">'),
                            $.txt(gt('All files'))
                        ),
                        $('<button type="button" class="btn-nav" data-cmd="show-history">').append(
                            $('<i class="fa fa-clock-o btn-icon" aria-hidden="true">'),
                            // Was "Chat History"; lets try "History" (because we have Chats & Channels)
                            //#. A list (history) of older chats, like the browser history of visited sites
                            $.txt(gt('History'))
                        )
                    )
                ),
                this.$rightside = $('<div class="chat-rightside">')
            );

            this.onChangeDensity();

            // load chat rooms here -- not in every ChatListView
            _.delay(this.onChatsLoaded.bind(this));
        },

        onChatsLoaded: function () {
            var showLastRoom = settings.get('selectLastRoom', true);
            var lastRoomId = showLastRoom && settings.get('lastRoomId');
            var room = lastRoomId && data.chats.get(lastRoomId);
            if (room && room.isActive()) return this.showChat(lastRoomId);
            // fill right side only if not selecting last room (to avoid flicker)
            this.$rightside.append(new EmptyView().render().$el);
        },

        getLeftNavigation: function () {
            var $el = $('<div class="left-navigation">').append(
                new SearchResultView().render().$el,
                new ChatListView({ collection: data.chats, filter: function (m) { return m.isFavorite(); }, header: gt('Favorites') }).render().$el
            );
            if (settings.get('groupByType', false)) {
                // by type
                $el.append(
                    new ChatListView({ collection: data.chats, filter: function (m) { return !m.isFavorite() && m.isPrivate(); }, header: gt('Private chats') }).render().$el,
                    //#. one ot the headlines when chats are grouped by type (group chats, private chats, channels)
                    new ChatListView({ collection: data.chats, filter: function (m) { return !m.isFavorite() && m.isGroup(); }, header: gt('Group chats') }).render().$el,
                    new ChatListView({ collection: data.chats, filter: function (m) { return !m.isFavorite() && m.isChannel(); }, header: gt('Channels') }).render().$el
                );
            } else {
                // one view for all (default)
                $el.append(
                    new ChatListView({ collection: data.chats, filter: function (m) { return !m.isFavorite(); }, header: gt('Chats') }).render().$el
                );
            }
            return $el;
        },

        drawAuthorizePane: function (errorMessage) {
            var self = this,
                mode = settings.get('mode', 'sticky');
            this.$body.empty().addClass('ox-chat').toggleClass('columns', mode === 'sticky').width(settings.get('width', 320)).append(
                $('<div class="auth-container">').append(
                    $('<div>').append(
                        $('<button class="btn btn-primary">').text(gt('Authorize')).on('click', function () {
                            self.$body.empty().parent().busy();
                            data.session.getUserId()
                            .then(function () {
                                return data.chats.fetch();
                            })
                            .then(function success() {
                                self.draw();
                                self.ready.resolveWith(self);
                            })
                            .fail(function fail(err) {
                                self.drawAuthorizePane(err.message || gt('Cannot connect. Please try again later.'));
                            })
                            .always(function () {
                                self.$body.parent().idle();
                            });
                        }),
                        $('<div class="text-danger">').text(errorMessage)
                    )
                )
            );
        },

        onChangeDensity: function () {
            this.$body.find('.chat-leftside')
                .removeClass('density-default density-compact density-detailed')
                .addClass('density-' + settings.get('density', 'default'));
        }

    });

    var win;

    ext.point('io.ox/chat/list/toolbar').extend({
        id: 'create',
        index: 100,
        prio: 'hi',
        title: gt('New Chat'),
        dropdown: 'io.ox/chat/list/toolbar/create',
        caret: false,
        customize: function () {
            this.siblings('.dropdown-menu');
        }
    });

    ext.point('io.ox/chat/list/toolbar').extend({
        id: 'switch-to-floating',
        index: 200,
        prio: 'hi',
        mobile: 'lo',
        custom: true,
        draw: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="button" draggable="false" tabindex="-1" data-cmd="switch-to-floating">').attr('aria-label', gt('Detach window')).append(
                    $('<i class="fa fa-window-maximize" aria-hidden="true">').attr('title', gt('Detach window'))
                )
            );
        }
    });

    ext.point('io.ox/chat/list/toolbar/create').extend({
        id: 'caption',
        index: 100,
        custom: true,
        draw: function () {
            this.append(
                //#. title of a dropdown. This text is followed by 'Private chat', 'Group chat' and 'Public channel'
                $('<li class="dropdown-header" role="separator">').append('<span aria-hidden="true">').text(gt('New'))
            );
        }
    });

    ext.point('io.ox/chat/list/toolbar/create').extend({
        id: 'create-new',
        index: 200,
        custom: true,
        draw: function () {
            this.append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="start-private-chat" data-action="null">').text(gt('Private chat'))
            );
        }
    });

    ext.point('io.ox/chat/list/toolbar/create').extend({
        id: 'create-group',
        index: 300,
        custom: true,
        draw: function () {
            this.append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="edit-group-chat" data-action="null">').text(gt('Group chat'))
            );
        }
    });

    ext.point('io.ox/chat/list/toolbar/create').extend({
        id: 'create-channel',
        index: 400,
        custom: true,
        draw: function () {
            this.append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="edit-group-chat" data-type="channel" data-action="none">').text(gt('Channel'))
            );
        }
    });

    var dataReady = data.fetchUsers()
        .catch($.noop)
        .then(function () {
            return data.session.getUserId();
        })
        .then(function () {
            return data.chats.fetch();
        })
        .then(function () {
            require(['io.ox/chat/notifications']);
        });

    ox.chat = {
        data: data
    };

    var app = ox.ui.createApp({
        name: 'io.ox/chat',
        id: 'io.ox/chat',
        title: 'Chat'
    });

    app.setLauncher(function () {

        var mode = settings.get('mode', 'sticky');

        win = new Window({
            title: 'OX Chat',
            sticky: mode === 'sticky',
            showInTaskbar: false,
            stickable: true,
            resizable: false,
            closable: true,
            size: 'width-lg',
            quitOnEscape: false
        })
        .render().open();

        // don't use setWindow method. Has to much overhead for the rather special chat window
        this.set('window', win);

        app.settings = settings;

        // add some scaffold css now to avoid invisible busy spinner (width 0px etc)
        win.$body.addClass('ox-chat').toggleClass('columns', mode === 'sticky').width(settings.get('width', 320)).parent().busy();

        return dataReady
            .always(function () {
                win.$body.parent().idle();
            })
            .done(function () {
                win.draw();
            })
            .fail(function () {
                win.$body.parent().idle();
                win.drawAuthorizePane();
            });
    });

    app.setResume(function () {
        win.model.trigger('open');
    });

    return {
        getApp: app.getInstance
    };
});
