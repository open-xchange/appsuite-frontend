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
    'io.ox/chat/data',
    'io.ox/backbone/views/window',
    'io.ox/chat/views/chat',
    'io.ox/chat/views/chatList',
    'io.ox/chat/views/channelList',
    'io.ox/chat/views/history',
    'io.ox/chat/views/fileList',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'io.ox/chat/socket',
    'less!io.ox/chat/style'
], function (data, WindowView, ChatView, ChatListView, ChannelList, History, FileList, contactsAPI, contactsUtil) {

    'use strict';

    var Window = WindowView.extend({

        events: {
            'click [data-cmd]': 'onCommand',
            'keydown .left-navigation': 'onLeftNavigationKeydown',
            'keydown .overlay': 'onOverlayEvent',
            'click .overlay': 'onOverlayEvent'
        },

        initialize: function () {
            this.listenTo(data.backbone.chats, 'unseen', function (count) {
                this.setCount(count);
            });
        },

        onCommand: function (e) {
            e.preventDefault();
            var node = $(e.currentTarget), data = node.data();
            switch (data.cmd) {
                case 'start-chat': this.startChat(); break;
                case 'start-private-chat': this.startPrivateChat(data); break;
                case 'join-channel': this.joinChannel(data); break;
                case 'show-chat': this.showChat(data); break;
                case 'show-recent-conversations': this.showRecentConversations(); break;
                case 'show-channels': this.showChannels(); break;
                case 'show-all-files': this.showAllFiles(); break;
                case 'show-file': this.showFile(data); break;
                case 'prev-file': this.moveFile(-1); break;
                case 'next-file': this.moveFile(+1); break;
                case 'close-file': this.closeFile(); break;
                default: console.log('Unknown command', data.cmd, data); break;
            }
        },

        startChat: function (cmd) {
            console.log('Start chat', cmd);
        },

        startPrivateChat: function (cmd) {
            var chatId = data.backbone.chats.length + 1,
                user = data.backbone.users.get(cmd.id);
            data.backbone.chats.add({ id: chatId, type: 'private', title: user.get('name'), members: [cmd.id, 1], messages: [{ id: 1, body: 'Created private chat', type: 'system' }] });
            this.showChat({ id: chatId });
        },

        joinChannel: function (cmd) {
            console.log('joinChannel', cmd);
            var channel = data.backbone.channels.get(cmd.id);
            channel.set('subscribed', true);
            var chatId = data.backbone.chats.length + 1;
            data.backbone.chats.add({ id: chatId, type: 'channel', title: channel.get('title'), members: [1, 2, 3, 4, 5], messages: [{ id: 1, body: 'Joined channel', type: 'system' }] });
            this.showChat({ id: chatId });
        },

        showChat: function (cmd) {
            var view = new ChatView({ id: cmd.id });
            window.$rightside.empty().append(view.render().$el);
            view.scrollToBottom();
        },

        showRecentConversations: function () {
            window.$rightside.empty().append(new History().render().$el);
        },

        showChannels: function () {
            window.$rightside.empty().append(new ChannelList().render().$el);
        },

        showAllFiles: function () {
            window.$rightside.empty().append(new FileList().render().$el);
        },

        showFile: function (cmd) {
            renderOverlay().appendTo(this.$body).focus();
            this.updateFile(cmd.index);
        },

        moveFile: function (step) {
            var index = parseInt(this.$('.overlay').attr('data-index'), 10) + step;
            if (index < 0) index = data.files.length - 1; else if (index >= data.files.length) index = 0;
            this.updateFile(index);
        },

        updateFile: function (index) {
            this.$('.overlay')
                .attr('data-index', index)
                .css('backgroundImage', 'url(' + data.files[index].url + ')');
        },

        closeFile: function () {
            this.$('.overlay').remove();
            this.$el.focus();
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
        }
    });

    var window = new Window({ title: 'OX Chat' }).open(),
        user = ox.rampup.user;

    // start with BAD style and hard-code stuff

    window.$body.addClass('ox-chat').append(
        $('<div class="leftside abs">').append(
            $('<div class="header">').append(
                contactsAPI.pictureHalo(
                    $('<div class="picture" aria-hidden="true">'), user, { width: 40, height: 40 }
                ),
                $('<i class="fa state online fa-check-circle">'),
                $('<div class="name">').text(contactsUtil.getFullName(user))
            ),
            $('<div class="search">').append(
                $('<input type="text" spellcheck="false" autocomplete="false" placeholder="Search chat or contact">')
            ),
            $('<div class="left-navigation abs">').append(
                // chats
                new ChatListView({ collection: data.backbone.chats }).render().$el,
                // navigation
                $('<div class="navigation">').append(
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
            )
        ),
        window.$rightside = $('<div class="rightside abs">').append(
            $('<div class="start-chat abs">').append(
                $('<button type="button" class="btn btn-default" data-cmd="start-chat">').append(
                    $('<i class="fa fa-plus">'),
                    $('<br>'),
                    $.txt('Start new chat')
                )
            )
        )
    );

    function renderOverlay() {
        return $('<div class="overlay abs" tabindex="-1">').append(
            $('<button type="button" data-cmd="prev-file"><i class="fa fa-chevron-left"></i></button>'),
            $('<button type="button" data-cmd="next-file"><i class="fa fa-chevron-right"></i></button>'),
            $('<button type="button" data-cmd="close-file"><i class="fa fa-close"></i></button>')
        );
    }

    ox.chat = {
        backbone: data.backbone
    };

});
