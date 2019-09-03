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

    return DisposableView.extend({

        className: 'messages',

        initialize: function (options) {
            this.options = options;

            this.listenTo(this.collection, {
                'add': this.onAdd,
                'reset': this.onReset,
                'remove': this.onRemove,
                'change:body': this.onChangeBody,
                'change:fileId': this.onChangeBody,
                'change:time': this.onChangeTime,
                'change:state': this.onChangeDelivery
            });

            this.updateDelivery = _.debounce(this.updateDelivery.bind(this), 10);
        },

        render: function () {
            this.$el.empty().append(
                this.collection.last(this.options.limit || Infinity).map(this.renderMessage, this)
            );
            return this;
        },

        renderMessage: function (model) {
            // mark message as seen as soon as it is rendered
            if (model.get('state') !== 'seen' && model.get('senderId').toString() !== data.user_id.toString()) this.updateDelivery(model, 'seen');
            return $('<div class="message">')
                // here we use cid instead of id, since the id might be unknown
                .attr('data-cid', model.cid)
                .addClass(model.get('type'))
                .toggleClass('myself', !model.isSystem() && model.isMyself())
                .toggleClass('highlight', !!model.get('id') && model.get('id') === this.messageId)
                .append(
                    this.renderDateInformation(model),
                    // sender avatar & name
                    this.renderSender(model),
                    // message boby
                    $('<div class="content">').append(
                        $('<div class="body">').html(model.getBody()),
                        $('<div class="foot">').append(
                            // time
                            $('<div class="time">').text(model.getTime()),
                            // delivery state
                            $('<div class="fa delivery">').addClass(model.get('state'))
                        )
                    )
                );
        },

        renderSender: function (model) {
            if (model.isSystem() || model.isMyself() || model.hasSameSender(this.options.limit)) return $();
            var user = data.users.getByMail(model.get('sender'));
            return [new Avatar({ model: user }).render().$el, $('<div class="sender">').text(user.getName())];
        },

        renderDateInformation: function (model) {
            var index = model.collection.indexOf(model),
                prev = index === 0 ? undefined : model.collection.at(index - 1),
                start = this.options.limit ? model.collection.length - this.options.limit : 0;

            if (index === start || moment(prev.get('sent')).startOf('day').isBefore(moment(model.get('sent')).startOf('day'))) {
                var date = moment(model.get('sent'));

                var formattedDate = date.calendar(null, {
                    sameDay: '[Today]',
                    lastDay: '[Yesterday]',
                    lastWeek: '[Last] dddd',
                    sameElse: 'LL'
                });

                return $('<div class="date">').html(formattedDate);
            }

            return $();
        },

        updateDelivery: function (model, state) {
            model.updateDelivery(state);
        },

        onAdd: _.debounce(function (model, collection, options) {
            // need to check if view is not disposed since this function is debounced
            if (this.disposed) return;

            // special case when there is a limit. calculating diffs is too complicated
            // and it is fast enough to just rerender, if there is a limit
            if (this.options.limit) return this.render();

            var added = options.changes.added;
            if (added.length === 0) return;

            this.trigger('before:add', added);

            added.forEach(function (model) {
                var index = collection.indexOf(model);
                if (index === 0) return this.$el.prepend(this.renderMessage(model));

                var prev = collection.at(index - 1);
                this.$('[data-cid="' + prev.cid + '"]').after(this.renderMessage(model));
            }.bind(this));

            this.trigger('after:add', added);
        }, 1),

        onReset: function () {
            if (this.disposed) return;
            this.$el.empty();
            var collection = this.collection;
            this.onAdd(undefined, collection, { changes: { added: collection.toArray() } });
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
            $body.html(model.getBody());
        },

        onChangeTime: function (model) {
            this.getMessageNode(model, '.time').text(model.getTime());
        },

        onChangeDelivery: function (model) {
            this.getMessageNode(model, '.delivery').attr('class', 'fa delivery ' + model.get('state'));
        }

    });

});
