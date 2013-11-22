/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('plugins/halo/contacts/register', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    ext.point('io.ox/halo/contact:renderer').extend({
        id: 'contacts',
        handles: function (type) {
            return type === 'com.openexchange.halo.contacts';
        },
        draw: function (baton) {

            if (baton.data.length === 0) return;

            var self = this, def = $.Deferred();

            require(['io.ox/contacts/view-detail', 'less!io.ox/contacts/style.less'], function (view) {
                self.append(view.draw(baton.data[0]));
                def.resolve();
            });

            return def;
        }
    });

    ext.point('io.ox/halo/contact:requestEnhancement').extend({
        id: 'contacts-request',
        enhances: function (type) {
            return type === 'com.openexchange.halo.contacts';
        },
        enhance: function (request) {
            request.appendColumns = true;
            request.columnModule = 'contacts';
        }
    });
});
