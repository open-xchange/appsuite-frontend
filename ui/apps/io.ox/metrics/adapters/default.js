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

define('io.ox/metrics/adapters/default', [
    'settings!io.ox/core',
    'io.ox/core/extensions',
    'io.ox/metrics/util'
], function (settings, ext, util) {

    'use strict';

    // Matomo, formerly known as Piwik
    if (!settings.get('tracking/piwik/enabled', false)) return;

    var point = ext.point('io.ox/metrics/adapter'),
        lib = settings.get('tracking/piwik/url/lib'),
        api = settings.get('tracking/piwik/url/api'),
        id = settings.get('tracking/piwik/id', 1),
        maxlength = 200;

    // piwik uses global var to allow pushing before tracker is fully loaded
    window._paq = window._paq || [];

    if ((!api || !lib) && ox.debug) console.log('Error: Matomo/Piwik is enabled but no backend URL was configured!');

    point.extend({
        id: 'piwik',
        setup: function () {
            _paq.push(['setTrackerUrl', api]);
            _paq.push(['setSiteId', ox.debug ? 2 : id]);
            _paq.push(['setUserId', this.getUserHash()]);
            //_paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            // lazy
            require([lib]);
        },
        trackVisit: function (list) {
            var self = this,
                result = [];
            // split arrays into little chunks
            // f.e. capabilities -> capabilities-1, capabilities-2...
            _.each(list, function (data) {
                var val = String(data.value);
                // split only stringified arrays that exceed maxlength
                if (!_.isArray(data.value) || val.length <= maxlength) return result.push(data);
                var chunks = util.toChunks(data.value, maxlength);
                _.each(chunks, function (value, index) {
                    result.push(
                        _.extend({}, data, { value: value, id: data.id + '-' + (index + 1) })
                    );
                });
            });
            // add index
            _.each(result, function (data, index) {
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
            // important: 200 chars is max length
            // https://piwik.org/faq/how-to/faq_17931/
            if (!data.index) {
                if (ox.debug) console.log('Missing/invalid index argument on trackVariable call');
                return;
            }
            // http://developer.piwik.org/guides/tracking-javascript-guide#custom-variables
            _paq.push(['setCustomVariable', data.index, data.id, String(data.value), data.scope || 'visit']);
        }
    });

});
