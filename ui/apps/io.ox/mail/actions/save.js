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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
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
