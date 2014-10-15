/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/contacts/actions/send', [
    'io.ox/contacts/api'
], function (api) {

    'use strict';

    return function (list) {

        api.getList(list, true, {
            check: function (obj) {
                return obj.mark_as_distributionlist || obj.email1 || obj.email2 || obj.email3;
            }
        }).done(function (list) {
            // set recipient
            var recipients = _.chain(list).map(function (obj) {
                if (obj.distribution_list && obj.distribution_list.length) {
                    return _(obj.distribution_list).map(function (obj) {
                        return [obj.display_name, obj.mail];
                    });
                } else {
                    return [[obj.display_name, obj.email1 || obj.email2 || obj.email3]];
                }
            }).flatten(true).filter(function (obj) { return !!obj[1]; }).value();

            // open compose
            ox.registry.call('mail-compose', 'compose', {
                to: recipients
            });
        });
    };

});
