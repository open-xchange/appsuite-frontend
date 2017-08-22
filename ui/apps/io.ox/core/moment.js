/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */

// define for moment timezone
define('moment', ['static/3rd.party/moment/moment.js'], function (m) {
    return (window.moment = m);
});

// this is defined globaly in boot.js
define('static/3rd.party/moment/moment.js', function () {
    return window.moment;
});

define('static/3rd.party/moment/moment-timezone-with-data.js', ['moment'], function (m) {
    return m;
});

define('io.ox/core/moment', [
    'settings!io.ox/core',
    'static/3rd.party/moment/moment-timezone-with-data.js'
], function (settings, moment) {

    'use strict';

    var defaultLang = 'en';

    function isMomentLanguage(lang) {
        return ox.momentLanguages ? ox.momentLanguages.indexOf(lang) > -1 : false;
    }

    function normalizeLocale(key) {
        if (_.isEmpty(key)) return defaultLang;
        var l = key.toLowerCase().replace('_', '-').split('-'),
            iso = l[0] !== l[1] ? l[0] + '-' + l[1] : l[0];
        if (isMomentLanguage(iso)) {
            return iso;
        }
        return isMomentLanguage(l[0]) ? l[0] : defaultLang;
    }

    // set locale
    var langISO = normalizeLocale(settings.get('language'));
    if (langISO !== defaultLang) {
        // load the file that contains the define, then load the define itself
        // we need do it this way to avoid the use of anonymous defines
        require(['static/3rd.party/moment/locale/' + langISO + '.js'], function () {
            require(['moment/locale/' + langISO]).done(function () {
                // use custom locales for japanese
                if (moment.locales().indexOf('ja') !== -1) {
                    moment.updateLocale('ja', {
                        longDateFormat: {
                            LT: 'HH:mm',
                            LTS: 'HH:mm:ss',
                            L: 'YYYY/MM/DD',
                            LL: 'YYYY年M月D日',
                            LLL: 'YYYY年M月D日 HH:mm',
                            LLLL: 'YYYY年M月D日 HH:mm dddd',
                            l: 'YYYY/MM/DD',
                            ll: 'YYYY年M月D日',
                            lll: 'YYYY年M月D日 HH:mm',
                            llll: 'YYYY年M月D日 HH:mm dddd'
                        }
                    });
                }
            });
        });
    }

    // set timezone
    moment.tz.setDefault(settings.get('timezone'));

    // define threshold for humanize function
    moment.relativeTimeThreshold('s', 60);
    moment.relativeTimeThreshold('m', 55);
    moment.relativeTimeThreshold('h', 23);
    moment.relativeTimeThreshold('d', 29);
    moment.relativeTimeThreshold('M', 11);

    // fix local function to work with timezone plugin
    moment.fn.local = function (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;
            this._z = moment.defaultZone || null;
            if (keepLocalTime) {
                this.subtract((this._z ? this._z.offset(this) : Math.round(this._d.getTimezoneOffset() / 15) * 15) * -1, 'm');
            }
        }
        return this;
    };

    // make global
    window.moment = moment;

    return moment;
});
