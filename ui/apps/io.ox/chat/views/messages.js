/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/chat/views/messages', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/data',
    'io.ox/chat/views/avatar',
    'io.ox/core/extensions',
    'gettext!io.ox/chat',
    'io.ox/chat/events',
    'io.ox/chat/util',
    'io.ox/backbone/mini-views/dropdown',
    'settings!io.ox/chat'
], function (DisposableView, data, Avatar, ext, gt, events, util, Dropdown, settings) {

    'use strict';

    ext.point('io.ox/chat/message/menu').extend({
        id: 'edit',
        index: 100,
        draw: function (baton) {
            // we cannot edit pictures or system mesages
            // we can only edit our own messages
            if (baton.model.get('type') !== 'text' || !baton.model.isMyself()) return;
            this.append($('<li role="presentation">').append($('<a href="#" role="menuitem" tabindex="-1">').text(gt('Edit message')).on('click', function () {
                baton.view.trigger('editMessage', baton.model);
            })));
        }
    });

    ext.point('io.ox/chat/message/menu').extend({
        id: 'delete',
        index: 200,
        draw: function (baton) {
            // we can only delete our own messages
            if (!baton.model.isMyself()) return;
            this.append($('<li role="presentation">').append($('<a href="#" role="menuitem" tabindex="-1">').text(gt('Delete message')).on('click', function () {
                baton.view.trigger('delete', baton.model);
            })));
        }
    });

    ext.point('io.ox/chat/message/menu').extend({
        id: 'reply',
        index: 300,
        draw: function (baton) {
            // no reply to for own messages
            if (baton.model.isMyself()) return;
            this.append($('<li role="presentation">').append($('<a href="#" role="menuitem" tabindex="-1">').text(gt('Reply')).on('click', function () {
                baton.view.trigger('replyToMessage', baton.model);
            })));
        }
    });

    return DisposableView.extend({

        className: 'messages',

        initialize: function (options) {
            this.options = options;
            this.room = this.options.room;
            this.isChannel = this.room.isChannel();
            this.listenTo(this.collection, {
                'expire': this.onExpire,
                'update': this.onAdd,
                'reset': this.onReset,
                'remove': this.onRemove,
                'change:content': this.onChangeBody,
                'change:files': this.onChangeBody,
                'change:time': this.onChangeTime,
                'change:deliveryState': this.onChangeDelivery
            });
            this.listenTo(events, {
                'message:changed': this.onMessageChanged
            });
            this.$el.on('dblclick', function () {
                $(this).toggleClass('visible-bubbles');
            });
        },

        render: function () {
            this.$el.empty().append(
                this.collection
                    .chain()
                    .filter(this.options.filter)
                    .last(this.options.limit || Infinity)
                    // call renderMessage this way to avoid unexpected parameter values (e.g. noDate)
                    .map(function (model) { return this.renderMessage(model); }, this)
                    .flatten()
                    .value()
            );
            return this;
        },

        renderMessage: function (model, showDate) {

            var deleted = model.isDeleted(),
                messageId = model.get('messageId'),
                replyTo = model.get('replyTo');

            var message = $('<div class="message">')
                // here we use cid instead of id, since the id might be unknown
                .attr('data-cid', model.cid)
                .addClass(model.getType())
                .toggleClass('user', model.isUser())
                .toggleClass('myself', (!model.isSystem() || deleted) && model.isMyself())
                .toggleClass('highlight', !!messageId && messageId === this.messageId)
                .toggleClass('emoji', !deleted && model.isEmoji())
                .toggleClass('deleted', deleted)
                .toggleClass('editable', model.isEditable())
                .toggleClass('reply', !_.isEmpty(replyTo) && !replyTo.deleted)
                .append(
                    // sender avatar & name
                    this.renderSender(model),
                    this.renderUploadMessage(model),
                    // replied to message
                    $('<div class="content">').append(
                        this.renderReply(model),
                        // message body
                        this.renderBody(model)
                    ),
                    // show some indicator dots when a menu is available
                    this.renderMenu(model),
                    // delivery state
                    !this.isChannel ? $('<div class="fa delivery" aria-hidden="true">').addClass(model.getDeliveryState()) : $()
                );

            if (messageId === this.messageId) delete this.messageId;

            var date = showDate !== false && this.renderDate(model);
            if (date) return [date, message];

            return message;
        },

        renderReply: function (model) {

            if (!model.get('replyTo') || model.get('replyTo').deleted) return '';

            var replyModel = new data.MessageModel(model.get('replyTo'));
            replyModel.set('roomId', model.get('roomId'));

            var user = data.users.getByMail(replyModel.get('sender')),
                replyBody = this.renderMessageContent(replyModel);

            return $('<div class="quote">').append(
                $('<div class="sender">').text(user.getName()),
                $('<div class="content">').html(replyBody)
            );
        },

        renderMessageContent: function (model) {
            if (model.isSystem()) return model.getSystemMessage();
            else if (model.hasPreview()) return model.getFilesPreview();
            else if (model.isFile()) return util.getFileText({ model: model });
            return model.getFormattedBody();
        },

        renderBody: function (model, lastIndex) {
            var el = $('<div class="body">'),
                chunkSize = lastIndex ? lastIndex : settings.get('messageChunkLoadSize', 500),
                body = this.renderMessageContent(model);

            // +350 so that if we load a message, we load at least 500 more chars a not only e.g. 10
            if (body.length <= chunkSize + 350) return el.html(body).append(this.renderFlags(model));

            var showMoreNode = $('<button type="button" class="btn btn-link show-more">').text(gt('Show more')).on('click', function () {
                chunkSize += 3 * settings.get('messageChunkLoadSize', 500);
                this.getMessageNode(model).find('.body').replaceWith(this.renderBody(model, chunkSize));
            }.bind(this));

            return el.html(body.slice(0, chunkSize) + '...').append(showMoreNode, this.renderFlags(model));
        },

        renderMenu: function (model) {
            if (this.options.hideActions) return '';
            if (model.isSystem()) return '';
            var toggle = $('<button type="button" class="btn btn-link dropdown-toggle actions-toggle" aria-haspopup="true" data-toggle="dropdown">')
                    .attr('title', gt('Message actions'))
                    .append($('<i class="fa fa-bars" aria-hidden="true">')),
                menu = $('<ul class="dropdown-menu dropdown-menu-right">'),
                dropdown = new Dropdown({
                    className: 'message-actions-dropdown dropdown',
                    smart: true,
                    $toggle: toggle,
                    $ul: menu
                });
            ext.point('io.ox/chat/message/menu').invoke('draw', menu, ext.Baton({ view: this, model: model }));
            return dropdown.render().$el;
        },

        renderFlags: function (model) {
            var flags = [];
            var deleted = model.get('deleted');
            if (deleted) flags.push($('<i class="fa fa-ban" aria-hidden="true">'));
            var edited = !deleted && model.get('edited');
            if (edited) flags.push($('<i class="fa fa-pencil" aria-hidden="true">').attr('title', gt('Message was edited')));
            if (!flags.length) return;
            return $('<span class="flags">').append(flags);
        },

        renderUploadMessage: function (model) {
            var isMultiple = this.isMultipleUpload(this.options.limit, model),
                user = data.users.getByMail(model.get('sender'));
            //#. %1$s: User name of the person that uploaded files
            if (!model.isMyself() && isMultiple) this.$el.find('.upload').last().text(gt('%1$s uploaded files', user.getName()));
            if (model.isMyself() || !model.get('files') || isMultiple) return $();
            //#. %1$s: User name of the person that uploaded a file
            return $('<div class="upload">').text(gt('%1$s uploaded a file', user.getName()));
        },

        isMultipleUpload: function (limit, model) {
            limit = limit ? this.collection.length - limit : 0;
            var index = this.collection.indexOf(model);
            if (index <= limit) return false;
            var prev = this.collection.at(index - 1);
            return prev.get('sender') === model.get('sender') && prev.get('files') && model.get('files') && true;
        },

        renderSender: function (model) {
            if (model.isSystem()) return $();
            if (model.hasSameSender(this.options.limit)) return $();
            var user = data.users.getByMail(model.get('sender'));
            return [
                new Avatar({ model: user }).render().$el,
                $('<div class="sender">').append(
                    $('<span class="name">').text(user.getName()),
                    $('<span class="time">').text(model.getTime())
                )
            ];
        },

        getPrevModel: function (current) {
            var index = this.collection.indexOf(current);
            var filter = this.options.filter;
            while (--index >= 0) {
                var prev = this.collection.at(index);
                if (!filter || filter(prev)) return prev;
            }
        },

        renderDate: function (model) {
            var prev = this.getPrevModel(model);
            var current = moment(model.get('date'));
            if (prev && moment(prev.get('date')).startOf('day').isSame(current.startOf('day'))) return;
            var formattedDate = current.calendar(null, {
                sameDay: '[' + gt('Today') + ']',
                lastDay: '[' + gt('Yesterday') + ']',
                //#. %1$s is a weekday, e.g Monday.
                //#. "Last" must be in square brackets
                lastWeek: gt('[Last] %1$s', 'dddd'),
                sameElse: 'l'
            });
            return $('<div class="date-container">').append(
                $('<div class="date">').text(formattedDate)
            );
        },

        onExpire: function () {
            this.collection.expired = false;
        },

        onAdd: function (collection, options) {
            var added = options.changes.added;
            if (added.length === 0) return;

            var lastAdded = added[added.length - 1];
            var firstPrev = collection.at(collection.indexOf(lastAdded) + 1);
            if (firstPrev && moment(lastAdded.get('date')).startOf('day').isSame(moment(firstPrev.get('date')).startOf('day'))) {
                var $firstPrev = $('.messages').find('[data-cid=' + firstPrev.cid + ']'),
                    $daylabel = $firstPrev.prev();
                if ($daylabel.hasClass('date')) {
                    $daylabel.remove();
                    $firstPrev.replaceWith(this.renderMessage(firstPrev));
                }
            }

            // special case when there is a limit. calculating diffs is too complicated
            // and it is fast enough to just rerender, if there is a limit
            if (this.options.limit || this.options.filter) return this.render();

            this.trigger('before:add', added);

            added.forEach(function (model) {
                var index = collection.indexOf(model), node = this.renderMessage(model);
                if (index === 0) return this.$el.prepend(node);
                if (index === collection.length - 1) return this.$el.append(node);

                var prev = collection.at(index - 1), sibling = this.$('[data-cid="' + prev.cid + '"]');
                if (sibling.length) return sibling.after(node);
                var next = collection.at(index + 1);
                sibling = this.$('[data-cid="' + next.cid + '"]');
                if (sibling.length) return sibling.before(node);
            }.bind(this));

            this.trigger('after:add', added);
        },

        onReset: function () {
            if (this.disposed) return;
            this.$el.empty();
            var collection = this.collection;
            this.onAdd(collection, { changes: { added: collection.toArray() } });
        },

        onRemove: function (model) {
            this.getMessageNode(model).remove();
        },

        getMessageNode: function (model, selector) {
            return this.$('.message[data-cid="' + model.cid + '"] ' + (selector || ''));
        },

        // currently used when the message changed it's type. We replace the entire node then
        onMessageChanged: function (model) {
            var $message = this.getMessageNode(model);
            if ($message.length) $message.replaceWith(this.renderMessage(model, false));
        },

        onChangeBody: function (model) {
            var $message = this.getMessageNode(model);
            // We don't want to change replied to messages, that also have a body
            var $body = $message.find('.body:not(.replied-to)');
            $message
                .removeClass('system text preview')
                .addClass(model.getType())
                .toggleClass('emoji', model.isEmoji());
            $body
                .html(this.renderMessageContent(model))
                .append(this.renderFlags(model));
        },

        onChangeTime: function (model) {
            this.getMessageNode(model, '.time').text(model.getTime());
        },

        onChangeDelivery: function (model) {
            this.getMessageNode(model, '.delivery').attr('class', 'fa delivery ' + model.getDeliveryState());
        }

    });

});
