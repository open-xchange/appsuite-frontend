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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/calendar/edit/view-main',
       ['io.ox/calendar/edit/binding-util',
       'io.ox/calendar/util',
       'io.ox/core/extensions',
       'io.ox/core/date',
       'io.ox/calendar/edit/view-addparticipants',
       'io.ox/calendar/edit/module-recurrence',
       'io.ox/calendar/edit/template',
       'gettext!io.ox/calendar/edit/main',
       'io.ox/backbone/views',
       'io.ox/backbone/forms'], function (BinderUtils, util, ext, dateAPI, AddParticipantsView, recurrenceModule, tmpl, gt, views, forms) {

    'use strict';

    //customize datepicker
    //just localize the picker
    $.fn.datepicker.dates.en = {
        "days": dateAPI.locale.days,
        "daysShort": dateAPI.locale.daysShort,
        "daysMin": dateAPI.locale.daysStandalone,
        "months": dateAPI.locale.months,
        "monthsShort": dateAPI.locale.monthsShort
    };

    var CommonView = views.point('io.ox/calendar/edit/section').createView({
        tagName: 'div',
        className: 'io-ox-calendar-edit container-fluid',
        render: function () {
            var self = this;

            var rows = [];
            function getRow(index) {
                if (rows.length > index + 1) {
                    return rows[index];
                }
                for (var i = 0; i < index + 1 - rows.length; i++) {
                    rows.push($('<div class="row-fluid">'));
                }
                return rows[index];
            }

            this.point.each(function (extension) {
                var node = getRow(extension.forceLine || rows.length);
                extension.invoke('draw', node, {model: self.model, parentView: self});
            });

            this.$el.append(rows);

            return this;
        }
    });

    return CommonView;
});
