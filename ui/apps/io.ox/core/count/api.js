/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/count/api', ['io.ox/core/uuids', 'settings!io.ox/core'], function (uuids, settings) {

    'use strict';

    // we always need to expose the API even if tracking is disabled
    var api = _.extend({ queue: [], add: _.noop }, Backbone.Events),
        url = settings.get('count/url') || settings.get('tracker/url'),
        enabled = url && !ox.debug && settings.get('count/enabled', true),
        chunkSize = 100;

    // count/disabled is _only_ for dev purposes!
    api.disabled = settings.get('count/disabled', !enabled);
    // return mock/noop API so that consumers don't have to worry
    if (api.disabled) return api;

    function getUUID() {
        if (Modernizr.localstorage) {
            var uuid = window.sessionStorage.getItem('countid');
            if (!uuid) {
                uuid = uuids.randomUUID();
                window.sessionStorage.setItem('countid', uuid);
            }
            return uuid;
        }
        return uuids.randomUUID();
    }

    api.uuid = getUUID();

    var delay = parseInt(settings.get('count/delay', 15), 10) * 1000,
        brand = settings.get('count/brand') || settings.get('tracker/brand'),
        toggles = settings.get('count/stats', {}),
        intervalId;

    // overwrite with real function
    api.add = function (stat, data) {
        if (toggles[stat] === false) return;
        data = _.extend({ stat: stat }, data);
        if (brand) data.brand = brand;
        api.trigger('add', data);
        api.queue.push(data);
    };

    api.stat = function (id) {
        return toggles[id] !== false;
    };

    function send() {
        if (api.queue.length === 0) return;
        // for large queues ensure we only send chunks of 100 entries to avoid "entity too large" issues
        var data = api.queue.slice(0, chunkSize);
        api.queue = api.queue.slice(chunkSize, api.queue.length);
        api.trigger('sync', data);
        if (url === 'debug') return console.debug('count', data);
        $.post({ url: url, contentType: 'application/json', data: JSON.stringify(data), timeout: 10000 }).fail(function (xhr) {
            // stop in case of 403 Forbidden (which means we have an invalid API token)
            if (xhr.status === 403) {
                api.trigger('forbidden');
                return clearInterval(intervalId);
            }
            if (xhr.status === 413) {
                // last line of defense, maybe messed up content in queue causing
                // request entity too large error. In this case clear the queue
                api.queue = [];
            } else {
                // reschedule data for retransmission in case switchboard is not available
                api.trigger('fail', data);
                [].push.apply(api.queue, data);
            }
        });
    }

    // send first payload after 3s, then use longer interval
    setTimeout(function () {
        send();
        intervalId = setInterval(send, delay);
    }, 3000);

    return api;
});
