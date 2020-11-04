/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/views/content', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/file',
    'io.ox/chat/data',
    'io.ox/chat/util',
    'settings!io.ox/chat',
    'gettext!io.ox/chat'
], function (DisposableView, FileView, data, util, settings, gt) {

    'use strict';

    var initialChunkSize = settings.get('messageChunkLoadSize', 500);

    var ContentView = DisposableView.extend({

        className: 'content',

        events: {
            'click .show-more': 'onShowMore'
        },

        initialize: function (options) {
            this.options = _.extend({ inEditor: false }, options);
            this.inEditor = this.options.inEditor;
            this.listenTo(this.model, {
                'change:content': this.onChangeBody,
                'change:time': this.onChangeTime,
                'change:deliveryState': this.onChangeDelivery,
                'change:flags': this.onChangeFlags
            });
            this.listenTo(this.model, 'change:deliveryState', this.onChangeFlags);
            this.chunkSize = initialChunkSize;
            this.$file = $();
            this.$body = $('<div class="body">');
            this.$flags = $('<div class="flags">');
        },

        render: function () {
            this.$file = new FileView({ model: this.model, inEditor: this.inEditor }).render().$el;
            this.renderBody();
            if (!this.inEditor) {
                this.renderFlags();
                this.$el.append(this.renderQuote(), this.$file, this.$body, this.$flags);
            } else {
                this.$el.append(this.$file, this.$body);
            }
            return this;
        },

        renderQuote: function () {

            var replyTo = this.model.get('replyTo');
            if (!replyTo || replyTo.deleted) return;

            var replyModel = new data.MessageModel(replyTo);
            replyModel.set('roomId', this.model.get('roomId'));
            var user = data.users.getByMail(replyModel.get('sender'));

            return $('<div class="message-quote">').append(
                $('<div class="sender">').text(user.getName()),
                new ContentView({ model: replyModel }).render().$el
            );
        },

        renderBody: function () {

            var deleted = this.model.isDeleted();

            this.$body
                .toggleClass('deleted', deleted)
                .toggleClass('emoji', !deleted && this.model.isEmoji())
                .empty();

            var content = this.renderContent();
            // +350 so that if we load a message, we load at least 500 more chars a not only e.g. 10
            if (content.length <= (this.chunkSize + 350)) return this.$body.html(content);

            return this.$body.html(content.slice(0, this.chunkSize) + '...').append(
                !this.inEditor ? $('<button type="button" class="btn btn-link show-more">').text(gt('Show more')) : $()
            );
        },

        renderContent: function () {
            var model = this.model;
            if (model.get('cancelled')) return gt('Sending has been cancelled');
            if (model.isDeleted()) return gt('This message was deleted');
            if (model.isSystem()) return model.getSystemMessage();
            return model.getFormattedBody();
        },

        onShowMore: function () {
            this.chunkSize += 3 * initialChunkSize;
            this.$('.body').replaceWith(this.renderBody());
        },

        renderFlags: function () {
            this.$flags.empty();
            // text is the better icon
            var failed = this.model.get('deliveryState') === 'failed';
            if (failed) return this.$flags.append($('<span class="flag-failed">').text(gt('Delivery failed')));
            var edited = !this.model.isDeleted() && this.model.isEdited();
            if (edited) this.$flags.append($('<span>').text('Edited'));
        },

        onChangeBody: function () {
            this.renderBody();
        },

        onChangeTime: function () {
            this.$('.time').text(this.model.getTime());
        },

        onChangeFlags: function () {
            this.$('.flags').replaceWith(this.renderFlags());
        }
    });

    return ContentView;
});
