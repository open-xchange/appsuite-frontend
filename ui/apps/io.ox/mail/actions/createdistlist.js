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

define('io.ox/mail/actions/createdistlist', [
    'settings!io.ox/core',
    'io.ox/contacts/api'
], function (coreConfig, contactAPI) {

    'use strict';

    return function (baton) {

        var data = baton.data,
            collectedRecipients = [].concat(data.to, data.cc, data.from),
            dev = $.Deferred(),
            arrayOfMembers = [],
            currentId = ox.user_id,
            lengthValue,
            contactsFolder = coreConfig.get('folder/contacts'),

            createDistlist = function (members) {
                require(['io.ox/contacts/distrib/main'], function (m) {
                    m.getApp().launch().done(function () {
                        this.create(contactsFolder, { distribution_list: members });
                    });
                });
            };

        collectedRecipients = _(collectedRecipients).chain()
            .map(function (obj) {
                return obj[1];
            })
            .uniq()
            .value();

        // get length now to know when done
        lengthValue = collectedRecipients.length;

        _(collectedRecipients).each(function (mail) {
            contactAPI.search(mail).done(function (results) {

                var currentObj, result = results[0];

                if (result) {
                    // found via search
                    currentObj = {
                        id: result.id,
                        folder_id: result.folder_id,
                        display_name: result.display_name,
                        mail: result.email1,
                        mail_field: 1
                    };
                    if (result.internal_userid !== currentId) {
                        arrayOfMembers.push(currentObj);
                    } else {
                        lengthValue = lengthValue - 1;
                    }
                } else {
                    // manual add
                    currentObj = {
                        display_name: mail,
                        mail: mail,
                        mail_field: 0
                    };
                    arrayOfMembers.push(currentObj);
                }

                // done?
                if (arrayOfMembers.length === lengthValue) {
                    dev.resolve();
                }
            });
        });

        dev.done(function () {
            createDistlist(arrayOfMembers);
        });
    };
});
