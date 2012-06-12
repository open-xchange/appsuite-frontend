/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/month/view',
    ['io.ox/calendar/util',
     'io.ox/calendar/api',
     'dot!io.ox/calendar/month/template.html',
     'io.ox/core/date',
     'gettext!io.ox/calendar/view',
     'less!io.ox/calendar/month/style.css'], function (util, api, tmpl, date, gt) {

    'use strict';

    return {

        drawScaffold: function (main) {

            var node = tmpl.render('scaffold', { days: date.locale.daysShort });
            console.log('YEAH', node);
            return node;
        }
    };
});