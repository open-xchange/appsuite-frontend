/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/chat/views/content', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/file',
    'io.ox/chat/data',
    'io.ox/chat/util',
    'io.ox/chat/system-message',
    'io.ox/chat/formatting',
    'settings!io.ox/chat',
    'gettext!io.ox/chat'
], function (DisposableView, FileView, data, util, systemMessage, formatting, settings, gt) {

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
                // type change can happen when a message is deleted file->text preview->text. behave as if the content changed
                'change:type': this.onChangeBody,
                'change:time': this.onChangeTime,
                'change:deliveryState': this.onChangeDelivery,
                'change:edited': this.onChangeFlags,
                'change:deleted': this.onChangeDeleted
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

            var model = this.model;
            var deleted = this.model.isDeleted();
            this.$body.toggleClass('deleted', deleted).empty();

            if (model.get('cancelled')) {
                this.$body.text(gt('Sending has been cancelled'));
            } else if (model.isDeleted()) {
                this.$body.text(gt('This message was deleted'));
            } else if (model.isSystem()) {
                // yes append is correct. system messages may contain html
                this.$body.append(systemMessage.render(model));
            } else {
                var content = model.getContent();
                // +350 so that if we load a message, we load at least 500 more chars a not only e.g. 10
                if (model.isSystem() || content.length <= (this.chunkSize + 350)) {
                    this.setBodyContent(content);
                } else {
                    this.setBodyContent(content.slice(0, this.chunkSize) + '...');
                    if (!this.inEditor) this.$body.append($('<button type="button" class="btn btn-link show-more">').text(gt('Show more')));
                }
            }
        },

        setBodyContent: function (content) {
            var deleted = this.model.isDeleted();
            var formatted = formatting.apply(content);
            this.$body
                .toggleClass('only-emoji', !deleted && formatted.onlyEmoji)
                .toggleClass('contains-emoji', !deleted && formatted.containsEmoji)
                .html(formatted.content);
        },

        onShowMore: function () {
            this.chunkSize += 3 * initialChunkSize;
            this.renderBody();
        },

        renderFlags: function () {
            this.$flags.empty();
            // text is the better icon
            var failed = this.model.get('deliveryState') === 'failed';
            if (failed) return this.$flags.append($('<span class="flag-failed">').text(gt('Delivery failed')));
            var edited = !this.model.isDeleted() && this.model.isEdited();
            if (edited) this.$flags.append($('<span>').text(gt('Edited')));
        },

        onChangeBody: function () {
            this.renderBody();
        },

        onChangeTime: function () {
            this.$('.time').text(this.model.getTime());
        },

        onChangeFlags: function () {
            this.renderFlags();
        },

        onChangeDeleted: function () {
            if (!this.model.isDeleted()) return;
            this.$('.message-quote').remove();
            this.$file.remove();
            this.$file = $();
            this.renderBody();
        }
    });

    return ContentView;
});
