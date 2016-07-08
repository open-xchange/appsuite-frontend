/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/metrics/adapters/analytics', [
    'settings!io.ox/core',
    'io.ox/core/extensions'
], function (settings, ext) {

    'use strict';

    if (!settings.get('tracking/analytics/enabled')) return;

    var point = ext.point('io.ox/metrics/adapter'),
        //https://developers.google.com/analytics/devguides/collection/analyticsjs/debugging#the_debug_version_of_the_analyticsjs_library
        url = settings.get('tracking/analytics/url', location.protocol + '//www.google-analytics.com/analytics.js'),
        id = settings.get('tracking/analytics/id'),
        mapping = settings.get('tracking/analytics/mapping', {});

    if (!id) {
        if (ox.debug) console.log("Missing value for server setting for property 'io.ox/core//tracking/analytics/id'");
        return;
    }

    // analytics uses global var to allow pushing before tracker is fully loaded
    window.GoogleAnalyticsObject = 'ga';
    if (!window.qa) {
        window.ga = function () { window.ga.q.push(arguments); };
        window.ga.q = [];
    }

    point.extend({
        id: 'analytics',
        setup: function () {
            // https://support.google.com/analytics/answer/4574780
            // store the current timestamp
            window.ga.l = (new Date()).getTime();
            window.ga('create', id, 'auto');
            // options
            window.ga('set', 'anonymizeIp', true);
            //window.ga('set', 'userId', this.getUserHash());
            // lazy
            require([url]);
        },
        trackVisit: function (list) {
            var self = this;
            _.each(list, self.trackVariable);
            // send tracked variables with the pageview request
            window.ga('send', 'pageview');
        },
        trackEvent: function (baton) {
            // https://developers.google.com/analytics/devguides/collection/analyticsjs/events
            // https://support.google.com/analytics/answer/1033068
            var data = baton.data,
                value = data.detail || data.value,
                isValueNumeric = _.isNumber(value);
            window.ga('send', {
                hitType: 'event',
                eventCategory: data.app,
                eventAction: baton.id || data.target,
                eventLabel: data.action,
                // ga only support integer values for event values
                eventValue: isValueNumeric ? value : undefined
            });
        },
        trackPage: function (baton) {
            //https://developers.google.com/analytics/devguides/collection/analyticsjs/pages#implementation
            window.ga('send', 'pageview', {
                title: baton.data.trackingId || baton.data.name || baton.data.id
            });
        },
        trackVariable: function (data) {
            // https://analyticsacademy.withgoogle.com/course/4/unit/3/lesson/4
            // https://support.google.com/analytics/answer/2709828
            // https://support.google.com/analytics/answer/2709829
            // https://developers.google.com/analytics/devguides/collection/analyticsjs/custom-dims-mets
            if (!mapping[data.id]) {
                if (ox.debug) console.log("Missing mapping for custom dimension '" + data.id + "'.");
                return;
            }
            // set dimension (max 150 Bytes)
            window.ga('set', mapping[data.id], String(data.value));
        }
    });

});
