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
