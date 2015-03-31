/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/tk/reminder-util',
    ['gettext!io.ox/core',
     'less!io.ox/core/tk/reminder-util'
    ], function (gt) {

    'use strict';

    function buildActions(node, values, focusId) {
        if (_.device('medium')) {//native style for tablet
            node.append(
                    $('<div>').text(gt('Remind me again')),
                    $('<select tabindex="1" class="dateselect" data-action="selector">').append(function () {
                            var ret = '<option value="0">' + gt('Pick a time here') + '</option>';
                            for (var i = 0; i < values.length; i++) {
                                ret += '<option value="' + values[i][0] + '">' +
                                    values[i][1] +
                                    '</option>';
                            }
                            return ret;
                        }),
                    $('<button type="button" tabindex="1" class="btn btn-primary btn-sm remindOkBtn" data-action="ok">').text(gt('OK')).attr('aria-label', gt('Close this reminder'))
                );
        } else {
            // special link dropdown
            node.append(
                $('<div>').addClass('dropdown').css({float: 'left'}).append(
                    $('<a href="#" role="listbox" aria-label="' + gt('Press [enter] to select a time when you want to be reminded again') + '"tabindex="1" data-action="reminderbutton" aria-haspopup="true">')
                    .attr({'data-toggle': 'dropdown', 'focus-id': focusId + '-select'})
                    .text(gt('Remind me again')).addClass('refocus')
                    .append(
                        $('<i class="fa fa-chevron-down">').css({ paddingLeft: '5px', textDecoration: 'none' })
                    ),
                    $('<ul role="menu">').addClass('dropdown-menu dropdown-left').css({minWidth: 'auto'}).append(function () {
                        var ret = [];
                        for (var i = 0; i < values.length; i++) {
                            ret.push('<li><a  tabindex="1" role="menuitem" aria-label="' + gt('Remind me again ') + values[i][1] + '" href="#" data-action="reminder" data-value="' + values[i][0] + '">' +
                                values[i][1] +
                                '</a></li>');
                        }
                        return ret;
                    })
                ),
                $('<button type="button" tabindex="1" class="btn btn-primary btn-sm remindOkBtn refocus" focus-id="' + focusId + '-button" data-action="ok">').text(gt('OK'))
                .attr('aria-label', gt('Close this reminder'))
            ).find('after').css('clear', 'both');
        }
    }

    var draw = function (node, model, options) {
        var info,
            label,//aria label
            actions = $('<div class="reminder-actions">');

        //find out remindertype
        if (model.get('reminder') && model.get('reminder').module === 4) {//task
            info = [$('<div class="title">').text(_.noI18n(model.get('title'))),
                    $('<div class="info-wrapper">').append($('<span class="end_date">').text(_.noI18n(model.get('end_date'))),
                    $('<span class="status pull-right">').text(model.get('status')).addClass(model.get('badge')))];
            var endText = '',
                statusText = '';
            if (_.noI18n(model.get('end_date'))) {
                endText = gt('end date ') + _.noI18n(model.get('end_date'));
            }
            if (_.noI18n(model.get('status'))) {
                statusText = gt('status ') + _.noI18n(model.get('status'));
            }
                    //#. %1$s task title
                    //#. %2$s task end date
                    //#. %3$s task status
                    //#, c-format
            label = gt('Task reminder. %1$s %2$s %3$s. Press [enter] to open', _.noI18n(model.get('title')), endText, statusText);
        } else {//appointment
            info = [$('<div class="time">').text(model.get('time')),
                    $('<div class="date">').text(model.get('date')),
                    $('<div class="title">').text(model.get('title')),
                    $('<div class="location">').text(model.get('location'))];
                    //#. %1$s Appointment title
                    //#. %2$s Appointment date
                    //#. %3$s Appointment time
                    //#. %4$s Appointment location
                    //#, c-format
            label = gt('Appointment reminder. %1$s %2$s %3$s %4$s. Press [enter] to open',
                    _.noI18n(model.get('title')), _.noI18n(model.get('date')), _.noI18n(model.get('time')), _.noI18n(model.get('location')) || '');
        }

        var focusId = model.attributes.cid;
        if (!model.attributes.cid) {
            focusId = _.ecid(model.attributes);
        }

        node.attr({'data-cid': model.get('cid'),
                   'model-cid': model.cid,
                   'aria-label': label,
                   'focus-id': 'reminder-notification-' + focusId,//calendar and task are a bit different here (recurrenceposition etc)
                   role: 'listitem',
                   'tabindex': 1
        }).addClass('reminder-item refocus clearfix');
        buildActions(actions, options, 'reminder-notification-' + focusId);

        node.append(
                info,
                actions
            );
    };

    return {draw: draw};
});
