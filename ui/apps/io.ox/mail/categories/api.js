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

define('io.ox/mail/categories/api', [
    'io.ox/core/http',
    'io.ox/core/capabilities'
], function (http, capabilities) {

    'use strict';

    if (!capabilities.has('mail_categories')) {
        console.error("mail/categories/api: capababilty 'mail_categories' missing");
    }

    return {

        get: function () {
            return http.GET({
                module: 'mail/categories',
                params: {
                    action: 'unread'
                }
            });
        },
        // add mail to category
        move: function (options) {
            if (!options.data || !options.data.length) return $.when();

            var data = _.map(options.data, function (obj) {
                return _.pick(obj, 'id', 'folder_id');
            });
            return http.PUT({
                module: 'mail/categories',
                params: {
                    'action': 'move',
                    'category_id': options.category
                },
                data: data
            });
        },
        // generate rule(s) to add mail to category
        train: function (options) {
            var opt = _.extend({ past: true, future: true }, options);
            if (!opt.category || !opt.data) return;
            // plain list of mail addresses
            var list = _.chain(options.data)
                        .map(function (obj) { return obj.from[0][1]; })
                        .uniq()
                        .value();
            return http.PUT({
                module: 'mail/categories',
                params: {
                    'action': 'train',
                    'category_id': opt.category,
                    'apply-for-existing': opt.past,
                    'apply-for-future-ones': opt.future
                },
                data: {
                    from: list
                }
            });
        },
        // update categories
        update: $.noop

    };
});
