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

define('io.ox/files/common-extensions', [
    'io.ox/mail/util',
    'io.ox/files/api',
    'io.ox/core/strings'
], function (util, api, strings) {

    'use strict';

    var extensions = {

        date: function (baton, options) {
            var data = baton.data, t = data.last_modified;
            if (!_.isNumber(t)) return;
            this.append(
                $('<time class="date">')
                .attr('datetime', moment(t).toISOString())
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

        filename: function (baton) {
            var data = baton.data;
            this.append(
                $('<div class="filename">').append(
                    data.filename || data.title
                )
            );
        },

        size: function (baton) {
            var size = baton.data.file_size;
            if (!_.isNumber(size)) return;
            this.append(
                $('<span class="size">').text(!!size ? strings.fileSize(size, 1) : strings.fileSize(size, 1))
            );
        },

        locked: function (baton) {
            var node = api.tracker.isLocked(baton.data) ? $('<i class="fa fa-lock">') : '';
            this.append(
                $('<span class="locked">').append(node)
            );
        }

    };

    return extensions;
});
