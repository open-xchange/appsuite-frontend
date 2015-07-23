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
    'io.ox/metrics/adapters/default',
    'io.ox/metrics/adapters/console'
], function (ext, settings, util) {

    'use strict';

    var point = ext.point('io.ox/metrics/adapter'),
        enabled =  !_.device('karma') && !ox.debug && settings.get('tracking/enabled', false),
        // TODO: salt?
        userhash = getUserHash(),
        metrics;

    function getUserHash () {
        var userhash = _.getCookie('metrics-userhash');
        if (!userhash) {
            var salt = (Math.random() + 1).toString(36).substring(2),
                userhash = util.md5(salt + ox.user + ox.user_id);
            _.setCookie('metrics-userhash', userhash);
        }
        return userhash;
    }

    // add generated id to baton (based on baton.data)
    function qualify (baton) {
        var data = baton.data,
            id = _.compact([data.app, data.target, data.action, data.detail]).join('/');
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

    metrics = {
        trackEvent: function (data) {
            point.invoke('trackEvent', metrics, createBaton(data));
        },
        trackPage: function (data) {
            point.invoke('trackPage', metrics, createBaton(data));
        },
        trackVariable: function (data) {
            point.invoke('trackVariable', metrics, createBaton(data));
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

    // replace existing functions with no-ops when metrics is disabled
    if (!enabled) {
        // avoid undefined functions by change original metrics object
        _.each(metrics, function (func, key) { metrics[key] = $.noop; });
        return metrics;
    }

    // called once
    point.invoke('setup', metrics);
    point.invoke('trackVisit', metrics);

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
