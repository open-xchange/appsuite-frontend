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

define.async('io.ox/switchboard/standalone/api', [
    'io.ox/contacts/util',
    'io.ox/core/api/user',
    'io.ox/core/extensions',
    'io.ox/core/uuids',
    'settings!io.ox/switchboard'
], function (contactsUtil, userAPI, ext, uuids, settings) {

    'use strict';

    var supportedSolutions = {};

    var api = _.extend({
        // will be set below
        userId: undefined,
        domain: '',

        // just to make sure we always use the same string
        trim: function (userId) {
            return String(userId || '').toLowerCase().trim();
        },

        isMyself: function (id) {
            return this.trim(id) === this.userId;
        },

        isGAB: function (baton) {
            // call/chat only works for users, so
            // make sure we are in global address book
            return baton.array().every(function (data) {
                return String(data.folder_id) === contactsUtil.getGabId() && data.email1;
            });
        },

        isInternal: _.constant(false),

        addSolution: function (type) {
            supportedSolutions[type] = true;
            this.trigger('addSolution', type);
        },

        supports: function (type) { return !!supportedSolutions[type]; },

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
    }, Backbone.Events);

    return userAPI.get().then(function (data) {
        api.userId = api.trim(data.email1 || data.email2 || data.email3);
        // create a simple heuristic based on domain
        // to check whether people are internal users
        var domain = api.userId.replace(/^.*?@/, ''),
            regexp = new RegExp('@' + _.escapeRegExp(domain) + '$', 'i');
        api.isInternal = function (id) {
            return regexp.test(id);
        };
        return api;
    });
});
