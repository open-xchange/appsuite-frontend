/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define.async('io.ox/realtime/rt', ['io.ox/core/extensions', "io.ox/core/event", "io.ox/core/capabilities", "io.ox/core/uuids", "io.ox/core/http"], function (ext, Event, caps, uuids, http) {
    'use strict';

    if (!caps.has("rt")) {
        console.error("Backend doesn't support realtime communication!");
        var dummy = {
            send: $.noop
        };
        Event.extend(dummy);
        return $.Deferred().resolve(dummy);
    }

    var tabId = uuids.randomUUID();
    var api = {};
    var seq = 0;

    var resendBuffer = {};
    var resendDeferreds = {};
    var serverSequenceThreshhold = 0;
    var initialReset = true;
    var ackBuffer = {};

    var rejectAll = false;
    var transmitting = false;
    var purging = false;
    var enroled = false;

    var INFINITY = 10;
    var TIMEOUT = 2 * 60 * 1000;

    var mode = 'lazy';
    var intervals = {
        lazy: 10000, // When traffic is low, don't ask for data as often
        eager: 1000, // When traffic is high, ask for data more frequently
        lazyThreshhold: 5 * 60 * 1000 // Switch from eager to lazy mode when 5 minutes without a message have elapsed
    };

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

    
    // Keep sending stanzas until buffer is empty
    function purge() {
        if (api.debug) {
            console.log("Drain buffer");
        }
        purging = true;

        if (transmitting) {
            if (api.debug) {
                console.log("Transmitting so skipping purge");
            }
            return;
        }
        if (!enroled) {
            if (api.debug) {
                console.log("Not enrolled, so skipping purge");
            }

            purging = false;
            return;
        }
        
        if (_.isEmpty(queue.stanzas) && _.isEmpty(ackBuffer)) {
            if (api.debug) {
                console.log("No stanzas enqueued, so skipping purge");
            }
            purging = false;

            return;
        }
        // Send queue.stanzas
        if (api.debug) {
            console.log("SENDING", queue.stanzas);
        }
        var stanzas = queue.stanzas;
        queue.stanzas = [];
        // prepend ack stanza
        if (!_.isEmpty(ackBuffer)) {
            stanzas.unshift({
                type: "ack",
                seq: _(ackBuffer).keys()
            });
            ackBuffer = {};
        }
        if (api.debug) {
            console.log("->", stanzas);
        }
        
        transmitting = true;
        http.PUT({
            module: 'rt',
            params: {
                action: 'send',
                resource: tabId
            },
            data: stanzas,
            noRetry: true,
            timeout: TIMEOUT
        }).done(function (resp) {
            transmitting = false;
            handleResponse(resp);
            if (!_.isEmpty(queue.stanzas) || !_.isEmpty(ackBuffer)) {
                purge();
            } else {
                purging = false;
            }
        }).fail(function (resp) {
            transmitting = false;
            handleError(resp);
            if (!_.isEmpty(queue.stanzas) || !_.isEmpty(ackBuffer)) {
                purge();
            } else {
                purging = false;
            }
        });

    }

    actions.purge = function () {
        if (!purging && !_.isEmpty(queue.stanzas)) {
            purge();
        }
    };

    // Periodically poll
    actions.poll = function () {
        var lastFetchInterval = _.now() - lastCheck;
        var interval = _.now() - lastDelivery;
        if (lastFetchInterval >= intervals[mode] && !purging) {
            lastCheck = _.now();
            http.GET({
                module: 'rt',
                params: {
                    action: 'poll',
                    resource: tabId
                },
                timeout: TIMEOUT
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
        if (ticks % 5 !== 0) {
            return;
        }
        if (purging) {
            return;
        }
        _(resendBuffer).each(function (m) {
            m.count++;
            if (m.count < INFINITY) {
                api.sendWithoutSequence(m.msg);
            } else {
                delete resendBuffer[Number(m.msg.seq)];
                resendDeferreds[Number(m.msg.seq)].reject();
                delete resendDeferreds[Number(m.msg.seq)];
            }
        });
    };

    Event.extend(api);


    function matches(json, namespace, element) {
        return json.namespace === namespace && json.element === element;
    }

    function get(json, namespace, element) {
        var i;
        if (matches(json, namespace, element)) {
            return new RealtimePayload(json);
        } else {
            if (json.payloads || json.data) {
                var payloads = json.payloads || json.data;
                for (i = 0; i < payloads.length; i++) {
                    var payload = get(payloads[i], namespace, element);
                    if (payload !== null) {
                        return payload;
                    }
                }
            }
            return null;
        }
    }

    function getAll(collector, json, namespace, element) {
        if (matches(json, namespace, element)) {
            collector.push(new RealtimePayload(json));
        }
        _(json.payloads || json.data || []).each(function (p) {
            getAll(collector, p, namespace, element);
        });
    }

    function RealtimePayload(json) {
        this.element = json.element;
        this.namespace = json.namespace;
        this.data = json.data;
        this.payloads = json.payloads || [];

        this.get = function (namespace, element) {
            return get(json, namespace, element);
        };

        this.getAll = function (namespace, element) {
            var collector = [];
            getAll(collector, json, namespace, element);
            return collector;
        };

    }

    function RealtimeStanza(json) {
        this.selector = json.selector;
        this.to = json.to;
        this.from = json.from;
        this.type = json.type;
        this.element = json.element;
        this.payloads = json.payloads || [];
        this.tracer = json.tracer;
        this.seq = _.isNull(json.seq) ? -1 : Number(json.seq);
        if (_.isNaN(this.seq)) {
            this.seq = -1;
        }
        this.tracer = json.tracer;
        this.log = json.log;

        this.get = function (namespace, element) {
            return get(json, namespace, element);
        };

        this.getAll = function (namespace, element) {
            var collector = [];
            getAll(collector, json, namespace, element);
            return collector;
        };
    }

    function receivedAcknowledgement(sequenceNumber) {
        delete resendBuffer[sequenceNumber];
        if (resendDeferreds[sequenceNumber]) {
            resendDeferreds[sequenceNumber].resolve();
        } else {
        }
        if (api.debug) {
            console.log("Received receipt for " + sequenceNumber);
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
            console.log("Flushing buffers and rejecting all sends");
        }
        rejectAll = true;
    }

    function resetSequence(newSequence) {
        if (api.debug) {
            console.log("Resetting sequence to ", newSequence);
        }
        flushAllBuffers();
        http.PUT({
            module: 'rt',
            params: {
                action: 'send',
                resource: tabId
            },
            timeout: TIMEOUT,
            data: {type: 'nextSequence', seq: newSequence}
        }).done(function () {
            if (api.debug) {
                console.log("Done resetting the sequence, no longer rejecting all sends.");
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
                console.log("Got reset command, nextSequence is ", seq);
            }
            seq = newSequence;
            serverSequenceThreshhold = -1;
            api.trigger("reset");
        });

    }

    function received(stanza) {
        if (api.debug) {
            console.log("Received  Stanza");
        }
        if (stanza.get("", "error")) {
            if (api.debug) {
                console.log("Received Stanza contained an error");
            }
            var error = stanza.get("", "error");
            if (error.data && error.data.code === 1005) {
                ox.trigger('relogin:required');
            } else if (error.data && error.data.code === 1006) {
                if (api.debug) {
                    console.log("Got error 1006, so resetting sequence");
                }
                resetSequence(-1);
            }
        } else if (stanza.get("atmosphere", "received")) {
            _(stanza.getAll("atmosphere", "received")).each(function (receipt) {
                var sequenceNumber = Number(receipt.data);
                receivedAcknowledgement(sequenceNumber);
            });
        } else if (stanza.get("atmosphere", "pong")) {
            _(stanza.getAll("atmosphere", "pong")).each(function (pong) {
                // Discard
            });
        } else if (stanza.get("atmosphere", "nextSequence")) {
            if (!initialReset) {
                if (api.debug) {
                    console.log("Got nextSequence stanza, so resetting sequence");
                }
                resetSequence(stanza.get("atmosphere", "nextSequence").data);
            } else {
                initialReset = false;
            }
        } else {
            if (stanza.seq > -1) {
                if (api.debug) {
                    console.log("Enqueueing receipt " + stanza.seq);
                }
                ackBuffer[Number(stanza.seq)] = 1;
                purge();
            }
            if (serverSequenceThreshhold === -1 && stanza.seq > 0) {
                serverSequenceThreshhold = stanza.seq - 1;
            }
            if (api.debug) {
                console.log("SERVER THRESHHOLD: ", serverSequenceThreshhold, stanza.seq);
            }
            if (stanza.seq === -1 || stanza.seq > serverSequenceThreshhold || stanza.seq === 0) {
                var outOfOrder = false;
                if (stanza.seq > 0 && stanza.seq - serverSequenceThreshhold > 1) {
                    console.error("Received a sequence number that is too far out of order: Expected: " + serverSequenceThreshhold + 1 + ", but got: " + stanza.seq);
                    outOfOrder = true;
                }
                if (stanza.seq > 0 && stanza.seq <= serverSequenceThreshhold) {
                    return; // Discard, as we have already seen this stanza
                }
                if (!outOfOrder) {
                    if (api.debug) {
                        console.log("RECEIVED", stanza.seq, stanza);
                    }
                    api.trigger("receive", stanza);
                    api.trigger("receive:" + stanza.selector, stanza);
                    if (stanza.seq !== -1) {
                        serverSequenceThreshhold = stanza.seq;
                    }
                } else {
                    if (api.debug) {
                        console.log("Out of order, so resetting sequence to 0");
                    }
                    resetSequence(0);
                }
            }
        }
    }

    function handleError(error) {
        if (error.code === "RT_STANZA-1006" || error.code === 'RT_STANZA-0006' || error.code === 1006 || error.code === 6) {
            if (api.debug) {
                console.log("Got error 1006, so resetting sequence");
            }
            resetSequence(0);
        }

        if (error.code === "RT_STANZA-1007" || error.code === 1007) {
            enroled = false;
            enrol();
        }
    }

    function handleResponse(resp) {
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
            return http.GET({
                module: 'rt',
                params: {
                    action: 'enrol',
                    resource: tabId
                },
                timeout: TIMEOUT
            }).done(function (resp) {
                enroled = true;
                handleResponse(resp);
            }).done(purge).fail(handleError);
        }
    }

    ox.on("relogin:required", function () {
        flushAllBuffers();
        stop();
    });

    ox.on('relogin:success', function () {
        start();
    });

    ox.on("change:session", function () {
        start();
    });

    ox.on("connection:down connection:offline", function () {
        api.trigger("offline");
        stop();
    });

    ox.on("connetion:up connection:online", function () {
        api.trigger("online");
        start();
    });

    function drainAckBuffer() {
        if (_(ackBuffer).isEmpty()) {
            return;
        }
        var start, stop;

        start = stop = -1;
        var seqExpression = [];

        function addToSeqExpression(start, stop) {
            if (start === stop) {
                seqExpression.push(start);
            } else {
                seqExpression.push([start, stop]);
            }
        }

        _(_(ackBuffer).keys().sort()).each(function (seq) {
            if (start === -1) {
                start = stop = seq;
            } else if (seq === stop + 1) {
                stop = seq;
            } else {
                addToSeqExpression(start, stop);
                start = stop = seq;
            }
        });

        addToSeqExpression(start, stop);
        http.PUT({
            module: 'rt',
            params: {
                action: 'send',
                resource: tabId
            },
            timeout: TIMEOUT,
            data: {type: 'ack', seq: seqExpression}
        }).done(handleResponse).fail(handleError);
        ackBuffer = {};

    }

    

    api.internal = {
        setSequence: function (newSequence) {
            seq = newSequence;
        }
    };

    api.query = function (options) {
        if (options.trace) {
            delete options.trace;
            options.tracer = uuids.randomUUID();
        }
        options.seq = seq;
        seq++;
        return http.PUT({
            module: 'rt',
            params: {
                action: 'query',
                resource: tabId
            },
            timeout: TIMEOUT,
            data: options
        }).pipe(function (resp) {
            return handleResponse(resp);
        }).fail(function (resp) {
            handleError(resp);
            // Send a dummy message to consume the sequence number
            api.send({
                to: "devnull://sequenceDiscard",
                seq: options.seq,
                element: 'message'
            });
        });
    };

    api.send = function (options) {
        if (api.debug) {
            console.log("Send", options);
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
                console.log("Not connected, so rejecting all");
            }
            return def.reject();
        }
        if (options.trace) {
            delete options.trace;
            options.tracer = uuids.randomUUID();
        }
        if (_.isNumber(options.bufferinterval)) {
            delete options.bufferinterval;  // Do not send bufferinterval to server
        }
        if (_.isUndefined(options.seq)) {
            def.resolve(); // Pretend a message without sequence numbers always arrives
        } else {
            if (api.debug) {
                console.log("Enqueuing in resendBuffer", options.seq);
            }
            resendBuffer[Number(options.seq)] = {count: 0, msg: options};
            if (resendDeferreds[Number(options.seq)]) {
                def = resendDeferreds[Number(options.seq)];
            } else {
                resendDeferreds[Number(options.seq)] = def;
            }
        }
        
        if (api.debug) {
            console.log("Adding to sender queue", queue);
        }
        queue.stanzas.push(JSON.parse(JSON.stringify(options)));
        if (!purging) {
            if (api.debug) {
                console.log("Start purge process");
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
