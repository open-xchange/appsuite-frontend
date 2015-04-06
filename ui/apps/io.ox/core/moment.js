/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */

// define for moment timezone
define('moment', ['static/3rd.party/moment/moment-with-locales.js'], function (m) {

    'use strict';

    return window.moment = m;
});

define('io.ox/core/moment', [
    'settings!io.ox/core',
    'static/3rd.party/moment/moment-timezone-with-data.js'
], function (settings, moment) {

    'use strict';

    // make global
    window.moment = moment;

    // set locale
    moment.locale(settings.get('language'));
    // set timezone
    moment.tz.setDefault(settings.get('timezone'));
    // define threshold for humanize function
    moment.relativeTimeThreshold('s', 60);
    moment.relativeTimeThreshold('m', 55);
    moment.relativeTimeThreshold('h', 23);
    moment.relativeTimeThreshold('d', 29);
    moment.relativeTimeThreshold('M', 11);

    return moment;
});
