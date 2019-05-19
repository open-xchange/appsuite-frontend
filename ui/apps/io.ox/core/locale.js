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

define('io.ox/core/locale', ['io.ox/core/locale/meta', 'settings!io.ox/core'], function (meta, settings) {

    'use strict';

    var currentLocaleId = settings.get('language', 'en_US'),
        localeData = settings.get('localeData', {}),
        localeDefinitions = {};

    function getLocaleData(localeId) {
        return _.extend({}, localeDefinitions[localeId || currentLocaleId], settings.get('localeData'));
    }

    function setMomentLocale(localeId) {
        var id = meta.deriveMomentLocale(localeId);
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
        var id = meta.deriveMomentLocale(localeId),
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
        var id = meta.deriveMomentLocale(localeId);
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

    function getNumber(n, options) {
        if (isNaN(n)) return n;
        if (meta.grouping[localeData.number] === false) options.useGrouping = false;
        return Number(n).toLocaleString(meta.numberFormats[localeData.number], options);
    }

    function getDefaultNumberFormat(localeId) {
        var locale = (localeId || currentLocaleId).toLowerCase().replace(/_/, '-');
        return Number(1234.56)
            .toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            // fr-be, for example, uses narrow nbsp
            .replace(/\u202F/, '\u00a0');
    }

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

        getSupportedLocales: meta.getSupportedLocales,

        getNumberFormats: function () {
            return _(meta.numberFormats).keys();
        },

        getDefaultNumberFormat: getDefaultNumberFormat,

        getDateFormats: function () {
            return meta.dateFormats.slice();
        },

        getFirstDayOfWeek: function () {
            return moment().startOf('week').format('dddd');
        },

        deriveSupportedLanguageFromLocale: meta.deriveSupportedLanguageFromLocale,

        meta: meta
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
