/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/metrics/main', [
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'io.ox/metrics/util',
    'io.ox/core/capabilities',
    'io.ox/core/http',
    'io.ox/metrics/extensions',
    'io.ox/metrics/adapters/default',
    'io.ox/metrics/adapters/console'
], function (ext, settings, util, caps, http) {

    'use strict';

    var point = ext.point('io.ox/metrics/adapter'),
        // TODO: salt?
        userhash = util.getUserHash(),
        metrics;

    function isEnabled () {
        // disable when doNotTrack is enabled
        if (settings.get('tracking/donottrack', false) && util.doNotTrack()) return false;
        // disable for tests
        if (_.device('karma')) return false;
        // disable durin development
        if (ox.debug) return false;
        // disable when global setting is set
        if (!settings.get('tracking/enabled', false)) return false;
        return true;
    }

    // add generated id to baton (based on baton.data)
    function qualify (baton) {
        var data = baton.data,
            // use only tail of non-flat action ids
            action = data.action ? data.action.substr(data.action.lastIndexOf('/') + 1) : data.action,
            // we do not use data.value for this -  mostly these values do not repeat
            id = _.compact([data.app, data.target, action, data.detail]).join('/');
        if (!id) return baton;
        baton.id = id;
        return baton;
    }

    function createBaton (obj) {
        // obj can be data or event with data property
        var isEvent = !!obj.preventDefault,
            baton = ext.Baton.ensure(isEvent ? { data: obj.data, event: obj } : { data: obj });
        return qualify(baton);
    }

    function mapColumns (data) {
        var app = data.app === 'drive' ? 'files' : data.app,
            mapping = http.getColumnMapping(app);
        return data.detail = mapping[data.detail] || data.detail;
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
            options.node.delegate(options.selector, options.type, data, metrics.trackEvent);
        },
        // util
        getUserHash: function () {
            return userhash;
        },
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
