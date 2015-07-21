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
    'io.ox/metrics/extensions',
    'io.ox/metrics/adapters/piwik',
    'io.ox/metrics/adapters/console'
], function (ext, settings, util) {

    'use strict';

    var point = ext.point('io.ox/metrics/adapter'),
        // don't run metrics in test environment
        enabled = !_.device('karma') && settings.get('tracking/enabled', false),
        userhash = util.md5(ox.user),
        metrics;

    // enabled?
    if (!enabled) {
        return {
            trackEvent: $.noop,
            trackPage: $.noop,
            trackVariable: $.noop,
            getUserHash: $.noop,
            watch: $.noop
        };
    }

    function createBaton (data) {
        var baton = ext.Baton.ensure({ data: data.data || data });
        if (!data.data) return baton;
        return _.extend(baton, { event: data } );
    }

    metrics = {
        trackEvent: function (data) {
            ext.point('io.ox/metrics/adapter').invoke('trackEvent', metrics, createBaton(data));
        },
        trackPage: function (data) {
            ext.point('io.ox/metrics/adapter').invoke('trackPage', metrics, createBaton(data));
        },
        trackVariable: function (data) {
            ext.point('io.ox/metrics/adapter').invoke('trackVariable', metrics, createBaton(data));
        },
        // register listener
        watch: function (options, data) {
            options.node.delegate(options.selector, options.type, data, metrics.trackEvent);
        },
        // util
        getUserHash: function () {
            return userhash;
        }
    };

    point.invoke('setup', metrics);
    point.invoke('trackVisit', metrics);

    // global listener (ox-events)
    ext.point('io.ox/metrics/extensions').invoke('register', metrics);

    /**
     * category: category, app
     * action: topic, question, target
     * name: name (optional) 'default'
     * value: value (optional) 'true'
     */

    return metrics;
});
