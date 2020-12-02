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

define('io.ox/chat/events', [], function () {

    'use strict';

    var started = false;

    // simple event aggregator
    var events = _.extend({}, Backbone.Events, {
        forward: function (e) {
            e.preventDefault();
            // if we use stopPropagation dropdowns won't close "naturally"
            //e.stopPropagation();
            var node = $(e.currentTarget), data = node.data();
            if (ox.debug) console.debug('cmd', data.cmd, data);
            events.trigger('cmd cmd:' + data.cmd, data);
        },
        // starts the app on demand
        // this prevents commands from failing when triggered before the chat app was started (start chat from address book buttons etc)
        trigger: function () {
            var self = this,
                args = arguments;
            if (started) return Backbone.Events.trigger.apply(self, args);

            require(['io.ox/chat/main'], function (chat) {
                chat.getApp().launch().done(function () {
                    this.getWindow().showApp();
                    started = true;
                    Backbone.Events.trigger.apply(self, args);
                });
            });
        }
    });

    // forward local command clicks into event hub
    $(document).on('click', '.ox-chat [data-cmd]', events.forward);

    return events;
});
