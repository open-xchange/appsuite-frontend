/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/contacts/actions/send', [
    'io.ox/contacts/api',
    'io.ox/contacts/util'
], function (api, util) {

    'use strict';

    function resolve(list) {
        if (list.length === 1 && (list[0].id === 0 || String(list[0].folder_id) === '0' || list[0].folder_id === null)) {
            // just one contact
            var address = list[0].email1 || list[0].email2 || list[0].email3;
            return $.Deferred().resolve([[address, address]]);
        }
        // multiple contacts
        return api.getList(list, true, {
            check: function (obj) {
                return obj.mark_as_distributionlist || obj.email1 || obj.email2 || obj.email3;
            }
        })
        .then(function (list) {
            // check distribution lists for valid mail addresses (causes yell if found)
            util.validateDistributionList(_.chain(list).filter(function (obj) { return obj.distribution_list; }).map(function (obj) { return obj.distribution_list; }).flatten().value());

            // set recipient
            return _.chain(list)
                .map(function (obj) {
                    if (obj.distribution_list && obj.distribution_list.length) {
                        return _(obj.distribution_list).map(function (obj) {
                            return [obj.display_name, obj.mail];
                        });
                    }
                    return [[obj.display_name, obj.email1 || obj.email2 || obj.email3, obj.image1_url]];
                })
                .flatten(true)
                .filter(function (obj) {
                    return !!obj[1];
                })
                .value();
        });
    }

    return function (list) {
        return resolve(list).done(function (recipients) {
            // open compose
            ox.registry.call('mail-compose', 'open', { to: recipients });
        });
    };
});
