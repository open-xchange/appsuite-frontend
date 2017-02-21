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
        var zipCode = data['postal_code_' + type],
            city = data['city_' + type];

        if (!zipCode && !city) return;
        return _([zipCode, city]).compact().join(' ');
    }

    function process(data) {
        return {
            original: data,
            name: util.getFullName(data) || '-',
            birthday: _.isNumber(data.birthday) ? util.getBirthday(data.birthday) : undefined,
            'city_business': getCity(data, 'business'),
            'city_home': getCity(data, 'home'),
            'city_other': getCity(data, 'other')
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
                    phone: gt('Phone'),
                    cellphone: gt('Cell phone'),
                    email: gt('Email'),
                    businessAddress: gt('Business Address'),
                    homeAddress: gt('Home Address'),
                    otherAddress: gt('Other Address'),
                    business: gt('Business'),
                    home: gt('Home'),
                    otherPhone: gt('Other'),
                    messenger: gt('Messenger'),
                    personalInformation: gt('Personal information'),
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
