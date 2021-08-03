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

define('io.ox/mail/actions/save', [
    'io.ox/mail/api'
], function (api) {

    'use strict';

    return {

        multiple: function (data) {
            require(['io.ox/core/download'], function (download) {
                var url, first = _(data).first();

                // download plain EML?
                if (!_.isObject(first.parent)) {
                    return data.length === 1 ? download.mail(first) : download.mails(data);
                }

                if (first.msgref && _.isObject(first.parent)) {
                    // using msgref reference if previewing during compose (forward previewed mail as attachment)
                    url = api.getUrl(data, 'eml:reference');
                } else {
                    // adjust attachment id for previewing nested email within compose view
                    var adjustFn = first.parent.adjustid || '';
                    first.id = _.isFunction(adjustFn) ? adjustFn(first.id) : first.id;
                    // download attachment eml
                    url = api.getUrl(first, 'download');
                }

                download.url(url);
            });
        }
    };
});
