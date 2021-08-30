/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/switchboard/call/api', [
    'io.ox/switchboard/api',
    'io.ox/switchboard/lookup'
], function (api, lookup) {

    'use strict';

    var Call = Backbone.Model.extend({
        initialize: function (data) {
            this.active = true;
            // make sure callees are of type array
            if (!_.isArray(data.callees)) this.attributes.callees = [];
            // maintain states as separate hash (easier)
            this.states = {};
            this.getCallees().forEach(function (callee) {
                this.states[callee] = 'pending';
            }, this);
        },
        getType: function () {
            return this.get('type');
        },
        getCaller: function () {
            return this.get('caller');
        },
        getCallerName: function () {
            return lookup.getUserNameNode(this.getCaller());
        },
        getCalleeName: function (callee) {
            return lookup.getUserNameNode(callee);
        },
        getCallees: function () {
            return this.get('callees');
        },
        getCalleeState: function (id) {
            return this.states[id];
        },
        getJoinURL: function () {
            return this.get('joinURL');
        },
        isIncoming: function () {
            return !!this.get('incoming');
        },
        isMissed: function () {
            return !!this.get('missed');
        },
        isCalling: function () {
            return this.get('caller') === api.userId;
        },
        isActive: function () {
            return this.active;
        },
        propagate: function () {
            api.propagate('call', this.get('callees'), { joinURL: this.getJoinURL(), type: this.getType() });
        },
        hangup: function () {
            this.active = false;
            this.trigger('hangup');
            if (this.isCalling() && this.isPending()) api.propagate('cancel', this.getCallees());
        },
        decline: function () {
            this.states[api.userId] = 'declined';
            api.propagate('decline', [this.getCaller()]);
        },
        answer: function () {
            this.states[api.userId] = 'answered';
            api.propagate('answer', [this.getCaller()]);
        },
        changeState: function (userId, state) {
            if (!this.states[userId]) return;
            this.states[userId] = state;
            this.trigger('change:state');
            if (this.isPending()) return;
            this.active = false;
            this.trigger('done');
        },
        isPending: function () {
            return _(this.states).some(function (state) { return state === 'pending'; });
        },
        addToHistory: function () {
            require(['io.ox/switchboard/views/call-history'], function (callHistory) {
                var incoming = this.isIncoming(),
                    email = incoming ? this.getCaller() : this.getCallees()[0];
                callHistory.add({ date: _.now(), email: email, incoming: incoming, missed: this.isMissed(), type: this.getType() });
            }.bind(this));
        }
    });

    var call, autoDecline;

    function isCallActive() {
        return call && call.isActive();
    }

    // start a call with participants
    function start(type, callees) {
        // should not happen UI-wise, but to be sure
        if (isCallActive()) return $.when();
        // clean up callees
        callees = [].concat(callees).map(function (address) {
            return String(address).trim().toLowerCase();
        });
        call = new Call({ caller: api.userId, callees: callees, type: type, incoming: false });
        // load on demand / otherwise circular deps
        return require(['io.ox/switchboard/call/outgoing']).then(function (outgoing) {
            return outgoing.openDialog(call);
        });
    }

    // user gets called
    api.socket.on('call', function (caller, callees, payload) {
        // auto-decline incoming call
        if (isCallActive()) {
            if (autoDecline) clearTimeout(autoDecline);
            autoDecline = setTimeout(function () {
                autoDecline = null;
                if (!isCallActive()) return;
                api.propagate('decline', [caller], { reason: 'away' });
            }, 20000);
            return;
        }
        call = new Call({ caller: caller, callees: callees, joinURL: payload.joinURL, type: payload.type, incoming: true });
        // load on demand / otherwise circular deps
        require(['io.ox/switchboard/call/incoming'], function (incoming) {
            incoming.openDialog(call);
        });
    });

    // CALLEE answers the call
    api.socket.on('answer', function (caller) {
        if (!isCallActive()) return;
        call.changeState(caller, 'answered');
        //call.addToHistory();
    });

    // CALLEE declines the call
    api.socket.on('decline', function (caller) {
        if (!isCallActive()) return;
        call.changeState(caller, 'declined');
        //call.addToHistory();
    });

    // CALLER cancels the call
    api.socket.on('cancel', function () {
        if (!isCallActive()) return;
        call.set('missed', true);
        call.addToHistory();
        call.hangup();
    });

    return {
        get: function () { return call; },
        start: start
    };
});
