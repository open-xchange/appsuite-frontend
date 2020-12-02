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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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

    return { request: request };
});
