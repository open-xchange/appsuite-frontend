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

define('io.ox/metrics/main', [
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'io.ox/metrics/util',
    'io.ox/core/capabilities',
    'io.ox/core/http',
    'io.ox/metrics/extensions',
    'io.ox/metrics/adapters/default',
    'io.ox/metrics/adapters/pro',
    'io.ox/metrics/adapters/analytics',
    'io.ox/metrics/adapters/console',
    'io.ox/metrics/adapters/context'
], function (ext, settings, util, caps, http) {

    'use strict';

    var point = ext.point('io.ox/metrics/adapter'),
        userhash,
        metrics;

    function isEnabled() {
        // disable when doNotTrack is enabled
        if (util.doNotTrack()) return false;
        // disable for tests
        if (_.device('karma')) return false;
        // disable durin development
        if (ox.debug) return false;
        // disable when global setting is set
        if (!settings.get('tracking/enabled', false)) return false;
        return true;
    }

    // add generated id to baton (based on baton.data)
    function qualify(baton) {
        var data = baton.data,
            // remove leading 'io.ox/' to flatten the id a little bit
            action = data.action ? data.action.replace(/^io\.ox\//, '') : data.action,
            // prevent false to be removed by _.compact
            detail = _.isBoolean(data.detail) ? String(data.detail) : data.detail,
            // we do not use data.value for this -  mostly these values do not repeat
            id = _.compact([data.app, data.target, action, detail]).join('/');
        if (!id) return baton;
        baton.id = id;
        return baton;
    }

    function createBaton(obj) {
        // obj can be data or event with data property
        var isEvent = !!obj.preventDefault,
            baton = ext.Baton.ensure(isEvent ? { data: obj.data, event: obj } : { data: obj });
        return qualify(baton);
    }

    function mapColumns(data) {
        var app = data.app === 'drive' ? 'files' : data.app,
            mapping = http.getColumnMapping(app);
        return (data.detail = mapping[data.detail] || data.detail);
    }

    metrics = {
        trackEvent: function (data) {
            if (data.action === 'sort') mapColumns(data);
            point.invoke('trackEvent', metrics, createBaton(data));
        },
        trackPage: function (data) {
            point.invoke('trackPage', metrics, createBaton(data));
        },
        trackVariable: function (data) {
            // properties needed: id, value, index
            point.invoke('trackVariable', metrics, data);
        },
        // register listener
        watch: function (options, data) {
            options.node.on(options.type, options.selector, data, metrics.trackEvent);
        },
        // util
        getUserHash: function () {
            userhash = userhash || util.getUserHash();
            return userhash;
        },
        getFolderFlags: util.getFolderFlags,
        isEnabled: isEnabled
    };

    // replace existing functions with no-ops when metrics is disabled
    if (!isEnabled()) {
        // avoid undefined functions by change original metrics object
        _.each(metrics, function (func, key) { metrics[key] = $.noop; });
        return metrics;
    }

    // called once
    point.invoke('setup', metrics);
    point.invoke('trackVisit', metrics, [
        { id: 'language', value: ox.language },
        { id: 'version', value: ox.version },
        { id: 'capabilities', value: caps.getFlat().enabled }
    ]);

    // global listener (ox-events)
    ext.point('io.ox/metrics/extensions').invoke('register', metrics);

    /**
     * HINT: use hyphen instead if space
     *
     * id: _.compact([app, target, action, detail]).join('/')
     * cid:
     *
     * app: mail (or core)
     * target: toolbar/button
     * type: click (or drag, swipe)
     * action: delete (basic type of action)
     * detail: 3 mails (or 1 mail)
     *
     *
     * category: app-title (f.e. mail)
     * action: id (summarize information)
     * name: action preformed (add, remove, etc)
     * value: optional detail about action performed ()
     */

    return metrics;
});
