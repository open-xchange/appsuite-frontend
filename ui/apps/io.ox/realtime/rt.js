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

define.async('io.ox/realtime/rt', ['io.ox/core/extensions', "io.ox/core/event", "io.ox/core/capabilities", "io.ox/core/uuids", "io.ox/realtime/atmosphere"], function (ext, Event, caps, uuids) {
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
    var connecting = false;
    var shouldReconnect = false;
    var disconnected = true;
    var socket = $.atmosphere;
    var splits = document.location.toString().split('/');
    var proto = splits[0];
    var host = splits[2];
    var url = proto + "//" + host + (_.url.hash("realtimePath") || "/realtime") + "/atmosphere/rt";
    var api = {};
    var def = $.Deferred();
    var BUFFERING = true;
    var BUFFER_INTERVAL = 1000;
    var INFINITY = 4;
    var seq = 0;
    var request = null;
    var resendBuffer = {};
    var resendDeferreds = {};
    var serverSequenceThreshhold = 0;
    var pingNumber = 0;
    var pendingPing = false;
    var initialReset = true;

    Event.extend(api);


    function matches(json, namespace, element) {
        return json.namespace === namespace && json.element === element;
    }

    function get(json, namespace, element) {
        var i;
        if (matches(json, namespace, element)) {
            return new RealtimePayload(json);
        } else {
            if (json.payloads) {
                for (i = 0; i < json.payloads.length; i++) {
                    var payload = get(json.payloads[i], namespace, element);
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
        _(json.payloads || []).each(function (p) {
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

    /*
    TODO: Transport Negotiation
    var transports = [];
    transports[0] = "websocket";
    transports[1] = "sse";
    transports[2] = "jsonp";
    transports[3] = "long-polling";
    transports[4] = "streaming";
    transports[5] = "ajax";

    $.each(transports, function (index, transport) {
        var req = new $.atmosphere.AtmosphereRequest();

        req.url = url;
        req.contentType = "application/json";
        req.transport = transport;
        req.headers = { "negotiating" : "true", session: session };

        req.onOpen = function(response) {
            // SO?
        };

        req.onReconnect = function(request) {
          request.close();
        };

        socket.subscribe(req);
    });
    */

    function received(stanza) {
        if (stanza.get("atmosphere", "received")) {
            _(stanza.getAll("atmosphere", "received")).each(function (receipt) {
                delete resendBuffer[Number(receipt.data)];
                if (resendDeferreds[Number(receipt.data)]) {
                    resendDeferreds[Number(receipt.data)].resolve();
                } else {
                }
                if (api.debug) {
                    console.log("Received receipt for " + receipt.data);
                }
                delete resendDeferreds[Number(receipt.data)];
            });
        } else if (stanza.get("atmosphere", "pong")) {
            _(stanza.getAll("atmosphere", "pong")).each(function (pong) {
                if (pong.data === pingNumber - 1) {
                    pendingPing = false;
                }
            });
        } else if (stanza.get("atmosphere", "nextSequence")) {
            if (!initialReset) {
                api.trigger("reset");
                seq = stanza.get("atmosphere", "nextSequence").data;
                serverSequenceThreshhold = 0;
                if (api.debug) {
                    console.log("Got reset command, nextSequence is ", seq);
                }
            } else {
                initialReset = false;
            }
        } else {
            if (stanza.seq > -1) {
                if (api.debug) {
                    console.log("Sending receipt " + stanza.seq);
                }
                subSocket.push("{type: 'ack', seq: " + stanza.seq + "}");
            }
            if (stanza.seq === -1 || stanza.seq > serverSequenceThreshhold || stanza.seq === 0) {
                api.trigger("receive", stanza);
                api.trigger("receive:" + stanza.selector, stanza);
                if (stanza.seq !== -1) {
                    serverSequenceThreshhold = stanza.seq;
                }
            }
        }
    }


    function connect() {
        if (connecting) {
            return;
        }
        connecting = true;

        request = {
            url: url + '?session=' + ox.session + "&resource=" + tabId,
            contentType : "application/json",
            logLevel : 'shutUp',
            transport : 'long-polling',
            fallbackTransport: 'long-polling',
            timeout: 60000,
            messageDelimiter: null,
            maxRequest: 60
        };


        //------------------------------------------------------------------------------
        //request callbacks
        request.onOpen = function (response) {
            connecting = false;
            def.resolve(api);
            if (disconnected) {
                disconnected = false;
                api.trigger("open");
                if (api.debug) {
                    console.log("Triggering Online because #onOpen was called");
                }
                api.trigger("online");
            }
            disconnected = false;
        };

        var reconnectCount = 0;

        request.onReconnect = function (request, response) {
            reconnectCount++;
            if (reconnectCount > 30 && !disconnected) {
                reconnect();
            }
        };


        request.onMessage = function (response) {
            request.requestCount = 0;
            if (response.status !== 200 && response.status !== 408) { // 200 = OK, 208 == TIMEOUT, which is expected
                if (!disconnected) {
                    if (api.debug) {
                        console.log("Triggering offline, because request failed with status: ", response.status);
                    }
                    goOffline();
                    subSocket.close();
                }
                return;
            }
            var message = response.responseBody;
            var json = {};
            try {
                json = $.parseJSON(message);
            } catch (e) {
                console.log(response);
                console.log('This doesn\'t look like valid JSON: ', message);
                console.error(e, e.stack, response);
                throw e;
            }
            if (_.isArray(json)) {
                _(json).each(function (stanza) {
                    if (api.debug) {
                        console.log("<-", stanza);
                    }
                    stanza = new RealtimeStanza(stanza);
                    received(stanza);
                });
            } else if (_.isObject(json)) { // json may be null
                if (api.debug) {
                    console.log("<-", json);
                }
                var stanza = new RealtimeStanza(json);
                received(stanza);
                if (json.error && /^SES/.test(json.error)) {
                    if (json.error.indexOf(ox.session) === -1 && !connecting && !disconnected && !/^SES-0201/.test(json.error)) {
                        reconnect();
                    } else {
                        subSocket.close();
                        if (!disconnected) {
                            if (api.debug) {
                                console.log("Triggering offline, because I got a session expired error");
                            }
                            goOffline();
                        }
                        disconnected = true;

                        ox.trigger('relogin:required');
                    }
                }

            }
        };

        request.onClose = function (response) {
            if (api.debug) {
                console.log("Closed");
            }
            if (shouldReconnect) {
                shouldReconnect = false;
                subSocket = connect();
            } else {
                if (!disconnected) {
                    if (api.debug) {
                        console.log("Triggering offline because #onClose was called");
                    }
                    goOffline();
                }
                disconnected = true;
            }
        };

        request.onError = function (response) {
            if (!disconnected) {
                disconnected = true;
                reconnect();
            }
        };

        return socket.subscribe(request);
    }

    function goOffline() {
        if (!disconnected) {
            disconnected = true;
            api.trigger("offline");
        }
    }

    function reconnect() {
        if (connecting) {
            return;
        }
        shouldReconnect = true;
        disconnected = true;
        subSocket.close();
    }

    var subSocket = connect();

    disconnected = false;
    ox.on("change:session", function () {
        subSocket = connect();
    });

    var queue = {
        stanzas: [],
        timer: null
    };

    var reconnectBuffer = [];

    function drainBuffer() {
        request.requestCount = 0;
        subSocket.push(JSON.stringify(queue.stanzas));
        if (api.debug) {
            console.log("->", queue.stanzas);
        }
        queue.stanzas = [];
        queue.timer = false;
    }

    api.send = function (options) {
        options.seq = seq;
        seq++;
        return api.sendWithoutSequence(options);
    };

    api.sendWithoutSequence = function (options) {
        var def = $.Deferred();
        if (options.trace) {
            delete options.trace;
            options.tracer = uuids.randomUUID();
        }
        if (_.isUndefined(options.seq)) {
            def.resolve(); // Pretend a message without sequence numbers always arrives
        } else {
            resendBuffer[options.seq] = {count: 0, msg: options};
            if (resendDeferreds[options.seq]) {
                def = resendDeferreds[options.seq];
            } else {
                resendDeferreds[options.seq] = def;
            }
        }
        if (disconnected) {
            subSocket = connect();
            reconnectBuffer.push(options);
            return def;
        }
        if (connecting) {
            // Buffer messages until connect went through
            reconnectBuffer.push(options);
            return def;
        }
        if (BUFFERING) {
            queue.stanzas.push(JSON.parse(JSON.stringify(options)));
            if (!queue.timer) {
                queue.timer = true;
                setTimeout(drainBuffer, BUFFER_INTERVAL);
            }
        } else {
            request.requestCount = 0;
            subSocket.push(JSON.stringify(options));
            if (api.debug) {
                console.log("->", options);
            }
        }
        return def;
    };

    api.on("open", function () {
        _(reconnectBuffer).each(function (options) {
            api.sendWithoutSequence(options);
        });
        reconnectBuffer = [];
    });

    api.inspectStatus = function () {
        console.log("Resend Buffer", resendBuffer);
        console.log("Resend Deferreds", resendDeferreds);
        console.log("Connecting", connecting);
        console.log("Disconnected", disconnected);
    };

    setInterval(function () {
        if (!connecting) {
            if (disconnected) {
                reconnect();
            } else {
                if (pendingPing) {
                    if (api.debug) {
                        console.log("Triggering offline, because I found a pending ping");
                    }
                    goOffline();
                }
                subSocket.push("{\"type\": \"ping\", \"commit\": true, \"id\" : " + pingNumber + " }");
                pingNumber++;
                pendingPing = true;
            }
        }
    }, 30000);

    setInterval(function () {
        _(resendBuffer).each(function (m) {
            m.count++;
            if (m.count < INFINITY) {
                api.sendWithoutSequence(m.msg);
            } else {
                delete resendBuffer[m.msg.seq];
                resendDeferreds[m.msg.seq].reject();
                delete resendDeferreds[m.msg.seq];
            }
        });
    }, 5000);

    return def;
});
