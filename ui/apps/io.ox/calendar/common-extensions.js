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

define('io.ox/calendar/common-extensions', [
    'io.ox/core/extensions',
    'io.ox/calendar/view-detail'
], function (ext) {

    'use strict';

    var extensions = {

        title: function (baton) {
            this.append(
                $('<div class="title">').append(
                    baton.data.title
                )
            );
        },

        interval: function (baton) {
            var tmp = $('<div>');
            ext.point('io.ox/calendar/detail/date').invoke('draw', tmp, baton);
            this.append(
                $('<span class="interval">').append(tmp.find('.interval').html())
            );
        },

        day: function (baton) {
            var tmp = $('<div>');
            ext.point('io.ox/calendar/detail/date').invoke('draw', tmp, baton);
            this.append(
                $('<span class="day">').append(tmp.find('.day').html())
            );
        },

        location: function (baton) {
            this.append(
                $('<span class="location">').append(baton.data.location)
            );
        }

    };

    return extensions;
});
