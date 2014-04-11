/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/tasks/common-extensions',
    ['io.ox/mail/util',
     'io.ox/tasks/api',
     'io.ox/core/date',
     'io.ox/core/strings',
     'gettext!io.ox/tasks'
    ], function (util, api, date, strings, gt) {

    'use strict';

    var extensions = {

        date: function (baton, options) {
            var data = baton.data, t = data.end_date || data.start_date || data.last_modified, d;
            if (!_.isNumber(t)) return;
            d = new date.Local(t);
            this.append(
                $('<time class="date">')
                .attr('datetime', d.format('yyyy-MM-dd hh:mm'))
                .text(_.noI18n(util.getDateTime(t, options)))
            );
        },

        smartdate: function (baton) {
            extensions.date.call(this, baton, { fulldate: false, smart: true });
        },

        fulldate: function (baton) {
            extensions.date.call(this, baton, { fulldate: true, smart: false });
        },

        compactdate: function (baton) {
            extensions.date.call(this, baton, { fulldate: false, smart: false });
        },

        title: function (baton) {
            this.append(
                $('<div class="title">').append(
                    baton.data.title
                )
            );
        },

        status: function (baton) {
            this.append(
                $('<div class="status">').append(
                    baton.data.status
                )
            );
        },

        progress: function (baton) {
            this.append(
                $('<div class="prog">').append(
                    gt('Progress') + ': ' + (baton.data.percent_completed || 0) + '%'
                )
            );
        }

    };

    return extensions;
});
