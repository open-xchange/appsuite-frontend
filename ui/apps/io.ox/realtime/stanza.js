/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/realtime/stanza', function () {
    'use strict';

    function matches(json, namespace, element) {
        return json.namespace === namespace && json.element === element;
    }

    function get(json, namespace, element) {
        var i;
        if (matches(json, namespace, element)) {
            return new RealtimePayload(json);
        }
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

    return {
        RealtimePayload: RealtimePayload,
        RealtimeStanza: RealtimeStanza
    };
});
