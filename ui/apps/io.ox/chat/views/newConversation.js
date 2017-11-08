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

define('io.ox/chat/views/newConversation', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/events'
], function (DisposableView, events) {

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
                $('<div class="header abs">').append(
                    $('<h2 class="title">').append('Start new conversation')
                ),
                $('<div class="scrollpane abs">').append(
                ),
                $('<div class="buttons abs">').append(
                    $('<button type="button" class="btn btn-default" data-cmd="new:cancel">').text('Cancel'),
                    $('<button type="button" class="btn btn-primary" data-cmd="new:start">').text('Start conversation')
                )
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
