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
    'io.ox/backbone/mini-views/dropdown'
], function (DisposableView, data, Avatar, ext, gt, events, util, Dropdown) {

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
        },

        render: function () {
            this.$el.empty().append(
                this.collection
                    .chain()
                    .filter(this.options.filter)
                    .last(this.options.limit || Infinity)
                    .map(this.renderMessage, this)
                    .flatten()
                    .value()
            );
            return this;
        },

        renderMessage: function (model, noDate) {
            var body = model.getBody(),
                message = $('<div class="message">')
                // here we use cid instead of id, since the id might be unknown
                .attr('data-cid', model.cid)
                .addClass(model.getType())
                .toggleClass('myself', (!model.isSystem() || model.get('deleted')) && model.isMyself())
                .toggleClass('highlight', !!model.get('messageId') && model.get('messageId') === this.messageId)
                .toggleClass('emoji', util.isOnlyEmoji(body))
                .toggleClass('deleted', !!model.get('deleted'))
                .toggleClass('has-reply', !_.isEmpty(model.get('replyTo')) && !model.get('replyTo').deleted)
                .append(
                    // sender avatar & name
                    this.renderSender(model),
                    // replied to message
                    $('<div class="content">').append(
                        this.renderReply(model),
                        // message body
                        $('<div class="body">')
                            .html(body)
                            .append(this.renderFoot(model))
                    ),
                    // show some indicator dots when a menu is available
                    this.renderMenu(model),
                    //delivery state
                    $('<div class="fa delivery" aria-hidden="true">').addClass(model.getDeliveryState())
                );

            if (model.get('messageId') === this.messageId) delete this.messageId;

            var date = this.renderDate(model);
            if (date && !noDate) return [date, message];
            return message;
        },

        renderReply: function (model) {
            if (!model.get('replyTo') || model.get('replyTo').deleted) return '';
            var replyModel = new data.MessageModel(model.get('replyTo')),
                user = data.users.getByMail(replyModel.get('sender')),
                replyBody = replyModel.getBody();

            return $('<div class="replied-to-message message">')
                .addClass(replyModel.getType())
                .toggleClass('emoji', util.isOnlyEmoji(replyBody))
                .append(
                    $('<div class="content">').append(
                        // sender name
                        $('<div class="sender">').text(user.getName()),
                        // message body
                        $('<div class="body replied-to">')
                            .html(replyBody)
                    )
                );
        },

        renderMenu: function (model) {
            if (model.isSystem()) return '';
            var toggle = $('<button type="button" class="btn btn-link dropdown-toggle actions-toggle" aria-haspopup="true" data-toggle="dropdown">')
                    .attr('title', gt('Message actions'))
                    .append($('<i class="fa fa-ellipsis-v">')),
                menu = $('<ul class="dropdown-menu">'),
                dropdown = new Dropdown({
                    className: 'message-actions-dropdown dropdown',
                    smart: true,
                    $toggle: toggle,
                    $ul: menu
                });
            ext.point('io.ox/chat/message/menu').invoke('draw', menu, ext.Baton({ view: this, model: model }));
            return dropdown.render().$el;
        },

        renderFoot: function (model) {
            return $('<div class="foot">').append(
                // time
                $('<div class="time">').text(model.getTime()),
                // flags
                $('<div class="flags">').append((model.get('edited') && !model.get('deleted')) ? $('<i class="fa fa-pencil">').attr('title', gt('Message was edited')) : '')
            );
        },

        renderSender: function (model) {
            if ((model.isSystem() && !model.get('deleted')) || model.isMyself() || model.hasSameSender(this.options.limit)) return $();
            var user = data.users.getByMail(model.get('sender'));
            return [new Avatar({ model: user }).render().$el, $('<div class="sender">').text(user.getName())];
        },

        renderDate: function (model) {
            var index = model.collection.indexOf(model),
                prev = index === 0 ? undefined : model.collection.at(index - 1),
                start = this.options.limit ? Math.max(0, model.collection.length - this.options.limit) : 0;

            if (index !== start && moment(prev.get('date')).startOf('day').isSameOrAfter(moment(model.get('date')).startOf('day'))) return;

            var date = moment(model.get('date'));

            var formattedDate = date.calendar(null, {
                sameDay: '[' + gt('Today') + ']',
                lastDay: '[' + gt('Yesterday') + ']',
                lastWeek: 'LL',
                sameElse: 'LL'
            });

            return $('<div class="date">').html(formattedDate);
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
            if ($message.length) $message.replaceWith(this.renderMessage(model, true));
        },

        onChangeBody: function (model) {
            var $message = this.getMessageNode(model);
            // We don't want to change replied to messages, that also have a body
            var $body = $message.find('.body:not(.replied-to)');
            $message
                .removeClass('system text preview')
                .addClass(model.getType())
                .toggleClass('emoji', util.isOnlyEmoji(model.getBody()));
            $body
                .html(model.getBody())
                .append(
                    this.renderFoot(model)
                );
        },

        onChangeTime: function (model) {
            this.getMessageNode(model, '.time').text(model.getTime());
        },

        onChangeDelivery: function (model) {
            this.getMessageNode(model, '.delivery').attr('class', 'fa delivery ' + model.getDeliveryState());
        }

    });

});
