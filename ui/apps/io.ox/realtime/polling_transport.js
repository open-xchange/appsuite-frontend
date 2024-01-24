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

define.async('io.ox/realtime/polling_transport', [
    'io.ox/core/extensions',
    'io.ox/core/event',
    'io.ox/core/capabilities',
    'io.ox/core/uuids',
    'io.ox/core/http',
    'io.ox/realtime/stanza',
    'io.ox/realtime/tab_id',
    'io.ox/realtime/synchronized_http'
],
function (ext, Event, caps, uuids, http, stanza, tabId, synchronizedHTTP) {

    'use strict';

    var RealtimeStanza = stanza.RealtimeStanza;

    if (!caps.has('rt')) {
        console.error('Backend doesn\'t support realtime communication!');
        var dummy = {
            send: $.noop,
            sendWithoutSequence: $.noop,
            query: function () { return $.when(); }
        };
        Event.extend(dummy);
        return $.Deferred().resolve(dummy);
    }

    var api = {
        protocol: 'ox'
    };
    var seq = 0;

    var resendBuffer = {};
    var resendDeferreds = {};
    var serverSequenceThreshhold = 0;
    var initialReset = true;
    var ackBuffer = {};

    var rejectAll = false;
    var purging = false;
    var enroled = false;
    var traceAll = false;

    var TIMEOUT = 2 * 60 * 1000;
    var INFINITY = TIMEOUT / 5000;
    var offlineCountdown;
    var lastSend = _.now();

    var mode = 'lazy';
    var intervals = {
        lazy: 10000, // When traffic is low, don't ask for data as often
        eager: 1000, // When traffic is high, ask for data more frequently
        lazyThreshhold: 5 * 60 * 1000, // Switch from eager to lazy mode when 5 minutes without a message have elapsed
        guardClear: 10 * 60 * 1000
    };

    var idGateKeeper = (function () {
        var seenIDs = {};

        return {
            shouldPass: function (stanza) {
                if (!stanza.id) {
                    return true;
                }
                if (seenIDs[stanza.id]) {
                    if (api.debug) {
                        console.log('I have already seen uuid ' + stanza.id + ' at ' + seenIDs[stanza.id]);
                    }
                    return false;
                }
                seenIDs[stanza.id] = _.now();
                if (api.debug) {
                    console.log('I have not seen uuid ' + stanza.id + ' yet');
                }
                return true;
            },
            tick: function () {
                var now = _.now();
                if (api.debug) {
                    console.log('Clearing UUID guards older than ' + now);
                }
                var count = 0;
                _(seenIDs).chain().keys().each(function (id) {
                    var ts = seenIDs[id];
                    if (ts + intervals.guardClear >= now) {
                        count++;
                        delete seenIDs[id];
                    }
                });
                if (api.debug) {
                    console.log('I have cleared ' + count + ' uuids at ' + now);
                }
            }
        };
    })();


    var damage = {
        value: 0,
        threshhold: 10,
        state: 'working',
        systemSleep: false,
        isWorking: function () {
            return this.state === 'working';
        },
        isBrokenDueToSystemSleep: function () {
            return this.systemSleep;
        },
        brokenDueToSystemSleep: function () {
            this.value = this.threshhold;
            this.state = 'broken';
            this.systemSleep = true;
            this.trigger('broken');
        },
        increase: function (value) {
            this.value += value;
            this.trigger('change');
            if (api.debug) {
                console.log('Connection does not seem to be working well. ', this.value, this.threshhold);
            }
            if (this.value > this.threshhold && this.state === 'working') {
                this.state = 'broken';
                this.trigger('broken');
            }
        },
        reset: function () {
            this.value = 0;
            this.systemSleep = false;
            if (this.state !== 'working') {
                this.state = 'working';
                this.trigger('working');
            }
        }
    };
    Event.extend(damage);

    var queue = {
        stanzas: []
    };

    var lastDelivery = _.now();
    var lastCheck = _.now();
    var ticks = 0;

    var actions = {};
    var running = false;
    function runActions() {
        if (!enroled) {
            return;
        }
        ticks++;
        _(actions).each(function (action) {
            action(ticks);
        });
        if (running) {
            setTimeout(runActions, 1000);
        }
    }

    function start() {
        if (running) {
            return;
        }
        running = true;
        setTimeout(runActions, 1000);
    }

    function stop() {
        running = false;
    }

    actions.expireGuards = function (ticks) {
        if (ticks % 300 === 0) {
            idGateKeeper.tick();
        }
    };

    // Keep sending stanzas until buffer is empty
    function purge() {
        if (api.trace) {
            console.log('Drain buffer');
        }
        if (!enroled) {
            return;
        }

        if (_.isEmpty(queue.stanzas) && _.isEmpty(ackBuffer)) {
            return;
        }
        // Send queue.stanzas
        if (api.trace) {
            console.log('SENDING', queue.stanzas);
        }
        var stanzas = queue.stanzas;
        queue.stanzas = [];
        // prepend ack stanza
        if (!_.isEmpty(ackBuffer)) {
            stanzas.unshift({
                type: 'ack',
                seq: _(ackBuffer).keys()
            });
            ackBuffer = {};
        }
        if (api.trace) {
            console.log('->', stanzas);
        }

        purging = true;
        if (api.trace) {
            console.log('Starting purge, so setting purging to true');
        }

        lastSend = _.now();
        synchronizedHTTP.PUT({
            module: 'rt',
            params: {
                action: 'send',
                resource: tabId
            },
            data: stanzas,
            noRetry: true,
            timeout: TIMEOUT,
            silent: true,
            skipable: true
        }).done(function (resp) {
            purging = false;
            if (api.trace) {
                console.log('Purged stanzas, so setting purging to false');
            }
            handleResponse(resp);
            if (!_.isEmpty(queue.stanzas) || !_.isEmpty(ackBuffer)) {
                purge();
            }
        }).fail(function (resp) {
            purging = false;
            if (api.debug) {
                console.log('Purging call failed, setting purging to false', resp);
            }

            handleError(resp);
            if (!_.isEmpty(queue.stanzas) || !_.isEmpty(ackBuffer)) {
                purge();
            }
        });

    }

    actions.purge = function () {
        if (!purging && !_.isEmpty(queue.stanzas)) {
            purge();
        }
    };

    function someoneIsListeningForRemoveEvents() {
        if (!api.events) {
            return;
        }
        var listeners = api.events.list();
        if (!listeners) {
            return false;
        }

        var found = false;
        _(listeners).each(function (listeners, evt) {
            if (found) {
                return;
            }
            if (/^receive/.test(evt) && listeners.length > 0) {
                found = true;
            }
        });

        return found;
    }

    // Periodically poll
    actions.poll = function () {
        // no need to poll if no one is listening for events
        if (!someoneIsListeningForRemoveEvents()) {
            return;
        }

        var lastSendDiff = (_.now() - lastSend);
        var lastFetchInterval = _.now() - lastCheck;
        var interval = _.now() - lastDelivery;

        if ((lastSendDiff > TIMEOUT) && damage.isWorking()) {
            if (api.debug) {
                console.log('Connection sent last message 2 minutes ago and state is working. Could be system awake from sleep mode => triggering offline event.');
            }
            damage.brokenDueToSystemSleep();
        }

        if (lastFetchInterval >= intervals[mode] && !purging) {
            lastCheck = _.now();
            lastSend = _.now();

            synchronizedHTTP.GET({
                module: 'rt',
                params: {
                    action: 'poll',
                    resource: tabId
                },
                timeout: TIMEOUT,
                silent: true,
                skipable: true
            }).done(handleResponse).fail(handleError);
        }

        if (interval >= intervals.lazyThreshhold) {
            mode = 'lazy';
        } else {
            mode = 'eager';
        }
    };

    // Periodically flush resend buffer
    actions.flushResendBuffer = function (ticks) {
        if (damage.state === 'broken') {
            if (api.debug) {
                console.log('Skipping flush of resend buffer due to broken connection');
            }
            return;
        }

        var hasBegunCountout = false;
        if (ticks % 5 !== 0) {
            return;
        }
        if (purging) {
            if (api.debug) {
                console.log('Skipping flush, purging or transmission in progress');
            }
            return;
        }

        _(resendBuffer).each(function (m) {
            m.count++;
            if (m.count > 2) {
                hasBegunCountout = true;
            }
            if (m.count < INFINITY) {
                api.sendWithoutSequence(m.msg);
            } else {
                if (api.debug) {
                    console.log('Count to infinity reached, dropping message with sequence: ', m.msg.seq);
                }
                delete resendBuffer[Number(m.msg.seq)];
                resendDeferreds[Number(m.msg.seq)].reject();
                delete resendDeferreds[Number(m.msg.seq)];
            }
        });
        if (hasBegunCountout) {
            damage.increase(1);
        }
    };

    Event.extend(api);

    function receivedAcknowledgement(sequenceNumber) {
        delete resendBuffer[sequenceNumber];
        if (resendDeferreds[sequenceNumber]) {
            resendDeferreds[sequenceNumber].resolve();
        }
        if (api.debug) {
            console.log('Received receipt for ' + sequenceNumber);
        }
        delete resendDeferreds[sequenceNumber];
    }

    function flushAllBuffers() {
        resendBuffer = {};
        _(resendDeferreds).chain().values().each(function (def) {
            def.reject();
        });
        resendDeferreds = {};
        queue.stanzas = [];
        queue.timer = false;
        if (api.debug) {
            console.log('Flushing buffers and rejecting all sends');
        }
        rejectAll = true;
    }

    function resetSequence(newSequence) {
        if (api.debug) {
            console.log('Resetting sequence to ', newSequence);
        }
        lastSend = _.now();
        flushAllBuffers();
        synchronizedHTTP.PUT({
            module: 'rt',
            params: {
                action: 'send',
                resource: tabId
            },
            timeout: TIMEOUT,
            data: { type: 'nextSequence', seq: newSequence },
            silent: true
        }).done(function () {
            if (api.debug) {
                console.log('Done resetting the sequence, no longer rejecting all sends.');
            }
            rejectAll = false;
            resendBuffer = {};
            _(resendDeferreds).chain().values().each(function (def) {
                def.reject();
            });
            resendDeferreds = {};
            queue.stanzas = [];
            queue.timer = false;
            if (api.debug) {
                console.log('Got reset command, nextSequence is ', seq);
            }
            seq = newSequence;
            serverSequenceThreshhold = -1;
            if (api.debug) {
                console.log('Sequence number was reset to ' + seq + '. Triggering reset event.');
            }
            api.trigger('reset');
        });

    }

    function received(stanza) {
        if (api.debug) {
            console.log('Received  Stanza', stanza);
        }
        if (!idGateKeeper.shouldPass(stanza)) {
            if (api.debug) {
                console.log('Discarding Stanza', stanza.id, stanza.seq, stanza);
            }
            return;
        }
        if (stanza.get('atmosphere', 'received')) {
            _(stanza.getAll('atmosphere', 'received')).each(function (receipt) {
                var sequenceNumber = Number(receipt.data);
                receivedAcknowledgement(sequenceNumber);
            });
        } else if (stanza.get('atmosphere', 'pong')) {
            _(stanza.getAll('atmosphere', 'pong')).each($.noop);
        } else if (stanza.get('atmosphere', 'nextSequence') || stanza.get('ox', 'nextSequence')) {
            if (!initialReset) {
                if (api.debug) {
                    console.log('Got nextSequence stanza, so resetting sequence');
                }
                resetSequence(stanza.get('atmosphere', 'nextSequence').data);
            } else {
                initialReset = false;
            }
        } else if (stanza.get('ox', 'tracingDemand')) {
            if (stanza.get('ox', 'tracingDemand').data) {
                traceAll = true;
            } else {
                traceAll = false;
            }
        } else {
            if (stanza.seq > -1) {
                if (api.debug) {
                    console.log('Enqueueing receipt ' + stanza.seq);
                }
                ackBuffer[Number(stanza.seq)] = 1;
            }
            if (serverSequenceThreshhold === -1 && stanza.seq > 0) {
                serverSequenceThreshhold = stanza.seq - 1;
            }
            if (api.debug) {
                console.log('SERVER THRESHHOLD: ', serverSequenceThreshhold, stanza.seq);
            }
            if (stanza.seq === -1 || stanza.seq > serverSequenceThreshhold || stanza.seq === 0) {
                var outOfOrder = false;
                if (stanza.seq > 0 && stanza.seq - serverSequenceThreshhold > 1) {
                    console.error('Received a sequence number that is too far out of order: Expected: ' + (serverSequenceThreshhold + 1) + ', but got: ' + stanza.seq);
                    outOfOrder = true;
                }
                if (stanza.seq > 0 && stanza.seq <= serverSequenceThreshhold) {
                    return; // Discard, as we have already seen this stanza
                }
                if (!outOfOrder) {
                    if (stanza.get('', 'error')) {
                        if (api.debug) {
                            console.log('Received Stanza contained an error', stanza);
                        }
                        var error = stanza.get('', 'error');
                        if (error.data && error.data.code === 1005) {
                            ox.trigger('relogin:required');
                        } else if (error.data && error.data.code === 1006) {
                            if (api.debug) {
                                console.log('Got error 1006, so resetting sequence');
                            }
                            resetSequence(-1);
                        } else {
                            api.trigger('error', stanza);
                            api.trigger('error:' + stanza.selector, stanza);
                            if (error.data && error.data.code) {
                                api.trigger('error:code:' + error.data.code, stanza);
                            }
                        }
                    } else {
                        if (api.debug) {
                            console.log('RECEIVED', stanza.seq, stanza);
                        }
                        api.trigger('receive', stanza);
                        api.trigger('receive:' + stanza.selector, stanza);
                        api.trigger('receive:from:' + stanza.from, stanza);
                    }
                    if (stanza.seq !== -1) {
                        serverSequenceThreshhold = stanza.seq;
                    }
                } else {
                    if (api.debug) {
                        console.log('Out of order, so resetting sequence to 0');
                    }
                    resetSequence(0);
                }
            } else if (api.debug) {
                console.log('Already received ' + stanza.seq + '. Waiting for ' + (serverSequenceThreshhold + 1));
            }
        }
    }

    function handleError(error) {

        if (error.code === 'RT_STANZA-1006' || error.code === 'RT_STANZA-0006' || error.code === 1006 || error.code === 6) {
            if (api.debug) {
                console.log('Got error 1006, so resetting sequence');
            }
            resetSequence(0);
            return;
        }

        if (error.code === 'RT_STANZA-1007' || error.code === 1007) {
            enroled = false;
            enrol().done(function () {
                flushAllBuffers();
                api.trigger('reset', error);
            });
            return;
        }
    }

    function handleResponse(resp) {
        lastSend = _.now();

        damage.reset();

        var result = null;
        if (resp.acks) {
            _(resp.acks).each(function (sequenceNumber) {
                receivedAcknowledgement(sequenceNumber);
            });
        }

        if (resp.stanzas && !_.isEmpty(resp.stanzas)) {
            lastDelivery = _.now();

            _(resp.stanzas).each(function (s) {
                received(new RealtimeStanza(s));
            });
            purge();
        }

        if (resp.result) {
            result = new RealtimeStanza(resp.result);
        }

        if (resp.error) {
            handleError(resp.error);
        }

        return result;
    }

    function enrol() {
        if (!running) {
            return $.when();
        }

        if (!enroled) {
            lastSend = _.now();

            return synchronizedHTTP.GET({
                module: 'rt',
                params: {
                    action: 'enrol',
                    resource: tabId
                },
                timeout: TIMEOUT,
                silent: true
            }).done(function (resp) {
                enroled = true;
                handleResponse(resp);
            }).done(purge).fail(handleError);
        }
    }

    ox.on('relogin:required', function () {
        if (api.debug) {
            console.log('Session seems to have expired. Relogin required.');
        }
        flushAllBuffers();
        stop();
    });

    ox.on('relogin:success', function () {
        if (api.debug) {
            console.log('Relogin was successful, resuming operation');
        }
        enroled = false;
        start();
        enrol();
    });

    ox.on('change:session', function () {
        if (api.debug) {
            console.log('Got a new sessionID. Resuming operation.');
        }
        enroled = false;
        start();
        enrol();
    });

    ox.on('connection:down connection:offline', function () {
        damage.increase(1);
    });

    ox.on('connection:up connection:online', function () {
        damage.reset();
    });

    damage.on('broken', function () {
        if (api.debug) {
            console.log('Connection seems to be broken. Waiting 2 minutes for the connection to return.');
        }

        function notifyOffline() {
            if (api.debug) {
                console.log('Connection was still broken after 2 minute grace period. Triggering offline event.');
            }
            api.trigger('offline');
            stop();
        }

        if (damage.isBrokenDueToSystemSleep()) {
            notifyOffline();
        } else {
            offlineCountdown = setTimeout(notifyOffline, 10000);
        }
    });

    damage.on('working', function () {
        if (api.debug) {
            console.log('Connection seems to be working again. Triggering online event');
        }
        if (offlineCountdown) {
            clearTimeout(offlineCountdown);
        }
        api.trigger('online');
        start();

    });

    api.internal = {
        setSequence: function (newSequence) {
            seq = newSequence;
        }
    };

    api.query = function (options) {
        var force = options.force || false;
        var def = $.Deferred();
        var previousOperation = null;
        if (options.trace || traceAll) {
            delete options.trace;
            options.tracer = ox.user + '@' + ox.context_id + ' [' + uuids.randomUUID() + ']';
        }
        options.seq = seq;
        seq++;

        previousOperation = resendDeferreds[Number(options.seq - 1)] || $.when();

        // Wait for an ACK for the previous operation, so the stanza gates
        // don't get mixed up
        if (force) {
            if (previousOperation.state() === 'pending') {
                def.reject({ cause: 'sync_send_not_possible' });
            } else {
                var url = ox.apiRoot + '/rt' + '?action=query&session=' + ox.session + '&resource=' + tabId;
                var payload = JSON.stringify(options);
                // special case: use sendBeacon to send a final last messages
                // TODO: sendBeacon - use same structure as synchronizedHTTP.PUT!!!
                try {
                    var header = { type: 'text/plain; charset=utf-8' };
                    payload = new Blob([payload], header);

                    navigator.sendBeacon(url, payload);

                } catch (e) {
                    //TODO remove, at the moment only used for debugging
                }
            }
        } else {
            previousOperation.done(function () {
                lastSend = _.now();
                synchronizedHTTP.PUT({
                    module: 'rt',
                    params: {
                        action: 'query',
                        resource: tabId
                    },
                    timeout: TIMEOUT,
                    data: options,
                    silent: true
                }).done(function (resp) {
                    var stanzas = resp.stanzas;
                    resp.stanzas = [];
                    // Handle the regular stanzas later
                    setTimeout(function () {
                        handleResponse({ stanzas: stanzas });
                    }, 0);
                    if (resp.error) {
                        handleError(resp.error);
                        def.reject(resp);
                    } else {
                        def.resolve(handleResponse(resp));
                    }
                }).fail(function (resp) {
                    handleError(resp);
                    // Send a dummy message to consume the sequence number
                    api.send({
                        to: 'devnull://sequenceDiscard',
                        seq: options.seq,
                        element: 'message'
                    });
                    def.reject(resp);
                });
            });
        }
        return def;
    };

    api.hasPendingAcks = function () {
        var def = resendDeferreds[seq];
        return (_.isObject(def) && def.getState() === 'pending');
    };

    api.send = function (options) {
        if (api.debug) {
            console.log('Send', options);
        }
        if (rejectAll || !running) {
            if (api.debug) {
                console.log('Not connected, so rejecting all (send)');
            }
            return def.reject();
        }
        if (!options.seq) {
            options.seq = seq;
            seq++;
        }
        return api.sendWithoutSequence(options);
    };

    api.sendWithoutSequence = function (options) {
        var def = $.Deferred();
        if (rejectAll || !running) {
            if (api.debug) {
                console.log('Not connected, so rejecting all (sendWithoutSequence)');
            }
            return def.reject();
        }
        if (options.trace || traceAll) {
            delete options.trace;
            options.tracer = ox.user + '@' + ox.context_id + ' [' + uuids.randomUUID() + ']';
        }
        if (_.isNumber(options.bufferinterval)) {
            delete options.bufferinterval;  // Do not send bufferinterval to server
        }
        if (_.isUndefined(options.seq)) {
            def.resolve(); // Pretend a message without sequence numbers always arrives
        } else {
            if (api.debug) {
                console.log('Enqueuing in resendBuffer ', options.seq);
            }
            if (resendDeferreds[Number(options.seq)]) {
                def = resendDeferreds[Number(options.seq)];
            } else {
                resendDeferreds[Number(options.seq)] = def;
                resendBuffer[Number(options.seq)] = { count: 0, msg: options };
            }
        }

        if (api.debug) {
            console.log('Adding to sender queue ', queue);
        }
        queue.stanzas.push(JSON.parse(JSON.stringify(options)));
        if (!purging) {
            if (api.debug) {
                console.log('Start purge process');
            }
            purge();
        }

        return def;
    };

    api.resource = tabId;

    start();

    var def = $.Deferred();

    enrol().done(function () {
        def.resolve(api);
    }).fail(def.reject);

    return def;

});
