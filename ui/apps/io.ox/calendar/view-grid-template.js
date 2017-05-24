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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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
                var title, location, time, date, shown_as, isPrivate;

                this.addClass('calendar').append(
                    time = $('<div class="time">'),
                    date = $('<div class="date">'),
                    isPrivate = $('<i class="fa fa-lock private-flag" aria-hidden="true">').hide(),
                    title = $('<div class="title">'),
                    $('<div class="location-row">').append(
                        shown_as = $('<span class="shown_as label label-info">&nbsp;</span>'),
                        location = $('<span class="location">')
                    )
                );

                return {
                    title: title,
                    location: location,
                    time: time,
                    date: date,
                    shown_as: shown_as,
                    isPrivate: isPrivate
                };
            },

            set: function (data, fields) {

                var self = this,
                    isPrivate = _.isUndefined(data.title),
                    title = isPrivate ? gt('Private') : gt.noI18n(data.title || '\u00A0'),
                    a11yLabel = [];

                //conflicts with appointments, where you aren't a participant don't have a folder_id.
                if (data.folder_id) {
                    var folder = folderAPI.get(data.folder_id);
                    folder.done(function (folder) {
                        var conf = util.getConfirmationStatus(data, folderAPI.is('shared', folder) ? folder.created_by : ox.user_id);
                        self.addClass(util.getConfirmationClass(conf) + (data.hard_conflict ? ' hardconflict' : ''));
                    });
                }

                fields.title.text(title);

                fields.location.text(gt.noI18n(data.location || '\u00A0'));
                fields.time.text(gt.noI18n(util.getTimeInterval(data)));
                fields.date.text(gt.noI18n(util.getDateInterval(data)));
                fields.shown_as.addClass(util.getShownAsLabel(data)).attr('title', util.getShownAs(data));

                fields.isPrivate.toggle(isPrivate);

                // a11y: this should be unnecessary!

                a11yLabel.push(title);
                //#. %1$s is an appointment location (e.g. a room, a telco line, a company, a city)
                //#. This fragment appears within a long string for screen readers.
                //#. Some languages (e.g. German) might need to translate "location:".
                if (data.location) a11yLabel.push(gt.pgettext('a11y', 'at %1$s', data.location));
                a11yLabel.push(util.getTimeIntervalA11y(data));
                a11yLabel.push(gt.noI18n(util.getDateIntervalA11y(data)));

                this.attr('aria-label', _.escape(a11yLabel.join(', ') + '.'));
            }
        },

        // simple grid-based list for portal & halo
        drawSimpleGrid: function (list) {

            // use template
            var tmpl = new VGrid.Template({
                    tagName: 'li',
                    defaultClassName: 'vgrid-cell list-unstyled'
                }),
                $ul = $('<ul>');

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
