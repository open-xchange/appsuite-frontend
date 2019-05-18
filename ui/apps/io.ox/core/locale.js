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

define('io.ox/core/locale', ['settings!io.ox/core'], function (settings) {

    'use strict';

    var currentLocaleId = settings.get('language', 'en_US'),
        localeData = settings.get('localeData', {}),
        localeDefinitions = {};

    var supportedLocales = {
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
        fi_FI: 'Suomi (Suomi)',
        fr_FR: 'Français (France)',
        fr_CA: 'Français (Canada)',
        fr_CH: 'Français (Suisse)',
        fr_BE: 'Français (Belgique)',
        hu_HU: 'Magyar (Magyarorszag)',
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
        ja_JP: '日本語 (日本)',
        zh_CN: '中文 (简体)',
        zh_TW: '中文 (繁體)'
    };

    // map locales to moment's locale
    var mapToMoment = {
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
        ja_JP: 'ja',
        zh_CN: 'zh-cn',
        zh_TW: 'zh-tw'
    };

    function deriveMomentLocale(localeId) {
        return mapToMoment[localeId] || 'en';
    }

    function getSupportedLocales() {
        // check against server-side list of available translations
        var result = {};
        for (var id in ox.serverConfig.languages) {
            switch (id) {
                case 'de_DE':
                    add('de_DE de_AT de_CH');
                    break;
                case 'en_GB':
                    add('en_GB en_AU en_CA en_DE en_IE en_NZ en_SG en_ZA');
                    break;
                case 'es_MX':
                    add('es_MX es_AR es_BO es_CL es_CO es_CR es_DO es_EC es_SV es_GT es_HN es_NI es_PA es_PE es_PR es_US');
                    break;
                case 'fr_FR':
                    add('fr_FR fr_CH fr_BE');
                    break;
                case 'it_IT':
                    add('it_IT it_CH');
                    break;
                case 'nl_NL':
                    add('nl_NL nl_BE');
                    break;
                default:
                    add(id);
                    break;
            }
        }
        return result;
        function add(ids) {
            String(ids).split(' ').forEach(function (id) {
                result[id] = supportedLocales[id];
            });
        }
    }

    function getLocaleData(localeId) {
        return _.extend({}, localeDefinitions[localeId || currentLocaleId], settings.get('localeData'));
    }

    function setMomentLocale(localeId) {
        var id = deriveMomentLocale(localeId);
        if (localeDefinitions[localeId]) {
            updateLocale(localeId);
            return $.when();
        }
        // load the file that contains the define, then load the define itself
        // we need do it this way to avoid the use of anonymous defines
        return require(['static/3rd.party/moment/locale/' + id + '.js'], function () {
            return require(['moment/locale/' + id], function () {
                // create backup on first definition
                backupLocale(localeId);
                updateLocale(localeId);
            });
        });
    }

    function backupLocale(localeId) {
        // avoid overrides
        if (localeDefinitions[localeId]) return;
        var id = deriveMomentLocale(localeId),
            data = moment.localeData(id);
        localeDefinitions[localeId] = {
            time: data.longDateFormat('LT'),
            date: data.longDateFormat('L'),
            number: getDefaultNumberFormat(localeId),
            firstDayOfWeek: data.firstDayOfWeek(),
            // reverse formula: doy = 7 + dow - JanX <=> JanX = 7 + dow - doy
            firstDayOfYear: 7 + data.firstDayOfWeek() - data.firstDayOfYear()
        };
    }

    function updateLocale(localeId) {
        localeData = getLocaleData(localeId);
        if (_.isEmpty(localeData)) return;
        var id = deriveMomentLocale(localeId);
        moment.updateLocale(id, {
            // time and date format
            longDateFormat: { LT: localeData.time, L: localeData.date },
            // dow = first day of week (0=Sunday, 1=Monday, ...)
            // doy = 7 + dow - janX (first day of year)
            week: { dow: localeData.firstDayOfWeek, doy: 7 + localeData.firstDayOfWeek - localeData.firstDayOfYear }
        });
        ox.trigger('change:locale');
        ox.trigger('change:locale:data');
    }

    function onChangeLanguage(value) {
        currentLocaleId = value;
        settings.set('localeData', undefined).save();
        setMomentLocale(currentLocaleId);
    }

    function onChangeLocaleData() {
        updateLocale(currentLocaleId);
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

    function getNumber(n, options) {
        if (isNaN(n)) return n;
        if (grouping[localeData.number] === false) options.useGrouping = false;
        return Number(n).toLocaleString(numberFormats[localeData.number], options);
    }

    function getDefaultNumberFormat(localeId) {
        var locale = (localeId || currentLocaleId).toLowerCase().replace(/_/, '-');
        return Number(1234.56)
            .toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            // fr-be, for example, uses narrow nbsp
            .replace(/\u202F/, '\u00a0');
    }

    var dateFormats = [
        // M D Y
        'M/D/YY',
        'M/D/YYYY',
        'MM/DD/YY',
        'MM/DD/YYYY',
        // D M Y
        'D.M.YY',
        'D.M.YYYY',
        'DD.MM.YY',
        'DD.MM.YYYY',
        'DD.MM.YYYY.',
        'D/M/YY',
        'DD/MM/YY',
        'DD/MM/YYYY',
        'DD-MM-YYYY',
        // Y M D
        'YYYY/MM/DD',
        'YYYY.MM.DD.',
        'YYYY-MM-DD'
    ];

    var api = {

        // formatting

        number: function (n, d) {
            return getNumber(n, { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
        },

        currency: function (n, code) {
            return getNumber(n, { style: 'currency', currency: code || 'EUR', currencyDisplay: 'symbol', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        percent: function (n, d) {
            return getNumber(n, { style: 'percent', minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
        },

        // utility functions

        current: function () {
            return currentLocaleId;
        },

        getLocaleData: getLocaleData,
        localeDefinitions: localeDefinitions,

        setLocaleData: function (data) {
            // reset locale first to get proper change event everywhere
            settings.set('localeData', undefined, { silent: true }).set('localeData', data).save();
        },

        getSupportedLocales: getSupportedLocales,

        getNumberFormats: function () {
            return _(numberFormats).keys();
        },

        getDefaultNumberFormat: getDefaultNumberFormat,

        getDateFormats: function () {
            return dateFormats.slice();
        },

        getFirstDayOfWeek: function () {
            return moment().startOf('week').format('dddd');
        },

        deriveSupportedLanguageFromLocale: function (localeId) {

            var longMap = { en_DE: 'en_US' },
                shortMap = { de: 'de_DE', en: 'en_GB', es: 'es_MX', fr: 'fr_FR', it: 'it_IT', nl: 'nl_NL' },
                language = get(localeId);
            return language in ox.serverConfig.languages ? language : 'en_US';

            function get(localeId) {
                if (/^(en_US|es_ES|fr_CA)$/.test(localeId)) return localeId;
                return longMap[localeId] || shortMap[String(localeId).substr(0, 2)] || localeId;
            }
        }
    };

    backupLocale('en_US');
    localeData = getLocaleData();
    setMomentLocale(currentLocaleId).always(function () {
        settings.on('change:language', onChangeLanguage);
        settings.on('change:localeData', onChangeLocaleData);
    });

    // debug
    window.locale = api;

    return api;
});
