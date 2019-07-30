/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/contacts/print-details', [
    'io.ox/core/print',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'io.ox/core/locale/postal-address',
    'settings!io.ox/contacts',
    'gettext!io.ox/contacts'
], function (print, api, util, postalAddress, settings, gt) {

    'use strict';

    function process(data) {
        return {
            original: data,
            name: util.getFullName(data) || '-',
            birthday: _.isNumber(data.birthday) ? util.getBirthday(data.birthday) : undefined,
            businessAddress: postalAddress.format(data, 'business'),
            homeAddress: postalAddress.format(data, 'home'),
            otherAdress: postalAddress.format(data, 'other')
        };
    }

    var printContacts = {

        getOptions: function (selection, win) {
            return {
                get: function (obj) {
                    return api.get(obj);
                },

                title: selection.length === 1 ? selection[0].display_name : undefined,

                i18n: {
                    //#. vcard (electronic business card) field
                    phone: gt('Phone'),
                    //#. vcard (electronic business card) field
                    cellphone: gt('Cell phone'),
                    //#. vcard (electronic business card) field
                    email: gt('Email'),
                    //#. vcard (electronic business card) field
                    businessAddress: gt('Business Address'),
                    //#. vcard (electronic business card) field
                    homeAddress: gt('Home Address'),
                    //#. vcard (electronic business card) field
                    otherAddress: gt('Other Address'),
                    //#. vcard (electronic business card) field
                    business: gt('Business'),
                    //#. vcard (electronic business card) field
                    home: gt('Home'),
                    //#. vcard (electronic business card) field
                    otherPhone: gt('Other'),
                    //#. vcard (electronic business card) field
                    messenger: gt('Messenger'),
                    //#. vcard (electronic business card) field
                    personalInformation: gt('Personal information'),
                    //#. vcard (electronic business card) field
                    birthday: gt('Date of birth')
                },

                process: process,
                selection: selection,
                selector: '.contacts-details',
                sortBy: 'sort_name',
                window: win
            };
        },

        open: function (selection, win) {
            print.smart(printContacts.getOptions(selection, win));
        }
    };

    return printContacts;
});
