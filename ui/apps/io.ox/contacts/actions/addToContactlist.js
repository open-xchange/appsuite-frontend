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

define('io.ox/contacts/actions/addToContactlist', [
    'io.ox/contacts/edit/main',
    'settings!io.ox/core'
], function (editApp, coreSettings) {

    'use strict';

    function isMSISDN(value) {
        if (/\/TYPE=PLMN$/.test(value)) return true;
        if (/^\+?\d+$/.test(value)) return true;
        return false;
    }

    return function (baton) {

        var container = $(this).closest('.contact-detail.view'),
            def = $.Deferred(),
            contact = {};

        // copy data with values
        _(baton.data).each(function (value, key) {
            if (!!value) contact[key] = value;
        });

        // create in default folder
        contact.folder_id = String(coreSettings.get('folder/contacts'));
        // MSISDN fix: email1 might be a phone number, so we should move that to cellular_telephone1
        if (isMSISDN(contact.email1)) {
            contact.cellular_telephone1 = contact.email1;
            delete contact.email1;
        }

        // launch edit app
        editApp.getApp(contact).launch(def);
        def.done(function (data) {
            baton.data = data;
            container.triggerHandler('redraw', baton);
        });
    };

});
