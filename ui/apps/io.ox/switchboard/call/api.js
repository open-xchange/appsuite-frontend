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
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/switchboard/call/api', ['io.ox/switchboard/api', 'io.ox/switchboard/lookup'], function (api, lookup) {

    'use strict';

    var TELCO = 'https://meet.jit.si/';

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
        getTelcoLink: function () {
            return this.get('telco');
        },
        generateTelcoLink: function () {
            this.set('telco', TELCO + s4() + s4());
            function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1); }
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
            api.propagate('call', this.get('callees'), { telco: this.getTelcoLink(), type: this.getType() });
        },
        hangup: function () {
            this.active = false;
            this.trigger('hangup');
            if (this.isCalling()) api.propagate('cancel', this.getCallees());
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
            var isPending = _(this.states).some(function (state) { return state === 'pending'; });
            if (isPending) return;
            this.active = false;
            this.trigger('done');
        },
        addToHistory: function () {
            require(['io.ox/switchboard/views/call-history'], function (callHistory) {
                var incoming = this.isIncoming(),
                    email = incoming ? this.getCaller() : this.getCallees()[0];
                callHistory.add({ date: _.now(), email: email, incoming: incoming, missed: this.isMissed(), type: this.getType() });
            }.bind(this));
        }
    });

    var call;

    function isCallActive() {
        return call && call.isActive();
    }

    // start a call with participants
    function start(type, callees) {
        // should not happen UI-wise, but to be sure
        if (isCallActive()) return;
        call = new Call({ caller: api.userId, callees: [].concat(callees), type: type, incoming: false });
        // load on demand / otherwise circular deps
        require(['io.ox/switchboard/call/outgoing'], function (outgoing) {
            outgoing.openDialog(call);
        });
    }

    // user gets called
    api.socket.on('call', function (caller, callees, payload) {
        // auto-decline incoming call
        if (isCallActive()) {
            setTimeout(function () {
                api.propagate('decline', [caller], { reason: 'busy' });
            }, 2000);
            return;
        }
        call = new Call({ caller: caller, callees: callees, telco: payload.telco, type: payload.type, incoming: true });
        // load on demand / otherwise circular deps
        require(['io.ox/switchboard/call/incoming'], function (incoming) {
            incoming.openDialog(call);
        });
    });

    // 42["answer", "alexander.quast@open-xchange.com", ["matthias.biggeleben@open-xchange.com"], null]

    // CALLEE answers the call
    api.socket.on('answer', function (caller) {
        if (!isCallActive()) return;
        call.changeState(caller, 'answered');
        call.addToHistory();
    });

    // CALLEE declines the call
    api.socket.on('decline', function (caller) {
        if (!isCallActive()) return;
        call.changeState(caller, 'declined');
        call.addToHistory();
    });

    // CALLER cancels the call
    api.socket.on('cancel', function () {
        if (!isCallActive()) return;
        call.set('missed', true);
        call.addToHistory();
        call.hangup();
    });

    // TEST
    // Outgoing:
    // api = require('io.ox/switchboard/call/api'); void api.start('zoom', ['matthias.biggeleben@open-xchange.com', 'alexander.quast@open-xchange.com']);
    // Incoming:
    // api = require('io.ox/switchboard/api'); void api.propagate('call', 'matthias.biggeleben@open-xchange.com', { type: 'zoom' });

    return {
        get: function () { return call; },
        start: start
    };
});
