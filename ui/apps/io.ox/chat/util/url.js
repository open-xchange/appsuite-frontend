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

define('io.ox/chat/util/url', ['io.ox/chat/api'], function (api) {

    // ttl is 10 minutes
    var TTL = 1000 * 60 * 10;
    var cache = {};
    var timeout = {};

    function request(url) {
        // cache hit
        if (cache[url]) {
            startTimeout(url);
            return $.when(cache[url]);
        }
        // cache miss
        return requestBlob(url).then(function (blob) {
            startTimeout(url);
            return (cache[url] = URL.createObjectURL(blob));
        });
    }

    function requestBlob(url) {
        return api.request({ url: url, xhrFields: { responseType: 'blob' } });
    }

    function revoke(url) {
        var objectURL = cache[url];
        if (!objectURL) return;
        delete cache[url];
        delete timeout[url];
        URL.revokeObjectURL(objectURL);
    }

    function startTimeout(url) {
        if (timeout[url]) clearTimeout(timeout[url]);
        timeout[url] = setTimeout(revoke, TTL, url);
    }

    return {
        request: request,
        revoke: revoke
    };
});
