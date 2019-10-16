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
    'io.ox/chat/views/avatar'
], function (DisposableView, data, Avatar) {

    'use strict';

    var emojiRegex = new RegExp('^[\\u{1f300}-\\u{1f5ff}\\u{1f900}-\\u{1f9ff}\\u{1f600}-\\u{1f64f}\\u{1f680}-\\u{1f6ff}\\u{2600}-\\u{26ff}\\u{2700}-\\u{27bf}\\u{1f1e6}-\\u{1f1ff}\\u{1f191}-\\u{1f251}\\u{1f004}\\u{1f0cf}\\u{1f170}-\\u{1f171}\\u{1f17e}-\\u{1f17f}\\u{1f18e}\\u{3030}\\u{2b50}\\u{2b55}\\u{2934}-\\u{2935}\\u{2b05}-\\u{2b07}\\u{2b1b}-\\u{2b1c}\\u{3297}\\u{3299}\\u{303d}\\u{00a9}\\u{00ae}\\u{2122}\\u{23f3}\\u{24c2}\\u{23e9}-\\u{23ef}\\u{25b6}\\u{23f8}-\\u{23fa}]{1,3}$', 'u');

    function isOnlyEmoji(str) {
        return emojiRegex.test(str);
    }

    return DisposableView.extend({

        className: 'messages',

        initialize: function (options) {
            this.options = options;

            this.listenTo(this.collection, {
                'update': this.onAdd,
                'reset': this.onReset,
                'remove': this.onRemove,
                'change:body': this.onChangeBody,
                'change:fileId': this.onChangeBody,
                'change:time': this.onChangeTime,
                'change:state': this.onChangeDelivery
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

        renderMessage: function (model) {
            var message = $('<div class="message">')
                // here we use cid instead of id, since the id might be unknown
                .attr('data-cid', model.cid)
                .addClass(model.get('type'))
                .toggleClass('myself', !model.isSystem() && model.isMyself())
                .toggleClass('highlight', !!model.get('id') && model.get('id') === this.messageId)
                .toggleClass('emoji', isOnlyEmoji(model.getBody()))
                .append(
                    // sender avatar & name
                    this.renderSender(model),
                    // message boby
                    $('<div class="content">').append(
                        $('<div class="body">')
                            .html(model.getBody())
                            .append(this.renderFoot(model))
                    ),
                    //delivery state
                    $('<div class="fa delivery">').addClass(model.get('state'))
                );

            if (model.get('id') === this.messageId) delete this.messageId;

            var date = this.renderDate(model);
            if (date) return [date, message];
            return message;
        },

        renderFoot: function (model) {
            return $('<div class="foot">').append(
                // time
                $('<div class="time">').text(model.getTime())
            );
        },

        renderSender: function (model) {
            if (model.isSystem() || model.isMyself() || model.hasSameSender(this.options.limit)) return $();
            var user = data.users.getByMail(model.get('sender'));
            return [new Avatar({ model: user }).render().$el, $('<div class="sender">').text(user.getName())];
        },

        renderDate: function (model) {
            var index = model.collection.indexOf(model),
                prev = index === 0 ? undefined : model.collection.at(index - 1),
                start = this.options.limit ? Math.max(0, model.collection.length - this.options.limit) : 0;

            if (index !== start && moment(prev.get('sent')).startOf('day').isSameOrAfter(moment(model.get('sent')).startOf('day'))) return;

            var date = moment(model.get('sent'));

            var formattedDate = date.calendar(null, {
                sameDay: '[Today]',
                lastDay: '[Yesterday]',
                lastWeek: 'LL',
                sameElse: 'LL'
            });

            return $('<div class="date">').html(formattedDate);
        },

        onAdd: function (collection, options) {
            var added = options.changes.added;
            if (added.length === 0) return;

            var lastAdded = added[added.length - 1];
            var firstPrev = collection.at(collection.indexOf(lastAdded) + 1);
            if (firstPrev && moment(lastAdded.get('sent')).startOf('day').isSame(moment(firstPrev.get('sent')).startOf('day'))) {
                $('.messages').find('[data-cid=' + firstPrev.cid + ']')
                    .prev().remove().end()
                    .replaceWith(this.renderMessage(firstPrev));
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

        onChangeBody: function (model) {
            var $message = this.getMessageNode(model);
            var $body = $message.find('.body');
            $message
                .removeClass('system text image file audio')
                .addClass(model.isSystem() ? 'system' : model.get('type'));
            $body
                .html(model.getBody())
                .append(this.renderFoot(model));
        },

        onChangeTime: function (model) {
            this.getMessageNode(model, '.time').text(model.getTime());
        },

        onChangeDelivery: function (model) {
            this.getMessageNode(model, '.delivery').attr('class', 'fa delivery ' + model.get('state'));
        }

    });

});
