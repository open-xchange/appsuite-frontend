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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('plugins/halo/contacts/register', [
    'io.ox/core/extensions',
    'settings!io.ox/mail'
], function (ext, mailSettings) {

    'use strict';

    ext.point('io.ox/halo/contact:renderer').extend({
        id: 'contacts',
        handles: function (type) {
            return type === 'com.openexchange.halo.contacts';
        },
        draw: function (baton) {

            if (baton.data.length === 0) return;

            var self = this, def = $.Deferred();

            require(['io.ox/contacts/view-detail', 'io.ox/contacts/util', 'less!io.ox/contacts/style'], function (view, util) {

                // prefer entry that is not in "collected addresses" (bug 58433)
                var contact = _.sortBy(baton.data, function (contact) {
                    return contact.folder_id === mailSettings.get('contactCollectFolder') ? 1 : 0;
                })[0];

                // if no display name can be computed, use the name of the mail
                if (util.getFullName(contact) === '') contact.display_name = (baton.contact.contact ? util.getFullName(baton.contact.contact) || baton.contact.name : baton.contact.name);
                // investigate request does not convert birthdays from year 1 (used to store birthdays without a year) back to gregorian calendar so do it here
                if (contact.birthday && moment.utc(contact.birthday).year() === 1) {
                    contact.birthday = util.julianToGregorian(contact.birthday);
                }

                self.append(view.draw(contact));
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
