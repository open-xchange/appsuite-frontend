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

define('io.ox/switchboard/presence', ['io.ox/switchboard/api'], function (api) {

    'use strict';

    var users = {};

    var exports = {

        // returns jQuery node
        getPresenceString: function (userId) {
            var presence = this.getPresence(userId);
            return createPresenceNode(presence.availability, presence.id).append(
                $('<span class="availability">').text(this.getAvailabilityString(presence))
            );
        },

        // returns jQuery node
        getPresenceIcon: function (userId) {
            var presence = this.getPresence(userId);
            return createPresenceNode(presence.availability, presence.id);
        },

        getFixedPresenceIcon: function (availability) {
            return createPresenceIcon(availability);
        },

        // returns jQuery node
        getPresenceDot: function (userId) {
            var presence = this.getPresence(userId);
            return createPresenceNode(presence.availability, presence.id).addClass('dot');
        },

        getPresence: function (userId) {
            userId = api.trim(userId);
            if (!users[userId]) {
                users[userId] = { id: userId, lastSeen: 0, availability: 'offline' };
                api.socket.emit('presence-get', userId, function (data) {
                    exports.changePresence(userId, data);
                    if (api.isMyself(userId)) exports.trigger('change-own-availability', data.availability);
                });
            }
            return users[userId];
        },

        getAvailabilityString: function (presence) {
            switch (presence.availability) {
                case 'online':
                    return 'Online now';
                case 'busy':
                    return 'Busy';
                case 'absent':
                    return 'Absent';
                default:
                    if (!presence.lastSeen) return 'Offline';
                    // get last seen in minutes from now
                    var duration = Math.ceil((_.now() - presence.lastSeen) / 60000);
                    // less than 1 hour -> human readable duration
                    if (duration < 60) return 'Last seen ' + moment.duration(-duration, 'minutes').humanize(true);
                    // less than 24 hours -> time
                    if (duration < 1440) return 'Last seen at ' + moment(presence.lastSeen).format('LT');
                    // otherwise -> date
                    return 'Last seen on ' + moment(presence.lastSeen).format('L');
            }
        },

        changePresence: function (userId, changes) {
            var presence = this.getPresence(userId);
            if (changes.availability === presence.availability) return;
            _.extend(presence, changes, { lastSeen: _.now() });
            // update all DOM nodes for this user
            $('.presence[data-id="' + $.escape(presence.id) + '"]')
                .removeClass('online absent busy offline')
                .addClass(presence.availability)
                .find('.availability').text(this.getAvailabilityString(presence));
        },

        changeOwnAvailability: function (availability) {
            this.changePresence(api.userId, { availability: availability });
            // share might (soon) be: all, context, domain, (white) list
            api.socket.emit('presence-change', { availability: availability, visibility: 'all' });
            exports.trigger('change-own-availability', availability);
        },

        getMyAvailability: function () {
            return (users[api.userId] || {}).availability || 'offline';
        },

        users: users
    };

    // create template
    var tmpl = $('<div class="presence">')
        .append('<span class="icon" aria-hidden="true"><i class="fa"></i></span>');

    function createPresenceNode(availability, id) {
        return createPresenceIcon(availability).attr('data-id', id);
    }

    function createPresenceIcon(availability) {
        return tmpl.clone().addClass(availability);
    }

    // respond to events
    api.socket.on('presence-change', function (userId, presence) {
        console.log('socket > presence-change', userId, presence);
        exports.changePresence(userId, presence);
    });

    // add an event hub. we need this to publish presence state changes
    _.extend(exports, Backbone.Events);

    return exports;
});
