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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/core/locale/postal-address', [], function () {

    'use strict';

    var _ = ' ', LF = '\n';

    function format(data, type, countrycode) {
        type = type || 'home';
        return getAddress(data, type, countrycode)
                // remove inline spaces caused by undefined variables
                .replace(/( )+/g, ' ')
                .replace(/(\n |\n)+/g, '\n').trim();
    }

    function getAddress(data, type, countrycode) {

        var street = $.trim(data['street_' + type]),
            postal_code = $.trim(data['postal_code_' + type]),
            city = $.trim(data['city_' + type]),
            state = $.trim(data['state_' + type]),
            country = $.trim(data['country_' + type]).toUpperCase();

        countrycode = countrycode || getCountryCode(country) || (ox.locale || ox.language || '').slice(3, 5) || 'US';

        switch (countrycode) {
            case 'AR':
            case 'AT':
            case 'BE':
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
                       postal_code + _ + city + _ + state + LF +
                       country;

            // omits 'state'
            case 'DE':
                return street + LF +
                       postal_code + _ + city + LF +
                       country;

            case 'AU':
            case 'CA':
            case 'PR':
            case 'US':
                return street + LF +
                       city + _ + state + _ + postal_code + LF +
                       country;

            case 'IE':
            case 'GB':
            case 'RU':
                return street + LF +
                       city + LF +
                       state + _ + postal_code + LF +
                       country;

            case 'NZ':
            case 'SG':
                return street + LF +
                       city + _ + postal_code + _ + state + LF +
                       country;

            case 'CN':
                return street + _ + city + LF +
                       postal_code + _ + state + LF +
                       country;

            case 'CR':
                return street + LF +
                       city + _ + state + LF +
                       postal_code + _ + country;

            case 'JP':
                return street + LF +
                       state + _ + city + _ + postal_code + LF +
                       country;

            case 'MX':
                return street + LF +
                       city + LF +
                       postal_code + _ + state + LF +
                       country;

            case 'NL':
                return street + LF +
                       postal_code + _ + state + _ + city + LF +
                       country;

            case 'TW':
                return street + LF +
                       city + _ + state + _ + postal_code + LF +
                       country;

            case 'ZA':
                return street + LF +
                       city + LF +
                       state + LF +
                       postal_code + _ + country;

            case 'RO':
            default:
                return street + LF +
                       postal_code + _ + city + LF +
                       state + LF +
                       country;
        }
    }

    function getCountryCode(country) {
        country = $.trim(country).toLowerCase();

        // order: en, de, fr, es, it
        if (/^(germany|deutschland|allemange|alemania|germania|)$/.test(country)) return 'DE';
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

        return '';
    }

    return {
        format: format,
        getCountryCode: getCountryCode
    };

});
