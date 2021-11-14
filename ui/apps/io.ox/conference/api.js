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

define('io.ox/conference/api', [
    'io.ox/core/api/user',
    'io.ox/contacts/util',
    'io.ox/core/http',
    'io.ox/core/uuids',
    'io.ox/core/capabilities',
    'settings!io.ox/switchboard',
    'gettext!io.ox/switchboard'
], function (userAPI, contactsUtil, http, uuids, cap, settings, gt) {

    'use strict';

    var services = {};

    var api = {

        add: function (service, options) {
            services[service] = options;
        },

        get: function (service) {
            return services[service];
        },

        supports: function (service) {
            return !!services[service];
        },

        // no better place so far
        createJitsiMeeting: function () {
            var id = ['ox'].concat(uuids.asArray(5)).join('-');
            return { id: id, joinURL: settings.get('jitsi/host') + '/' + id };
        },

        getConference: function (conferences) {
            if (!_.isArray(conferences) || !conferences.length) return;
            // we just consider the first one
            var conference = conferences[0];
            var params = conference.extendedParameters;
            if (!params || !params['X-OX-TYPE']) return;
            return {
                id: params['X-OX-ID'],
                joinURL: conference.uri,
                owner: params['X-OX-OWNER'],
                params: params,
                type: params['X-OX-TYPE']
            };
        }
    };

    if (settings.get('zoom/enabled') && settings.get('host') && cap.has('switchboard')) {
        api.add('zoom', {
            joinLinkTitle: gt('Join Zoom meeting')
        });
    }
    if (settings.get('jitsi/enabled') && settings.get('jitsi/host')) {
        api.add('jitsi', {
            joinLinkTitle: gt('Join Jitsi meeting')
        });
    }

    return api;

});
