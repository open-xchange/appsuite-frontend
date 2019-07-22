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

define('../moment', ['static/3rd.party/moment/moment.js'], function (m) {
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
                this.subtract((this._z ? this._z.utcOffset(this) : Math.round(this._d.getTimezoneOffset() / 15) * 15) * -1, 'm');
            }
        }
        return this;
    };

    // support non standard time format strings (see io.ox/core/locale.js for more info)
    var originalMomentFormat = moment.prototype.format;

    moment.fn.format = function (inputString) {
        // check if the input string is one ouf our non standard Moment formats
        inputString = moment.localeData()._specialDateFormats && moment.localeData()._specialDateFormats[inputString] ? moment.localeData()._specialDateFormats[inputString] : inputString;
        return originalMomentFormat.apply(this, [inputString]);
    };

    // make global
    window.moment = moment;

    return moment;
});
