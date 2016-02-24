/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/realtime/synchronized_http', ['io.ox/core/http'], function (http) {
    'use strict';

    // Ensures PUTs to be performed one after the other
    var synchronizedHTTP = {
        transmitting: false,
        buffer: [],
        PUT: function (options) {
            var def = $.Deferred();
            this.buffer.push({
                options: options,
                deferred: def,
                method: 'PUT'
            });

            this.tick();

            return def;
        },
        GET: function (options) {
            var def = $.Deferred();
            this.buffer.push({
                options: options,
                deferred: def,
                method: 'GET'
            });

            this.tick();

            return def;
        },

        tick: function () {
            var self = this;
            if (this.transmitting) {
                return;
            }
            if (this.buffer.length === 0) {
                return;
            }
            this.transmitting = true;
            var nextRequest = this.buffer.shift();
            if (nextRequest.skipable) {
                this.tick();
                return;
            }
            if (nextRequest.method === 'PUT') {
                http.PUT(nextRequest.options).always(function () {
                    self.transmitting = false;
                    self.tick();
                }).done(nextRequest.deferred.resolve).fail(nextRequest.deferred.reject);
            } else if (nextRequest.method === 'GET') {
                http.GET(nextRequest.options).always(function () {
                    self.transmitting = false;
                    self.tick();
                }).done(nextRequest.deferred.resolve).fail(nextRequest.deferred.reject);
            }
        }
    };

    return synchronizedHTTP;
});
