/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/calendar/edit/template',
        ['io.ox/core/extensions',
         'gettext!io.ox/calendar/edit/main'], function (ext, gt) {

    'use strict';

    ext.point('io.ox/calendar/edit/section').extend({
        index: 100,
        id: 'error',
        draw: function (data) {
            this.append($('<div>').addClass('error-display'));
        }
    });

    ext.point('io.ox/calendar/edit/section').extend({
        index: 120,
        id: 'additionalinfo',
        draw: function (data) {
            this.append($('<div>').addClass('additional-info'));
        }
    });

    ext.point('io.ox/calendar/edit/section').extend({
        index: 140,
        id: 'head',
        draw: function (data) {
            this.append(
                $('<div class="row-fluid show-grid">')
                .append($('<div>')
                    .addClass('span12 control-group'))
                    .append($('<label>')
                        .addClass('control-label desc')
                        .attr('for', data.uid)
                        .text(gt('Subject')))
                        .append($('<div>')
                            .addClass('controls'))
                            .append($('<input>')
                                .addClass('discreet title')
                                .attr({
                                    'type': 'text',
                                    'name': 'title',
                                    'data-property': 'title',
                                    'id': data.uid + '_title'
                                })));
            this.append($('<div class="row-fluid show-grid">')
                    .append($('<div>')
                        .addClass('span10 control-group')
                        .append($('<label>')
                            .addClass('control-label desc')
                            .attr('for', data.uid + '_location')
                            .text(gt('Location')))
                            .append($('<div>')
                                .addClass('controls'))
                                .append($('<input>')
                                    .addClass('discreet location')
                                    .attr({
                                        'type': 'text',
                                        'name': 'location',
                                        'data-property': 'location',
                                        'id': data.uid + '_location'
                                    })))
            .append($('<div class="span2 control-group">')
                .append($('<div>')
                    .addClass('controls')
                        .append($('<a>')
                            .addClass('btn btn-primary save')
                            .text((data.editmode ? gt('Save'): gt('Create')))))));
        }
    });

    ext.point('io.ox/calendar/edit/section').extend({
        index: 160,
        id: 'dates',
        draw: function (data) {
            this.append($('<div class="row-fluid show-grid">')
                .append($('<div class="control-group span6">')
                    .append($('<label>')
                        .addClass('control-label desc')
                        .attr('for', data.uid)
                        .text(gt('Starts on')))
                        .append($('<div>')
                            .addClass('controls')
                            .append($('<input>')
                                .attr({
                                    'type': 'text',
                                    'class': 'discreet startsat-date input-small',
                                    'id': data.uid + '_start_date',
                                    'data-extgroup': 'startdates',
                                    'data-extid': 'date',
                                    'data-property': 'start_date'
                                }))
                            .append($('<input>')
                                .attr({
                                    'type': 'text',
                                    'class': 'discreet startsat-time input-mini',
                                    'data-extgroup': 'startdates',
                                    'data-extid': 'time',
                                    'data-property': 'start_date'
                                }))
                            .append($('<span>')
                                .attr({
                                    'type': 'text',
                                    'class': 'label startsat-timezone',
                                    'data-original-title': "",
                                    'data-extgroup': 'startdates',
                                    'data-extid': 'timezones',
                                    'data-property': 'start_date'
                                })
                                .text(gt('CEST'))))).append(
                $('<div class="control-group span6">')
                    .append($('<label>')
                         .addClass('control-label desc')
                         .attr('for', data.uid)
                         .text(gt('Ends on')))
                         .append($('<div>')
                             .addClass('controls')
                             .append($('<input>')
                                 .attr({
                                    'type': 'text',
                                    'class': 'discreet endsat-date input-small',
                                    'id': data.uid + '_end_date',
                                    'data-extgroup': 'enddates',
                                    'data-extid': 'date',
                                    'data-property': 'end_date'
                                }))
                             .append($('<input>')
                                 .attr({
                                    'type': 'text',
                                    'class': 'discreet endsat-time input-mini',
                                    'data-extgroup': 'enddates',
                                    'data-extid': 'time',
                                    'data-property': 'end_date'
                                }))
                             .append($('<span>')
                                 .attr({
                                    'type': 'text',
                                    'class': 'label endsat-timezone',
                                    'data-original-title': "",
                                    'data-extgroup': 'enddates',
                                    'data-extid': 'timezones',
                                    'data-property': 'end_date'
                                }).text(gt('CEST'))))));
        }
    });
    ext.point('io.ox/calendar/edit/section').extend({
        index: 180,
        id: 'extras',
        draw: function (data) {
            this.append(
                $('<div class="row-fluid show-grid">').append(
                    $('<div class="control-group span12">').append(
                        $('<div class="controls">').append(
                            $('<div>').attr({'data-extgroup': 'extrasleft', 'data-extid': 'fulltime'})
                            .append($('<input type="checkbox" class="full_time">').attr({
                                    'name': 'full_time',
                                    'id': data.uid + '_full_time',
                                    'data-property': 'full_time'
                                })).append(
                                    $('<label>').attr({
                                        'style': 'display: inline;',
                                        'for': data.uid + '_full_time'
                                    }).text(gt("All day")))))));
        }
    });

    ext.point('io.ox/calendar/edit/section').extend({
        index: 200,
        id: 'description',
        draw: function (data) {
            this.append(
                $('<div class="row-fluid show-grid">').append(
                    $('<div class="control-group span12">').append(
                        $('<label class="control-label desc">')
                            .attr('for', data.uid + '_note')
                            .text(gt("Description")))
                            .append(
                                $('<div class="controls">').append(
                                    $('<textarea class="note">')
                                        .attr({
                                            'id': data.uid + '_note',
                                            'data-property': 'note'
                                        })))));
        }
    });

    ext.point('io.ox/calendar/edit/section').extend({
        index: 220,
        id: 'options',
        draw: function (data) {
            //reminder values
            var reminderListValues = [
                {value: 0, format: 'minutes'},
                {value: 15, format: 'minutes'},
                {value: 30, format: 'minutes'},
                {value: 45, format: 'minutes'},

                {value: 60, format: 'hours'},
                {value: 120, format: 'hours'},
                {value: 240, format: 'hours'},
                {value: 360, format: 'hours'},
                {value: 420, format: 'hours'},
                {value: 720, format: 'hours'},

                {value: 1440, format: 'days'},
                {value: 2880, format: 'days'},
                {value: 4320, format: 'days'},
                {value: 5760, format: 'days'},
                {value: 7200, format: 'days'},
                {value: 8640, format: 'days'},
                {value: 10080, format: 'weeks'},
                {value: 20160, format: 'weeks'},
                {value: 30240, format: 'weeks'},
                {value: 40320, format: 'weeks'}
            ];

            // prefill options
            var reminders = ['<option value="-1">' + gt("No reminder") + '</option>'];

            // generate options html array
            _.each(reminderListValues, function (item, index) {
                var i;
                switch (item.format) {
                case 'minutes':
                    item.label = gt.format(gt.ngettext('%1$d Minute', '%1$d Minutes', item.value), gt.noI18n(item.value));
                    break;
                case 'hours':
                    i = Math.floor(item.value / 60);
                    item.label = gt.format(gt.ngettext('%1$d Hour', '%1$d Hours', i), gt.noI18n(i));
                    break;
                case 'days':
                    i  = Math.floor(item.value / 60 / 24);
                    item.label = gt.format(gt.ngettext('%1$d Day', '%1$d Days', i), gt.noI18n(i));
                    break;
                case 'weeks':
                    i = Math.floor(item.value / 60 / 24 / 7);
                    item.label = gt.format(gt.ngettext('%1$d Week', '%1$d Weeks', i), gt.noI18n(i));
                    break;
                }
                reminders.push('<option value="' + item.value + '">' + item.label + '</option>');
            });

            // html fragements
            var reminder = $('<div class="control-group span3">').append(
                    $('<label class="control-label desc">')
                        .attr('for', data.uid + '_alarm')
                        .text(gt('Reminder'))).append(
                            $('<div class="controls">').append(
                                $('<select name="alarm" data-property="alarm">').append(reminders))),
            shownAsOptions = [
                '<option value="1" data-extgroup="shownas" data-extid="reserved">' + gt("Reserved") + '</option>',
                '<option value="2" data-extgroup="shownas" data-extid="temporary">' + gt("Temporary") + '</option>',
                '<option value="3" data-extgroup="shownas" data-extid="absent">' + gt("Absent") + '</option>',
                '<option value="4" data-extgroup="shownas" data-extid="free">' + gt("Free") + '</option>'
            ],
            shown_as = $('<div class="control-group span3">').append(
                    $('<label class="control-label desc">')
                        .attr('for', 'shown_as')
                        .text(gt("Display as"))).append(
                            $('<div class="controls">').append(
                                $('<select id="' + data.uid + '_shown_as" name="shown_as" "data-property="shonw_as">')
                                    .append(shownAsOptions))),
            privateFlag = $('<div class="control-group span3">').append(
                    $('<label class="control-label desc">')
                        .text(gt("Type"))
                        .attr('for', data.uid + '_private_flag')).append(
                            $('<div class="controls">').append(
                                $('<input type="checkbox">')
                                    .attr({
                                        'name': 'private_flag',
                                        'id': data.uid + '_private_flag',
                                        'data-property': 'private_flag'
                                    })).append(
                                        $('<label style="display: inline;">')
                                            .attr('for', data.uid + '_private_flag')
                                            .text(gt("Private"))));
            // append fragments
            this.append($('<div class="row-fluid show-grid">').append(reminder, shown_as, privateFlag));
        }
    });

    ext.point('io.ox/calendar/edit/section').extend({
        index: 240,
        id: 'participants',
        draw: function (data) {
            this.append(
                $('<div class="row-fluid show-grid">').append(
                    $('<div class="span12">').append(
                        $('<legend class="sectiontitle">')
                            .text(gt("Participants")))),
                $('<div class="row-fluid show-grid participantsrow">').append(
                    $('<div class="span12 participants">')),
                $('<div class="row-fluid show-grid add-participants">').append(
                    $('<div class="span6 control-group">').append(
                        $('<div class="controls">').append(
                            $('<div class="input-append">').append(
                                $('<input type="text" class="add-participant">')).append(
                                    $('<button class="btn" type="button" data-action="add">').append(
                                        $('<i class="icon-plus">'))).append(
                                $('<div class="help">')
                                    .text(gt('To add participants manually, just provide a valid email address (e.g john.doe@example.com or "John Doe" <jd@example.com>)')))))).append(
                    $('<div class="control-group span6 notify-participants">').append(
                        $('<div class="controls">').append(
                            $('<input type="checkbox" data-property="notification">')
                                .attr('id', data.uid + "_notification"),
                            $('<label class="label-inline">')
                                .attr('for', data.uid + '_notification')
                                .text(gt('Notify all participants about this change'))))));
        }
    });

    // per default templates return null
    return null;
});