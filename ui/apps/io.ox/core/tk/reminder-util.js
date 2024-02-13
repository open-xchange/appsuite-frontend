/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/tk/reminder-util', [
    'gettext!io.ox/core',
    'io.ox/calendar/util',
    'less!io.ox/core/tk/reminder-util'
], function (gt, util) {

    'use strict';

    function buildActions(node, values) {
        var guid = _.uniqueId('reminder-label-');
        node.append(
            $('<label>').text(gt('Remind me again')).attr('for', guid),
            $('<select class="dateselect" data-action="selector">').attr('id', guid).append(function () {
                var ret = '<option value="0">' + gt("Don't remind me again") + '</option>';
                for (var i = 0; i < values.length; i++) {
                    ret += '<option value="' + values[i][0] + '">' + values[i][1] + '</option>';
                }
                return ret;
            }),
            $('<button type="button" class="btn btn-primary btn-sm remindOkBtn" data-action="ok">').text(gt('OK'))
        );
    }

    var draw = function (node, model, options, taskMode) {
        var info,
            //aria label
            label,
            actions = $('<div class="reminder-actions">');

        //find out remindertype
        if (taskMode) {
            //task
            info = $('<a class="notification-info" role="button">').append(
                $('<span class="span-to-div title">').text(model.get('title')),
                $('<span class="span-to-div info-wrapper">').append(
                    $('<span class="end_date">').text(model.get('end_time')),
                    $('<span class="status pull-right">').text(model.get('status')).addClass(model.get('badge'))
                ),
                $('<span class="sr-only">').text(gt('Press to open Details'))
            );

            //#. %1$s task title
            //#, c-format
            label = gt('Reminder for task %1$s.', model.get('title'));
        } else {
            var strings = util.getDateTimeIntervalMarkup(model.attributes, { output: 'strings', zone: moment().tz() });
            //appointment
            info = $('<a class="notification-info" role="button">').append(
                $('<span class="span-to-div time">').text(strings.timeStr),
                $('<span class="span-to-div date">').text(strings.dateStr),
                $('<span class="span-to-div title">').text(model.get('summary')),
                $('<span class="span-to-div location">').text(model.get('location')),
                $('<span class="sr-only">').text(gt('Press to open Details'))
            );
            //#. %1$s appointment title
            //#, c-format
            label = gt('Reminder for appointment %1$s.', model.get('summary'));
        }

        node.attr({
            'data-cid': model.get('cid'),
            'model-cid': model.cid,
            'aria-label': label,
            role: 'listitem',
            'tabindex': 0
        }).addClass('reminder-item clearfix');
        buildActions(actions, options, model);

        node.append(info, actions);
    };

    return { draw: draw };
});
