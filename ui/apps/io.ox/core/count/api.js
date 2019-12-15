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
    var api = _.extend({ queue: [], add: _.noop, uuid: uuids.randomUUID() }, Backbone.Events),
        url = settings.get('count/url');

    // having an URL means enabled, disable requires an explicit "false"
    api.disabled = !url || settings.get('count/enabled') === false;

    // return mock/noop API so that consumers don't have to worry
    if (api.disabled) return api;

    var delay = parseInt(settings.get('count/delay', 3), 10) * 1000,
        brand = settings.get('count/brand'),
        toggles = settings.get('count/stats', {});

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

    var intervalId = setInterval(function () {
        if (api.queue.length === 0) return;
        var data = api.queue;
        api.queue = [];
        api.trigger('sync', data);
        if (url === 'debug') return console.debug('count', data);
        $.post({ url: url, contentType: 'application/json', data: JSON.stringify(data), timeout: 10000 })
        .fail(function (xhr) {
            // stop in case of 403 Forbidden (which means we have an invalid API token)
            if (xhr.status === 403) {
                api.trigger('forbidden');
                return clearInterval(intervalId);
            }
            // reschedule data for retransmission
            api.trigger('fail', data);
            [].push.apply(api.queue, data);
        });
    }, delay);

    return api;
});
