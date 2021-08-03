/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/chat/main', [
    'io.ox/core/extensions',
    'io.ox/chat/views/launcher',
    'io.ox/chat/api',
    'io.ox/chat/data',
    'io.ox/chat/events',
    'io.ox/chat/util',
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
    'io.ox/chat/toolbar',
    'io.ox/contacts/api',
    'io.ox/backbone/views/toolbar',
    'io.ox/backbone/views/modal',
    'io.ox/chat/views/avatar',
    'io.ox/switchboard/presence',
    'io.ox/core/yell',
    'io.ox/core/a11y',
    'settings!io.ox/chat',
    'gettext!io.ox/chat',
    'less!io.ox/chat/style',
    'io.ox/chat/commands'
], function (ext, launcher, api, data, events, util, FloatingWindow, EmptyView, ChatView, ChatListView, ChannelList, History, FileList, searchView, SearchResultView, url, toolbar, contactsAPI, ToolbarView, ModalDialog, AvatarView, presence, yell, a11y, settings, gt) {

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
                'keydown .overlay': 'onOverlayEvent',
                'click .overlay': 'onOverlayEvent'
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

        switchToFloating: function () {
            var cid = this.getCurrentMessageCid();
            this.model.set('sticky', false);
            this.scrollToMessage(cid);
        },

        onStick: function () {
            var cid = this.getCurrentMessageCid();
            this.model.set('sticky', true);
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
                case 'switch-to-floating': this.switchToFloating(); break;
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
                        var email = _(items).pluck('email')[0];

                        return self.openPrivateChat({ email: email });
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
                return this.showChat(chat.get('roomId'));
            }

            var members = _.object([[api.userId, 'admin'], [cmd.email, 'member']]);
            chat = new data.ChatModel({ type: 'private', members: members, active: true });

            return chat.save().then(function success() {
                data.chats.add(chat);
                this.showChat(chat.get('roomId'));
            }.bind(this), function fail() {
                yell('error', gt('Private chat could not be created.'));
            });
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
                        this.$body.find('.accessible-list').data('plugin').set(state.roomId);
                        settings.set('lastRoomId', state.roomId).save();
                    }
                    break;
                case 'history':
                    this.$rightside.append(new History().render().$el);
                    a11y.getTabbable(this.$rightside).first().focus();
                    break;
                case 'channels':
                    this.$rightside.append(new ChannelList().render().$el);
                    a11y.getTabbable(this.$rightside).first().focus();
                    break;
                case 'files':
                    this.$rightside.append(new FileList().render().$el);
                    a11y.getTabbable(this.$rightside).first().focus();
                    break;
                // no default
            }
        },

        showChat: function (id, opt) {
            this.setState(_.extend({ view: 'chat', roomId: id }, _(opt).pick('messageId', 'reference', 'model')));
        },

        closeChat: function () {
            this.setState({ view: 'empty' });
            if (settings.get('mode') === 'sticky') {
                this.$body.find('.accessible-list [tabindex=0]').focus();
            }
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
            if (model.get('active')) return this.showChat(roomId);
            model.toggleRecent().then(
                this.showChat.bind(this, roomId)
            );
        },

        toggleFavorite: function (roomId) {
            var model = data.chats.get(roomId);
            if (model) {
                model.toggleFavorite().catch(function () {
                    if (model.isFavorite()) yell('error', gt('The chat could not be removed from favorites. Please try again.'));
                    else yell('error', gt('The chat could not be added to favorites. Please try again.'));
                });
            }
        },

        toggleWindowMode: function () {
            var mode = this.model.get('sticky') ? 'sticky' : 'floating';
            settings.set('mode', mode).save();
            this.$body.toggleClass('columns', mode === 'sticky');
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
                this.$leftside = $('<nav class="chat-leftside">').addClass('density-' + settings.get('density', 'default')).append(
                    $('<div class="header">').append(
                        $('<div class="picture">').append(
                            new AvatarView({ model: user }).render().$el,
                            presence.getPresenceIcon(user.get('email'))
                        ),
                        $('<div class="name">').text(user.getName()),
                        $('<div class="dropdown">').append(
                            $('<button type="button" class="btn btn-round dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">').attr('aria-label', gt('New'))
                                .append(
                                    util.svg({ icon: 'fa-plus', size: 16 }).attr('title', gt('New'))
                                ),
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
                        )
                    ),
                    new ToolbarView({ point: 'io.ox/chat/list/toolbar', title: 'Chat actions' }).render(new ext.Baton()).$el,
                    new searchView().render().$el,
                    this.getLeftNavigation(),
                    // recent, all channels, all files
                    $('<div class="navigation-actions">').append(
                        $('<button type="button" class="btn-nav" data-cmd="show-channels">').append(
                            util.svg({ icon: 'fa-hashtag' }).addClass('btn-icon'),
                            $.txt(gt('All channels'))
                        ),
                        $('<button type="button" class="btn-nav" data-cmd="show-all-files">').append(
                            util.svg({ icon: 'fa-paperclip' }).addClass('btn-icon'),
                            $.txt(gt('All files'))
                        ),
                        $('<button type="button" class="btn-nav" data-cmd="show-history">').append(
                            util.svg({ icon: 'fa-clock-o' }).addClass('btn-icon'),
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
            if (room && room.isActive()) {
                this.showChat(lastRoomId);
            } else {
                // fill right side only if not selecting last room (to avoid flicker)
                this.$rightside.append(new EmptyView().render().$el);
            }
            // finally set the initial focus
            a11y.getTabbable(this.$body).first().focus();
        },

        getLeftNavigation: function () {
            var $tree = $('<ul role="tree">').append(
                new SearchResultView().render().$el,
                new ChatListView({ collection: data.chats, filter: function (m) { return m.isFavorite(); }, header: gt('Favorites') }).render().$el
            );
            if (settings.get('groupByType', false)) {
                // by type
                $tree.append(
                    new ChatListView({ collection: data.chats, filter: function (m) { return !m.isFavorite() && m.isPrivate(); }, header: gt('Private chats') }).render().$el,
                    //#. one ot the headlines when chats are grouped by type (group chats, private chats, channels)
                    new ChatListView({ collection: data.chats, filter: function (m) { return !m.isFavorite() && m.isGroup(); }, header: gt('Group chats') }).render().$el,
                    new ChatListView({ collection: data.chats, filter: function (m) { return !m.isFavorite() && m.isChannel(); }, header: gt('Channels') }).render().$el
                );
            } else {
                // one view for all (default)
                $tree.append(
                    new ChatListView({ collection: data.chats, filter: function (m) { return !m.isFavorite(); }, header: gt('Chats') }).render().$el
                );
            }
            return $('<nav class="left-navigation" role="navigation">')
                .attr('aria-label', gt('Chats'))
                .append($tree)
                .makeAccessible()
                .on('select', function (e, cids) {
                    if (cids[0]) this.showChat(cids[0]);
                }.bind(this));
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
        draw: toolbar.detach
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
        // strange circular dependency we need for getCurrentFloatingApp()
        win.app = app;

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

    // custom function if chat is used in quicklaunch menu. This enables toggling instead of just opening
    // just reusing the onClick function from the original launcher should do the trick
    app.quickLaunch = launcher.prototype.onClick;

    app.setResume(function () {
        win.model.trigger('open');
    });

    return {
        getApp: app.getInstance
    };
});
