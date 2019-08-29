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
    'io.ox/contacts/api',
    'io.ox/backbone/views/toolbar',
    'settings!io.ox/core',
    'less!io.ox/chat/style'
], function (ext, data, events, FloatingWindow, EmptyView, ChatView, ChatListView, ChannelList, History, FileList, searchView, SearchResultView, contactsAPI, ToolbarView, settings) {

    'use strict';

    var Window = FloatingWindow.View.extend({

        events: function () {
            return _.extend(FloatingWindow.View.prototype.events, {
                'keydown .left-navigation': 'onLeftNavigationKeydown',
                'keydown .overlay': 'onOverlayEvent',
                'click .overlay': 'onOverlayEvent'
            });
        },

        initialize: function () {

            FloatingWindow.View.prototype.initialize.apply(this, arguments);

            this.listenTo(data.chats, 'unseen', function (count) {
                this.setCount(count);
            });

            this.listenTo(events, 'cmd', this.onCommand);
        },

        setCount: function (count) {
            this.model.set('count', count);
        },

        onCommand: function (data) {
            switch (data.cmd) {
                case 'start-chat': this.startChat(data); break;
                case 'open-group-dialog': this.openGroupDialog(data); break;
                case 'leave-group': this.leaveGroup(data.id); break;
                case 'start-private-chat': this.startPrivateChat(data); break;
                case 'join-channel': this.joinChannel(data); break;
                case 'show-chat': this.showChat(data.id || data.cid, data.messageId); break;
                case 'close-chat': this.closeChat(); break;
                case 'show-recent-conversations': this.showRecentConversations(); break;
                case 'show-channels': this.showChannels(); break;
                case 'show-all-files': this.showAllFiles(); break;
                case 'show-file': this.showFile(data); break;
                case 'open-chat': this.toggleChat(data.id, true); break;
                case 'unsubscribe-chat': this.toggleChat(data.id, false); break;
                case 'add-member': this.addMember(data.id); break;
                case 'switch-to-floating': this.toggleWindowMode('floating'); break;
                // no default
            }
        },

        startChat: function () {
            var self = this;

            require(['io.ox/contacts/addressbook/popup'], function (picker) {
                picker.open(
                    function callback(items) {
                        var members = _(items).pluck('email');
                        if (members.length === 1) return self.startPrivateChat({ email: members[0] });
                        data.chats.addAsync({ type: 'group', members: members }).done(function (result) {
                            self.showChat(result.id);
                        });
                    },
                    {
                        help: false,
                        build: function () {
                            this.$el.addClass('ox-chat-popup');
                        },
                        useGABOnly: true,
                        title: 'Start new conversation',
                        button: 'Start conversation'
                    }
                );
            });
        },

        openGroupDialog: function (data) {
            var self = this;

            require(['io.ox/chat/actions/openGroupDialog'], function (openGroupDialog) {
                openGroupDialog(data.id, data.type).then(function (id) {
                    self.showChat(id);
                });
            });
        },

        startPrivateChat: function (cmd) {
            // try to reuse chat
            var chat = data.chats.find(function (model) {
                return model.get('type') === 'private' && model.get('members').indexOf(cmd.email) >= 0;
            });
            if (chat) return this.showChat(chat.id);

            data.chats.addAsync({ type: 'private', members: [cmd.email] }).done(function (result) {
                this.showChat(result.id);
            }.bind(this));
        },

        leaveGroup: function (groupId) {
            data.chats.get(groupId).destroy();
            this.closeChat();
        },

        joinChannel: function (cmd) {
            data.chats.joinChannel(cmd.id);
            this.showChat(cmd.id);
        },

        showChat: function (id, messageId) {
            var view = new ChatView({ room: id, messageId: messageId });
            this.$rightside.empty().append(view.render().$el);
            this.$body.addClass('open');
            view.scrollToBottom();
        },

        closeChat: function () {
            this.$rightside.empty();
            this.$body.removeClass('open');
        },

        showRecentConversations: function () {
            this.$body.addClass('open');
            this.$rightside.empty().append(new History().render().$el);
        },

        showChannels: function () {
            this.$body.addClass('open');
            this.$rightside.empty().append(new ChannelList().render().$el);
        },

        showAllFiles: function () {
            this.$body.addClass('open');
            this.$rightside.empty().append(new FileList().render().$el);
        },

        showFile: function (cmd) {
            var options = {
                files: data.files.map(function (file) {
                    return _.extend({
                        url: file.getPreviewUrl(),
                        // try to fake mail compose attachement
                        space: true
                    }, file.pick('name', 'size', 'id'));
                }),
                opt: {
                    disableFolderInfo: true,
                    disableFileDetail: true
                },
                selection: {
                    id: data.files.at(cmd.index).get('id')
                }
            };

            require(['io.ox/core/viewer/main'], function (Viewer) {
                var viewer = new Viewer();
                // disable file details: data unavailbale for mail attachments
                viewer.launch(options);
            });
        },

        onLeftNavigationKeydown: function (e) {
            if (e.which !== 38 && e.which !== 40) return;
            e.preventDefault();
            var items = this.$('.left-navigation [data-cmd]'),
                index = items.index(document.activeElement) + (e.which === 38 ? -1 : +1);
            index = Math.max(0, Math.min(index, items.length - 1));
            items.eq(index).focus().click();
        },

        onOverlayEvent: function (e) {
            if ((e.type === 'click' && $(e.target).is('.overlay')) || e.which === 27) return this.closeFile();
            if (e.which !== 37 && e.which !== 39) return;
            this.moveFile(e.which === 37 ? -1 : +1);
        },

        toggleChat: function (id, state) {
            var model = data.chats.get(id);
            if (!model) return;
            model.toggle(state);
            this.$body.toggleClass('open', state);
            if (state) this.showChat(id); else this.$rightside.empty();
        },

        addMember: function (id) {
            var model = data.chats.get(id);
            if (!model) return;
            require(['io.ox/contacts/addressbook/popup'], function (picker) {
                picker.open(
                    function callback(items) {
                        var ids = _(items).pluck('user_id');
                        model.addMembers(ids);
                    },
                    {
                        help: false,
                        build: function () {
                            this.$el.addClass('ox-chat-popup');
                        },
                        useGABOnly: true,
                        title: 'Add members',
                        button: 'Add'
                    }
                );
            });
        },

        toggleWindowMode: function (mode) {
            win.model.set(mode, true);
            settings.set('chat/mode', mode).save();
            this.$body.toggleClass('columns', mode === 'sticky');
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
                settings.set('chat/width', this.$body.width()).save();
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

        draw: function () {
            var user = data.users.getByMail(data.user.email),
                mode = settings.get('chat/mode') || 'sticky';

            data.session.connectSocket();

            contactsAPI.on('reset:image update:image', updatePicture);

            function updatePicture() {
                $('.picture').replaceWith(
                    contactsAPI.pictureHalo(
                        $('<div class="picture" aria-hidden="true">'), { internal_userid: user.id }, { width: 40, height: 40 }
                    )
                );
            }

            // start with BAD style and hard-code stuff
            this.$body.empty().addClass('ox-chat').toggleClass('columns', mode === 'sticky').width(settings.get('chat/width', 320)).append(
                this.getResizeBar(),
                $('<div class="chat-leftside">').append(
                    $('<div class="header">').append(
                        contactsAPI.pictureHalo(
                            $('<div class="picture" aria-hidden="true">'), { internal_userid: user.id }, { width: 40, height: 40 }
                        ),
                        $('<div class="dropdown pull-right">').append(
                            $('<button type="button" class="btn btn-default btn-circle dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">')
                                .append($('<i class="fa fa-plus" aria-hidden="true">')),
                            $('<ul class="dropdown-menu" id="new-chat-ul">').append(
                                $('<li class="dropdown-header" role="separator">').append('<span aria-hidden="true">').text('New'),
                                $('<li>').append(
                                    $('<a href="#" role="button">')
                                        .attr({ 'data-cmd': 'start-chat', 'data-id': this.model.id })
                                        .text('Private chat')
                                ),
                                $('<li>').append(
                                    $('<a href="#" role="button">')
                                        .attr({ 'data-cmd': 'open-group-dialog', 'data-id': this.model.id })
                                        .text('Group chat')
                                ),
                                $('<li>').append(
                                    $('<a href="#" role="button">')
                                        .attr({ 'data-cmd': 'open-group-dialog', 'data-id': this.model.id, 'data-type': 'channel' })
                                        .text('Public channel')
                                )
                            )
                        ),
                        $('<i class="fa state online fa-check-circle" aria-hidden="true">'),
                        $('<div class="name">').text(user.getName())
                    ),
                    new ToolbarView({ point: 'io.ox/chat/list/toolbar', title: 'Chat actions' }).render(new ext.Baton()).$el,
                    new searchView().render().$el,
                    $('<div class="left-navigation">').append(
                        // search results
                        new SearchResultView().render().$el,
                        // chats
                        new ChatListView({ collection: data.chats }).render().$el
                    ),
                    // recent, all channels, all files
                    $('<div class="navigation-actions">').append(
                        $('<button type="button" class="btn-nav" data-cmd="show-recent-conversations">').append(
                            $('<i class="fa fa-clock-o btn-icon">'),
                            $.txt('Recent conversations')
                        ),
                        $('<button type="button" class="btn-nav" data-cmd="show-channels">').append(
                            $('<i class="fa fa-hashtag btn-icon">'),
                            $.txt('All channels')
                        ),
                        $('<button type="button" class="btn-nav" data-cmd="show-all-files">').append(
                            $('<i class="fa fa-paperclip btn-icon">'),
                            $.txt('All files')
                        )
                    )
                ),
                this.$rightside = $('<div class="chat-rightside">').append(
                    new EmptyView().render().$el
                )
            );
        },

        drawAuthorizePane: function (errorMessage) {
            var self = this,
                mode = settings.get('chat/mode') || 'sticky';
            this.$body.empty().addClass('ox-chat').toggleClass('columns', mode === 'sticky').width(settings.get('chat/width', 320)).append(
                $('<div class="auth-container">').append(
                    $('<div>').append(
                        $('<button class="btn btn-primary">').text('Authorize').on('click', function () {
                            self.$body.empty().parent().busy();
                            data.session.login().then(function success() {
                                self.draw();
                            }, function fail() {
                                self.drawAuthorizePane('Cannot connect. Please try again later.');
                            }).always(function () {
                                self.$body.parent().idle();
                            });
                        }),
                        $('<div class="text-danger">').text(errorMessage)
                    )
                )
            );
        }

    });

    var win;

    ext.point('io.ox/chat/list/toolbar').extend({
        id: 'switch-to-floating',
        index: 100,
        prio: 'hi',
        mobile: 'lo',
        custom: true,
        draw: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="switch-to-floating">').append(
                    $('<i class="fa fa-external-link" aria-hidden="true">')
                )
            );
        }
    });

    ext.point('io.ox/chat/list/toolbar').extend({
        id: 'create-new',
        index: 200,
        prio: 'lo',
        mobile: 'lo',
        custom: true,
        draw: function () {
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="start-chat">').text('Create new chat').on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/list/toolbar').extend({
        id: 'create-group',
        index: 300,
        prio: 'lo',
        mobile: 'lo',
        custom: true,
        draw: function () {
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="open-group-dialog">').text('Create new group').on('click', events.forward)
            );
        }
    });

    ext.point('io.ox/chat/list/toolbar').extend({
        id: 'create-channel',
        index: 400,
        prio: 'lo',
        mobile: 'lo',
        custom: true,
        draw: function () {
            this.attr('data-prio', 'lo').append(
                $('<a href="#" role="menuitem" draggable="false" tabindex="-1" data-cmd="open-group-dialog" data-type="channel">').text('Create new channel').on('click', events.forward)
            );
        }
    });

    var mode = settings.get('chat/mode') || 'sticky';

    win = new Window({ title: 'OX Chat', floating: mode === 'floating', sticky: mode === 'sticky', stickable: true }).render().open();
    win.listenTo(win.model, 'change:sticky', function () {
        if (!this.model.get('sticky')) return;
        settings.set('chat/mode', 'sticky').save();
        this.$body.addClass('columns');
    });

    win.$body.parent().busy();

    data.fetchUsers().then(function () {
        return data.session.autologin();
    }).always(function () {
        win.$body.parent().idle();
    }).then(function success() {
        win.draw();
    }, function fail() {
        win.$body.parent().idle();
        win.drawAuthorizePane();
    });

    ox.chat = {
        data: data
    };

});
