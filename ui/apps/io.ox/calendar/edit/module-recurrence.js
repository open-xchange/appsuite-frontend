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
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */
define('io.ox/calendar/edit/module-recurrence',
      ['io.ox/calendar/util',
       'io.ox/calendar/edit/binding-util',
       'gettext!io.ox/calendar/edit/main',
       'io.ox/core/extensions',
       'io.ox/core/date',
       'io.ox/calendar/edit/binding-util',
       'io.ox/calendar/edit/template'], function (util, BinderUtils, gt, ext, dateAPI, binderUtils) {
    'use strict';

    var RecurrenceOptionView = Backbone.View.extend({
        RECURRENCE_NONE: 0,
        tagName: 'div',
        events: {
            'click .editrecurrence': 'toggleRecurrence',
            'change input.repeat': 'onToggleRepeat'
        },
        rendered: false,
        initialize: function (options) {
            console.log("init option view", options);
            var self = this;
            self.parentview = options.parentview; //for further scoping
            self.recurrenceView = options.recurrenceView;
            self._modelBinder = new Backbone.ModelBinder();

            // converts recurrence to a readable string for displaying
            var recurTextConverter = function (direction, value, attribute, model) {

                if (direction === 'ModelToView') {
                    var txt = util.getRecurrenceString(model.attributes);
                    return (txt) ? ': ' + txt : '';
                } else {
                    return model.get(attribute);
                }
            };
            self.bindings = { };
//            self.bindings = {
//
//                recurrence_type: [
//                    {
//                        selector: '[name=repeat]',
//                        converter: function (direction, value, attribute, model) {
//                            console.log("converter", direction, value, attribute, model);
//                            if (direction === 'ModelToView') {
//                                if (value === self.RECURRENCE_NONE) {
//                                    return false;
//                                }
//                                return true;
//                            } else {
//                                if (value === false) {
//                                    return self.RECURRENCE_NONE;
//                                }
//                                return model.get(attribute);
//                            }
//                        }
//                    },
//                    {
//                        selector: '[name=recurrenceText]',
//                        converter: recurTextConverter
//                    }
//                ]//,
//                day_in_month: {selector: '[name=recurrenceText]', converter: recurTextConverter},
//                interval: {selector: '[name=recurrenceText]', converter: recurTextConverter},
//                days: {selector: '[name=recurrenceText]', converter: recurTextConverter},
//                month: {selector: '[name=recurrenceText]', converter: recurTextConverter}
//            };
        },
        render: function () {
            console.log("render recurrence", this);
            var self = this;
            ext.point('io.ox/calendar/recurrence/repeat').invoke('draw', self.$el, {});

            /*self.$el.empty().append(tmpl('repeatoption', {
                strings: {
                    REPEAT: gt('Repeat'),
                    EDIT: gt('edit')
                },
                uid: _.uniqueId('io_ox_calendar_edit_')
            }));

            self._modelBinder.bind(self.model, self.el, self.bindings);

            return self;
        },
        toggleRecurrence: function () {
            console.log("toggle recurrence");
            var self = this,
                $rep = self.$('.recurrence-option-container');

            if ($rep.is(':visible')) {
                self.$('.editrecurrence').text(gt('(edit)'));
                $rep.hide();
            } else {
                self.$('.editrecurrence').text(gt('(hide)'));
                if (!self.rendered) {
                    // only render once
                    self.recurrenceView = self.recurrenceView.render().el;
                    self.rendered = true;
                }
                $rep.show();
            }
            //this.$('.recurrence-option-container').toggle();
        },
        // recurrence on or off
        onToggleRepeat: function (evt) {

            var self = this;
            var isRecurrence = ($(evt.target).attr('checked') === 'checked');

            if (isRecurrence) {
                self.$('.editrecurrence_wrapper').show();
                if (self.model.get('recurrence_type') === 0) {
                    self.model.set('recurrence_type', 1);
                }
            } else {
                self.$('.editrecurrence_wrapper').hide();
                self.model.set('recurrence_type', 0);
                self.$('.recurrence-option-container').hide();
                self.$('.editrecurrence').text(gt('(Edit recurrence)'));
            }
            // set default recurrence settings and not
            // if not delete all recurrence settings, save them in temporary variable
            // so it can restored*/
        }
    });

    // TODO remove later
    //Strings
    var staticStrings = {
        STARTS_ON: gt('Starts on'),
        ENDS: gt('Ends'),
        NEVER: gt('Never'),
        ON: gt('on'),
        AFTER: gt('after'),
        TIMES: gt('times'),
        DAILY: gt('Daily'),
        WEEKLY: gt('Weekly'),
        MONTHLY: gt('Monthly'),
        YEARLY: gt('Yearly'),
        EVERY: gt('Every'),
        DAY: gt('day'),
        WEEKS: gt('weeks'),
        AT: gt('at'),
        TH_DAY_EVERY: gt('th day every'),
        TH_MONTH: gt('th month'),
        FIRST: gt('First'),
        SECOND: gt('Second'),
        THIRD: gt('Third'),
        FOURTH: gt('Fourth'),
        LAST: gt('Last'),
        TH: gt('th'),
        IN: gt('in')
    };

    var weekDayList = [
        { value: (1 << 0), label: gt('Sunday')},
        { value: (1 << 1), label: gt('Monday')},
        { value: (1 << 2), label: gt('Tuesday')},
        { value: (1 << 3), label: gt('Wednesday')},
        { value: (1 << 4), label: gt('Thursday')},
        { value: (1 << 5), label: gt('Friday')},
        { value: (1 << 6), label: gt('Saturday')}
    ];

    var monthList = [
        { value: 0, label: gt('January') },
        { value: 1, label: gt('February') },
        { value: 2, label: gt('March') },
        { value: 3, label: gt('April') },
        { value: 4, label: gt('May') },
        { value: 5, label: gt('June') },
        { value: 6, label: gt('July') },
        { value: 7, label: gt('August') },
        { value: 8, label: gt('September') },
        { value: 9, label: gt('October') },
        { value: 10, label: gt('November') },
        { value: 11, label: gt('December') }
    ];
    //strings end



    function createDaysBitConverter(day) {
        return {
            selector: '[name=day' + day + ']',
            converter: function (dir, val, attr, model) {
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
        events: {
            'change [name=monthly_option]': 'changeMonthlyOption',
            'change [name=yearly_option]': 'changeYearlyOption'
        },
        tagName: 'div',
        className: 'control-group recurrence',
        initialize: function (options) {
            console.log("init recview");
            var self = this;
            self.parentView = options.parentView;
            self._modelBinder = new Backbone.ModelBinder();

            /*var bindings = {
                start_date: {
                    selector: '[name=recurrence_start]',
                    converter: binderUtils.convertDate
                }
            };*/

            // bind recurrence type change, i.e. "daily" or "weekly"
            self.model.on('change:recurrence_type', _.bind(self.updateRecurrenceDetail, self));

            //self.model.on('change:start_date', _.bind(self.updateRecurrenceStart, self));
        },
        render: function () {
            var self = this;
            console.log("render recurrenceview here", self);

            var $container = $(self.parentView).find('.recurrence-option-container');

            self.$el.empty();
            ext.point('io.ox/calendar/edit/recurrence').invoke('draw', $container, {
                uid: _.uniqueId('io_ox_calendar_edit_')
            });

            ext.point('io.ox/calendar/edit/recurrence/option_weekly').invoke('draw', $container, {
                uid: _.uniqueId('io_ox_calendar_edit_recurrence')
            });

            ext.point('io.ox/calendar/edit/recurrence/start_stop').invoke('draw', $container, {
                uid: _.uniqueId('io_ox_calendar_edit_recurrence')
            });

//            $('.startsat-date', $container).datepicker({format: dateAPI.DATE});

//            self.updateRecurrenceStart();

            /*self.$el.empty().append(tmpl({
                uid: _.uniqueId('io_ox_calendar_edit_recurrence'),
                strings: staticStrings,
                weekDayList: weekDayList,
                monthList: monthList
            }));

            var bindings = {
                day_in_month: '[name=day_in_month]',
                interval: '[name=interval]',
                month: '[name=month]',
                recurrence_start: {selector: '[name=recurrence_start]', converter: BinderUtils.convertDate },
                until: {
                    selector: '[name=until]',
                    converter: BinderUtils.convertDate
                },
                recurrence_type: [{
                    selector: '[name=recurrence_type]',
                    converter: BinderUtils.numToString //shitty aspect in ModelBinder
                }]
            };
             */

            var bindings = {
                recurrence_type: [{
                    selector: '[name=recurrence_type]',
                    converter: BinderUtils.numToString
                }]
            };
//                ,
//                recurrence_start: {
//                    selector: '[name=recurrence_start]',
//                    converter: binderUtils.convertDate
//                }

            // days of the week - bindings
//            bindings.days = [];
//            _.each(weekDayList, function (item) {
//                bindings.days.push(createDaysBitConverter(item.value));
//            });
//            bindings.days.push({ selector: '[name=days]'});

            self._modelBinder.bind(self.model, $(self.parentView).find('.recurrence-option-container'), bindings);
            self.updateRecurrenceDetail();
            return self;
        },
        updateRecurrenceDetail: function () {

            var self = this;
            var $container = $(self.parentView).find('.recurrence-option-container');
            $('.recurrence_details', $container).hide();

            switch (parseInt(self.model.get('recurrence_type'), 10)) {
            case self.RECURRENCE_DAILY:
                self.model.unset('day_in_month');
                if (!self.model.has('interval')) {
                    self.model.set('interval', 1);
                }
                console.log("day",  $('.recurrence_details.daily', $container));
                $('.recurrence_details.daily', $container).show();
                break;
            case self.RECURRENCE_WEEKLY:
                if (!self.model.has('interval')) {
                    self.model.set('interval', 1);
                }
                if (!self.model.has('days')) {
                    self.model.set('days', 2); //set monday default
                }
                $('.recurrence_details.weekly', $container).show();
                break;
            case self.RECURRENCE_MONTHLY:
                console.log('ok monthly');
                self.model.unset('month');
                $('.recurrence_details.monthly', $container).show();

                if (!self.model.has('day_in_month')) {
                    self.model.set('day_in_month', 1);
                }
                if (!self.model.has('interval')) {
                    self.model.set('interval', 1);
                }
                // yeah ducktype is awesome :x

                if (self.model.has('day_in_month') &&
                    self.model.has('days') &&
                    self.model.has('interval')) {

                    console.log('chck option one');
                    //select option two
                    self.model.set('interval', self.model.get('interval')); //mmhh?
                    $('input[name=monthly_option][value=two]', $container).attr('checked', 'checked');
                } else {
                    //select option one
                    $('input[name=monthly_option][value=one]', $container).attr('checked', 'checked');

                }
                break;
            case self.RECURRENCE_YEARLY:

                //should always be 1 - regarding to http api doc
                self.model.set('interval', 1);
                self.$('.recurrence_details.yearly').show();

                // yeah ducktype 2.0
                if (self.model.has('day_in_month') &&
                    self.model.has('days') &&
                    self.model.has('month')) {

                    // select option two
                    self.$('input[name=yearly_option][value=two]').attr('checked', 'checked');
                } else {
                    self.$('input[name=yearly_option][value=one]').attr('checked', 'checked');
                }

                break;
            case self.RECURRENCE_NONE:
                // TODO: should this handled in model?
                self.model.unset('interval');
                self.model.unset('days');
                self.model.unset('day_in_month');
                self.model.unset('until');
                self.model.unset('recurrence_start');
                self.model.unset('month');
                break;
            default:
                break;
            }
        },
        changeMonthlyOption: function (evt) {
            var self = this,
                option = evt.target.value;
            if (option === 'one') {
                self.model.unset('days');

            } else {
                if (!self.model.has('days')) {
                    self.model.set('days', 2); //set monday to default
                }
            }
            console.log('change monthly option');

        },

        changeYearlyOption: function (evt) {
            var self = this;
            console.log('change yearly option');
            //unset the right one and default the other
            if (!self.model.has('day_in_month')) {
                //set default
                self.model.set('day_in_month', 1);
            }
            if (!self.model.has('month')) {
                self.model.set('month', 0);
            }

            if (!self.model.has('days')) {
                self.model.set('days', 2); //monday as default
            }

            var option = evt.target.value;
            if (option === 'one') {
                self.model.unset('days');
            }
        },

        updateRecurrenceStart: function () {
            var self = this;
            var mydate = dateAPI.Local.utc(parseInt(self.model.get('start_date'), 10));
            console.log(mydate);
            var formattedDate = new dateAPI.Local(mydate).format(dateAPI.DATE);
            console.log(formattedDate);
            $('[name=recurrence_start]').attr('value', formattedDate);
        }
    });


    return {
        OptionView: RecurrenceOptionView,
        View: RecurrenceView
    };

});
