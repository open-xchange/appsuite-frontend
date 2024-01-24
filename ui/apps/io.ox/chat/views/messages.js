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

define('io.ox/chat/views/messages', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/message',
    'gettext!io.ox/chat'
], function (DisposableView, MessageView, gt) {

    'use strict';

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
                'remove': this.onRemove
            });
            // TBD: fix css, then reenable
            // I guess some users on appsuite-div will accidentally enable it
            // this.$el.on('dblclick', function () {
            //     $(this).toggleClass('visible-bubbles');
            // });
        },

        render: function () {
            this.$el.empty().append(
                this.collection
                    .chain()
                    .filter(this.options.filter)
                    .last(this.options.limit || Infinity)
                    // call renderMessage this way to avoid unexpected parameter values (e.g. noDate)
                    .map(function (model) {
                        return this.renderMessage(model);
                    }, this)
                    .flatten()
                    .value()
            );
            // optimize for immediate appearance of lazyloaded images when reopening a chat
            _.defer(function () {
                if (this.disposed) return;
                this.$el.closest('.scrollpane').triggerHandler('add');
            }.bind(this));
            return this;
        },

        renderMessage: function (model, options) {
            var previous = this.getPreviousModel(model);
            options = _.extend({
                model: model,
                messageId: this.messageId,
                previous: previous,
                isChannel: this.isChannel,
                showDate: true,
                scrollpane: this.options.scrollpane
            }, options);
            var $message = new MessageView(options).render().$el;
            return options.showDate ? [this.renderDate(model), $message] : $message;
        },

        renderDate: function (model) {
            var prev = this.getPreviousModel(model);
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

        getPreviousModel: function (model) {
            var index = this.collection.indexOf(model);
            var filter = this.options.filter;
            while (--index >= 0) {
                var previous = this.collection.at(index);
                if (!filter || filter(previous)) return previous;
            }
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
                var $firstPrev = this.$('[data-cid=' + firstPrev.cid + ']'),
                    $daylabel = $firstPrev.prev();
                if ($daylabel.hasClass('date-container')) {
                    $daylabel.remove();
                    $firstPrev.replaceWith(this.renderMessage(firstPrev));
                }
            }

            // special case when there is a limit. calculating diffs is too complicated
            // and it is fast enough to just rerender, if there is a limit
            if (this.options.limit || this.options.filter) return this.render();

            this.trigger('before:add', added);

            added.forEach(function (model) {
                var index = collection.indexOf(model),
                    node = this.renderMessage(model);
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
        }
    });
});
