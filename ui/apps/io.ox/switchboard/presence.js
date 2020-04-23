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

define('io.ox/switchboard/presence', [], function () {

    'use strict';

    var users = {};

    var exports = {

        // returns jQuery node
        getPresenceString: function (userId) {
            var presence = this.getPresence(userId);
            return createPresenceNode(presence).append(
                $('<span class="state">').text(this.getStateString(presence))
            );
        },

        // returns jQuery node
        getPresenceDot: function (userId) {
            var presence = this.getPresence(userId);
            return createPresenceNode(presence);
        },

        getPresence: function (userId) {
            userId = trim(userId);
            if (!users[userId]) {
                users[userId] = {
                    id: userId,
                    lastSeen: _.now() - Math.random() * 30 * 60000,
                    state: getRandomState()
                };
            }
            return users[userId];
        },

        getStateString: function (presence) {
            switch (presence.state) {
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

        updateState: function (userId, state) {
            var presence = this.getPresence(userId);
            if (state !== 'offline') presence.lastSeen = _.now();
            if (state === presence.state) return;
            presence.state = state;
            // update all DOM nodes for this user
            $('.presence[data-id="' + $.escape(presence.id) + '"]')
                .attr('class', 'presence ' + presence.state)
                .find('.state').text(this.getStateString(presence));
        },

        users: users
    };

    function createPresenceNode(presence) {
        return $('<div class="presence">')
            .addClass(presence.state)
            .attr('data-id', presence.id)
            .append(
                $('<span class="icon" aria-hidden="true"><i class="fa"></i></span>')
            );
    }

    // just to make sure we always use the same string
    function trim(userId) {
        return String(userId).toLowerCase().trim();
    }

    function getRandomState() {
        var r = Math.random();
        if (r < 0.2) return 'offline';
        if (r < 0.4) return 'busy';
        if (r < 0.6) return 'absent';
        return 'online';
    }

    // setInterval(function () {
    //     var array = _(users).values();
    //     if (!array.length) return;
    //     var presence = array[Math.random() * array.length >> 0];
    //     console.log('setInterval/update', presence.id);
    //     exports.updateState(presence.id, getRandomState());
    // }, 100);

    return exports;
});
