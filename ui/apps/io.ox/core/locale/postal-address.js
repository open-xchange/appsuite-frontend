/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/core/locale/postal-address', [], function () {

    'use strict';

    function format(data, type, locale) {
        type = type || 'home';
        locale = locale || ox.locale;

        var address = {};
        _(['street', 'postal_code', 'city', 'state', 'country']).each(function (field) {
            address[field] = data[field + '_' + type] || '';
        });

        return getAddress(address, locale)
                // remove inline spaces caused by undefined variables
                .replace(/( )+/g, ' ')
                .replace(/(\n |\n)+/g, '\n').trim();
    }

    function getAddress(data, locale) {
        locale = locale || ox.locale;

        var location = window.test || locale.slice(3, 5) || 'US';

        switch (location) {
            case 'AR':
            case 'AT':
            case 'BE':
            case 'BO':
            case 'CH':
            case 'CZ':
            case 'DE':
            case 'DK':
            case 'EE':
            case 'ES':
            case 'FI':
            case 'FR':
            case 'IT':
            case 'NO':
            case 'SE':
                return data.street + '\n' +
                       data.postal_code + ' ' + data.city + ' ' + data.state + '\n' +
                       data.country;

            case 'AU':
            case 'CA':
            case 'PR':
            case 'US':
                return data.street + '\n' +
                       data.city + ' ' + data.state + ' ' + data.postal_code + '\n' +
                       data.country;

            case 'IE':
            case 'GB':
            case 'RU':
                return data.street + '\n' +
                       data.city + '\n' +
                       data.state + ' ' + data.postal_code + '\n' +
                       data.country;

            case 'NZ':
            case 'SG':
                return data.street + '\n' +
                       data.city + ' ' + data.postal_code + ' ' + data.state + '\n' +
                       data.country;

            case 'CN':
                return data.street + ' ' + data.city + '\n' +
                       data.postal_code + ' ' + data.state + '\n' +
                       data.country;

            case 'CR':
                return data.street + '\n' +
                       data.city + ' ' + data.state + '\n' +
                       data.postal_code + ' ' + data.country;

            case 'JP':
                return data.street + '\n' +
                       data.state + ' ' + data.city + ' ' + data.postal_code + '\n' +
                       data.country;

            case 'MX':
                return data.street + '\n' +
                       data.city + '\n' +
                       data.postal_code + ' ' + data.state + '\n' +
                       data.country;

            case 'NL':
                return data.street + '\n' +
                       data.postal_code + ' ' + data.state + ' ' + data.city + '\n' +
                       data.country;

            case 'TW':
                return data.street + '\n' +
                       data.city + ' ' + data.state + ' ' + data.postal_code + '\n' +
                       data.country;

            case 'ZA':
                return data.street + '\n' +
                       data.city + '\n' +
                       data.state + '\n' +
                       data.postal_code + ' ' + data.country;

            case 'RO':
            default:
                return data.street + '\n' +
                       data.postal_code + ' ' + data.city + '\n' +
                       data.state + '\n' +
                       data.country;
        }
    }

    return {
        format: format
    };

});
