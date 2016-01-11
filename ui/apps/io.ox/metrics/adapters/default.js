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

define('io.ox/metrics/adapters/default', [
    'settings!io.ox/core',
    'io.ox/core/extensions'
], function (settings, ext) {

    'use strict';

    if (!settings.get('tracking/piwik/enabled', false)) return;

    var point = ext.point('io.ox/metrics/adapter'),
        url = settings.get('tracking/piwik/url', 'https://metrics.open-xchange.com/piwik/'),
        id = settings.get('tracking/piwik/id', 1);

    // piwik uses global var to allow pushing before tracker is fully loaded
    window._paq = window._paq || [];

    point.extend({
        id: 'piwik',
        setup: function () {
            _paq.push(['setTrackerUrl', url + 'piwik.php']);
            _paq.push(['setSiteId', ox.debug ? 2 : id]);
            _paq.push(['setUserId', this.getUserHash()]);
            //_paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            // lazy
            require([url + 'piwik.js']);
        },
        trackVisit: function (list) {
            var self = this;
            _.each(list, function (data, index) {
                self.trackVariable(_.extend(data, { index: index + 1 }));
            });
        },
        trackEvent: function (baton) {
            var data = baton.data;
            // category, action, name, value
            _paq.push(['trackEvent', data.app, baton.id || data.target, data.action, data.detail || data.value]);
        },
        trackPage: function (baton) {
            //_paq.push(['setUserId', this.getUserHash() ]);
            _paq.push(['trackPageView', baton.data.trackingId || baton.data.name || baton.data.id]);
        },
        trackVariable: function (data) {
            // important: index range in piwiks default settings is 1 to 5
            // https://piwik.org/faq/how-to/faq_17931/
            if (!data.index) {
                if (ox.debug) console.log('Missing/invalid index argument on trackVariable call');
                return;
            }
            // http://developer.piwik.org/guides/tracking-javascript-guide#custom-variables
            data.value = _.isString(data.value) ? data.value : JSON.stringify(data.value);
            _paq.push(['setCustomVariable', data.index, data.id, data.value, data.scope || 'visit']);
        }
    });

});
