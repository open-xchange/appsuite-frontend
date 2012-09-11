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
         'gettext!io.ox/calendar/edit/main',
         'io.ox/contacts/util'], function (ext, gt, util) {

    'use strict';

    var convertImageStyle = function (url) {
        if (_.isString(url) && url.length > 1) {
            url = url.replace(/^\/ajax/, ox.apiRoot);
            return 'url("' + url + '")';
        } else {
            return '';
        }
    };

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
                        $('<label class="checkbox">').append(
                                $('<input type="checkbox" class="full_time" name="full_time">')
                                    .after(gt("All day"))
                            )
                    )));
                        /*
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
                                    }).text(gt("All day"))))*/


        }
    });

    /**
     * RECURRENCE CONTAINER
     */
    ext.point('io.ox/calendar/edit/section').extend({
        index: 181,
        id: 'repeat-option',
        draw: function (data) {
            this.append(
                $('<div class="edit-appointment-recurrence-container">')
            );
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
    /**
     * extpoint
     * conflicts
     */
    ext.point('io.ox/calendar/edit/conflicts').extend({
        index: 1,
        id: 'conflicts',
        draw: function (data) {
            this.append($('<div class="row-fluid show-grid">')
                .css('margin-top', '10px').append(
                    $('<span class="span12">').css('text-align', 'right').append(
                        $('<a class="btn">')
                            .attr('data-action', 'cancel')
                            .text(gt('Cancel')),
                        $('<a class="btn btn-danger">')
                            .addClass('btn')
                            .attr('data-action', 'ignore')
                            .text(gt('Ignore conflicts')))));
        }
    });
    /**
     * extension point
     * user drawing in participant view
     */
    ext.point('io.ox/calendar/edit/participants/user').extend({
        index: 1,
        id: 'participant_user',
        draw: function (model) {

            this.append(
                $('<div class="contact-image">')
                    .css("background-image", convertImageStyle(model.get('image1_url'))),
                $('<div>').append(
                    $('<a class="person-link">')
                        .text(util.getDisplayName(model.toJSON()))
                ),
                $('<div class="email">')
                    .text(util.getMail(model.toJSON())),
                // only append remove icon if user is removable
                model.get('ui_removable') !== false ? $('<a class="remove">')
                    .attr('href', '#').append(
                        $('<div class="icon">').append('<i class="icon-remove"></i>')
                    ) : $()
            );
        }
    });
    /**
     * extension point
     * groups in particpant view
     */
    ext.point('io.ox/calendar/edit/participants/usergroup').extend({
        index: 1,
        id: 'participant_group',
        draw: function (model) {
            this.append(
                $('<div class="group-image">'),
                $('<div>')
                     .text(util.getDisplayName(model.toJSON())),
                gt("Group"),
                $('<a class="remove">')
                    .attr('href', '#').append(
                        $('<div class="icon">').append(
                            '<i class="icon-remove"></i>')
                        )
             );
        }
    });

    ext.point('io.ox/calendar/edit/participants/resource').extend({
        index: 1,
        id: 'resource',
        draw: function (model) {
            this.append(
                $('<div class="resource-image">'),
                $('<div>')
                    .text(util.getDisplayName(model.toJSON())),
                gt("Resource"),
                $('<a class="remove">')
                    .attr('href', '#').append(
                        $('<div class="icon">').append(
                            '<i class="icon-remove"></i>')
                        )
            );
        }
    });

    ext.point('io.ox/calendar/edit/participants/externaluser').extend({
        index: 1,
        id: 'externaluser',
        draw: function (model) {
            this.append(
                $('<div class="external-user-image">'),
                $('<div>').append(
                    $('<a class="person-link">')
                         .text(util.getDisplayName(model.toJSON()))
                ),
                $('<div class="email">')
                    .text(util.getMail(model.toJSON())),
                $('<a class="remove">').attr('href', '#').append(
                    $('<div class="icon">').append(
                        '<i class="icon-remove"></i>')
                    )
            );
        }
    });

    ext.point('io.ox/calendar/edit/participants/distlistusergroup').extend({
        index: 1,
        id: 'distlistgroup',
        draw: function (model) {
            this.append(
                $('<div class="group-image">'),
                $('<div>')
                    .text(util.getDisplayName(model.toJSON())),
                gt("Distribution list"),
                $('<a class="remove">')
                    .attr('href', '#').append(
                        $('<div class="icon">').append(
                            '<i class="icon-remove"></i>')
                        )
            );
        }
    });


    /**
     * shows which type of recurrence is selected
     */
    ext.point('io.ox/calendar/edit/recurrence').extend({
        index: 10,
        id: 'options',
        draw: function (data) {
            console.log("draw ext recurrence", data);
            this.append(
                $('<div class="span12">').append(
                    $('<div class="span3">').append(
                        $('<label class="radio">').append(
                            $('<input type="radio" checked="checked">')
                            .attr({
                                'id': data.uid + '_daily',
                                'value': '1',
                                'name': 'recurrence_type'
                            })
                            .after(gt("Daily"))
                        )
                    ),
                    $('<div class="span3">').append(
                        $('<label class="radio">').append(
                            $('<input type="radio">')
                            .attr({
                                'id': data.uid + '_weekly',
                                'value': '2',
                                'name': 'recurrence_type'
                            })
                            .after(gt("Weekly"))
                        )
                    ),
                    $('<div class="span3">').append(
                        $('<label class="radio">').append(
                            $('<input type="radio">')
                                .attr({
                                    'id': data.uid + '_monthly',
                                    'value': '3',
                                    'name': 'recurrence_type'
                                })
                                .after(gt("Monthly"))
                        )
                    ),
                    $('<div class="span3">').append(
                        $('<label class="radio">').append(
                            $('<input type="radio">')
                                .attr({
                                    'id': data.uid + '_yearly',
                                    'value': '4',
                                    'name': 'recurrence_type'
                                })
                                .after(gt("Yearly"))
                        )
                    )
                 )
            );
        }
    });
    /**
     * day options for recurrence
     */
    ext.point('io.ox/calendar/edit/recurrence/option_day').extend({
        index: 1,
        id: 'dayoption',
        draw: function (data) {
            this.append(
                $('<div class="span12">').append(
                    $('<form class="form-inline">').append(
                        $('<span class="margin-right">')
                            .text(gt("Every")),
                        $('<input type="text" class="input-extra-small">')
                            .attr({
                                'size': 2,
                                'name': 'recurrence_days_input',
                                'value': data.days
                            })
                            .after(
                                $('<span class="margin-left">')
                                    .text(gt("Days")))
                    )
                )
            );
        }
    });

    /**
     *
     */
    ext.point('io.ox/calendar/edit/recurrence/option_weekly').extend({
        index: 1,
        id: 'weekoption',
        draw: function (data) {
            var days = ['<option>Montag</option>',
                        '<option>Dienstag</option>',
                        '<option>Mittwoch</option>',
                        '<option>Donnerstag</option>',
                        '<option>Freitag</option>',
                        '<option>Samstag</option>',
                        '<option>Sonntag</option>'];
            this.append(
                $('<div class="span12">').append(
                    $('<form class="form-inline">').append(
                        $('<span class="margin-right">')
                            .text(gt("Every")),
                        $('<input type="text">')
                            .attr({
                                'size': 2,
                                'name': 'recurrence_days_input',
                                'value': data.days
                            })
                            .css('width', '25px') // TODO not so nice, find better value
                            .after(
                                $('<span class="margin-left">')
                                    .text(gt("Weeks on"))
                                )),
                    $('<form class="form-inline">').append(
                        $('<div class=" ">')
                            .append($('<label class="checkbox">').append(
                                $('<input type="checkbox">')
                                    .attr({
                                        'value': 'monthly',
                                        'name': 'rec_weekly_weekday'
                                    })
                                    .after(gt("Monday"))
                            )
                        ),
                        $('<div class=" ">').append(
                            $('<label class="checkbox">').append(
                                $('<input type="checkbox">')
                                    .attr({
                                        'value': 'monthly',
                                        'name': 'rec_weekly_weekday'
                                    })
                                    .after(gt("Tuesday"))
                            )
                        ),
                        $('<div class=" ">').append(
                            $('<label class="checkbox">').append(
                                $('<input type="checkbox">')
                                    .attr({
                                        'value': 'monthly',
                                        'name': 'rec_weekly_weekday'
                                    })
                                    .after(gt("Wednesday"))
                            )
                        ),
                        $('<div class=" ">').append(
                            $('<label class="checkbox">').append(
                                $('<input type="checkbox">')
                                    .attr({
                                        'value': 'monthly',
                                        'name': 'rec_weekly_weekday'
                                    })
                                    .after(gt("Thursday"))
                            )
                        ),
                        $('<div class=" ">').append(
                            $('<label class="checkbox">').append(
                                $('<input type="checkbox">')
                                    .attr({
                                        'value': 'monthly',
                                        'name': 'rec_weekly_weekday'
                                    })
                                    .after(gt("Friday"))
                            )
                        ),
                        $('<div class=" ">').append(
                            $('<label class="checkbox">').append(
                                $('<input type="checkbox">')
                                    .attr({
                                        'value': 'monthly',
                                        'name': 'rec_weekly_weekday'
                                    })
                                    .after(gt("Saturday"))
                            )
                        ),
                        $('<div class=" ">').append(
                            $('<label class="checkbox">').append(
                                    $('<input type="checkbox">')
                                        .attr({
                                            'value': 'monthly',
                                            'name': 'rec_weekly_weekday'
                                        })
                                        .after(gt("Sunday"))
                                )
                            )
                    )
                )
            );
        }
    });

    //TODO nicen this up
    ext.point('io.ox/calendar/recurrence/repeat').extend({
        index: 1,
        id: 'repeat-option',
        draw: function (data) {
            this.append(
                $('<div class="row-fluid show-grid">').append(
                    $('<div class="control-group span3">').append(
                        $('<label class="checkbox">').append(
                            $('<input type="checkbox" class="repeat" name="repeat">')
                                .after(gt("Repeat"))
                        ))).append('<span name="recurrenceText"></span><div class="span3 editrecurrence_wrapper" style="display:none;">' +
                            '(<a class="editrecurrence">' + gt('Edit recurrence') + '</a>)</div>'),
                $('<div class="row-fluid show-grid recurrence-option-container" style="display:none">')
            );

        }
    });

    /*
     *
<div class="row-fluid show-grid">
<div class="control-group span6">
    <label for="{{!it.uid}}_recurrence_start" class="control-label">{{! it.strings.STARTS_ON }}</label>
    <div class="controls">
        <input id="{{!it.uid}}_recurrence_start" type="text" class="discreet startsat-date" name='recurrence_start'/>
    </div>
</div>
<div class="control-group span6">
    <label for="{{!it.uid}}_recurrence_endings" class="control-label">{{! it.strings.ENDS }}</label>
    <div class="controls">
        <div>
            <input type="radio" name='endingoption'/>
            <label class="radio inline">{{! it.strings.NEVER }}</label>
        </div>
        <div>
            <input id="{{!it.uid}}_recurrence_endings" type="radio" name='endingoption'/>
            <label class="radio inline">
               {{! it.strings.ON }}
               <input type="text" class="discreet until" name='until'/>
            </label>
        </div>
        <div>
            <input type="radio" name='endingoption'/>
            <label class="radio inline">
                {{! it.strings.AFTER }}
                <input type="text" class="discreet until short" name='occurrences'/>
                <span class="help-inline">{{! it.strings.TIMES }}</span>
            </label>
        </div>
    </div>
</div>
</div>
     */
    //TODO nicen this up
    ext.point('io.ox/calendar/edit/recurrence/start_stop').extend({
        index: 1,
        id: 'start_stop',
        draw: function (data) {
            this.append(
                $('<div class="span12">').append(
                    /*$('<div class="span6">').append(
                        $('<label class="control-label desc">')
                            .attr({
                                'for': data.uid + '_recurrence_start'
                            })
                            .text(gt('Starts on')),
                        $('<div>').append($('<input type="text" class="discreet startsat-date input-small">')
                            .attr({
//                                'value': data.startDate,
                                'name': 'recurrence_start',
                                'id': data.uid + '_recurrence_start'
                            }))
                    ),*/
                    $('<div class="span6">').append(
                        $('<label class="control-label desc">')
                            .attr({
                                'for': data.uid + '_recurrence_endings'
                            })
                            .text(gt('Ends'))
                    ).append(
                        $('<div class="controls">').append(
                            $('<label class="radio">').append(
                                    $('<input type="radio" name="endingoption">')
                                        .after(gt("Never"))),
                            $('<label class="radio">').append(
                                    $('<input type="radio" name="endingoption">').attr('id', data.uid + '_recurrence_endings')
                                        .after(gt("On"))),
                            $('<input type="text" class="discreet until input-small">').attr('name', 'until'),
                            $('<label class="radio">').append(
                                    $('<input type="radio" name="endingoption">').attr('id', data.uid + '_recurrence_endings')
                                        .after($('<span>').text(gt("After")))
                                ),
                            $('<div>').append(
                                $('<input type="text" class="discreet until input-extra-small">')
                                    .attr('name', 'occurences')
                                    .css('margin-top', '5px')
                            )
                        )
                    )
                )
            );

        }
    });
    // per default templates return null
    return null;
});


