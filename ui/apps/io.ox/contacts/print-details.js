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
