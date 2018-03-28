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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/tk/reminder-util', [
    'gettext!io.ox/core',
    'io.ox/calendar/util',
    'less!io.ox/core/tk/reminder-util'
], function (gt, util) {

    'use strict';

    function buildActions(node, values, model) {
        node.append(
            $('<div>').text(gt('Remind me again')),
            $('<select class="dateselect" data-action="selector">').append(function () {
                var ret = '<option value="0">' + gt('Pick a time here') + '</option>';
                for (var i = 0; i < values.length; i++) {
                    ret += '<option value="' + values[i][0] + '">' + values[i][1] + '</option>';
                }
                return ret;
            }),
            $('<button type="button" class="btn btn-primary btn-sm remindOkBtn" data-action="ok">').text(gt('OK'))
            //#. %1$s appointment or task title
            .attr('aria-label', gt('Close reminder for %1$s', model.get('title')))
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
