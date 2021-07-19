/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/locale/meta', function () {

    'use strict';

    var locales = {
        bg_BG: 'български (България)',
        ca_ES: 'Català (Espanya)',
        cs_CZ: 'Čeština (Česko)',
        da_DK: 'Dansk (Danmark)',
        de_DE: 'Deutsch (Deutschland)',
        de_AT: 'Deutsch (Österreich)',
        de_CH: 'Deutsch (Schweiz)',
        en_US: 'English (United States)',
        en_GB: 'English (United Kingdom)',
        en_AU: 'English (Australia)',
        en_CA: 'English (Canada)',
        en_DE: 'English (Germany)',
        en_IE: 'English (Ireland)',
        en_NZ: 'English (New Zealand)',
        en_SG: 'English (Singapore)',
        en_ZA: 'English (South Africa)',
        es_ES: 'Español (Espana)',
        es_MX: 'Español (México)',
        es_AR: 'Español (Argentina)',
        es_BO: 'Español (Bolivia)',
        es_CL: 'Español (Chile)',
        es_CO: 'Español (Colombia)',
        es_CR: 'Español (Costa Rica)',
        es_DO: 'Español (Républica Dominicana)',
        es_EC: 'Español (Ecuador)',
        es_SV: 'Español (El Salvador)',
        es_GT: 'Español (Guatemala)',
        es_HN: 'Español (Honduras)',
        es_NI: 'Español (Nicaragua)',
        es_PA: 'Español (Panamá)',
        es_PY: 'Español (Paraguay)',
        es_PE: 'Español (Perú)',
        es_PR: 'Español (Puerto Rico)',
        es_US: 'Español (United States)',
        et_EE: 'eesti (Eesti)',
        fi_FI: 'Suomi (Suomi)',
        fr_FR: 'Français (France)',
        fr_CA: 'Français (Canada)',
        fr_CH: 'Français (Suisse)',
        fr_BE: 'Français (Belgique)',
        hu_HU: 'Magyar (Magyarország)',
        it_IT: 'Italiano (Italia)',
        it_CH: 'Italiano (Svizzera)',
        lv_LV: 'Latviešu (Latvija)',
        nl_NL: 'Nederlands (Nederland)',
        nl_BE: 'Nederlands (België)',
        nb_NO: 'Norsk (Norge)',
        pl_PL: 'Polski (Polska)',
        pt_BR: 'Português (Brasil)',
        ru_RU: 'Pусский (Россия)',
        ro_RO: 'Română (România)',
        sk_SK: 'Slovenčina (Slovensko)',
        sv_SE: 'Svenska (Sverige)',
        tr_TR: 'Türkçe (Türkiye)',
        ja_JP: '日本語 (日本)',
        zh_CN: '中文 (简体)',
        zh_TW: '中文 (繁體)'
    };

    // map locales to moment's locale
    var mapToMoment = {
        bg_BG: 'bg',
        ca_ES: 'ca',
        cs_CZ: 'cs',
        da_DK: 'da',
        de_DE: 'de',
        de_AT: 'de-at',
        de_CH: 'de-ch',
        en_US: 'en',
        en_GB: 'en-gb',
        en_AU: 'en-au',
        en_CA: 'en-ca',
        en_DE: 'en-gb',
        en_IE: 'en-ie',
        en_NZ: 'en-nz',
        en_SG: 'en-SG',
        en_ZA: 'en-gb',
        es_ES: 'es',
        es_MX: 'es-do',
        es_AR: 'es-do',
        es_BO: 'es-do',
        es_CL: 'es-do',
        es_CO: 'es-do',
        es_CR: 'es-do',
        es_DO: 'es-do',
        es_EC: 'es-do',
        es_SV: 'es-do',
        es_GT: 'es-do',
        es_HN: 'es-do',
        es_NI: 'es-do',
        es_PA: 'es-do',
        es_PY: 'es-do',
        es_PE: 'es-do',
        es_PR: 'es-do',
        es_US: 'es-us',
        et_EE: 'et',
        fi_FI: 'fi',
        fr_FR: 'fr',
        fr_CA: 'fr-ca',
        fr_CH: 'fr-ch',
        fr_BE: 'fr',
        hu_HU: 'hu',
        it_IT: 'it',
        it_CH: 'it-ch',
        lv_LV: 'lv',
        nl_NL: 'nl',
        nl_BE: 'nl-be',
        nb_NO: 'nb',
        pl_PL: 'pl',
        pt_BR: 'pt-br',
        ru_RU: 'ru',
        ro_RO: 'ro',
        sk_SK: 'sk',
        sv_SE: 'sv',
        tr_TR: 'tr',
        ja_JP: 'ja',
        zh_CN: 'zh-cn',
        zh_TW: 'zh-tw'
    };

    // used to locate correct date format files
    var mapToCLDRFiles = {
        bg_BG: 'bg',
        ca_ES: 'ca',
        cs_CZ: 'cs',
        da_DK: 'da',
        de_DE: 'de',
        de_AT: 'de-AT',
        de_CH: 'de-CH',
        en_US: 'en',
        en_GB: 'en-GB',
        en_AU: 'en-AU',
        en_CA: 'en-CA',
        en_DE: 'en-DE',
        en_IE: 'en-IE',
        en_NZ: 'en-NZ',
        en_SG: 'en-SG',
        en_ZA: 'en-ZA',
        es_ES: 'es',
        es_MX: 'es-MX',
        es_AR: 'es-AR',
        es_BO: 'es-BO',
        es_CL: 'es-CL',
        es_CO: 'es-CO',
        es_CR: 'es-CR',
        es_DO: 'es-DO',
        es_EC: 'es-EC',
        es_SV: 'es-SV',
        es_GT: 'es-GT',
        es_HN: 'es-HN',
        es_NI: 'es-NI',
        es_PA: 'es-PA',
        es_PY: 'es-PY',
        es_PE: 'es-PE',
        es_PR: 'es-PR',
        es_US: 'es-US',
        et_EE: 'et',
        fi_FI: 'fi',
        fr_FR: 'fr',
        fr_CA: 'fr-CA',
        fr_CH: 'fr-CH',
        fr_BE: 'fr-BE',
        hu_HU: 'hu',
        it_IT: 'it',
        it_CH: 'it-CH',
        lv_LV: 'lv',
        nl_NL: 'nl',
        nl_BE: 'nl-BE',
        nb_NO: 'nb',
        pl_PL: 'pl',
        pt_BR: 'pt',
        ru_RU: 'ru',
        ro_RO: 'ro',
        sk_SK: 'sk',
        sv_SE: 'sv',
        tr_TR: 'tr',
        ja_JP: 'ja',
        zh_CN: 'zh',
        zh_TW: 'zh'
    };

    var dateFormats = [
        // M d y
        'M/d/yy',
        'M/d/yyyy',
        'MM/dd/yy',
        'MM/dd/yyyy',
        // d M y
        'd.M.yy',
        'd.M.yyyy',
        'dd.MM.yy',
        'dd.MM.yyyy',
        'dd.MM.yyyy.',
        'd/M/yy',
        'dd/MM/yy',
        'dd/MM/yyyy',
        'dd-MM-yyyy',
        // y M d
        'yyyy/MM/dd',
        'yyyy.MM.dd.',
        'yyyy-MM-dd'
    ];

    // CLDR/Java -> moment
    // (see http://cldr.unicode.org/translation/date-time-patterns)
    function translateCLDRToMoment(format) {
        format = format.replace(/d/g, 'D')
            .replace(/EEEE/g, 'dddd')
            .replace(/E/g, 'ddd')
            .replace(/a/g, 'A')
            .replace(/y/g, 'Y');
        // moment uses [] to mark strings inside the formats, cldr uses ''
        return _(format.split('\'')).reduce(function (str, part, index) { return str + (index % 2 === 1 ? '[' : ']') + part; });
    }

    function translateMomentToCLDR(format) {
        return format
            .replace(/dddd/g, 'EEEE')
            .replace(/(ddd|dd|d)/g, 'E')
            .replace(/A/g, 'a')
            .replace(/D/g, 'd')
            .replace(/Y/g, 'y')
            // moment uses [] to mark strings inside the formats, cldr uses ''
            .replace(/(\[|\])/, '\'');
    }


    // Number formatting
    // we just need a proper match for custom formats
    var numberFormats = {
        '1,234.56': 'en-us',
        '1.234,56': 'de-de',
        '1’234.56': 'de-ch',
        // space must be nbsp
        '1 234,56': 'de-at',
        '1234.56': 'en-us',
        '1234,56': 'de-de'
    };

    var grouping = { '1234.56': false, '1234,56': false };

    // server-side we store a string (e.g. 'monday')
    // to avoid confusion between JavaScript and Java
    var weekdays = 'sunday monday tuesday wednesday thursday friday saturday'.split(' ');

    function deriveMomentLocale(localeId) {
        return mapToMoment[localeId] || 'en';
    }

    function getLocales() {
        return (ox.serverConfig && ox.serverConfig.locales) || locales;
    }

    function getSupportedLocales() {
        return _(getLocales())
            .map(function (name, id) {
                return { id: id, name: name };
            })
            .filter(function (item) {
                return isSupportedLocale(item.id);
            })
            .sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
    }

    function isSupportedLocale(id) {
        // server down
        if (_.isEmpty(ox.serverConfig)) return false;
        // check against server-side list of available languages and locales
        // also checking server config locales to support whitelisting and custom labels (see also Bug 68665)
        var a = ox.serverConfig.languages,
            b = ox.serverConfig.locales || a;
        if (a[id] && b[id]) return true;
        if (a.de_DE && b.de_DE && /^de_(AT|CH)$/.test(id)) return true;
        if (a.en_GB && b.en_GB && /^en_(GB|AU|CA|DE|IE|NZ|SG|ZA)$/.test(id)) return true;
        if (a.es_MX && b.es_MX && /^es_(AR|BO|CL|CO|CR|DO|EC|SV|GT|HN|NI|PA|PE|PR|US)$/.test(id)) return true;
        if (a.fr_FR && b.fr_FR && /^fr_(CH|BE)$/.test(id)) return true;
        if (a.it_IT && b.it_IT && id === 'it_CH') return true;
        if (a.nl_NL && b.nl_NL && id === 'nl_BE') return true;
        return false;
    }

    function getLocaleName(id) {
        return getLocales()[id] || '';
    }

    function deriveSupportedLanguageFromLocale(localeId) {
        var longMap = { en_DE: 'en_US' },
            shortMap = { de: 'de_DE', en: 'en_GB', es: 'es_MX', fr: 'fr_FR', it: 'it_IT', nl: 'nl_NL' },
            language = get(localeId);
        // server down, so no config available, return en_US
        return !_.isEmpty(ox.serverConfig) && language in ox.serverConfig.languages ? language : 'en_US';
        function get(localeId) {
            if (/^(en_US|es_ES|fr_CA)$/.test(localeId)) return localeId;
            return longMap[localeId] || shortMap[String(localeId).substr(0, 2)] || localeId;
        }
    }

    // for "irregular" ids
    var defaultLocaleMappings = {
        ca: 'ca_ES', cs: 'cs_CZ', da: 'da_DK', en: 'en_US', et: 'et_EE', ja: 'ja_JP', no: 'nb_NO', nb: 'nb_NO', sv: 'sv_SE'
    };

    function getDefaultLocale() {
        // do we have a cookie?
        var locale = _.getCookie('locale');
        if (locale) return locale;
        // if not we try the browser language
        locale = String(navigator.language || navigator.userLanguage);
        // irregular?
        if (defaultLocaleMappings[locale]) return defaultLocaleMappings[locale];
        // compare against existing locales
        var split = locale.split('-');
        locale = split[0] + '_' + (split[1] || split[0]).toUpperCase();
        return locale in getLocales() ? locale : 'en_US';
    }

    function getValidDefaultLocale() {
        var localeId = getDefaultLocale();
        if (isSupportedLocale(localeId)) return localeId;
        // server down, so no config available, return en_US
        if (_.isEmpty(ox.serverConfig)) return 'en_US';
        // special case: even en_US is not listed
        var list = ox.serverConfig.locales || ox.serverConfig.languages;
        if (list.en_US) return 'en_US';
        // return first valid locale with en_US as ultimate default
        return _(list).keys()[0] || 'en_US';
    }

    function getCLDRDateFilePath(locale) {
        // add text! so it works with require
        return 'text!3rd.party/cldr-dates/' + (mapToCLDRFiles[locale] || 'en') + '/ca-gregorian.json';
    }

    var CLDRDefinitions = {};

    function loadCLDRData(locale) {
        var def = $.Deferred();
        if (CLDRDefinitions[locale]) def.resolve(CLDRDefinitions[locale]);

        require([getCLDRDateFilePath(locale)], function (dateFormatData) {
            CLDRDefinitions[locale] = JSON.parse(dateFormatData).main[(mapToCLDRFiles[locale] || 'en')].dates.calendars.gregorian;
            def.resolve(CLDRDefinitions[locale]);
        });

        return def;
    }

    var currencyMap = {
        AR: 'ARS',
        AT: 'EUR',
        AU: 'AUD',
        BE: 'EUR',
        BG: 'BGN',
        BO: 'BOB',
        BR: 'BRL',
        CA: 'CAD',
        CH: 'CHF',
        CL: 'CLP',
        CN: 'CNY',
        CO: 'COP',
        CR: 'CRC',
        CZ: 'CZK',
        DE: 'EUR',
        DK: 'DKK',
        DO: 'DOP',
        EC: 'USD',
        ES: 'EUR',
        ET: 'EUR',
        FI: 'EUR',
        FR: 'EUR',
        GB: 'GBP',
        GT: 'GTQ',
        HN: 'HNL',
        HU: 'HUF',
        IE: 'EUR',
        IT: 'EUR',
        JP: 'JPY',
        LV: 'EUR',
        MX: 'MXN',
        NI: 'NIO',
        NL: 'EUR',
        NO: 'NOK',
        NZ: 'NZD',
        PA: 'PAB',
        PE: 'PEN',
        PL: 'PLN',
        PR: 'USD',
        PY: 'PYG',
        RO: 'RON',
        RU: 'RUB',
        SE: 'SEK',
        SG: 'SGD',
        SK: 'EUR',
        SV: 'USD',
        TR: 'TRY',
        TW: 'TWD',
        US: 'USD',
        ZA: 'ZAR'
    };

    function getCurrency(locale) {
        var country = locale.substr(3);
        return currencyMap[country] || 'USD';
    }

    return {
        getCurrency: getCurrency,
        getLocales: getLocales,
        dateFormats: dateFormats,
        numberFormats: numberFormats,
        grouping: grouping,
        getLocaleName: getLocaleName,
        deriveMomentLocale: deriveMomentLocale,
        isSupportedLocale: isSupportedLocale,
        getSupportedLocales: getSupportedLocales,
        getDefaultLocale: getDefaultLocale,
        getValidDefaultLocale: getValidDefaultLocale,
        deriveSupportedLanguageFromLocale: deriveSupportedLanguageFromLocale,
        translateCLDRToMoment: translateCLDRToMoment,
        translateMomentToCLDR: translateMomentToCLDR,
        getCLDRDateFilePath: getCLDRDateFilePath,
        mapToCLDRFiles: mapToCLDRFiles,
        CLDRDefinitions: CLDRDefinitions,
        loadCLDRData: loadCLDRData,
        weekday: {
            index: function (str) {
                return weekdays.indexOf(str);
            },
            name: function (index) {
                return weekdays[index];
            }
        }
    };
});
