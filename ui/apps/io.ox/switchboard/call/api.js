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

define('io.ox/switchboard/call/api', ['io.ox/switchboard/api'], function (api) {

    'use strict';

    var TELCO = 'https://jitsi.ox-frontend.de/';

    var Call = Backbone.Model.extend({
        initialize: function (data) {
            this.hungup = false;
            // make sure callees are of type array
            if (!_.isArray(data.callees)) this.attributes.callees = [];
            // maintain states as separate hash (easier)
            this.states = {};
            this.getCallees().forEach(function (callee) {
                this.states[callee] = 'pending';
            }, this);
            // no telco yet?
            if (!this.telco) this.generateTelcoLink();
        },
        getCaller: function () {
            return this.get('caller');
        },
        getCallerName: function () {
            return api.getUserName(this.getCaller());
        },
        getCalleeName: function (callee) {
            return api.getUserName(callee);
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
        isCalling: function () {
            return this.get('caller') === api.userId;
        },
        isActive: function () {
            return !this.hungup && _(this.states).some(function (value) { return value === 'pending'; });
        },
        hangup: function () {
            this.hungup = true;
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
        }
    });

    var call;

    function isCallActive() {
        return call && call.isActive();
    }

    // start a call with participants
    function start(callees) {
        // should not happen UI-wise, but to be sure
        if (isCallActive()) return;
        call = new Call({ caller: api.userId, callees: callees });
        // it's just here for better debugging, i.e. we get the incoming dialog first
        api.propagate('call', call.get('callees'), { telco: call.getTelcoLink() });
        // load on demand / otherwise circular deps
        require(['io.ox/switchboard/call/outgoing'], function (outgoing) {
            outgoing.openDialog(call);
        });
        // finally
        //window.open(call.getTelcoLink());
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
        call = new Call({ caller: caller, callees: callees, telco: payload.telco });
        // load on demand / otherwise circular deps
        require(['io.ox/switchboard/call/incoming'], function (incoming) {
            incoming.openDialog(call);
        });
    });

    // CALLEE answers the call
    api.socket.on('answer', function (caller) {
        if (!isCallActive()) return;
        call.changeState(caller, 'answered');
    });

    // CALLEE declines the call
    api.socket.on('decline', function (caller) {
        if (!isCallActive()) return;
        call.changeState(caller, 'declined');
    });

    // CALLER cancels the call
    api.socket.on('cancel', function () {
        if (!isCallActive()) return;
        call.hangup();
    });

    // TEST
    // Outgoing:
    // api = require('io.ox/switchboard/call/api'); void api.start(['matthias.biggeleben@open-xchange.com', 'alexander.quast@open-xchange.com']);
    // Incoming:
    // api = require('io.ox/switchboard/api'); void api.propagate('call', 'matthias.biggeleben@open-xchange.com', {});

    return {
        get: function () { return call; },
        start: start
    };
});
