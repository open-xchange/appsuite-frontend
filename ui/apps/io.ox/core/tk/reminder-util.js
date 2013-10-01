/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2013
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/tk/reminder-util',
    ['gettext!io.ox/core',
     'less!io.ox/core/tk/reminder-util.less'
    ], function (gt) {

    'use strict';

    function buildActions(node, values) {
        if (_.device('medium')) {//native style for tab
            node.append(
                    $('<div>').text(gt('Remind me again')),
                    $('<select class="dateselect" data-action="selector">').append(function () {
                            var ret = '<option value="0">' + gt('Pick a time here') + '</option>';
                            for (var i = 0; i < values.length; i++) {
                                ret += '<option value="' + values[i][0] + '">' +
                                    values[i][1] +
                                    '</option>';
                            }
                            return ret;
                        }),
                    $('<button type="button" class="btn btn-inverse remindOkBtn" data-action="ok">').text(gt('OK'))
                );
        } else {//special link dropdown
            node.append(
                    $('<div>').addClass('dropdown').css({float: 'left'}).append(
                        $('<a href="#" tabindex="1" data-action="reminderbutton" aria-haspopup="true">').attr('data-toggle', 'dropdown').text(gt('Remind me again')).append(
                            $('<i>').addClass('icon-chevron-down').css({color: 'white', paddingLeft: '5px', textDecoration: 'none'})
                        ),
                        $('<ul role="menu">').addClass('dropdown-menu dropdown-left').css({minWidth: 'auto'}).append(function () {
                            var ret = '';
                            for (var i = 0; i < values.length; i++) {
                                ret += '<li><a tabindex="1" href="#" data-action="reminder" data-value="' + values[i][0] + '">' +
                                    values[i][1] +
                                    '</a></li>';
                            }
                            return ret;
                        })
                    ),
                    $('<button type="button" tabindex="1" class="btn btn-inverse remindOkBtn" data-action="ok">').text(gt('OK'))
                ).find('after').css('clear', 'both');
        }
    }

    var draw = function (node, model, options) {
        var info,
            actions = $('<div class="reminder-actions">');

        buildActions(actions, options);

        //find out remindertype
        if (model.get('reminder') && model.get('reminder').module === 4) {//task
            info = [$('<div class="title">').text(_.noI18n(model.get('title'))),
                    $('<span class="end_date">').text(_.noI18n(model.get('end_date'))),
                    $('<span class="status pull-right">').text(model.get('status')).addClass(model.get('badge'))];
        } else {//appointment
            info = [$('<div class="time">').text(model.get('time')),
                    $('<div class="date">').text(model.get('date')),
                    $('<div class="title">').text(model.get('title')),
                    $('<div class="location">').text(model.get('location'))];
        }

        node.attr('data-cid', model.get('cid')).attr({
            'model-cid': model.cid,
            'tabindex': 1
        }).addClass('reminder-item')
            .append(
                info,
                actions
            );
    };

    return {draw: draw};
});
