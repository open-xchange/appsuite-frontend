/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/chat/views/message', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/content',
    'io.ox/chat/data',
    'io.ox/chat/views/avatar',
    'io.ox/chat/events',
    'io.ox/chat/util',
    'io.ox/chat/commands',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/extensions',
    'settings!io.ox/chat',
    'gettext!io.ox/chat'
], function (DisposableView, ContentView, data, Avatar, events, util, commands, Dropdown, ext, settings, gt) {

    'use strict';

    // maybe move this to a own file when more icons are introduced
    var deliveryIcon = $(
        '<svg class="delivery" aria-hidden="true" version="1.1" viewBox="0 0 13 8" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" fill-rule="evenodd"><g transform="translate(-9 -9)"><g transform="translate(9.3308 9.482)" ' +
        'stroke="#333" stroke-linejoin="round"><polyline points="0.9132 3.738 3.2524 6.0905 8.0929 1.0988"/>' +
        '<polyline points="5.7437 4.5731 7.2524 6.0905 12 1.0988"/></g></svg>'
    );

    var MessageView = DisposableView.extend({

        className: 'message',

        initialize: function (options) {
            this.options = _.extend({ isChannel: false, showDate: true }, options);
            this.listenTo(this.model, 'change:deleted change:deliveryState change:uploading', this.onChangeState);
            this.listenTo(this.model, 'change:uploading', this.onChangeUploading);
            this.listenTo(this.model, 'change:messageId', this.onChangeMessageId);
        },

        render: function () {

            var model = this.model,
                messageId = model.get('messageId');

            // here we use cid instead of id, since the id might be unknown
            this.$el.attr('data-cid', model.cid)
                .toggleClass('system', model.isSystem())
                .toggleClass('user', model.isUser())
                .toggleClass('myself', model.isMyself())
                .toggleClass('command', model.isCommand())
                .toggleClass('highlight', !!messageId && messageId === this.options.messageId)
                .toggleClass('editable', model.isEditable())
                .append(
                    this.renderSender(),
                    this.renderContent(),
                    this.renderMenu(),
                    this.renderDeliveryState()
                );

            this.onChangeState();

            if (messageId === this.messageId) delete this.messageId;

            return this;
        },

        renderSender: function () {
            if (!this.model.isUser()) return;
            if (this.model.hasSameSender(this.options.limit)) return;
            var user = data.users.getByMail(this.model.get('sender'));
            return [
                new Avatar({ model: user, scrollpane: this.options.scrollpane }).render().$el,
                $('<div class="sender">').append(
                    // we add a space so that we get nicer result when selecting/copying text
                    $('<span class="name">').text(user.getName() + ' '),
                    user.isExternal() ? this.renderExternal(user) : $(),
                    $('<span class="time">').text(this.model.getTime())
                )
            ];
        },

        renderExternal: function (user) {
            return $('<span class="email">')
                .attr('title', gt('Messages are delivered by email.'))
                .append(
                    util.svg({ icon: 'fa-envelope-o' }),
                    $.txt(' ' + user.getEmail() + ' ')
                );
        },

        renderContent: function () {
            try {
                var command = this.model.isCommand() && JSON.parse(this.model.get('data'));
                var render = command && commands.getRender(command.type);
                return render ?
                    render({ model: this.model, command: command }) :
                    new ContentView({ model: this.model }).render().$el;
            } catch (e) {
                if (ox.debug) console.error(e);
            }
        },

        renderDeliveryState: function () {
            if (this.model.isSystem()) return;
            if (!this.model.isMyself()) return;
            var roomId = this.model.get('roomId');
            if ((data.chats.get(roomId) || data.channels.get(roomId)).isChannel()) return;
            return $(deliveryIcon).clone().addClass(this.model.getDeliveryState());
        },

        renderMenu: function () {
            if (this.options.hideActions) return;
            if (this.model.isSystem()) return;
            var toggle = $('<button type="button" class="btn btn-link dropdown-toggle actions-toggle" aria-haspopup="true" data-toggle="dropdown">')
                    .attr('title', gt('Message actions'))
                    .append(util.svg({ icon: 'fa-bars' })),
                menu = $('<ul class="dropdown-menu dropdown-menu-right">'),
                dropdown = new Dropdown({
                    className: 'message-actions-dropdown dropdown',
                    smart: true,
                    $toggle: toggle,
                    $ul: menu
                });
            ext.point('io.ox/chat/message/menu').invoke('draw', menu, ext.Baton({ view: this, model: this.model }));
            return dropdown.render().$el;
        },

        onChangeState: function () {
            var hidden = this.model.isDeleted() || this.model.isUploading() || this.model.isFailed();
            this.$('.actions-toggle, .delivery').toggleClass('hidden', hidden);
            var deliveryState = this.model.getDeliveryState();
            if (!deliveryState) return;
            this.$('.delivery').removeClass('server received seen').addClass(deliveryState);
        },

        // after files are uploaded add correct classes
        onChangeUploading: function () {
            this.$el.toggleClass('editable', this.model.isEditable());
        },

        onChangeMessageId: function () {
            if (this.model.isFile()) {
                this.$el.find('.file')
                .addClass('cursor-zoom-in').attr({
                    'data-cmd': 'show-message-file',
                    'data-room-id': this.model.get('roomId'),
                    'data-file-id': this.model.get('file').fileId,
                    'data-message-id': this.model.get('messageId')
                });
            }
        },

        renderUploadMessage: function () {
            var isMultiple = this.isMultipleUpload(this.options.limit),
                user = data.users.getByMail(this.model.get('sender')),
                isMyself = this.model.isMyself();
            //#. %1$s: User name of the person that uploaded files
            if (!isMyself && isMultiple) this.$('.upload').last().text(gt('%1$s uploaded files', user.getName()));
            if (isMyself || isMultiple || !this.model.get('file')) return $();
            //#. %1$s: User name of the person that uploaded a file
            return $('<div class="upload">').text(gt('%1$s uploaded a file', user.getName()));
        },

        isMultipleUpload: function (limit) {
            var collection = this.model.collection;
            limit = limit ? collection.length - limit : 0;
            var index = collection.indexOf(this.model);
            if (index <= limit) return false;
            var prev = collection.at(index - 1);
            return prev.get('sender') === this.model.get('sender') &&
                prev.get('file') && this.model.get('file');
        }
    });

    ext.point('io.ox/chat/message/menu').extend(
        {
            id: 'edit',
            index: 100,
            draw: function (baton) {
                // we cannot edit pictures or system mesages
                // we can only edit our own messages
                var model = baton.model;
                if (model.get('type') !== 'text') return;
                if (!model.isMyself()) return;
                this.append(createDropdownItem(gt('Edit'), baton.model, 'message:edit'));
            }
        },
        {
            id: 'reply',
            index: 200,
            draw: function (baton) {
                // we should allow replying to your own messages (useful to repeat things)
                if (baton.model.isFailed()) return;
                this.append(createDropdownItem(gt('Reply'), baton.model, 'message:reply'));
            }
        },
        {
            id: 'delete',
            index: 300,
            draw: function (baton) {
                // we can only delete our own messages
                if (!baton.model.isMyself()) return;
                this.append('<li class="divider" role="separator">');
                this.append(createDropdownItem(gt('Delete'), baton.model, 'message:delete'));
            }
        }
    );

    function createDropdownItem(text, model, command) {
        return $('<li role="presentation">').append(
            $('<a href="#" role="menuitem" tabindex="-1">').text(text)
            .on('click', { model: model }, function (e) {
                events.trigger('cmd:' + command, e.data.model);
            })
        );
    }

    return MessageView;
});
