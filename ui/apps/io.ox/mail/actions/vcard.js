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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
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
