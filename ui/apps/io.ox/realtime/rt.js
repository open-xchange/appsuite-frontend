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
    var seq = 0;
    var request = null;
    var resendBuffer = {};

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
                if (api.debug) {
                    console.log("Received receipt for " + receipt.data);
                }
            });

        } else {
            api.trigger("receive", stanza);
            api.trigger("receive:" + stanza.selector, stanza);
        }
    }


    function connect() {
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
        var triggering = false;
        request.onOpen = function (response) {
            connecting = false;
            disconnected = false;
            def.resolve(api);
            if (!triggering) {
                triggering = true;
                api.trigger("open");
                triggering = false;
            }
        };

        var reconnectCount = 0;

        request.onReconnect = function (request, response) {
            reconnectCount++;
            if (reconnectCount > 30) {
                reconnect();
            }
        };


        request.onMessage = function (response) {
            request.requestCount = 0;
            var message = response.responseBody;
            var json = {};
            try {
                json = $.parseJSON(message);
            } catch (e) {
                console.log('This doesn\'t look like valid JSON: ', message);
                console.error(e, e.stack);
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
                        disconnected = true;
                        ox.relogin();
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
                disconnected = true;
            }
        };

        request.onError = function (response) {
        };

        return socket.subscribe(request);
    }

    function reconnect() {
        shouldReconnect = true;
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
        api.sendWithoutSequence(options);
    };

    api.sendWithoutSequence = function (options) {
        if (!_.isUndefined(options.seq)) {
            resendBuffer[options.seq] = options;
        }
        if (disconnected) {
            subSocket = connect();
            reconnectBuffer.push(options);
            return;
        }
        if (connecting) {
            // Buffer messages until connect went through
            reconnectBuffer.push(options);
            return;
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
    };

    api.on("open", function () {
        _(reconnectBuffer).each(function (options) {
            api.sendWithoutSequence(options);
        });
        reconnectBuffer = [];
    });

    setInterval(function () {
        if (!connecting && !disconnected) {
            subSocket.push("{\"type\": \"ping\"}");
        }
    }, 20000);

    setInterval(function () {
        _(resendBuffer).each(function (m) {
            api.sendWithoutSequence(m);
        });
    }, 5000);

    return def;
});
