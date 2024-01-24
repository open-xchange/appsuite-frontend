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

define('io.ox/chat/views/newConversation', [
    'io.ox/backbone/views/disposable',
    'io.ox/contacts/addressbook/popup',
    'io.ox/chat/events',
    'gettext!io.ox/chat'
], function (DisposableView, picker, events, gt) {

    'use strict';

    var NewConversationView = DisposableView.extend({

        initialize: function () {
            this.listenTo(events, {
                'cmd:new:cancel': this.onCancel,
                'cmd:new:start': this.onStart
            });
        },

        render: function () {
            this.$el.append(
                new picker.View()
                .on('render', function () {
                    this.$header.append(
                        $('<h2 class="title">').append(gt('Start new conversation'))
                    );
                    this.$footer.append(
                        $('<button type="button" class="btn btn-default" data-cmd="new:cancel">').text(gt('Cancel')),
                        $('<button type="button" class="btn btn-primary" data-cmd="new:start">').text(gt('Start conversation'))
                    );
                })
                .render().$el
            );
            return this;
        },

        onCancel: function () {
            this.trigger('cancel');
        },

        onStart: function () {
            this.trigger('done');
        }
    });

    return NewConversationView;
});
