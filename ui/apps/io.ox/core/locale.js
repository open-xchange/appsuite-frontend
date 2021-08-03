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

define('io.ox/core/locale', ['io.ox/core/locale/meta', 'settings!io.ox/core'], function (meta, settings) {

    'use strict';

    var currentLocaleId = settings.get('language', 'en_US'),
        localeData = settings.get('localeData', {}),
        localeDefinitions = {};

    function getLocaleData(localeId) {
        return deriveLocaleData(_.extend({}, localeDefinitions[localeId || currentLocaleId], settings.get('localeData')));
    }

    function getCLDRData() {
        return meta.CLDRDefinitions[currentLocaleId];
    }

    // support CLDR format strings for localized formats Moment does not know (see http://cldr.unicode.org/) or check the json files in the npm module
    moment.fn.formatCLDR = function (inputstring) {
        // check if the input string matches a CLDR format
        if (getCLDRData().dateTimeFormats.availableFormats[inputstring]) {
            inputstring = meta.translateCLDRToMoment(getCLDRData().dateTimeFormats.availableFormats[inputstring]);
        }
        return moment.prototype.format.apply(this, [inputstring]);
    };

    // eslint-disable-next-line no-useless-escape
    var regex = /(G+|y+|Y+|M+|w+|W+|D+|d+|F+|E+|u+|a+|H+|k+|K+|h+|m+|s+|S+|z+|Z+|v+|V+)|\[((?:[^\[\]]|\[\])+)\]|(\[\])/g;

    // use CLDR Data to get interval formats
    moment.fn.formatInterval = function (end, format, options) {
        var start = this,
            intervals = getCLDRData().dateTimeFormats.intervalFormats;
        options = options || {};

        // customized?
        if (!_.isEmpty(settings.get('localeData', {})) && (!format || format === 'date' || format === 'time')) {
            format = meta.translateCLDRToMoment(format === 'time' ? localeData.time : localeData.dateShort);
            return intervals.intervalFormatFallback.replace('{0}', start.format(format)).replace('{1}', end.format(format));
        }

        // use old shorthands, no need to change our whole code
        // use 12h/24h format correctly
        if (format === 'time') format = getCLDRData().timeFormats.short.indexOf('a') === -1 ? 'Hm' : 'hm';
        if (!format || format === 'date') format = 'yMd';

        // no real interval
        if (!end || this.isSame(end)) return this.formatCLDR(format);

        // no format found, use fallback
        if (!intervals[format]) return intervals.intervalFormatFallback.replace('{0}', start.format(format)).replace('{1}', end.format(format));


        var keys = _(intervals[format]).keys(), finalFormat;

        // smart date (checks for the biggest difference) or always full date (just displays the complete date)?
        if (options.alwaysFullDate) {
            // just choose the full format
            finalFormat = intervals[format][keys[keys.length - 1]];

        } else {
            // find biggest difference
            finalFormat = intervals[format][keys[0]];
            for (var i = 0; i < keys.length; i++) {
                if (!start.isSame(end, keys[i])) {
                    finalFormat = intervals[format][keys[i]];
                } else break;
            }
        }

        // convert to moment
        finalFormat = meta.translateCLDRToMoment(finalFormat);

        // replace format string with actual times
        var fields = {}, match;
        regex.lastIndex = 0;
        while ((match = regex.exec(finalFormat))) {
            if (!match[1]) continue;
            var letter = match[1].charAt(0);
            if (fields[letter]) break;
            fields[letter] = true;
        }

        if (regex.lastIndex) {
            return this.format(finalFormat.slice(0, match.index)) + end.format(finalFormat.slice(match.index));
        }
        return this.format(finalFormat);
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
            timeLong = String(data.timeLong || 'h:mm:ss a');
            _.extend(result, {
                time: timeLong.replace(/.ss/, ''),
                timeLong: timeLong
            });
        }
        return result;
    }

    function setMomentLocale(localeId) {
        var id = meta.deriveMomentLocale(localeId);

        if (localeDefinitions[localeId] && meta.CLDRDefinitions[localeId]) {
            updateLocale(localeId);
            return $.when();
        }

        // load cldr data
        return meta.loadCLDRData(localeId).then(function () {
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
        });
    }

    function backupLocale(localeId) {
        // avoid overrides
        if (localeDefinitions[localeId]) return;
        var id = meta.deriveMomentLocale(localeId),
            data = moment.localeData(id),
            dow = data.firstDayOfWeek();
        localeDefinitions[localeId] = {
            timeLong: meta.translateMomentToCLDR(data.longDateFormat('LTS')),
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
            timeLong = meta.translateCLDRToMoment(localeData.timeLong),
            time = timeLong.replace(/.ss/, ''),
            dow = meta.weekday.index(localeData.firstDayOfWeek),
            doy = localeData.firstDayOfYear;
        moment.updateLocale(id, {
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
        ox.trigger('change:locale:' + localeId);
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
        // no unnessesary change events here change from undefined to {} for example
        if (_.isEmpty(settings.get('localeData'))) return;
        settings.set('localeData', {}).save();
    }

    function getNumber(n, options) {
        if (isNaN(n)) return n;
        if (meta.grouping[localeData.number] === false) options.useGrouping = false;
        return Number(n).toLocaleString(meta.numberFormats[localeData.number], options);
    }

    function getDefaultNumberFormat(localeId) {
        // we want the default format for this specific localeId (used to cache backups)
        if (localeId) {
            var locale = localeId.toLowerCase().replace(/_/, '-');
            return Number(1234.56)
                .toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                // fr-be, for example, uses narrow nbsp
                .replace(/\u202F/, '\u00a0');
        }

        // use getNumber to return the current default number format, respects changed custom number formats
        return getNumber(1234.56, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            // fr-be, for example, uses narrow nbsp
            .replace(/\u202F/, '\u00a0');
    }

    var api = {

        // formatting
        // if there is only one value for decimalPlaces use it for min and max
        number: function (n, dMin, dMax) {
            return getNumber(n, { minimumFractionDigits: dMin || 0, maximumFractionDigits: dMax || dMin || 0 });
        },

        currency: function (n, code) {
            return getNumber(n, { style: 'currency', currency: code || meta.getCurrency(currentLocaleId), currencyDisplay: 'symbol', minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
