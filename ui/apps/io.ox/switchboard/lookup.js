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

define('io.ox/switchboard/lookup', [
    'io.ox/core/http',
    'io.ox/contacts/util',
    'settings!io.ox/switchboard',
    'gettext!io.ox/switchboard'
], function (http, util, settings, gt) {

    'use strict';

    var exports = {

        hash: {},
        emailFields: ['email1', 'email2', 'email3'],
        numberFields: ['telephone_home1', 'telephone_home2', 'cellular_telephone1', 'cellular_telephone2', 'telephone_business1', 'telephone_business2'],
        columns: '1,20,500,501,502,505,542,543,547,548,549,551,552,555,556,557',
        limit: settings.get('callHistory/searchLimit', 10000),

        ready: $.Deferred(),

        initialize: function () {
            this.initialize = _.noop;
            var filter = getFilter(exports.numberFields, '<>', '');
            search(filter).done(function (result) {
                processSearchResult(result);
                exports.ready.resolve();
            });
        },

        add: function (key, data) {
            if (!key) return;
            // avoid overrides (so GAB wins for example, see "sort")
            if (exports.hash[key]) return;
            exports.hash[key] = data;
        },

        findByNumber: function (str) {
            return this.ready.then(function () {
                return exports.hash[cleanNumber(str)];
            });
        },

        findByEmail: function (str) {
            var email = cleanAddress(str),
                cached = exports.hash[email];
            if (cached) return $.when(cached);
            var filter = getFilter(exports.emailFields, '=', email);
            return search(filter).then(function (result) {
                processSearchResult(result);
                return result[0];
            });
        },

        getUserNameNode: function (userId) {
            var preliminary = String(userId).replace(/\.|(@[^@]+$)/g, ' ').trim();
            var node = document.createTextNode(preliminary);
            this.findByEmail(userId).done(function (data) {
                if (data) node.nodeValue = gt.noI18n(util.getFullName(data));
            });
            return node;
        }
    };

    function getFilter(fields, operator, value) {
        return ['or'].concat(
            fields.map(function (field) {
                return [operator, { field: field }, value];
            })
        );
    }

    function search(filter) {
        return http.PUT({
            module: 'contacts',
            params: {
                action: 'advancedSearch',
                columns: exports.columns,
                right_hand_limit: exports.limit,
                // sort by folder so that we get entries from GAB (6) first
                sort: '20'
            },
            data: { filter: filter }
        });
    }

    function processSearchResult(result) {
        _(result).each(function (data) {
            exports.emailFields.forEach(function (field) {
                exports.add(cleanAddress(data[field]), data);
            });
            exports.numberFields.forEach(function (field) {
                exports.add(cleanNumber(data[field]), data);
                exports.add(cleanNumberWithPrefix(data[field]), data);
            });
        });
    }

    function cleanAddress(str) {
        return String(str).trim().toLowerCase();
    }

    function cleanNumber(str) {
        return String(str).trim().replace(/(^\+\d)?\D*/g, '$1');
    }

    function cleanNumberWithPrefix(str) {
        return String(str).trim().replace(/^(\+49|0049)/, '0').replace(/\D+/g, '');
    }

    return exports;
});
