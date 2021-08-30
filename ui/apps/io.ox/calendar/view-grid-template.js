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

define('io.ox/calendar/view-grid-template', [
    'io.ox/calendar/util',
    'io.ox/core/tk/vgrid',
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar',
    'less!io.ox/calendar/style'
], function (util, VGrid, ext, folderAPI, gt) {

    'use strict';

    var that = {

        // main grid template
        main: {

            build: function () {
                var summary, location, time, date, transp, isPrivate;

                this.addClass('calendar calendar-grid-cell').append(
                    $('<button type="button" class="btn-unstyled">').append(
                        time = $('<div class="time" aria-hidden="true">'),
                        date = $('<div class="date" aria-hidden="true">'),
                        isPrivate = $('<i class="fa fa-lock private-flag" aria-hidden="true">').hide(),
                        summary = $('<div class="title" aria-hidden="true">'),
                        $('<div class="location-row">').append(
                            transp = $('<span class="shown_as label label-info" aria-hidden="true">&nbsp;</span>'),
                            location = $('<span class="location" aria-hidden="true">')
                        )
                    )
                );

                return {
                    summary: summary,
                    location: location,
                    time: time,
                    date: date,
                    transp: transp,
                    isPrivate: isPrivate
                };
            },

            set: function (data, fields) {

                var isPrivate = _.isUndefined(data.summary),
                    summary = isPrivate ? gt('Private') : (data.summary || '\u00A0'),
                    a11yLabel = [];

                //conflicts with appointments, where you aren't a participant don't have a folder_id.
                if (data.folder_id) {
                    var conf = util.getConfirmationStatus(data);
                    this.addClass(util.getConfirmationClass(conf) + (data.hard_conflict ? ' hardconflict' : ''));
                }

                fields.summary.text(summary);

                fields.location.text(data.location || '\u00A0');
                fields.time.text(util.getTimeInterval(data));
                fields.date.text(util.getDateInterval(data));
                fields.transp.addClass(util.getShownAsLabel(data)).attr('summary', util.getShownAs(data));

                fields.isPrivate.toggle(isPrivate);

                // a11y: this should be unnecessary!

                a11yLabel.push(summary);
                //#. %1$s is an appointment location (e.g. a room, a telco line, a company, a city)
                //#. This fragment appears within a long string for screen readers.
                //#. Some languages (e.g. German) might need to translate "location:".
                if (data.location) a11yLabel.push(gt.pgettext('a11y', 'at %1$s', data.location));
                a11yLabel.push(util.getTimeIntervalA11y(data));
                a11yLabel.push(util.getDateIntervalA11y(data));

                this.find('button').attr('aria-label', _.escape(a11yLabel.join(', ') + '.'));
            }
        },

        // simple grid-based list for portal & halo
        drawSimpleGrid: function (list) {

            // use template
            var tmpl = new VGrid.Template({
                    tagName: 'li',
                    defaultClassName: 'vgrid-cell list-unstyled'
                }),
                $ul = $('<ul class="calendar-grid">');

            // add template
            tmpl.add(that.main);

            _(list).each(function (data, i) {
                var clone = tmpl.getClone();
                clone.update(data, i);
                clone.appendTo($ul).node
                    .data('appointment', data)
                    .addClass('hover');
            });

            return $ul;
        }

    };

    return that;
});
