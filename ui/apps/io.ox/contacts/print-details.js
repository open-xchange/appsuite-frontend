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
    'settings!io.ox/contacts',
    'gettext!io.ox/contacts'
], function (print, api, util, settings, gt) {

    'use strict';

    function getCity(data, type) {
        data = _(['street', 'postal_code', 'city', 'state', 'country']).map(function (field) {
            return data[field + '_' + type] || '';
        });

        //#. Format of addresses
        //#. %1$s is the street
        //#. %2$s is the postal code
        //#. %3$s is the city
        //#. %4$s is the state
        //#. %5$s is the country
        var text = gt('%1$s\n%2$s %3$s\n%4$s\n%5$s', data[0], data[1], data[2], data[3], data[4]).trim();
        return $.trim(text);
    }

    function process(data) {
        return {
            original: data,
            name: util.getFullName(data) || '-',
            birthday: _.isNumber(data.birthday) ? util.getBirthday(data.birthday) : undefined,
            businessAddress: getCity(data, 'business'),
            homeAddress: getCity(data, 'home'),
            otherAdress: getCity(data, 'other')
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
