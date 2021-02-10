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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/contacts/actions/send', [
    'io.ox/contacts/api',
    'io.ox/contacts/util'
], function (api, util) {

    'use strict';

    function resolve(list) {

        if (list.length === 1 && (list[0].id === 0 || String(list[0].folder_id) === '0')) {
            // just one contact
            var adress = list[0].email1 || list[0].email2 || list[0].email3;
            return $.Deferred().resolve([[adress, adress]]);
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
