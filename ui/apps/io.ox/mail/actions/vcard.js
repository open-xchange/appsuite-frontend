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

define('io.ox/mail/actions/vcard', [
    'io.ox/core/notifications',
    'settings!io.ox/core',
    'gettext!io.ox/mail',
    'io.ox/contacts/api'
], function (notifications, coreSettings, gt, contactAPI) {

    'use strict';

    return function (baton) {

        var attachment = _.isArray(baton.data) ? _.first(baton.data) : baton.data;

        require(['io.ox/core/api/conversion']).done(function (conversionAPI) {
            conversionAPI.convert({
                identifier: 'com.openexchange.mail.vcard',
                args: [
                    { 'com.openexchange.mail.conversion.fullname': attachment.parent.folder_id },
                    { 'com.openexchange.mail.conversion.mailid': attachment.parent.id },
                    { 'com.openexchange.mail.conversion.sequenceid': attachment.id }
                ]
            }, {
                identifier: 'com.openexchange.contact.json',
                args: []
            })
            .then(
                function success(data) {

                    if (!_.isArray(data) || data.length === 0) {
                        notifications.yell('error', gt('Failed to add. Maybe the vCard attachment is invalid.'));
                        return;
                    }

                    var contact = data[0], folder = coreSettings.get('folder/contacts');

                    function preloadParticipants() {
                        var dfd = $.Deferred();

                        _.each(contact.distribution_list, function (obj, key) {
                            contactAPI.getByEmailaddress(obj.mail).done(
                                function () {
                                    if (key === contact.distribution_list.length - 1) dfd.resolve();
                                }
                            );
                        });

                        return dfd;
                    }

                    if (contact.mark_as_distributionlist) {
                        // edit distribution list
                        require(['io.ox/contacts/distrib/main'], function (m) {
                            $.when(m.getApp(contact).launch(), preloadParticipants()).done(function () {
                                this[0].create(folder, contact);
                            });
                        });
                    } else {
                        // edit contact
                        require(['io.ox/contacts/edit/main'], function (m) {
                            contact.folder_id = folder;
                            if (m.reuse('edit', contact)) {
                                return;
                            }
                            m.getApp(contact).launch();
                        });
                    }
                },
                function fail(e) {
                    notifications.yell(e);
                }
            );
        });
    };
});
