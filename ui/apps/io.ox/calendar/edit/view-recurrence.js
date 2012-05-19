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

define('io.ox/calendar/edit/view-recurrence',
      ['io.ox/calendar/edit/deps/Backbone',
       'io.ox/calendar/edit/deps/doT',
       'io.ox/calendar/edit/binding-util',
       'text!io.ox/calendar/edit/tpl/recurrence.tpl',
       'gettext!io.ox/calendar/edit/main'], function (Backbone, doT, BinderUtils, template, gt) {

    'use strict';

    function createDaysBitConverter(day) {
        return {
            selector: '[name=day' + day + ']',
            converter: function (dir, val, attr, model) {
                console.log('change days bit: ' + dir);
                if (dir === 'ModelToView') {
                    return val & day;
                } else {
                    return (val) ? (model.get(attr) | day) : (model.get(attr) - day);
                }
            }
        };
    }

    var RecurrenceView = Backbone.View.extend({
        RECURRENCE_NONE: 0,
        RECURRENCE_DAILY: 1,
        RECURRENCE_WEEKLY: 2,
        RECURRENCE_MONTHLY: 3,
        RECURRENCE_YEARLY: 4,
        daybits: {
            DAYS_SUNDAY: 1 << 0,
            DAYS_MONDAY: 1 << 1,
            DAYS_TUESDAY: 1 << 2,
            DAYS_WEDNESDAY: 1 << 3,
            DAYS_THURSDAY: 1 << 4,
            DAYS_FRIDAY: 1 << 5,
            DAYS_SATURDAY: 1 << 6
        },
        tagName: 'div',
        _modelBinder: undefined,
        className: 'io-ox-calendar-edit-recurrence',
        initialize: function () {
            var self = this;
            self.template = doT.template(template);
            self._modelBinder = new Backbone.ModelBinder();
            self.model.on('change:recurrence_type', _.bind(self.updateRecurrenceDetail, self));
        },
        render: function () {
            var self = this;
            self.$el.empty().append(self.template({gt: gt, daybits: self.daybits}));

            window.recur = self.model;
            window.view = self;

            var bindings = {
                day_in_month: '[name=day_in_month]',
                interval: '[name=interval]',
                month: '[name=month]',
                recurrence_start: '[name=recurrence_start]',
                until: {
                    selector: '[name=until]',
                    converter: BinderUtils.convertDate
                },
                recurrence_type: [{
                    selector: '[name=recurrence_type]',
                    converter: BinderUtils.numToString //shitty aspect in ModelBinder
                }],
                days: [
                    createDaysBitConverter(self.daybits.DAYS_SUNDAY),
                    createDaysBitConverter(self.daybits.DAYS_MONDAY),
                    createDaysBitConverter(self.daybits.DAYS_TUESDAY),
                    createDaysBitConverter(self.daybits.DAYS_WEDNESDAY),
                    createDaysBitConverter(self.daybits.DAYS_THURSDAY),
                    createDaysBitConverter(self.daybits.DAYS_FRIDAY),
                    createDaysBitConverter(self.daybits.DAYS_SATURDAY),
                    { selector: '[name=days]'}
                ]
            };

            self._modelBinder.bind(self.model, self.el, bindings);
            self.updateRecurrenceDetail();

            return self;
        },
        updateRecurrenceDetail: function () {
            console.log('change');
            var self = this;

            console.log('change:' + self.model.get('recurrence_type'));
            console.log(self.model.changedAttributes());

            self.$('.recurrence_details').hide();

            switch (parseInt(self.model.get('recurrence_type'), 10)) {
            case self.RECURRENCE_DAILY:
                self.$('.recurrence_details.daily').show();
                break;
            case self.RECURRENCE_WEEKLY:
                self.$('.recurrence_details.weekly').show();
                break;
            case self.RECURRENCE_MONTHLY:
                self.$('.recurrence_details.monthly').show();
                break;
            case self.RECURRENCE_YEARLY:
                self.$('.recurrence_details.yearly').show();
                break;
            case self.RECURRENCE_NONE:
                break;
            default:
                break;
            }
        }
    });

    return RecurrenceView;

});
