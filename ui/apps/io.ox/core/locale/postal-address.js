/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/locale/postal-address', [], function () {

    'use strict';

    var _ = ' ', LF = '\n';

    function format(data, type, cc) {
        type = type || 'home';
        return getAddress(data, type, cc)
                // ensure single spaces (handles undefined variables)
                .replace(/( )+/g, ' ')
                // trim each line
                .replace(/(^ +| +$)+/gm, '')
                // remove empty lines
                .replace(/\n+/g, '\n').trim();
    }

    function getAddress(data, type, cc) {

        var street = data['street_' + type] || '',
            code = data['postal_code_' + type] || '',
            city = data['city_' + type] || '',
            state = data['state_' + type] || '',
            country = data['country_' + type] || '';

        cc = cc || getCountryCode(country) || (ox.locale || '').slice(3, 5);

        switch (cc) {

            // without 'state'
            case 'DE':
                return street + LF +
                       code + _ + city + LF +
                       country;

            case 'AR':
            case 'AT':
            case 'BO':
            case 'CH':
            case 'CZ':
            case 'DK':
            case 'EE':
            case 'ES':
            case 'FI':
            case 'FR':
            case 'IT':
            case 'NO':
            case 'SE':
                return street + LF +
                       code + _ + city + _ + state + LF +
                       country;

            case 'AU':
            case 'CA':
            case 'PR':
            case 'US':
            case 'TW':
                return street + LF +
                       city + _ + state + _ + code + LF +
                       country;

            case 'IE':
            case 'GB':
            case 'RU':
                return street + LF +
                       city + LF +
                       state + _ + code + LF +
                       country;

            case 'NZ':
            case 'SG':
                return street + LF +
                       city + _ + code + _ + state + LF +
                       country;

            case 'CN':
                return street + _ + city + LF +
                       code + _ + state + LF +
                       country;

            case 'CR':
                return street + LF +
                       city + _ + state + LF +
                       code + _ + country;

            case 'JP':
                return street + LF +
                       state + _ + city + _ + code + LF +
                       country;

            case 'MX':
                return street + LF +
                       city + LF +
                       code + _ + state + LF +
                       country;

            case 'NL':
                return street + LF +
                       code + _ + state + _ + city + LF +
                       country;

            case 'ZA':
                return street + LF +
                       city + LF +
                       state + LF +
                       code + _ + country;

            case 'RO':
            default:
                return street + LF +
                       code + _ + city + LF +
                       state + LF +
                       country;
        }
    }

    function getCountryCode(country) {
        country = $.trim(country).toLowerCase();
        if (!country) return '';
        // order: en, de, fr, es, it
        if (/^(germany|deutschland|allemange|alemania|germania)$/.test(country)) return 'DE';
        if (/^(united states|usa?|vereinigte staaten|(é|e)tats(-| )unis|estados unidos|stati uniti d.america)$/.test(country)) return 'US';
        if (/^(uk|united kingdom|great britain|großbritannien|royaume-?uni|reino unido|regno Unito)$/.test(country)) return 'GB';
        if (/^(france|frankreich|francia)$/.test(country)) return 'FR';
        if (/^(spain|spanien|espagne|españa|spagna)$/.test(country)) return 'ES';
        if (/^(italy|italien|itelie|italia)$/.test(country)) return 'IT';
        if (/^((the )?netherlands|niederlande|(les )?pays-bas|(los )?pa(í|i)ses bajos|paesi bassi|nederland)$/.test(country)) return 'NL';
        if (/^(finland|finnland|finlande|finlandia|suomi)$/.test(country)) return 'FI';
        if (/^(japan|japon|japona|jap(ó|o)n|giappone|日本)$/.test(country)) return 'JP';
        // just en, de and own
        if (/^(austria|österreich)$/.test(country)) return 'AT';
        if (/^(switzerland|schweiz|suisse|svizzera)$/.test(country)) return 'CH';
        if (/^(belgium|belgien|belgi(ë|e)|belgique)$/.test(country)) return 'BE';
        return '';
    }

    return {
        format: format,
        getCountryCode: getCountryCode
    };
});
