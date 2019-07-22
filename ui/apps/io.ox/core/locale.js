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

define('io.ox/core/locale', ['io.ox/core/locale/meta', 'settings!io.ox/core', 'raw!3rd.party/cldr-dates/en/ca-gregorian.json'], function (meta, settings, cldrEnUsData) {

    'use strict';

    var currentLocaleId = settings.get('language', 'en_US'),
        localeData = settings.get('localeData', {}),
        localeDefinitions = {},
        CLDRDefinitions = {
            'en_US':  JSON.parse(cldrEnUsData).main.en.dates.calendars.gregorian
        };

    function getLocaleData(localeId) {
        return deriveLocaleData(_.extend({}, localeDefinitions[localeId || currentLocaleId], settings.get('localeData')));
    }

    function getCLDRData() {
        return CLDRDefinitions[currentLocaleId];
    }

    // support CLDR format strings for localized formats Moment does not know (see http://cldr.unicode.org/) or check the json files in the npm module
    moment.fn.formatCLDR = function (inputstring) {
        // check if the input string matches a CLDR format
        if (getCLDRData().dateTimeFormats.availableFormats[inputstring]) {
            inputstring = meta.translateCLDRToMoment(getCLDRData().dateTimeFormats.availableFormats[inputstring]);
        }
        return moment.prototype.format.apply(this, [inputstring]);
    };

    function deriveLocaleData(data) {
        // derive formats for Java
        var result = _.extend({}, data), dateLong, timeLong;
        if (data.date) {
            dateLong = meta.translateMomentToCLDR(moment.localeData().longDateFormat('LL'));
            _.extend(result, {
                dateShort: data.date || 'M/d/yy',
                dateMedium: data.date || 'M/d/yyyy',
                dateLong: dateLong,
                dateFull: 'EEEE, ' + dateLong
            });
        }
        if (data.timeLong) {
            timeLong = String(data.timeLong || 'h:mm:ss A');
            _.extend(result, {
                time: timeLong.replace(/.ss/, ''),
                timeLong: timeLong
            });
        }
        return result;
    }

    function setMomentLocale(localeId) {
        var id = meta.deriveMomentLocale(localeId);

        if (localeDefinitions[localeId] && localeDefinitions[localeId].specialDateFormats) {
            updateLocale(localeId);
            return $.when();
        }

        // load the file that contains the define, then load the define itself
        // we need do it this way to avoid the use of anonymous defines
        return require(['static/3rd.party/moment/locale/' + id + '.js'], function () {
            return require([meta.getCLDRDateFilePath(localeId), 'moment/locale/' + id], function (dateFormatData) {
                CLDRDefinitions[localeId] = JSON.parse(dateFormatData).main[meta.mapToCLDRFiles[localeId]].dates.calendars.gregorian;

                // create backup on first definition
                backupLocale(localeId);
                updateLocale(localeId);
            });
        });
    }

    function backupLocale(localeId) {
        // avoid overrides
        if (localeDefinitions[localeId] && localeDefinitions[localeId].specialDateFormats) return;
        var id = meta.deriveMomentLocale(localeId),
            data = moment.localeData(id),
            dow = data.firstDayOfWeek();
        localeDefinitions[localeId] = {
            timeLong: data.longDateFormat('LTS'),
            date: meta.translateMomentToCLDR(data.longDateFormat('L')),
            number: getDefaultNumberFormat(localeId),
            firstDayOfWeek: meta.weekday.name(dow),
            // reverse formula: doy = 7 + dow - JanX <=> JanX = 7 + dow - doy
            firstDayOfYear: 7 + dow - data.firstDayOfYear()
        };
    }


    function updateLocale(localeId) {
        localeData = getLocaleData(localeId);
        if (_.isEmpty(localeData)) return;
        var id = meta.deriveMomentLocale(localeId),
            timeLong = localeData.timeLong,
            time = timeLong.replace(/.ss/, ''),
            dow = meta.weekday.index(localeData.firstDayOfWeek),
            doy = localeData.firstDayOfYear;
        moment.updateLocale(id, {
            // special non Moment standard localized date formats
            specialDateFormats: localeData.specialDateFormats,
            // time and date format
            longDateFormat: {
                L: meta.translateCLDRToMoment(localeData.date),
                // we also need to override LLL; let's see if all locales are happy with a space
                LLL: meta.translateCLDRToMoment(localeData.date) + ' ' + time,
                LT: time,
                LTS: timeLong
            },
            // dow = first day of week (0=Sunday, 1=Monday, ...)
            // doy = 7 + dow - janX (first day of year)
            week: { dow: dow, doy: 7 + dow - doy }
        });
        ox.trigger('change:locale');
        ox.trigger('change:locale:data');
    }

    function onChangeLanguage(value) {
        currentLocaleId = value;
        resetLocaleData();
        setMomentLocale(currentLocaleId);
    }

    function onChangeLocaleData() {
        updateLocale(currentLocaleId);
    }

    function resetLocaleData() {
        settings.set('localeData', {}).save();
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
            return getNumber(n / 100, { style: 'percent', minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
        },

        // utility functions

        current: function () {
            return currentLocaleId;
        },

        getCLDRData: getCLDRData,
        getLocaleData: getLocaleData,
        localeDefinitions: localeDefinitions,

        setLocaleData: function (data) {
            // reset locale first to get proper change event everywhere
            settings
                .set('localeData', undefined, { silent: true })
                .set('localeData', deriveLocaleData(data))
                .save();
        },

        resetLocaleData: resetLocaleData,

        getSupportedLocales: meta.getSupportedLocales,

        getNumberFormats: function () {
            return _(meta.numberFormats).keys();
        },

        getDefaultNumberFormat: getDefaultNumberFormat,

        getDateFormatOptions: function () {
            var m = moment().month(0).date(29);
            return meta.dateFormats.map(function (format) {
                return { label: m.format(meta.translateCLDRToMoment(format)), value: format };
            });
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
