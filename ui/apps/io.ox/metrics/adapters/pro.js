/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/metrics/adapters/pro', [
    'settings!io.ox/core',
    'io.ox/core/extensions',
    'io.ox/metrics/util'
], function (settings, ext, util) {

    'use strict';

    if (!settings.get('tracking/piwikpro/enabled', false)) return;

    var point = ext.point('io.ox/metrics/adapter'),
        lib = settings.get('tracking/piwikpro/url/lib'),
        maxlength = 200;

    // piwik uses global var to allow pushing before tracker is fully loaded
    window._paq = window._paq || [];

    if (!lib) console.log('Error: Piwik Pro is enabled but no backend URL was configured!');

    var self;

    point.extend(self = {
        id: 'piwik-pro',
        setup: function () {
            this.consents = undefined;
            self.track(['setUserId', this.getUserHash()]);
            require([lib], function () {
                self.getConsents();
                // workaround when user updates consence in widget
                $('body').on('click', '.ppms_cm_centered_buttons button', function () {
                    _.delay(self.getConsents, 1000);
                });
            });
        },

        getConsents: function () {
            // https://developers.piwik.pro/en/latest/consent_manager/js_api/index.html#get-compliance-settings
            window.ppms.cm.api('getComplianceSettings', callback, callback);

            function callback(data) {
                self.consents = data.consents || data || {};
                if (!self.consents.analytics) return;
                if (self.consents.analytics.status !== 1) return;
                self.enabled = true;
            }
        },

        track: function (array) {
            if (self.enabled) window._paq.push(array);
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
            self.track(['trackEvent', data.app, baton.id || data.target, data.action, data.detail || data.value]);
        },
        trackPage: function (baton) {
            self.track(['trackPageView', baton.data.trackingId || baton.data.name || baton.data.id]);
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
            self.track(['setCustomVariable', data.index, data.id, String(data.value), data.scope || 'visit']);
        }
    });

});
