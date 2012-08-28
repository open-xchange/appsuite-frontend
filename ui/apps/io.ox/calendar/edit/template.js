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
    /*

    <div class="row-fluid show-grid">
    <div class="span10 control-group">
        <label class="control-label desc" for="{{!it.uid}}_location">{{! it.strings.LOCATION }}</label>
        <div class="controls">
            <input type="text" class="discreet location" name="location" data-property="location" id="{{!it.uid}}_location" >
        </div>
    </div>
    <div class="span2 control-group">
        <div class="controls">
            <a class="btn btn-primary save" >{{! it.strings.SAVE_BUTTON_LABEL }}</a>
        </div>
    </div>
</div>*/
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
    /*<div class="row-fluid show-grid">
    <div class="control-group span6">
        <label class="control-label desc" for="{{!it.uid}}_start_date">{{! it.strings.STARTS_ON }}</label>
        <div class="controls">
              <input type="text" class="discreet startsat-date input-small" id="{{!it.uid}}_start_date" data-extgroup="startdates" data-extid="date" data-property="start_date">
              <input type="text" class="discreet startsat-time input-mini" data-extgroup="startdates" data-extid="time" data-property="start_date">
              <span class="label startsat-timezone" data-original-title="" data-extgroup="startdates" data-extid="timezone">CEST</span>
        </div>
    </div>
    <div class="control-group span6">
        <label class="control-label desc" for="{{!it.uid}}_end_date">{{! it.strings.ENDS_ON }}</label>
        <div class="controls">
            <input type="text" class="discreet endsat-date input-small" id="{{!it.uid}}_end_date" data-extgroup="enddates" data-extid="date" data-property="end_date">
            <input type="text" class="discreet endsat-time input-mini" data-extgroup="enddates" data-extid="time" data-property="end_date">
            <span class="label endsat-timezone" data-original-title="" data-extgroup="enddates" data-extid="timezone">CEST</span>
        </div>
    </div>
</div>*/
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
/*
 * <div class="row-fluid show-grid">
            <div class="control-group span12">
                <div class="controls">
                    <div data-extgroup="extrasleft" data-extid="fulltime">
                        <input type="checkbox" class="full_time" name="full_time" id="{{!it.uid}}_full_time" data-property="full_time">
                        <label style="display: inline;" for="{{!it.uid}}_full_time">{{! it.strings.ALL_DAY }}</label>
                    </div>
                </div>
            </div>
        </div>
 */
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

        }
    });

    ext.point('io.ox/calendar/edit/section').extend({
        index: 220,
        id: 'options',
        draw: function (data) {

        }
    });

    ext.point('io.ox/calendar/edit/section').extend({
        index: 240,
        id: 'participants',
        draw: function (data) {

        }
    });

    // per default templates return null
    return null;
});