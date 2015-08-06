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
        url = settings.get('tracking/piwik/url', 'https://metrics.open-xchange.com/piwik/');

    // piwik uses global var to allow pushing before tracker is fully loaded
    window._paq = window._paq || [];

    point.extend({
        id: 'piwik',
        setup: function () {
            _paq.push(['setTrackerUrl', url + 'piwik.php']);
            _paq.push(['setSiteId', ox.debug ? 2 : 1]);
            _paq.push(['setUserId', this.getUserHash() ]);
            //_paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            // lazy
            require([url + 'piwik.js']);
        },
        trackVisit: function () {
            //_paq.push(['setUserId', this.getUserHash() ]);
            _paq.push(['setCustomVariable', 1, 'language', ox.language, 'visit' ]);
        },
        trackEvent: function (baton) {
            var data = baton.data;
            //_paq.push(['setUserId', this.getUserHash() ]);
            // category, action, name, value
            _paq.push(['trackEvent', data.app, baton.id || data.target, data.action, data.detail]);
        },
        trackPage: function (baton) {
            //_paq.push(['setUserId', this.getUserHash() ]);
            _paq.push(['trackPageView', baton.data.id || baton.data.name || baton.data.title ]);
        }
    });

});
